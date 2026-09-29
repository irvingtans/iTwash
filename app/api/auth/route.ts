import {cookies} from 'next/headers';
import {database} from '../../../db/store';
import {authorized,hash,json,sameOrigin,scopes,Scope,matchesPin} from '../../../lib/server';
export async function GET(req:Request){try{const scope=new URL(req.url).searchParams.get('scope') as Scope;if(!scopes.includes(scope))return json({error:'Akses tidak valid.'},400);return json({authorized:await authorized(scope)||(scope==='customers'&&await authorized('owner'))})}catch{return json({error:'Akses belum tersedia. Coba lagi.'},503)}}
export async function POST(req:Request){
 try{
  if(!sameOrigin(req))return json({error:'Permintaan tidak diizinkan.'},403);
  const b=await req.json() as {scope:Scope|'admin';pin:string};if(!b||(!scopes.includes(b.scope)&&b.scope!=='admin')||typeof b.pin!=='string'||b.pin.length>12)return json({error:'PIN tidak valid.'},400);
  const key=await hash((req.headers.get('cf-connecting-ip')||'local')+':'+b.scope),now=Date.now();
  const attempts=await database().prepare('INSERT INTO pin_attempts (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING count,expires').bind(key,now+15*60000,now,now).first<{count:number;expires:number}>();
  if(attempts&&attempts.count>5)return json({error:'Terlalu banyak percobaan. Coba lagi dalam 15 menit.'},429);
  let selected:Scope|undefined;
  for(const candidate of (b.scope==='admin'?['owner','staff']:[b.scope]) as Scope[]){if(await matchesPin(candidate,b.pin)){selected=candidate;break}}
  if(!selected)return json({error:'PIN salah. Silakan coba lagi.'},401);
  if(b.scope==='admin'){
   const jar=await cookies();
   for(const old of scopes){const previous=jar.get('itwash_'+old)?.value;if(previous)await database().prepare('DELETE FROM pin_sessions WHERE token_hash=?').bind(await hash(previous)).run();jar.set('itwash_'+old,'',{httpOnly:true,secure:new URL(req.url).protocol==='https:',sameSite:'strict',path:'/',maxAge:0})}
  }
  const token=crypto.randomUUID()+crypto.randomUUID();
  await database().batch([database().prepare('INSERT INTO pin_sessions(token_hash,scope,expires) VALUES(?,?,?)').bind(await hash(token),selected,now+8*3600000),database().prepare('DELETE FROM pin_attempts WHERE key=?').bind(key),database().prepare('DELETE FROM pin_sessions WHERE expires<?').bind(now)]);
  (await cookies()).set('itwash_'+selected,token,{httpOnly:true,secure:new URL(req.url).protocol==='https:',sameSite:'strict',path:'/',maxAge:8*3600});
  return json({ok:true,scope:selected,redirect:selected==='owner'?'/owner':'/karyawan'});
 }catch(e){console.error(e);return json({error:'Tidak dapat membuka akses. Coba lagi.'},503)}
}
export async function DELETE(req:Request){if(!sameOrigin(req))return json({error:'Permintaan tidak diizinkan.'},403);const jar=await cookies();for(const scope of scopes){const token=jar.get('itwash_'+scope)?.value;if(token)await database().prepare('DELETE FROM pin_sessions WHERE token_hash=?').bind(await hash(token)).run();jar.set('itwash_'+scope,'',{httpOnly:true,sameSite:'strict',secure:new URL(req.url).protocol==='https:',path:'/',maxAge:0})}return json({ok:true})}
