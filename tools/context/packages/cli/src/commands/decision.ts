import { Command } from 'commander';
import { getServices } from '../utils';

export function registerDecisionCommands(program: Command) {
  const dec = program.command('decision').alias('dec').description('Manage architectural decisions');

  dec
    .command('list <projectId>')
    .alias('ls')
    .description('List decisions for a project')
    .action(async (projectId: string) => {
      const { decisions } = await getServices();
      const all = await decisions.listByProject(projectId);

      if (!all.length) {
        console.log('No decisions recorded. Add one with: think decision add <projectId> <title> <description>');
        return;
      }

      console.log(`\nDecisions (${all.length}):\n`);
      for (const d of all) {
        console.log(`  ${d.title} [${d.status}]`);
        console.log(`    ID: ${d.id.substring(0, 8)}...`);
        const preview = d.description.length > 100 ? d.description.substring(0, 100) + '...' : d.description;
        console.log(`    ${preview}\n`);
      }
    });

  dec
    .command('add <projectId> <title> <description>')
    .description('Record a decision')
    .option('-r, --rationale <text>', 'Reasoning behind the decision')
    .option('-a, --alternatives <text>', 'Alternatives considered')
    .action(async (projectId: string, title: string, description: string, opts: { rationale?: string; alternatives?: string }) => {
      const { decisions } = await getServices();
      const decision = await decisions.create({
        projectId, title, description,
        rationale: opts.rationale ? { text: opts.rationale } : undefined,
        alternatives: opts.alternatives ? { text: opts.alternatives } : undefined,
      });
      console.log(`\nDecision recorded: ${decision.title}`);
      console.log(`  ID: ${decision.id}\n`);
    });

  dec
    .command('update <id>')
    .description('Update a decision')
    .option('-t, --title <title>', 'New title')
    .option('-d, --description <desc>', 'New description')
    .option('-s, --status <status>', 'New status (active, deprecated, superseded)')
    .action(async (id: string, opts: any) => {
      const { decisions } = await getServices();
      const updates: any = {};
      if (opts.title) updates.title = opts.title;
      if (opts.description) updates.description = opts.description;
      if (opts.status) updates.status = opts.status;

      const decision = await decisions.update(id, updates);
      console.log(`Decision updated: ${decision.title} [${decision.status}]`);
    });

  dec
    .command('remove <id>')
    .alias('rm')
    .description('Remove a decision')
    .action(async (id: string) => {
      const { decisions } = await getServices();
      await decisions.delete(id);
      console.log(`Decision ${id} removed.`);
    });
}
