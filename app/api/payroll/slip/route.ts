import {database} from '../../../../db/store';
import {authorized,denied,json} from '../../../../lib/server';
import {payslipPDF} from '../../../../lib/payslip';
export async function GET(req:Request){try{
 if(!await authorized('owner'))return denied();const id=new URL(req.url).searchParams.get('id');if(!id||id.length>80)return json({error:'Slip tidak valid.'},400);
 const r=await database().prepare('SELECT * FROM salaries WHERE id=?').bind(id).first<any>();if(!r)return json({error:'Slip tidak ditemukan.'},404);
 const bytes=await payslipPDF({...JSON.parse(r.detail),id:r.id,week:r.week,date:r.date,total:r.total,paidAt:r.paid_at});
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Slip-Gaji-iTWash-${r.week}.pdf"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}catch{return json({error:'Slip belum dapat dibuat.'},503)}}
