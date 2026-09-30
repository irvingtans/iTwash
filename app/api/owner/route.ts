import {database} from '../../../db/store';
import {authorized,denied,json,sameOrigin,scopes,Scope,derivePin,matchesPin} from '../../../lib/server';
export async function GET(req:Request){try{
 if(!await authorized('owner'))return denied();const period=new URL(req.url).searchParams.get('period')||'day';if(!['day','week','month'].includes(period))return json({error:'Periode tidak valid.'},400);
 const now=Date.now(),local=new Date(now+7*3600000),midnight=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-7*3600000;
 const starts={day:midnight,week:midnight-((local.getUTCDay()+6)%7)*86400000,month:Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),1)-7*3600000};
 const db=database();const [totals,breakdown,transactions,outstanding]=await Promise.all([
 db.prepare('SELECT COALESCE(SUM(CASE WHEN paid_at>=? THEN amount ELSE 0 END),0) AS day,COALESCE(SUM(CASE WHEN paid_at>=? THEN amount ELSE 0 END),0) AS week,COALESCE(SUM(CASE WHEN paid_at>=? THEN amount ELSE 0 END),0) AS month FROM jobs WHERE voided_at IS NULL AND paid_at IS NOT NULL').bind(starts.day,starts.week,starts.month).first(),
 db.prepare('SELECT category,wash_type AS washType,COUNT(*) AS count,SUM(amount) AS revenue FROM jobs WHERE voided_at IS NULL AND paid_at>=? AND paid_at<=? GROUP BY category,wash_type ORDER BY revenue DESC').bind(starts[period as keyof typeof starts],now).all(),
 db.prepare('SELECT id,category,plate,brand,color,wash_type AS washType,amount,paid_at AS paidAt,payment_method AS paymentMethod,voided_at AS voidedAt,void_reason AS voidReason FROM jobs WHERE paid_at>=? AND paid_at<=? ORDER BY paid_at DESC').bind(starts[period as keyof typeof starts],now).all(),
 db.prepare('SELECT COUNT(*) AS count,COALESCE(SUM(amount),0) AS amount,SUM(CASE WHEN amount IS NULL THEN 1 ELSE 0 END) AS unpriced FROM jobs WHERE voided_at IS NULL AND paid_at IS NULL').first()
 ]);return json({totals,breakdown:breakdown.results,transactions:transactions.results,outstanding,period,starts});
}catch(e){console.error(e);return json({error:'Dashboard belum dapat dimuat.'},503)}}

export async function POST(req:Request){try{
 if(!await authorized('owner'))return denied();if(!sameOrigin(req))return json({error:'Permintaan tidak diizinkan.'},403);
 const b=await req.json() as {action:string;id?:string;reason?:string;scope?:Scope;pin?:string;confirmPin?:string};
 if(b.action==='void'){
  if(typeof b.id!=='string')return json({error:'Transaksi tidak valid.'},400);
  const reason=typeof b.reason==='string'?b.reason.trim().slice(0,200):'';
  const r=await database().prepare('UPDATE jobs SET voided_at=?,void_reason=?,updated=? WHERE id=? AND paid_at IS NOT NULL AND voided_at IS NULL').bind(Date.now(),reason||'Dibatalkan owner',Date.now(),b.id).run();
  if(!r.meta.changes)return json({error:'Transaksi tidak ditemukan atau sudah di-void.'},409);
  return json({ok:true});
 }
 if(b.action==='change_pin'){
  if(!b.scope||!scopes.includes(b.scope)||typeof b.pin!=='string'||!/^\d{4,8}$/.test(b.pin)||b.pin!==b.confirmPin)return json({error:'PIN harus 4–8 angka dan konfirmasi harus sama.'},400);
  if((b.scope==='staff'||b.scope==='owner')&&await matchesPin(b.scope==='staff'?'owner':'staff',b.pin))return json({error:'PIN Owner dan Karyawan harus berbeda agar akses Admin dapat dikenali.'},400);
  const salt=crypto.randomUUID(),pinHash=await derivePin(b.pin,salt);
  await database().batch([database().prepare('INSERT INTO pin_settings(scope,pin_hash,salt,updated) VALUES(?,?,?,?) ON CONFLICT(scope) DO UPDATE SET pin_hash=excluded.pin_hash,salt=excluded.salt,updated=excluded.updated').bind(b.scope,pinHash,salt,Date.now()),database().prepare('DELETE FROM pin_sessions WHERE scope=?').bind(b.scope)]);
  return json({ok:true,relogin:b.scope==='owner'});
 }
 return json({error:'Tindakan tidak valid.'},400);
}catch(e){console.error(e);return json({error:'Perubahan belum tersimpan. Coba lagi.'},503)}}
