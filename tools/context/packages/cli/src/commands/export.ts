import { Command } from 'commander';
import { getServices } from '../utils';
import { exportProject, getExportFilename, ExportFormat } from '@anamnesic/core';
import fs from 'fs';
import path from 'path';

const VALID_FORMATS: ExportFormat[] = ['json', 'markdown', 'plain', 'copilot', 'claude', 'cursor'];

export function registerExportCommands(program: Command) {
  program
    .command('export <projectId>')
    .description('Export project context to file or stdout')
    .option('-f, --format <fmt>', `Format: ${VALID_FORMATS.join(', ')}`, 'markdown')
    .option('-o, --output <path>', 'Output file path (default: write to target location)')
    .option('--stdout', 'Print to stdout instead of writing file')
    .action(async (projectId: string, opts: { format: string; output?: string; stdout?: boolean }) => {
      if (!VALID_FORMATS.includes(opts.format as ExportFormat)) {
        console.error(`Invalid format. Use: ${VALID_FORMATS.join(', ')}`);
        process.exit(1);
      }

      const { projects } = await getServices();
      let project = await projects.get(projectId);
      if (!project) project = await projects.findByName(projectId);

      if (!project) {
        console.error(`Project not found: ${projectId}`);
        process.exit(1);
      }

      const format = opts.format as ExportFormat;
      const content = exportProject(project, format);

      if (opts.stdout) {
        process.stdout.write(content);
        return;
      }

      const targetPath = opts.output || getExportFilename(format, project.name);
      const fullPath = path.resolve(targetPath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`\nExported to: ${fullPath}`);

      if (['copilot', 'claude', 'cursor'].includes(format)) {
        const tool = format === 'copilot' ? 'GitHub Copilot' : format === 'claude' ? 'Claude' : 'Cursor';
        console.log(`  ${tool} will automatically pick up this file.\n`);
      }
    });

  // Convenience aliases
  program
    .command('sync <projectId>')
    .description('Export context to all AI tool config files at once')
    .action(async (projectId: string) => {
      const { projects } = await getServices();
      let project = await projects.get(projectId);
      if (!project) project = await projects.findByName(projectId);

      if (!project) {
        console.error(`Project not found: ${projectId}`);
        process.exit(1);
      }

      const targets: ExportFormat[] = ['copilot', 'claude', 'cursor'];

      console.log(`\nSyncing context for: ${project.name}\n`);

      for (const format of targets) {
        const content = exportProject(project, format);
        const targetPath = getExportFilename(format, project.name);
        const fullPath = path.resolve(targetPath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`  ${targetPath}`);
      }

      console.log('\nAll AI tool configs updated.\n');
    });
}
