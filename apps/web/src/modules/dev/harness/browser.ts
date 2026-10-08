import { invokeHarness } from './transport';

export interface PageInfo {
  title: string;
  url: string;
  links: Array<{ href: string; text: string }>;
  forms: Array<{ id: string; action: string; method?: string; fields?: any[] }>;
  hostname?: string;
  [key: string]: any;
}

export interface StructuredData {
  tables: unknown[];
  lists: unknown[];
  images: unknown[];
  metadata: Record<string, unknown>;
  headings?: any[];
  jsonLd?: any[];
  [key: string]: any;
}

export interface PageText {
  text: string;
  length: number;
  wordCount?: number;
  [key: string]: any;
}

export interface BrowserScrapeResult {
  url: string;
  title: string;
  text: string;
  structuredData: StructuredData;
  contacts: { emails: string[]; phones: string[]; documents: string[]; socials: string[] };
}

export interface CnpjValidationResult {
  valid: boolean;
  formatted?: string;
  error?: string;
}

export interface ExtractedContacts {
  emails: string[];
  phones: string[];
  documents: string[];
  socials: string[];
}

export const browserClient = {
  getPageInfo: async () => invokeHarness<PageInfo>('browser_get_page_info_script'),
  getPageText: async () => invokeHarness<PageText>('browser_get_page_text'),
  getStructuredData: async () => invokeHarness<StructuredData>('browser_get_structured_data'),
  fillForm: async (fields: any) =>
    invokeHarness<{ results: Array<{ name: string; found: boolean }> }>('browser_fill_form', { fields }),
  screenshot: async () =>
    invokeHarness<{ ok: boolean; base64?: string; width?: number; height?: number; error?: string }>('browser_screenshot'),
  getFetchLog: async () =>
    invokeHarness<{ total: number; entries: Array<{ method: string; url: string; status: number }> }>('browser_get_fetch_log'),
  pageFetch: async (url: string, method?: string) =>
    invokeHarness<{ ok: boolean; status: number; statusText: string; body?: string }>('browser_page_fetch', { url, method }),
  scroll: async (direction: 'up' | 'down', amount: number) =>
    invokeHarness<{ scrollY: number; atBottom: boolean }>('browser_scroll', { direction, amount }),
  downloadScreenshot: (filename?: string) => {
    console.log('Download screenshot requested:', filename);
  },
  downloadPageHtml: (html: string, filename?: string) => {
    console.log('Download HTML requested:', filename);
  },
  downloadPageText: (text: string, filename?: string) => {
    console.log('Download Text requested:', filename);
  },
  downloadJson: (data: any, filename?: string) => {
    console.log('Download JSON requested:', filename);
  },
  scrapePage: async (url: string) => invokeHarness<BrowserScrapeResult>('browser_scrape_page', { url }),
  getAccessibilityScript: async () => invokeHarness<string>('browser_get_accessibility_script'),
  getClickScript: async (selector: string) => invokeHarness<string>('browser_get_click_script', { selector }),
  getSetValueScript: async (selector: string, value: string) =>
    invokeHarness<string>('browser_get_set_value_script', { selector, value }),
  validateCnpj: async (cnpj: string) => invokeHarness<CnpjValidationResult>('browser_validate_cnpj', { cnpj }),
  extractContacts: async (text: string) => invokeHarness<ExtractedContacts>('browser_extract_contacts', { text }),
};

export function checkMcpBrowserStatus(): { available: boolean } {
  return { available: false };
}
