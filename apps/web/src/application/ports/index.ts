// Portas (ADR-0022): exportação centralizada.

export type { IdentityPort } from './identity-port';
export type { CredentialPort, LlmCredential } from './credential-port';
export type { LlmPort } from './llm-port';
export type { SecretsPort } from './secrets-port';
export type { AuditPort, AuditEvent } from './audit-port';
export type {
  JobStorePort,
  CreateJobInput,
} from './control-plane-store-port';
export type { CrmPort, CreateLeadInput, LogActivityInput, CrmActivityRecord } from './crm-port';
export type { CompanyResearchPort } from './company-research-port';
export type {
  EmailOutreachPort,
  SendEmailInput,
  ProviderEmailInfo,
} from './email-outreach-port';
