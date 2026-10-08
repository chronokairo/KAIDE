#!/usr/bin/env python3
"""Install versioned scripts while keeping credentials and execution state local."""
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

ROOT=Path(__file__).resolve().parent
RUNTIME=Path.home()/'.copilot/chronokairo'

def install():
    if (ROOT.parent / 'minimal-team' / 'team.json').exists():
        raise RuntimeError('Equipe mínima ativa: use .copilot/minimal-team/install.py --apply (ADR 0001); não reinstale a equipe completa.')
    ROOT.mkdir(parents=True,exist_ok=True)
    if RUNTIME.is_symlink() and RUNTIME.resolve()==ROOT:pass
    elif RUNTIME.exists():
        backup=Path.home()/'.copilot/backups'/('runtime-before-install-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
        backup.parent.mkdir(parents=True,exist_ok=True)
        RUNTIME.rename(backup)
        for entry in backup.iterdir():
            dest=ROOT/entry.name
            if not dest.exists():
                if entry.is_dir():shutil.copytree(entry,dest)
                else:shutil.copy2(entry,dest)
        RUNTIME.symlink_to(ROOT,target_is_directory=True)
    else:
        RUNTIME.parent.mkdir(parents=True,exist_ok=True);RUNTIME.symlink_to(ROOT,target_is_directory=True)
    node=shutil.which('node');npm=shutil.which('npm')
    if not node or not npm:raise RuntimeError('Node and npm are required for ACP adapters')
    adapters=ROOT/'acp-adapters'
    if not (adapters/'node_modules/@agentclientprotocol/codex-acp/dist/index.js').exists():
        subprocess.run([npm,'ci','--prefix',str(adapters)],check=True)
    paths=[str(Path(node).parent),str(Path.home()/'.local/bin')]
    commands={
      'codex':[node,str(adapters/'node_modules/@agentclientprotocol/codex-acp/dist/index.js')],
      'claude':[node,str(adapters/'node_modules/@agentclientprotocol/claude-agent-acp/dist/index.js')],
      'opencode':[shutil.which('opencode') or 'opencode','acp'],
      'agy':[sys.executable,str(ROOT/'agy_acp.py')],
    }
    engines={name:{'command':cmd,'transport':'ACP stdio' if name!='agy' else 'ACP local bridge over agy print'} for name,cmd in commands.items()}
    (ROOT/'backends.json').write_text(json.dumps({'version':1,'path_prefix':os.pathsep.join(paths),'engines':engines},indent=2)+'\n')
    subprocess.run([sys.executable,str(ROOT/'configure.py'),'--apply'],check=True)
    units=Path.home()/'.config/systemd/user';units.mkdir(parents=True,exist_ok=True)
    for source in (ROOT/'systemd').iterdir():shutil.copy2(source,units/source.name)
    subprocess.run(['systemctl','--user','daemon-reload'],check=True)
    subprocess.run(['systemctl','--user','enable','--now','chronokairo-automation-watchdog.timer'],check=True)
    print(json.dumps({'source':str(ROOT),'runtime':str(RUNTIME),'backends':list(engines)}))

if __name__=='__main__':install()
