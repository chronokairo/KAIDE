// Read-only verification against the running app. Never prints its authentication token.
import {readFileSync} from 'node:fs';
import {homedir} from 'node:os';
const root=homedir()+'/.copilot/run/';
const port=readFileSync(root+'ws.port','utf8').split('\n')[0];
const token=readFileSync(root+'ws.token','utf8').split('\n')[0];
const ws=new WebSocket(`ws://127.0.0.1:${port}/?token=${encodeURIComponent(token)}`);
let done=false;
const timer=setTimeout(()=>{if(!done){console.error('App readback timed out');process.exitCode=1;ws.close();}},10000);
ws.onopen=()=>ws.send(JSON.stringify({type:'list_workflows',request_id:'chronokairo-verify'}));
ws.onmessage=e=>{
 const d=JSON.parse(e.data);
 if(!['workflow_list','error'].includes(d.type))return;
 done=true;clearTimeout(timer);
 if(d.type==='error'){console.error(d.message);process.exitCode=1;}
 else {
  const tasks=d.tasks.filter(t=>t.agent?.startsWith('ck-'));
  if(tasks.some(t=>t.agent_scope && !['global','project'].includes(t.agent_scope))){console.error('Invalid app agent scope');process.exitCode=1;}
  console.log(JSON.stringify({app_readback:'ok',managed_workflows:tasks.length}));
 }
 ws.onerror=null;ws.close();
};
ws.onerror=()=>{if(!done){console.error('Could not connect to running app');process.exitCode=1;}clearTimeout(timer);};
