import { NextRequest, NextResponse } from 'next/server';
import { RealDockerService } from '@/processes/docker/real-docker-service';
import { config } from '@/shared/lib/config';
import { logger } from '@/shared/lib/logger';
import { createErrorResponse } from '@/shared/lib/errors';
import { ContainerMode } from '@/entities/docker/model/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') as ContainerMode | null;
    const status = searchParams.get('status');

    const dockerService = new RealDockerService();
    let containers = await dockerService.listContainers();

    // Filter by mode
    if (mode) {
      containers = containers.filter((c) => c.mode === mode);
    }

    // Filter by status
    if (status) {
      containers = containers.filter((c) => c.status === status);
    }

    logger.info('Containers listed', { count: containers.length, mode, status });

    return NextResponse.json({
      success: true,
      containers,
      count: containers.length,
    });
  } catch (error) {
    logger.error('Failed to list containers', error instanceof Error ? error : new Error(String(error)));

    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, mode, image, ports, volumes, environment } = body;

    const dockerService = new RealDockerService();
    const containerMode = (mode as ContainerMode) || config.get('defaultContainerMode') as ContainerMode;

    const created = await dockerService.createContainer(
      name || `container_${Date.now()}`,
      containerMode,
      {
        image,
        ports: ports || [],
        volumes: volumes || ['/workspace:/workspace'],
        environment: environment || {},
      }
    );

    logger.info('Container created', { containerId: created.id, name: created.name, mode: created.mode });

    return NextResponse.json({
      success: true,
      container: created,
    });
  } catch (error) {
    logger.error('Failed to create container', error instanceof Error ? error : new Error(String(error)));

    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const containerId = searchParams.get('id');

    if (!containerId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Container ID required' },
        },
        { status: 400 }
      );
    }

    const dockerService = new RealDockerService();
    await dockerService.removeContainer(containerId);

    logger.info('Container removed', { containerId });

    return NextResponse.json({
      success: true,
      message: 'Container removed',
    });
  } catch (error) {
    logger.error('Failed to remove container', error instanceof Error ? error : new Error(String(error)));

    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}