import {database} from '../../../db/store';
import {authorized,denied,json,staffFields} from '../../../lib/server';
import {invoicePDF,invoiceNumber,invoiceIsPaid} from '../../../lib/invoice';
import {Job} from '../../../lib/wash';
export async function GET(req:Request){try{
 if(!await authorized('staff')&&!await authorized('owner'))return denied();
 const id=new URL(req.url).searchParams.get('id');if(!id||id.length>80)return json({error:'Invoice tidak valid.'},400);
 const job=await database().prepare(`SELECT ${staffFields} FROM jobs WHERE id=? AND voided_at IS NULL`).bind(id).first<Job>();
 if(!job)return json({error:'Cucian tidak ditemukan atau sudah di-void.'},404);
 const rows=job.category==='sepatu'&&job.groupId?(await database().prepare(`SELECT ${staffFields} FROM jobs WHERE group_id=? AND phone=? AND voided_at IS NULL ORDER BY created,rowid`).bind(job.groupId,job.phone).all<Job>()).results:[job];
 if(!invoiceIsPaid(rows))return json({error:'Invoice LUNAS tersedia setelah seluruh cucian dalam pesanan ini dibayar. Catat pembayaran terlebih dahulu.'},409);
 const bytes=await invoicePDF(rows);
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${invoiceNumber(job)}-LUNAS.pdf"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}catch(e){console.error(e);return json({error:'Invoice belum dapat dibuat. Coba lagi.'},503)}}
