import { invokeHarness } from './transport';

export interface SkillFrontmatter {
  name: string;
  description: string;
  tools?: string[];
  modelDelegation?: string;
  [key: string]: any;
}

export const skillFrontmatterClient = {
  getSkillFrontmatter: async () => ({ data: null, available: false }),
  parseSkillFile: async (filePath: string) =>
    invokeHarness<SkillFrontmatter>('parse_skill_file', { filePath }).then((r) => r.data),
  extractToolMentions: async (prompt: string) =>
    invokeHarness<string[]>('extract_tool_mentions_cmd', { prompt }).then((r) => r.data ?? []),
  validateSkillTools: async (filePath: string, availableTools: string[]) =>
    invokeHarness<string[]>('validate_skill_tools_cmd', { filePath, availableTools }).then((r) => r.data ?? []),
};
