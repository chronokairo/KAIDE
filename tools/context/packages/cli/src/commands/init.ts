import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { getServices } from '../utils';

export function registerInitCommand(program: Command) {
  program
    .command('init')
    .description('Initialize Anamnesic in the current project directory')
    .option('-n, --name <name>', 'Project name (defaults to directory name)')
    .option('-d, --description <desc>', 'Project description')
    .action(async (opts: { name?: string; description?: string }) => {
      const cwd = process.cwd();
      const dirName = path.basename(cwd);
      const name = opts.name || dirName;

      const { projects } = await getServices();

      // Check if project already exists
      const existing = await projects.findByName(name);
      if (existing) {
        console.log(`\nProject "${name}" already exists (${existing.id}).`);
        console.log('Use "think export" or "think sync" to update AI config files.\n');
        return;
      }

      const project = await projects.create({
        name,
        description: opts.description || `Anamnesic context for ${name}`,
      });

      // Create .anamnesic marker file
      const markerPath = path.join(cwd, '.anamnesic');
      fs.writeFileSync(markerPath, JSON.stringify({ projectId: project.id }, null, 2), 'utf-8');

      console.log(`\nAnamnesic initialized for: ${name}`);
      console.log(`  Project ID: ${project.id}`);
      console.log(`  Config: ${markerPath}`);
      console.log('');
      console.log('Next steps:');
      console.log('  think context add <projectId> <key> <value>   Add context');
      console.log('  think decision add <projectId> <title> <desc> Record a decision');
      console.log('  think sync <projectId>                        Export to AI tools');
      console.log('');
    });
}
