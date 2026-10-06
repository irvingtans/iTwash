import {env} from 'cloudflare:workers';
import {database} from '../db/store';
import {QrisError,createProviderQr,checkProviderQr,type QrisConfig} from './qris-provider';
export {QrisError};
export const NMID='ID1025433287535';
export function qrisConfig():QrisConfig|null{
 const e=env as unknown as Record<string,string>;
 return e.QRIS_API_KEY&&/^\d+$/.test(e.QRIS_MID||'')?{apiKey:e.QRIS_API_KEY,merchantId:e.QRIS_MID,nmid:NMID}:null;
}
export type Payment={id:string;job_id:string;active_job_id:string|null;invoice_id:string|null;amount:number;state:string;content:string|null;request_date:string|null;expires:number;created:number;checked_at:number;paid_at:number|null;message:string};
export const paymentById=(id:string)=>database().prepare('SELECT * FROM qris_payments WHERE id=?').bind(id).first<Payment>();
export function publicPayment(p:Payment){return {id:p.id,jobId:p.job_id,amount:p.amount,state:p.state,content:p.state==='pending'&&p.expires>Date.now()?p.content:null,expires:p.expires,paidAt:p.paid_at,nextCheckAt:p.checked_at+60000,message:p.message,nmid:NMID}}
export async function createPayment(jobId:string){
 const config=qrisConfig();if(!config)throw new QrisError('Open API QRIS belum diaktifkan. Owner perlu mengisi QRIS_API_KEY dan QRIS_MID di Cloudflare.',503);
 const db=database(),now=Date.now();
 // A response lost during creation cannot have shown a QR to a customer; keep it locked for its full lifetime.
 await db.prepare("UPDATE qris_payments SET state='failed',active_job_id=NULL,message='Pembuatan QR tidak selesai; silakan buat ulang.' WHERE job_id=? AND state='creating' AND expires<?").bind(jobId,now).run();
 const active=await db.prepare('SELECT * FROM qris_payments WHERE active_job_id=?').bind(jobId).first<Payment>();if(active)return active;
 const job=await db.prepare('SELECT amount FROM jobs WHERE id=? AND paid_at IS NULL AND voided_at IS NULL AND status<3').bind(jobId).first<{amount:number|null}>();
 if(!job||job.amount===null||!Number.isSafeInteger(job.amount)||job.amount<100||job.amount>100000000)throw new QrisError('Tagihan belum memiliki nominal yang valid atau sudah dibayar.',409);
 const id=crypto.randomUUID().replace(/-/g,'');
 const inserted=await db.prepare("INSERT OR IGNORE INTO qris_payments(id,job_id,active_job_id,amount,state,expires,created) SELECT ?,id,id,amount,'creating',?,? FROM jobs WHERE id=? AND amount=? AND paid_at IS NULL AND voided_at IS NULL AND status<3 AND NOT EXISTS(SELECT 1 FROM qris_payments WHERE active_job_id=?)").bind(id,now+30*60000,now,jobId,job.amount,jobId).run();
 if(!inserted.meta.changes){const pending=await db.prepare('SELECT * FROM qris_payments WHERE active_job_id=?').bind(jobId).first<Payment>();if(pending)return pending;throw new QrisError('Tagihan berubah. Tutup dan buka ulang pembayaran.',409)}
 try{const qr=await createProviderQr(config,id,job.amount);await db.prepare("UPDATE qris_payments SET invoice_id=?,content=?,request_date=?,expires=?,state='pending' WHERE id=? AND state='creating'").bind(qr.invoiceId,qr.content,qr.requestDate,qr.expires,id).run();}
 catch(e){await db.prepare("UPDATE qris_payments SET state='failed',active_job_id=NULL,message='QRIS belum berhasil dibuat.' WHERE id=? AND state='creating'").bind(id).run();throw e}
 return (await paymentById(id))!;
}
export async function verifyPayment(id:string){
 const config=qrisConfig();if(!config)throw new QrisError('Konfigurasi Open API QRIS belum tersedia.');
 const db=database(),p=await paymentById(id),now=Date.now();if(!p)throw new QrisError('Pembayaran tidak ditemukan.',404);
 if(p.state==='paid'||p.state==='review')return p;
 if(!p.invoice_id||!p.request_date)throw new QrisError('QRIS belum selesai dibuat. Buka kembali pembayaran.',409);
 const lock=await db.prepare('UPDATE qris_payments SET checked_at=? WHERE id=? AND checked_at<=?').bind(now,id,now-60000).run();
 if(!lock.meta.changes)throw new QrisError('Tunggu satu menit sebelum mengecek kembali.',429);
 const issuedDay=p.request_date.slice(0,10),today=new Date(Math.min(now,p.expires)+7*3600000).toISOString().slice(0,10);
 // Near midnight, alternate dates on separate checks; never query the provider in a tight loop.
 const date=today!==issuedDay&&p.message==='Periksa tanggal transaksi sebelumnya.'?issuedDay:today;
 const paid=await checkProviderQr(config,p.invoice_id,p.amount,date);
 if(paid){
  // Atomic D1 batch: a conflicting, voided or already-paid job goes to reconciliation, never double revenue.
  await db.batch([
   db.prepare("UPDATE jobs SET paid_at=?,payment_method='qris',updated=? WHERE id=? AND paid_at IS NULL AND voided_at IS NULL AND amount=? AND EXISTS(SELECT 1 FROM qris_payments WHERE id=? AND state NOT IN ('paid','review'))").bind(now,now,p.job_id,p.amount,id),
   db.prepare("UPDATE qris_payments SET state=CASE WHEN EXISTS(SELECT 1 FROM jobs WHERE id=? AND paid_at=? AND amount=? AND payment_method='qris') THEN 'paid' ELSE 'review' END,paid_at=?,active_job_id=NULL,content=NULL,message='' WHERE id=? AND state NOT IN ('paid','review')").bind(p.job_id,now,p.amount,now,id)
  ]);
 }else if(now>=p.expires&&date===issuedDay){await db.prepare("UPDATE qris_payments SET state='expired',active_job_id=NULL,content=NULL,message='QRIS kedaluwarsa dan belum dibayar.' WHERE id=? AND state='pending'").bind(id).run();}
 else await db.prepare('UPDATE qris_payments SET message=? WHERE id=?').bind(today!==issuedDay&&date===today?'Periksa tanggal transaksi sebelumnya.':'Belum ada pembayaran terverifikasi.',id).run();
 return (await paymentById(id))!;
}
