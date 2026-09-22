"use client";

import { useState } from 'react';
import { useHarnessSkillFrontmatter } from '@/modules/dev/hooks/useHarness';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export function SkillFrontmatterPanel() {
  const { skill, mentions, unknownTools, isParsing, parseSkillFile, extractMentions, validateTools } = useHarnessSkillFrontmatter();
  const [filePath, setFilePath] = useState('');
  const [text, setText] = useState('');
  const [knownTools, setKnownTools] = useState('tool1,tool2');

  const handleParse = () => {
    if (filePath) parseSkillFile(filePath);
  };

  const handleExtract = () => {
    if (text) extractMentions(text);
  };

  const handleValidate = () => {
    if (filePath) validateTools(filePath, knownTools.split(',').map(t => t.trim()));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Skill Frontmatter Parsing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={filePath} 
              onChange={e => setFilePath(e.target.value)} 
              placeholder="Absolute path to skill .md file" 
            />
            <Button onClick={handleParse} disabled={isParsing || !filePath}>
              Parse
            </Button>
            <Button onClick={handleValidate} disabled={!filePath}>
              Validate Tools
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Input 
              value={knownTools} 
              onChange={e => setKnownTools(e.target.value)} 
              placeholder="Known tools (comma-separated)" 
            />
          </div>

          {skill && (
            <div className="p-4 bg-muted rounded-md text-sm">
              <p><strong>Name:</strong> {skill.name}</p>
              <p><strong>Description:</strong> {skill.description}</p>
              <p><strong>Tools:</strong> {skill.tools?.join(', ') || 'Nenhum'}</p>
              {skill.model_delegation && <p><strong>Model Delegation:</strong> {skill.model_delegation}</p>}
            </div>
          )}

          {unknownTools.length > 0 && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
              <p><strong>Unknown Tools:</strong> {unknownTools.join(', ')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mentions Extraction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={text} 
              onChange={e => setText(e.target.value)} 
              placeholder="Enter text with @tool or @skill mentions" 
            />
            <Button onClick={handleExtract} disabled={!text}>
              Extract
            </Button>
          </div>

          {mentions.length > 0 && (
            <div className="p-4 bg-muted rounded-md text-sm">
              <p><strong>Extracted Mentions:</strong> {mentions.join(', ')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
