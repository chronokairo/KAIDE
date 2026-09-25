/**
 * Database Connection & Initialization
 */

import { DataSource } from 'typeorm';
import path from 'path';
import fs from 'fs';
import { User } from './entities/User';
import { Workspace } from './entities/Workspace';
import { WorkspaceMember } from './entities/WorkspaceMember';
import { Project } from './entities/Project';
import { ChatHistory } from './entities/ChatHistory';
import { ContextEntry } from './entities/ContextEntry';
import { Decision } from './entities/Decision';
import { ApiKey } from './entities/ApiKey';
import { SyncConfig } from './entities/SyncConfig';
import { Agent } from './entities/Agent';
import { Task } from './entities/Task';
import { Workflow } from './entities/Workflow';
import { SecurityAnalysis } from './entities/SecurityAnalysis';
import { ExecutionLog } from './entities/ExecutionLog';
import { OrchestratorPlanRecord } from './entities/OrchestratorPlan';
import { OrchestratorRunRecord } from './entities/OrchestratorRun';
import { PolicyDecisionAudit } from './entities/PolicyDecisionAudit';

const DATA_DIR = process.env.ANAMNESIC_DATA_DIR || path.join(process.env.HOME || process.env.USERPROFILE || '.', '.anamnesic');
const DB_PATH = path.join(DATA_DIR, 'data.sqlite');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dataSource: DataSource | null = null;

export const getDatabase = async (): Promise<DataSource> => {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  dataSource = new DataSource({
    type: 'sqlite',
    database: DB_PATH,
    entities: [
      User,
      Workspace,
      WorkspaceMember,
      Project,
      ChatHistory,
      ContextEntry,
      Decision,
      ApiKey,
      SyncConfig,
      Agent,
      Task,
      Workflow,
      SecurityAnalysis,
      ExecutionLog,
      OrchestratorPlanRecord,
      OrchestratorRunRecord,
      PolicyDecisionAudit,
    ],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.ANAMNESIC_DB_LOGGING === 'true',
  });

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
};

export { DataSource };
