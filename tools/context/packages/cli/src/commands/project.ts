import { Command } from 'commander';
import { getServices, formatDate } from '../utils';

export function registerProjectCommands(program: Command) {
  const proj = program.command('project').description('Manage projects');

  proj
    .command('list')
    .alias('ls')
    .description('List all projects')
    .action(async () => {
      const { projects } = await getServices();
      const all = await projects.list();

      if (!all.length) {
        console.log('No projects yet. Create one with: think project create <name>');
        return;
      }

      console.log('\nProjects:\n');
      for (const p of all) {
        const ctx = p.contextEntries?.length || 0;
        const dec = p.decisions?.length || 0;
        console.log(`  ${p.name} (${p.id.substring(0, 8)}...)`);
        console.log(`    Status: ${p.status} | Contexts: ${ctx} | Decisions: ${dec}`);
        console.log(`    Created: ${formatDate(p.createdAt)}\n`);
      }
    });

  proj
    .command('create <name>')
    .description('Create a new project')
    .option('-d, --description <desc>', 'Project description')
    .action(async (name: string, opts: { description?: string }) => {
      const { projects } = await getServices();
      const project = await projects.create({ name, description: opts.description });
      console.log(`\nProject created: ${project.name}`);
      console.log(`  ID: ${project.id}\n`);
    });

  proj
    .command('show <id>')
    .description('Show project details')
    .action(async (id: string) => {
      const { projects } = await getServices();
      let project = await projects.get(id);
      if (!project) project = await projects.findByName(id);

      if (!project) {
        console.error(`Project not found: ${id}`);
        process.exit(1);
      }

      console.log(`\n${project.name}`);
      console.log(`${'='.repeat(project.name.length)}`);
      if (project.description) console.log(`${project.description}`);
      console.log(`\n  ID: ${project.id}`);
      console.log(`  Status: ${project.status}`);
      console.log(`  Contexts: ${project.contextEntries?.length || 0}`);
      console.log(`  Decisions: ${project.decisions?.length || 0}`);
      console.log(`  Created: ${formatDate(project.createdAt)}\n`);
    });

  proj
    .command('delete <id>')
    .description('Delete a project')
    .action(async (id: string) => {
      const { projects } = await getServices();
      await projects.delete(id);
      console.log(`Project ${id} deleted.`);
    });
}
