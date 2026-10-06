import {authorized,denied,json,sameOrigin} from '../../../lib/server';
import {database} from '../../../db/store';
import {qrisConfig,publicPayment,createPayment,verifyPayment,paymentById,QrisError,type Payment} from '../../../lib/qris';
async function allowed(){return await authorized('staff')||await authorized('owner')}
export async function GET(req:Request){try{
 if(!await allowed())return denied();
 const id=new URL(req.url).searchParams.get('jobId');
 if(id){const p=await database().prepare('SELECT * FROM qris_payments WHERE job_id=? ORDER BY created DESC LIMIT 1').bind(id).first<Payment>();return json({configured:!!qrisConfig(),payment:p?publicPayment(p):null})}
 const r=await database().prepare("SELECT q.id,q.amount,q.state,q.paid_at AS paidAt,j.plate,j.brand,j.category FROM qris_payments q JOIN jobs j ON j.id=q.job_id WHERE q.state IN ('paid','review') AND q.paid_at>? ORDER BY q.paid_at DESC LIMIT 10").bind(Date.now()-86400000).all();
 return json({configured:!!qrisConfig(),payments:r.results});
}catch{return json({error:'Status QRIS belum dapat dimuat.'},503)}}
export async function POST(req:Request){try{
 if(!await allowed())return denied();if(!sameOrigin(req))return json({error:'Permintaan tidak diizinkan.'},403);
 const b=await req.json() as {action?:string;jobId?:string;id?:string};
 if(b.action==='create'&&typeof b.jobId==='string'&&b.jobId.length<=64){if(!await authorized('staff'))return denied();return json({payment:publicPayment(await createPayment(b.jobId))})}
 if(b.action==='check'&&typeof b.id==='string'&&b.id.length<=64){if(!await paymentById(b.id))return json({error:'Pembayaran tidak ditemukan.'},404);return json({payment:publicPayment(await verifyPayment(b.id))})}
 return json({error:'Permintaan QRIS tidak valid.'},400);
}catch(e){return json({error:e instanceof QrisError?e.message:'Pembayaran belum dapat diproses.'},e instanceof QrisError?e.status:503)}}
