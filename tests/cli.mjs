import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {socketPath} from '../hermes/adapter.mjs';
import {resolveHermesScanner} from '../hermes/smart.mjs';
const app=process.env.APP_PACKAGE??new URL('..',import.meta.url).pathname;
const tmp=fs.mkdtempSync('/tmp/hd-'),cfg=path.join(tmp,'config.yaml'),sock=path.join(tmp,'s');fs.mkdirSync(sock,{mode:0o700});
const c={schemaVersion:2,receiver:'fixture',bearer:'z'.repeat(32),mcs:'dumb',inbox:'on',peers:{},destinations:{},inboxFile:path.join(tmp,'inbox.json'),replayFile:path.join(tmp,'replay.json')};
const host={model:{default:'unchanged'},plugins:{enabled:[],entries:{antenna:{config:c,settings:{socket_dir:sock},llm:{allow_model_override:true,allow_provider_override:true}}}}};
const save=()=>fs.writeFileSync(cfg,JSON.stringify(host),{mode:0o600});save();
const run=(...args)=>new Promise(resolve=>{const p=spawn(process.execPath,[path.join(app,'diagnostics/cli.mjs'),cfg,...args]);let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.stdin.end('meeting agenda');p.on('close',code=>resolve({code,out,err}));});
let checks=0;function ok(r,code=0){assert.equal(r.code,code,r.err||r.out);checks++;return r.out?JSON.parse(r.out):null;}
let calls=0,seen=[];const server=net.createServer(socket=>{let data='';socket.on('data',x=>{data+=x;if(!data.includes('\n'))return;const req=JSON.parse(data);calls++;seen.push(req);socket.end(JSON.stringify({text:'{"schema":1,"verdict":"pass","findings":[]}',provider:'fixture',model:'fallback',execution:{mode:'hermes-plugin-llm'}})+'\n');});});
try{
 const before=fs.readFileSync(cfg);
 assert.equal(ok(await run('test','--text','meeting agenda','--json')).summary.requests,0);
 ok(await run('test','--stdin','--json'));
 const report=ok(await run('evaluate','--engine','dumb','--json'));assert.equal(report.results.length,84);assert.equal(report.summary.requests,0);
 ok(await run('test','--engine','smart','--text','hello','--json'),3);
 const rules=path.join(tmp,'rules.json');fs.writeFileSync(rules,JSON.stringify({formatVersion:1,rules:[{id:'FIXTURE',pattern:'fixture-danger',flags:'u',explanation:'fixture'}]}));
 assert.equal(ok(await run('test','--text','fixture-danger','--ruleset',rules,'--json'),2).results[0].verdict,'flagged');
 assert.equal((await run('test','--file',path.join(tmp,'absent'),'--json')).code,64);checks++;
 const output=path.join(tmp,'report');ok(await run('test','--text','meeting agenda','--output',output,'--json'));assert.equal(fs.statSync(output).mode&0o777,0o700);
 assert.deepEqual(fs.readFileSync(cfg),before);checks++;
 c.scannerModel='fixture/model';c.scannerIdentity=resolveHermesScanner(c.scannerModel,host).identity;save();const selected=fs.readFileSync(cfg);
 server.listen(socketPath(sock,'antenna:scanner'));await once(server,'listening');
 ok(await run('evaluate','--engine','smart','--preview','--json'));assert.equal(calls,0);
 const r=ok(await run('test','--engine','smart','--text','private selected body','--json'));assert.equal(calls,1);assert.equal(r.results[0].verdict,'pass');assert.equal(seen[0].op,'scan');assert.equal(seen[0].target,'antenna:scanner');
 const beforeBoth=calls;ok(await run('test','--engine','both','--text','fixture-danger','--ruleset',rules,'--json'),2);assert.equal(calls,beforeBoth);
 assert.deepEqual(fs.readFileSync(cfg),selected);assert.equal(fs.existsSync(c.inboxFile),false);assert.equal(fs.existsSync(c.replayFile),false);checks++;
 console.log(JSON.stringify({passed:checks,corpusCases:84,model:'local protocol fixture only; no provider request',stateUnchanged:true}));
}finally{if(server.listening)await new Promise(r=>server.close(r));fs.rmSync(tmp,{recursive:true,force:true});}
