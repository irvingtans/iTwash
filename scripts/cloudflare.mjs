// Cloudflare deployment only. The normal Sites/local workflow is unchanged.
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('..',import.meta.url)));
const configPath='wrangler.cloudflare.json';
const config=JSON.parse(readFileSync(configPath,'utf8'));
const db=config.d1_databases?.find(d=>d.binding==='DB');
const [command,...args]=process.argv.slice(2);
const placeholder='00000000-0000-4000-8000-000000000000';
function run(script,args,extraEnv={}){
 const result=spawnSync(process.execPath,[script,...args],{stdio:'inherit',env:{...process.env,...extraEnv}});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
function requireDatabase(){
 if(!db||!db.database_name||!db.database_id||db.database_id===placeholder||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(db.database_id)){
  throw Error('Production D1 is not configured. Replace database_id in wrangler.cloudflare.json with the ID from your Cloudflare D1 database. No deployment or remote migration was run.');
 }
}
function requireMatchingBuild(){
 const built=JSON.parse(readFileSync('dist/server/wrangler.json','utf8'));
 const binding=built.d1_databases?.find(d=>d.binding==='DB');
 if(built.name!==config.name||binding?.database_id!==db.database_id||binding?.database_name!==db.database_name||built.workers_dev!==true||built.preview_urls!==false)throw Error('Build does not match production config. Run npm run build:cloudflare first.');
}
const wrangler='node_modules/wrangler/bin/wrangler.js';
if(command==='build'){
 if(!db||db.database_id===placeholder)console.warn('D1 ID is a template: this build verifies compilation only; deployment stays blocked until configured.');
 run('node_modules/vinext/dist/cli.js',['build'],{ITWASH_CLOUDFLARE:'1'});
}else if(command==='deploy'){
 requireDatabase();requireMatchingBuild();
 // Only production deployment applies pending migrations; ordinary builds never write to D1.
 run(wrangler,['d1','migrations','apply','DB','--remote','--config',configPath]);
 run(wrangler,['deploy','--config','dist/server/wrangler.json']);
}else if(command==='migrate-local'){
 if(args.length!==2||args[0]!=='--persist-to')throw Error('Specify a disposable local state folder: --persist-to PATH');
 run(wrangler,['d1','migrations','apply','DB','--local','--config',configPath,...args]);
}else if(command==='migrate-remote'){
 requireDatabase();run(wrangler,['d1','migrations','apply','DB','--remote','--config',configPath]);
}else if(command==='dry-run'){
 requireDatabase();requireMatchingBuild();run(wrangler,['deploy','--dry-run','--config','dist/server/wrangler.json']);
}else throw Error('Expected build, deploy, migrate-local, migrate-remote, or dry-run.');
