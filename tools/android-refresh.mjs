import {spawn} from 'node:child_process';

const args=new Set(process.argv.slice(2));
const isStore=args.has('--store');
const npmCmd=process.platform==='win32'?'npm.cmd':'npm';
const npxCmd=process.platform==='win32'?'npx.cmd':'npx';
const steps=isStore
  ?[
    [npmCmd,['run','build:cap:store']],
    [npxCmd,['cap','sync','android']]
  ]
  :[
    [npmCmd,['run','build:cap']],
    [npxCmd,['cap','sync','android']]
  ];

function runStep(command,argsList){
  return new Promise((resolve,reject)=>{
    const spawnCommand=process.platform==='win32'?(process.env.ComSpec||'cmd.exe'):command;
    const spawnArgs=process.platform==='win32'
      ?['/d','/s','/c',`${command} ${argsList.join(' ')}`]
      :argsList;
    const child=spawn(spawnCommand,spawnArgs,{
      cwd:process.cwd(),
      stdio:'inherit',
      shell:false
    });
    child.on('exit',(code)=>code===0?resolve():reject(new Error(`${command} ${argsList.join(' ')} failed with exit code ${code}`)));
    child.on('error',reject);
  });
}

for(const [command,argsList] of steps){
  // Keep Android asset generation ordered to avoid syncing stale web output.
  await runStep(command,argsList);
}
