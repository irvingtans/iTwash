import {priceFor} from '../../../lib/pricing';
import {database} from '../../../db/store';
import {normalizePhone} from '../../../lib/wash';
import {authorized,denied,json,sameOrigin,staffFields} from '../../../lib/server';
const clean=(v:unknown)=>typeof v==='string'?v.trim():'';
export async function GET(){try{if(!await authorized('staff'))return denied();const r=await database().prepare(`SELECT ${staffFields} FROM jobs WHERE voided_at IS NULL ORDER BY created DESC,rowid DESC`).all();return json({jobs:r.results})}catch(e){console.error(e);return json({error:'Antrean belum dapat dimuat.'},503)}}
export async function POST(req:Request){try{
 if(!await authorized('staff'))return denied();if(!sameOrigin(req))return json({error:'Permintaan tidak diizinkan.'},403);
 const b=await req.json() as Record<string,unknown>;if(!b||Array.isArray(b))return json({error:'Data tidak valid.'},400);
 const category=clean(b.category),customerName=clean(b.customerName),phone=normalizePhone(b.phone);
 if(!['mobil','motor','sepatu'].includes(category)||!customerName||customerName.length>80||!phone)return json({error:'Isi jenis cucian, nama, dan nomor HP yang valid.'},400);
 const shoes=category==='sepatu',groupId=crypto.randomUUID().replace(/-/g,''),now=Date.now();
 const plate=shoes?'':clean(b.plate).toUpperCase().replace(/\s+/g,' '),vehicle=shoes?'':clean(b.vehicle),washType=shoes?'':clean(b.washType);
 if(!shoes&&(!/^[A-Z]{1,3}\s?\d{1,4}\s?[A-Z]{0,3}$/.test(plate)||!vehicle||vehicle.length>60||priceFor(category,washType)===undefined))return json({error:'Isi plat, jenis kendaraan, dan tipe cuci yang valid.'},400);
 const rows=shoes?(Array.isArray(b.shoes)?b.shoes:[{brand:b.brand,color:b.color,amount:b.amount}]):[{brand:'',color:'',amount:b.amount}];
 if(!rows.length||rows.length>30)return json({error:'Masukkan 1–30 pasang sepatu per transaksi.'},400);
 const items=[];
 for(const raw of rows){if(!raw||typeof raw!=='object')return json({error:'Data sepatu tidak valid.'},400);const r=raw as Record<string,unknown>,brand=clean(r.brand),color=clean(r.color);if(shoes&&(!brand||brand.length>60||!color||color.length>40))return json({error:'Isi merek dan warna setiap pasang sepatu.'},400);const amount=priceFor(category,washType)!;items.push({id:crypto.randomUUID().replace(/-/g,''),brand,color,amount})}
 const db=database();
 const statements=items.map(i=>db.prepare("INSERT INTO jobs(id,owner,plate,vehicle,category,customer_name,phone,wash_type,brand,color,status,created,updated,group_id,estimated_at,amount) SELECT ?,'itwash',?,?,?,?,?,?,?,?,0,?,?,?,?,? WHERE ?='sepatu' OR NOT EXISTS(SELECT 1 FROM jobs WHERE voided_at IS NULL AND category!='sepatu' AND REPLACE(plate,' ','')=REPLACE(?,' ','') AND status<3)").bind(i.id,plate,vehicle,category,customerName,phone,washType,i.brand,i.color,now,now,groupId,shoes?now+48*3600000:null,i.amount,category,plate));
 const results=await db.batch(statements);if(!results[0].meta.changes)return json({error:'Kendaraan dengan plat ini masih ada di antrean.'},409);
 return json({id:items[0].id,ids:items.map(i=>i.id),groupId,count:items.length},201);
}catch(e){console.error(e);return json({error:'Cucian belum tersimpan. Silakan coba lagi.'},503)}}
export async function PATCH(req:Request){try{
 if(!await authorized('staff'))return denied();if(!sameOrigin(req))return json({error:'Permintaan tidak diizinkan.'},403);
 const b=await req.json() as {id:string;status?:number;action?:string;amount?:number;paymentMethod?:string};if(typeof b.id!=='string')return json({error:'Data tidak valid.'},400);
 if(b.action==='pay'||b.action==='checkout'){
  const checkout=b.action==='checkout';
  const existing=await database().prepare('SELECT amount,paid_at AS paidAt,status FROM jobs WHERE id=? AND voided_at IS NULL').bind(b.id).first<{amount:number|null;paidAt:number|null;status:number}>();
  if(!existing)return json({error:'Cucian tidak ditemukan.'},404);
  if(checkout&&existing.status!==2)return json({error:'Cucian belum siap diambil atau sudah diambil.'},409);
  if(!checkout&&existing.paidAt!==null)return json({error:'Pembayaran sudah dicatat.'},409);
  if(checkout&&existing.paidAt!==null){
   const r=await database().prepare('UPDATE jobs SET status=3,updated=? WHERE id=? AND status=2 AND voided_at IS NULL').bind(Date.now(),b.id).run();
   if(!r.meta.changes)return json({error:'Status telah berubah. Muat ulang antrean.'},409);
   return json({ok:true});
  }
  if(!['cash','qris'].includes(b.paymentMethod||''))return json({error:'Pilih metode pembayaran yang valid.'},400);
  const amount=existing.amount??b.amount;
  if(amount===undefined||!Number.isSafeInteger(amount)||amount<0||amount>100000000)return json({error:'Nominal pembayaran tidak valid.'},400);
  if(existing.amount!==null&&b.amount!==existing.amount)return json({error:'Nominal harus sesuai harga cucian yang tercatat.'},400);
  const r=checkout
   ?await database().prepare('UPDATE jobs SET amount=COALESCE(amount,?),paid_at=COALESCE(paid_at,?),payment_method=CASE WHEN paid_at IS NULL THEN ? ELSE payment_method END,status=3,updated=? WHERE id=? AND status=2 AND voided_at IS NULL').bind(amount,Date.now(),b.paymentMethod!,Date.now(),b.id).run()
   :await database().prepare('UPDATE jobs SET amount=COALESCE(amount,?),paid_at=?,payment_method=?,updated=? WHERE id=? AND paid_at IS NULL AND voided_at IS NULL').bind(amount,Date.now(),b.paymentMethod!,Date.now(),b.id).run();
  if(!r.meta.changes)return json({error:'Transaksi sudah berubah. Muat ulang antrean.'},409);
 }else{
  if(!Number.isInteger(b.status)||b.status!<1||b.status!>2)return json({error:'Gunakan konfirmasi pembayaran untuk pengambilan cucian.'},400);
  const r=await database().prepare('UPDATE jobs SET status=?,updated=? WHERE id=? AND status=? AND voided_at IS NULL').bind(b.status!,Date.now(),b.id,b.status!-1).run();if(!r.meta.changes)return json({error:'Status telah berubah. Muat ulang antrean.'},409)
 }
 return json({ok:true});
}catch(e){console.error(e);return json({error:'Perubahan belum tersimpan.'},503)}}
