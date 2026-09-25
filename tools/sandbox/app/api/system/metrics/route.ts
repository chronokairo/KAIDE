import { NextRequest, NextResponse } from 'next/server';
import { taskQueue } from '@/shared/lib/task-queue';
import { sessionManager } from '@/shared/lib/session';
import { logger } from '@/shared/lib/logger';
import { config } from '@/shared/lib/config';

export async function GET() {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Clean up expired sessions
    const sessionsCleaned = sessionManager.cleanupExpiredSessions();

    const metrics = {
      system: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
        usagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      queue: taskQueue.getStats(),
      sessions: {
        active: sessionManager.getActiveSessions().length,
        cleaned: sessionsCleaned,
      },
      config: {
        containerMode: config.get('defaultContainerMode'),
        maxContainers: config.get('maxContainers'),
        nodeEnv: config.get('nodeEnv'),
      },
    };

    logger.info('System metrics retrieved');

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    logger.error('Failed to get system metrics', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      {
        success: false,
        error: { code: 'METRICS_ERROR', message: 'Failed to get system metrics' },
      },
      { status: 500 }
    );
  }
}