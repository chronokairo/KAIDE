// Porta (ADR-0028/0032): pesquisa pública (due diligence leve) sobre um lead.
// Adapters concretos: web search real (DuckDuckGo) ou harness OSINT (ADR-0008).

import type { LeadResearch } from '@/domain/control-plane';

export interface CompanyResearchPort {
  researchCompany(lead: {
    companyName: string;
    contactName?: string;
    contactEmail?: string;
  }): Promise<LeadResearch>;
}
