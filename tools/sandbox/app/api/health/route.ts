import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/shared/lib/config';
import { logger } from '@/shared/lib/logger';
import { OllamaService } from '@/processes/ollama/ollama-service';
import { RealDockerService } from '@/processes/docker/real-docker-service';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    ollama: { status: 'healthy' | 'unhealthy'; latency?: number };
    docker: { status: 'healthy' | 'unhealthy'; containers?: number };
    memory: { status: 'healthy' | 'unhealthy'; usage: number };
  };
  config: {
    nodeEnv: string;
    port: number;
    containerMode: string;
  };
}

export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();
  const health: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      ollama: { status: 'unhealthy' },
      docker: { status: 'unhealthy' },
      memory: { status: 'healthy', usage: 0 },
    },
    config: {
      nodeEnv: config.get('nodeEnv') as string,
      port: config.get('port') as number,
      containerMode: config.get('defaultContainerMode') as string,
    },
  };

  // Check Ollama
  try {
    const ollamaService = new OllamaService({
      baseUrl: config.get('ollamaBaseUrl') as string,
      model: config.get('ollamaModel') as string,
    });

    const ollamaStartTime = Date.now();
    const available = await ollamaService.isAvailable();

    if (available) {
      health.services.ollama = {
        status: 'healthy',
        latency: Date.now() - ollamaStartTime,
      };
    } else {
      health.services.ollama.status = 'unhealthy';
      health.status = 'degraded';
      logger.warn('Ollama service unhealthy');
    }
  } catch (error) {
    health.services.ollama.status = 'unhealthy';
    health.status = 'degraded';
    logger.error('Failed to check Ollama health', error as Error);
  }

  // Check Docker
  try {
    const dockerService = new RealDockerService();
    const containers = await dockerService.listContainers();

    health.services.docker = {
      status: 'healthy',
      containers: containers.length,
    };
  } catch (error) {
    health.services.docker.status = 'unhealthy';
    health.status = 'degraded';
    logger.error('Failed to check Docker health', error as Error);
  }

  // Check Memory
  if (typeof process.memoryUsage === 'function') {
    const usage = process.memoryUsage();
    const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;
    health.services.memory.usage = usagePercent;

    if (usagePercent > 90) {
      health.services.memory.status = 'unhealthy';
      health.status = 'degraded';
      logger.warn('High memory usage', { usage: usagePercent });
    }
  }

  logger.info('Health check completed', {
    status: health.status,
    duration: Date.now() - startTime,
  });

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 503 : 500;

  return NextResponse.json(health, { status: statusCode });
}
