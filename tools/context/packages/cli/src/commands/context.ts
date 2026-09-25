import { Command } from 'commander';
import { getServices } from '../utils';

const VALID_CATEGORIES = ['architecture', 'requirements', 'dependencies', 'standards', 'general'];

export function registerContextCommands(program: Command) {
  const ctx = program.command('context').alias('ctx').description('Manage context entries');

  ctx
    .command('list <projectId>')
    .alias('ls')
    .description('List context entries for a project')
    .option('-c, --category <cat>', 'Filter by category')
    .action(async (projectId: string, opts: { category?: string }) => {
      const { contexts } = await getServices();
      const entries = await contexts.listByProject(projectId, opts.category);

      if (!entries.length) {
        console.log('No context entries. Add one with: think context add <projectId> <key> <value>');
        return;
      }

      console.log(`\nContext entries (${entries.length}):\n`);
      for (const e of entries) {
        console.log(`  [${e.category}] ${e.key} (priority: ${e.priority})`);
        console.log(`    ID: ${e.id.substring(0, 8)}...`);
        const preview = e.value.length > 100 ? e.value.substring(0, 100) + '...' : e.value;
        console.log(`    ${preview}\n`);
      }
    });

  ctx
    .command('add <projectId> <key> <value>')
    .description('Add a context entry')
    .option('-c, --category <cat>', 'Category', 'general')
    .option('-p, --priority <n>', 'Priority 1-4', '1')
    .action(async (projectId: string, key: string, value: string, opts: { category: string; priority: string }) => {
      if (!VALID_CATEGORIES.includes(opts.category)) {
        console.error(`Invalid category. Use: ${VALID_CATEGORIES.join(', ')}`);
        process.exit(1);
      }
      const { contexts } = await getServices();
      const entry = await contexts.create({
        projectId, key, value,
        category: opts.category,
        priority: parseInt(opts.priority, 10),
      });
      console.log(`\nContext added: [${entry.category}] ${entry.key}`);
      console.log(`  ID: ${entry.id}\n`);
    });

  ctx
    .command('update <id>')
    .description('Update a context entry')
    .option('-k, --key <key>', 'New key')
    .option('-v, --value <value>', 'New value')
    .option('-c, --category <cat>', 'New category')
    .option('-p, --priority <n>', 'New priority')
    .action(async (id: string, opts: any) => {
      const { contexts } = await getServices();
      const updates: any = {};
      if (opts.key) updates.key = opts.key;
      if (opts.value) updates.value = opts.value;
      if (opts.category) updates.category = opts.category;
      if (opts.priority) updates.priority = parseInt(opts.priority, 10);

      const entry = await contexts.update(id, updates);
      console.log(`Context updated: [${entry.category}] ${entry.key}`);
    });

  ctx
    .command('remove <id>')
    .alias('rm')
    .description('Remove a context entry')
    .action(async (id: string) => {
      const { contexts } = await getServices();
      await contexts.delete(id);
      console.log(`Context entry ${id} removed.`);
    });

  ctx
    .command('search <projectId> <query>')
    .description('Search context entries')
    .action(async (projectId: string, query: string) => {
      const { contexts } = await getServices();
      const results = await contexts.search(projectId, query);

      if (!results.length) {
        console.log(`No results for "${query}"`);
        return;
      }

      console.log(`\nSearch results (${results.length}):\n`);
      for (const e of results) {
        console.log(`  [${e.category}] ${e.key} (priority: ${e.priority})`);
        console.log(`    ${e.value.substring(0, 120)}\n`);
      }
    });
}
