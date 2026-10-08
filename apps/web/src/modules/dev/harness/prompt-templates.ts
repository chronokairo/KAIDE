import { invokeHarness } from './transport';

export interface ReviewContext {
  scope?: string;
  diff?: string;
  instructions?: string;
}

export type ReviewScope = 'unstaged' | 'staged' | 'branch' | 'commit';

export const promptTemplatesClient = {
  listPromptTemplates: async (workspace?: string) =>
    invokeHarness<string[]>('list_prompt_templates', { workspace }),
  getPromptTemplate: async (templateName: string) =>
    invokeHarness<string>('get_prompt_template', { templateName }),
  resolveReviewContext: async (scope?: string, workspace?: string) =>
    invokeHarness<ReviewContext>('resolve_review_context', { scope, workspace }),
  getGoalBudgetPrompt: async (budgetOrUsed: number, limit?: number) =>
    invokeHarness<string>('get_goal_budget_prompt', { budget: limit ?? budgetOrUsed }),
};
