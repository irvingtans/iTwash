import {database} from '../../../db/store';
import {normalizePhone} from '../../../lib/wash';
import {authorized,denied,json,sameOrigin,phoneSQL,staffFields} from '../../../lib/server';
export async function GET(req:Request){try{
 const owner=await authorized('owner');if(!owner&&!await authorized('staff'))return denied();
 const params=new URL(req.url).searchParams,lookup=params.get('lookup');
 const quick=params.get('quick');if(quick!==null){const q=quick.toUpperCase().replace(/[^A-Z0-9]/g,'');if(q.length<3||q.length>22)return json({matches:[]});const phone=normalizePhone(quick);const r=await database().prepare(`WITH matches AS (SELECT ${staffFields},ROW_NUMBER() OVER(PARTITION BY category,CASE WHEN category='sepatu' THEN ${phoneSQL} ELSE UPPER(REPLACE(plate,' ','')) END ORDER BY created DESC,rowid DESC) AS rn FROM jobs WHERE (UPPER(REPLACE(plate,' ','')) LIKE ? OR ${phoneSQL} LIKE ?) ) SELECT * FROM matches WHERE rn=1 ORDER BY created DESC LIMIT 8`).bind(q+'%',(phone||q)+'%').all();return json({matches:r.results});}

 if(lookup!==null){const phone=normalizePhone(lookup);if(!phone)return json({customer:null});const c=await database().prepare(`SELECT customer_name AS name,COUNT(*) OVER() AS visits FROM jobs WHERE phone IN (?,?,?) ORDER BY created DESC,rowid DESC LIMIT 1`).bind(phone,'0'+phone.slice(2),'+'+phone).first();return json({customer:c})}
 if(!owner&&!await authorized('customers'))return denied();
 const phone=normalizePhone(params.get('phone'));
 if(phone){const r=await database().prepare(`SELECT ${staffFields},voided_at AS voidedAt FROM jobs WHERE phone IN (?,?,?) ORDER BY created DESC,rowid DESC`).bind(phone,'0'+phone.slice(2),'+'+phone).all();return json({jobs:r.results})}
 const r=await database().prepare(`WITH data AS (SELECT ${phoneSQL} AS normalized,customer_name,created,updated,group_id,id,ROW_NUMBER() OVER(PARTITION BY ${phoneSQL} ORDER BY created DESC,rowid DESC) AS rn FROM jobs WHERE phone!='') SELECT normalized AS phone,MAX(CASE WHEN rn=1 THEN customer_name END) AS name,COUNT(*) AS items,COUNT(DISTINCT CASE WHEN group_id='' THEN id ELSE group_id END) AS visits,MAX(created) AS lastVisit,MAX(updated) AS revision FROM data GROUP BY normalized ORDER BY lastVisit DESC`).all();
 return json({customers:r.results});
}catch(e){console.error(e);return json({error:'Data pelanggan belum dapat dimuat.'},503)}}

export async function POST(req:Request){
 if(!await authorized('owner'))return denied();if(!sameOrigin(req))return json({error:'Permintaan tidak diizinkan.'},403);
 try{const b=await req.json() as any,oldPhone=normalizePhone(b.oldPhone),phone=normalizePhone(b.phone),name=typeof b.name==='string'?b.name.trim():'';if(!oldPhone||!phone||!name||name.length>80||!Number.isSafeInteger(b.revision)||!Number.isInteger(b.items))return json({error:'Isi nama dan nomor HP yang valid.'},400);
 const db=database();const oldCondition=`${phoneSQL}=?`;const condition=`${oldCondition} AND (SELECT MAX(updated) FROM jobs WHERE ${oldCondition})=? AND (SELECT COUNT(*) FROM jobs WHERE ${oldCondition})=? AND (?=? OR NOT EXISTS(SELECT 1 FROM jobs WHERE ${phoneSQL}=?))`;
 const args=[oldPhone,oldPhone,b.revision,oldPhone,b.items,oldPhone,phone,phone];const now=Math.max(Date.now(),b.revision+1);const audit=crypto.randomUUID();const result=await db.batch([
 db.prepare(`INSERT INTO job_edits(id,job_id,scope,before,after,reason,created) SELECT ?||id,id,'owner',json_object('customerName',customer_name,'phone',phone),?, 'Koreksi melalui Data pelanggan',? FROM jobs WHERE ${condition}`).bind(audit,JSON.stringify({customerName:name,phone}),now,...args),
 db.prepare('UPDATE jobs SET customer_name=?,phone=?,updated=? WHERE id IN (SELECT job_id FROM job_edits WHERE substr(id,1,36)=?)').bind(name,phone,now,audit)
 ]);if(!result[1].meta.changes)return json({error:'Data berubah atau nomor HP sudah dipakai pelanggan lain. Muat ulang daftar.'},409);return json({ok:true});
 }catch{return json({error:'Perubahan pelanggan belum tersimpan.'},400)}
}
