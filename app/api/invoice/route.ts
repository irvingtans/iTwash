import {database} from '../../../db/store';
import {authorized,denied,json,staffFields,sameOrigin} from '../../../lib/server';
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

export async function POST(req:Request){try{
 if(!sameOrigin(req))return json({error:'Permintaan tidak valid.'},403);
 if(!await authorized('owner'))return denied();
 let input:any;try{input=await req.json()}catch{return json({error:'Data invoice tidak valid.'},400)}
 const b=input&&typeof input==='object'?input:{};
 const field=(key:string,max:number)=>typeof b[key]==='string'&&b[key].trim().length<=max?b[key].trim():'';
 const customerName=field('customerName',100),plate=field('plate',20).toUpperCase(),vehicle=field('vehicle',100),product=field('product',160),date=field('date',10),time=field('time',5);
 if(!customerName||!plate||!vehicle||!product||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return json({error:'Lengkapi nama, plat, jenis mobil, produk, tanggal, dan waktu.'},400);
 const timestamp=Date.parse(date+'T'+time+':00+07:00');
 if(!Number.isFinite(timestamp)||new Date(timestamp+7*3600000).toISOString().slice(0,16)!==date+'T'+time)return json({error:'Tanggal atau waktu tidak valid.'},400);
 if(!Number.isSafeInteger(b.amount)||b.amount<0||b.amount>100000000)return json({error:'Nominal harus berupa angka rupiah antara 0 dan 100.000.000.'},400);
 if(b.confirmPaid!==true||!['tunai','qris','transfer'].includes(b.paymentMethod))return json({error:'Pilih metode dan konfirmasi pembayaran telah diterima.'},400);
 if(b.brand!==undefined&&!['itwash','itworks'].includes(b.brand))return json({error:'Pilih logo invoice yang valid.'},400);
 const id='CUSTOM-'+crypto.randomUUID().replaceAll('-','').slice(0,16);
 const job:Job={id,groupId:id,category:'mobil',customerName,phone:'',plate,vehicle,washType:product,brand:'',color:'',status:3,created:timestamp,updated:timestamp,estimatedAt:null,amount:b.amount,paidAt:timestamp,paymentMethod:b.paymentMethod};
 const bytes=await invoicePDF([job],{custom:true,brand:b.brand||'itwash'});
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${invoiceNumber(job)}-LUNAS.pdf"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}catch(e){console.error(e);return json({error:'Invoice belum dapat dibuat. Coba lagi.'},503)}}
