"""Install only the requested minimum team, preserving historical app records."""
import argparse
from contextlib import closing
import datetime as dt
import json
from pathlib import Path
import shutil
import sqlite3
import subprocess
import uuid

ROOT = Path(__file__).resolve().parent
ZONE = dt.timezone(dt.timedelta(hours=-4), 'America/Manaus')
NAMESPACE = uuid.UUID('9c6cd7b7-5bd9-47c1-a57e-69c4c85f250d')

def next_run(agent, now=None):
    now = (now or dt.datetime.now(dt.timezone.utc)).astimezone(ZONE)
    when = now.replace(hour=agent['hour'], minute=agent['minute'], second=0, microsecond=0)
    if agent['interval'] == 'weekly':
        when += dt.timedelta(days=(agent['weekday'] - 1 - when.weekday()) % 7)
    if when <= now:
        when += dt.timedelta(days=7 if agent['interval'] == 'weekly' else 1)
    return when.astimezone(dt.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')

def check_machine_timezone():
    if dt.datetime.now().astimezone().utcoffset() != dt.timedelta(hours=-4):
        raise RuntimeError('Set the computer timezone to Manaus/UTC-4 before applying')

def install(app_home, apply=False):
    config = json.loads((ROOT / 'team.json').read_text(encoding='utf-8'))
    team = config['team']
    if {a['id'] for a in team} != {'comercial', 'security', 'payment', 'vigia', 'radar', 'briefing'} or len(team) != 6:
        raise RuntimeError('Expected exactly the six agents of ADR 0005')
    c = sqlite3.connect(app_home / 'data.db', timeout=30)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys=ON')
    providers = c.execute("SELECT id FROM model_providers WHERE lower(name)='nvidia'").fetchall()
    if len(providers) != 1:
        c.close()
        raise RuntimeError('Expected one existing NVIDIA provider')
    provider = providers[0]['id']
    registered = {r[0] for r in c.execute('SELECT model_id FROM provider_models WHERE provider_id=?', (provider,))}
    prepared = []
    for agent in team:
        if agent['model'] not in registered:
            c.close()
            raise RuntimeError('Model not registered: ' + agent['model'])
        source = (ROOT / 'agents' / agent['profile']).read_text(encoding='utf-8')
        profile = source.replace('__NVIDIA_PROVIDER__', provider)
        project = None
        if agent['repository']:
            for candidate in c.execute('SELECT id,main_repo_path FROM projects'):
                check = subprocess.run(['git', '-C', candidate['main_repo_path'], 'remote', 'get-url', 'origin'], capture_output=True, text=True, timeout=10)
                if check.returncode == 0 and check.stdout.strip().removesuffix('.git') == agent['repository'].removesuffix('.git'):
                    project = candidate
                    break
            if project is None:
                c.close()
                raise RuntimeError('Register the local canonical repository first: ' + agent['repository'])
        prepared.append((agent, profile, project))
    ids = [str(uuid.uuid5(NAMESPACE, a['id'])) for a in team]
    placeholders = ','.join('?' * len(ids))
    result = {'applied':apply, 'timezone':config['timezone'], 'agents':[a['id'] for a in team],
              'schedules':[{**{k:a[k] for k in ('id','interval','hour','minute','weekday')}, 'next_run_at':next_run(a)} for a in team]}
    if not apply:
        c.close()
        return result
    # App schedules use the machine's timezone for subsequent recurrences.
    try:
        check_machine_timezone()
    except RuntimeError:
        c.close()
        raise
    stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    backup = app_home / 'backups' / ('minimal-team-' + stamp)
    backup.mkdir(parents=True)
    with closing(sqlite3.connect(backup / 'data.db')) as destination:
        c.backup(destination)
    agents_dir = app_home / 'agents'
    agents_dir.mkdir(exist_ok=True)
    previous = list(agents_dir.glob('*.agent.md'))
    kaide_dir = app_home / 'repos' / 'kaide' / '.github' / 'agents'
    previous += list(kaide_dir.glob('*.agent.md'))
    moves = []
    writes = []
    try:
        c.execute('BEGIN IMMEDIATE')
        retired = [dict(r) for r in c.execute(f'SELECT id,name FROM workflows WHERE id NOT IN ({placeholders}) AND enabled=1', ids)]
        c.execute(f"UPDATE workflows SET enabled=0,next_run_at=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id NOT IN ({placeholders})", ids)
        active_runs = [dict(r) for r in c.execute(f"SELECT r.id,r.session_id,w.name FROM workflow_runs r JOIN workflows w ON w.id=r.task_id WHERE r.status IN ('pending','running') AND w.id NOT IN ({placeholders})", ids)]
        for source in previous:
            dest = backup / 'profiles' / source.relative_to(app_home)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(source), str(dest))
            moves.append((source, dest))
        for agent, profile, project in prepared:
            dest = agents_dir / agent['profile']
            dest.write_text(profile, encoding='utf-8')
            writes.append(dest)
            prompt = ('Equipe mínima; execute somente o papel ' + agent['id'] + '. Leia o perfil global correspondente. '
                      'Descubra checkouts pelos remotes canônicos. Horário de referência: America/Manaus. '
                      'Use os caminhos existentes do Windows; não use caminhos /home/deck. '
                      'Esta automação é independente e não cria subagentes. '
                      'Antes de pesquisar, escrever ou executar qualquer trabalho, consulte o relógio local em America/Manaus. '
                      'Execute somente entre 00:00 e 05:59:59; fora da janela, encerre com deferred_outside_night_window '
                      'sem tocar CRM, código, carteira ou mercado. Não execute catch-up durante o dia. '
                      'Pare o trabalho se a janela terminar.\n\n' + profile.split('---', 2)[-1].strip())
            workflow_id = str(uuid.uuid5(NAMESPACE, agent['id']))
            values = (workflow_id, agent['name'], prompt, provider+'/'+agent['model'], project['id'] if project else None,
                      agent['interval'], agent['hour'], agent['weekday'], agent['minute'], next_run(agent), agent['id'])
            c.execute("""INSERT INTO workflows(id,name,prompt,model,project_id,interval,schedule_hour,schedule_day,schedule_minute,next_run_at,agent,enabled,mode,workspace_type,agent_scope)
                         VALUES(?,?,?,?,?,?,?,?,?,?,?,1,'autopilot','worktree','global')
                         ON CONFLICT(id) DO UPDATE SET name=excluded.name,prompt=excluded.prompt,model=excluded.model,
                         project_id=excluded.project_id,interval=excluded.interval,schedule_hour=excluded.schedule_hour,
                         schedule_day=excluded.schedule_day,schedule_minute=excluded.schedule_minute,next_run_at=excluded.next_run_at,
                         agent=excluded.agent,enabled=1,mode='autopilot',workspace_type='worktree',agent_scope='global',
                         cron_expression=NULL,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')""", values)
        if c.execute('SELECT count(*) FROM workflows WHERE enabled=1').fetchone()[0] != len(team):
            raise RuntimeError('Unexpected enabled workflow count')
        if c.execute('PRAGMA foreign_key_check').fetchall() or c.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise RuntimeError('Database integrity failed')
        c.commit()
    except BaseException:
        c.rollback()
        for dest in writes:
            dest.unlink(missing_ok=True)
        for source, dest in reversed(moves):
            shutil.move(str(dest), str(source))
        raise
    finally:
        c.close()
    result.update(backup=str(backup), retired_workflows=retired, runs_to_cancel=active_runs)
    runtime = app_home / 'minimal-team'
    runtime.mkdir(exist_ok=True)
    (runtime / 'installation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--app-home', type=Path, default=Path.home()/'.copilot')
    args = parser.parse_args()
    print(json.dumps(install(args.app_home, args.apply), ensure_ascii=False, indent=2))
