import {database} from '../../../db/store';
import {normalizePhone,Job} from '../../../lib/wash';
import {json,publicFields} from '../../../lib/server';
const missing=()=>json({error:'Cucian tidak ditemukan. Periksa nomor plat atau nomor HP Anda.'},404);
export async function GET(req:Request){try{
 const input=new URL(req.url).searchParams.get('code')?.trim()||'',phone=normalizePhone(input),plate=input.toUpperCase().replace(/\s+/g,''),token=/^[a-f0-9]{32}$/i.test(input);
 const db=database();let jobs:Job[]=[];
 if(phone){
  const r=await db.prepare(`SELECT ${publicFields} FROM jobs WHERE voided_at IS NULL AND phone IN (?,?,?) ORDER BY created DESC,rowid DESC`).bind(phone,'0'+phone.slice(2),'+'+phone).all<Job>();
  const all=r.results,active=new Set(all.filter(j=>j.status<3).map(j=>j.groupId||j.id));
  if(!active.size&&all[0])active.add(all[0].groupId||all[0].id);
  jobs=all.filter(j=>active.has(j.groupId||j.id));
 }else if(token){
  const job=await db.prepare(`SELECT ${publicFields} FROM jobs WHERE voided_at IS NULL AND id=?`).bind(input.toLowerCase()).first<Job>();
  if(job){if(job.category==='sepatu'&&job.groupId){jobs=(await db.prepare(`SELECT ${publicFields} FROM jobs WHERE voided_at IS NULL AND group_id=? ORDER BY rowid`).bind(job.groupId).all<Job>()).results}else jobs=[job]}
 }else if(/^[A-Z]{1,3}\d{1,4}[A-Z]{0,3}$/.test(plate)){
  const j=await db.prepare(`SELECT ${publicFields} FROM jobs WHERE voided_at IS NULL AND UPPER(REPLACE(plate,' ',''))=? AND category IN ('mobil','motor') ORDER BY CASE WHEN status<3 THEN 0 ELSE 1 END,created DESC,rowid DESC LIMIT 1`).bind(plate).first<Job>();if(j)jobs=[j];
 }else return missing();
 if(!jobs.length)return missing();return json({job:jobs[0],jobs});
}catch(e){console.error(e);return json({error:'Status belum dapat dimuat. Silakan coba lagi.'},503)}}
