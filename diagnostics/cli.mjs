#!/usr/bin/env node
import {loadHost} from '../plugin/host-config.mjs';
import {validateConfig} from '../plugin/policy.mjs';
import {runDiagnostic} from '../plugin/evaluation.mjs';
import {resolveHermesScanner,hermesScan,NOTICE} from '../hermes/smart.mjs';
try {
 const [configPath,command,...args]=process.argv.slice(2);
 if(!configPath||!command)throw Error('Usage: node diagnostics/cli.mjs CONFIG_YAML evaluate|test [options]');
 const {host,runtime}=loadHost(configPath);
 if(runtime!=='hermes')throw Error('Use the intended Hermes config.yaml; OpenClaw has a separate diagnostics kit');
 const c=validateConfig(host.plugins?.entries?.antenna?.config);
 process.exitCode=await runDiagnostic(command,args,c,host,{configPath,resolveModel:resolveHermesScanner,scanModel:hermesScan,notice:NOTICE});
}catch(e){console.error(JSON.stringify({status:'error',reason:e.message}));process.exitCode=1;}
