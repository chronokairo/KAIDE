export interface AiCapabilityEntity {
  id: string;
  name: string;
  domain: string;
  version: string;
  inputSchema: any;
  outputSchema: any;
  authorization: string[];
}

export interface AiPermissionEntity {
  id: string;
  organization_id: string;
  capability_id: string;
  role: string;
  granted: boolean;
}
