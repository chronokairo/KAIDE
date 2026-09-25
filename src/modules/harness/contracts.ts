export interface AnnaUploadConfig {
  accept: string;
  intentKeywords: string[];
  describe: string;
}

export interface AnnaUploadToolDefinition {
  name: string;
  annaUpload?: AnnaUploadConfig;
}

export interface AnnaTranscriptDefaults {
  programId?: string;
  entryType?: string;
}
