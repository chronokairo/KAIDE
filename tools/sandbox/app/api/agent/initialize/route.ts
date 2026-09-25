import { NextRequest, NextResponse } from 'next/server';
import { getAgentService } from '../service';

export async function POST(request: NextRequest) {
  try {
    const agentService = getAgentService();
    await agentService.initialize();
    
    return NextResponse.json({
      success: true,
      message: 'Agent initialized successfully',
    });
  } catch (error) {
    console.error('Agent initialization error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to initialize agent',
        success: false,
      },
      { status: 500 }
    );
  }
}