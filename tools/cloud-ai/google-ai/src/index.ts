export type GeminiConfig = {
  project: string;
  location?: string;
};

export const API_COMMANDS = {
  generateContent: "ai_generate_content",
  listModels: "ai_list_models",
} as const;
