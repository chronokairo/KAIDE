import { NextRequest, NextResponse } from 'next/server';
import { RealDockerService } from '@/processes/docker/real-docker-service';
import { logger } from '@/shared/lib/logger';
import { createErrorResponse } from '@/shared/lib/errors';

export async function GET(request: NextRequest) {
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
    const logs = await dockerService.getContainerLogs(containerId);

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    logger.error('Failed to get container logs', error instanceof Error ? error : new Error(String(error)));

    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
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

    switch (action) {
      case 'start':
        await dockerService.startContainer(containerId);
        logger.info('Container started', { containerId });
        break;
      case 'stop':
        await dockerService.stopContainer(containerId);
        logger.info('Container stopped', { containerId });
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: { code: 'INVALID_ACTION', message: 'Invalid action. Use start or stop.' },
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Container ${action} successful`,
    });
  } catch (error) {
    logger.error('Container action failed', error instanceof Error ? error : new Error(String(error)));

    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}