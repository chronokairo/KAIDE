import { aiToolRegistry } from '../registry';
import { FINANCE_DOMAIN_TOOLS } from './finance-tools';

let registered = false;
export function registerFinanceDomainTools(): void {
  if (registered) return;
  aiToolRegistry.registerAll(FINANCE_DOMAIN_TOOLS);
  registered = true;
}
