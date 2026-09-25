/**
 * Usage Metering Service
 * 
 * Reports context entry usage to the Anamnesic SaaS.
 * When ANAMNESIC_API_URL and ANAMNESIC_API_KEY are configured,
 * this service tracks context entry creation/deletion and reports to the cloud.
 */

import crypto from 'crypto';

export interface UsageReport {
  workspaceId: string;
  plan: string;
  features: {
    seats: number;
    contextEntries: number;
    mcp: boolean;
    sync: boolean;
  };
  usage: {
    contextEntries: number;
    contextEntriesLimit: number;
    remaining: number;
  };
}

export interface UsageMeteringConfig {
  apiUrl: string | null;
  apiKey: string | null;
}

let _config: UsageMeteringConfig | null = null;

export function getUsageMeteringConfig(): UsageMeteringConfig {
  if (_config) return _config;
  
  _config = {
    apiUrl: process.env.ANAMNESIC_API_URL || null,
    apiKey: process.env.ANAMNESIC_API_KEY || null,
  };
  
  return _config;
}

export async function validateApiKeyAndCheckQuota(): Promise<UsageReport | null> {
  const config = getUsageMeteringConfig();
  if (!config.apiUrl || !config.apiKey) {
    return null;
  }

  try {
    const response = await fetch(`${config.apiUrl}/api/v1/auth/api-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: config.apiKey }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('API key validation failed:', error);
      return null;
    }

    const result: any = await response.json();
    return result.data as UsageReport;
  } catch (error) {
    console.error('Failed to validate API key:', error);
    return null;
  }
}

export async function reportContextEntryCreated(projectId: string): Promise<void> {
  const config = getUsageMeteringConfig();
  if (!config.apiUrl || !config.apiKey) {
    return;
  }

  try {
    await fetch(`${config.apiUrl}/api/v1/usage/context-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ 
        action: 'created',
        projectId,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to report context entry created:', error);
  }
}

export async function reportContextEntryDeleted(projectId: string): Promise<void> {
  const config = getUsageMeteringConfig();
  if (!config.apiUrl || !config.apiKey) {
    return;
  }

  try {
    await fetch(`${config.apiUrl}/api/v1/usage/context-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        action: 'deleted',
        projectId,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to report context entry deleted:', error);
  }
}

export async function reportBulkContextEntriesCreated(projectId: string, count: number): Promise<void> {
  const config = getUsageMeteringConfig();
  if (!config.apiUrl || !config.apiKey) {
    return;
  }

  try {
    await fetch(`${config.apiUrl}/api/v1/usage/context-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        action: 'bulk_created',
        projectId,
        count,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to report bulk context entries created:', error);
  }
}

export async function reportBulkContextEntriesDeleted(projectId: string, count: number): Promise<void> {
  const config = getUsageMeteringConfig();
  if (!config.apiUrl || !config.apiKey) {
    return;
  }

  try {
    await fetch(`${config.apiUrl}/api/v1/usage/context-entry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        action: 'bulk_deleted',
        projectId,
        count,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to report bulk context entries deleted:', error);
  }
}