import {database} from '../../../db/store';
import {authorized,denied,json,sameOrigin,staffFields} from '../../../lib/server';
import {normalizePhone,Job} from '../../../lib/wash';
import {monthRange,text} from '../../../lib/payroll';
export async function GET(req:Request){try{
 if(!await authorized('owner'))return denied();const month=new URL(req.url).searchParams.get('month')||new Date(Date.now()+25200000).toISOString().slice(0,7);const {start,end}=monthRange(month);
 const r=await database().prepare(`SELECT ${staffFields} FROM jobs WHERE category IN ('mobil','motor') AND status>=2 AND voided_at IS NULL AND COALESCE(paid_at,created)>=? AND COALESCE(paid_at,created)<? ORDER BY COALESCE(paid_at,created) DESC`).bind(start,end).all();return json({jobs:r.results});
}catch{return json({error:'Transaksi belum dapat dimuat.'},400)}}
export async function POST(req:Request){try{
 const owner=await authorized('owner');if(!owner&&!await authorized('staff'))return denied();if(!sameOrigin(req))return json({error:'Permintaan tidak diizinkan.'},403);
 const b=await req.json() as any;if(!b||typeof b.id!=='string'||!Number.isSafeInteger(b.updated))return json({error:'Data transaksi tidak valid.'},400);
 const db=database(),old=await db.prepare(`SELECT ${staffFields} FROM jobs WHERE id=? AND voided_at IS NULL AND category IN ('mobil','motor')`).bind(b.id).first<Job>();
 if(!old)return json({error:'Transaksi tidak ditemukan.'},404);
 const ownerEdit=b.mode==='owner';if(ownerEdit&&!owner)return denied();
 if(ownerEdit?old.status<2:old.paidAt!==null)return json({error:ownerEdit?'Edit owner tersedia setelah cucian selesai.':'Data hanya dapat diubah sebelum pembayaran.'},409);
 if(old.updated!==b.updated)return json({error:'Transaksi sudah berubah. Tutup editor dan muat ulang.'},409);
 const customerName=text(b.customerName,80,'Nama pelanggan'),vehicle=text(b.vehicle,60,'Jenis kendaraan'),phone=normalizePhone(b.phone),plate=text(b.plate,20,'Plat').toUpperCase().replace(/\s+/g,' ');
 if(!phone||!/^[A-Z]{1,3}\s?\d{1,4}\s?[A-Z]{0,3}$/.test(plate))return json({error:'Isi nomor HP dan plat yang valid.'},400);
 const washType=ownerEdit?text(b.washType,600,'Jasa'):old.washType,amount=ownerEdit?b.amount:old.amount;
 if(ownerEdit&&(!Number.isSafeInteger(amount)||amount<0||amount>100000000))return json({error:'Harga harus angka rupiah bulat antara 0 dan 100 juta.'},400);
 const reason=ownerEdit?text(b.reason,200,'Alasan perubahan'):'Perbaikan data sebelum pembayaran';
 const now=Math.max(Date.now(),old.updated+1),audit=crypto.randomUUID();
 const condition="id=? AND updated=? AND voided_at IS NULL AND "+(ownerEdit?'status>=2':'paid_at IS NULL')+" AND (status>=3 OR NOT EXISTS(SELECT 1 FROM jobs j WHERE j.id!=? AND j.voided_at IS NULL AND j.status<3 AND j.category IN ('mobil','motor') AND UPPER(REPLACE(j.plate,' ',''))=UPPER(REPLACE(?,' ',''))))";
 const after={customerName,phone,plate,vehicle,washType,amount};
 const result=await db.batch([
 db.prepare(`INSERT INTO job_edits(id,job_id,scope,before,after,reason,created) SELECT ?,id,?,?,?,?,? FROM jobs WHERE ${condition}`).bind(audit,ownerEdit?'owner':'staff',JSON.stringify(old),JSON.stringify(after),reason,now,b.id,b.updated,b.id,plate),
 db.prepare(`UPDATE jobs SET customer_name=?,phone=?,plate=?,vehicle=?,wash_type=?,amount=?,updated=? WHERE ${condition}`).bind(customerName,phone,plate,vehicle,washType,amount,now,b.id,b.updated,b.id,plate),
 ]);
 if(!result[1].meta.changes)return json({error:'Data berubah atau plat sudah dipakai kendaraan lain dalam antrean. Muat ulang.'},409);
 return json({ok:true});
}catch(e){const msg=(e as Error).message;return json({error:/D1|SQL|database|JSON|Cannot/i.test(msg)?'Perubahan belum tersimpan. Coba lagi.':msg},400)}}
