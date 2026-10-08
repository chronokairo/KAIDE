'use client';
import { useState } from 'react';
import { skillFrontmatterClient, SkillFrontmatter } from '@/modules/dev/harness/skill-frontmatter';

export function useHarnessSkillFrontmatter() {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skill, setSkill] = useState<SkillFrontmatter | null>(null);
  const [mentions, setMentions] = useState<string[]>([]);
  const [unknownTools, setUnknownTools] = useState<string[]>([]);

  const parseSkillFile = async (path: string) => {
    try {
      setIsParsing(true);
      setError(null);
      const data = await skillFrontmatterClient.parseSkillFile(path);
      setSkill(data);
      return data;
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg);
      console.error(`Failed to parse skill file: ${msg}`);
      throw err;
    } finally {
      setIsParsing(false);
    }
  };

  const extractMentions = async (text: string) => {
    try {
      setError(null);
      const data = await skillFrontmatterClient.extractToolMentions(text);
      setMentions(data);
      return data;
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg);
      console.error(`Failed to extract mentions: ${msg}`);
      throw err;
    }
  };

  const validateTools = async (path: string, knownTools: string[]) => {
    try {
      setError(null);
      const data = await skillFrontmatterClient.validateSkillTools(path, knownTools);
      setUnknownTools(data);
      return data;
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg);
      console.error(`Failed to validate tools: ${msg}`);
      throw err;
    }
  };

  return {
    skill,
    mentions,
    unknownTools,
    isParsing,
    error,
    parseSkillFile,
    extractMentions,
    validateTools,
  };
}
