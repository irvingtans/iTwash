import {database} from '../../../db/store';
import {authorized,denied,json,sameOrigin} from '../../../lib/server';
import {employeeInput,salaryInput,dateStamp,monthRange} from '../../../lib/payroll';
export async function GET(req:Request){try{
 if(!await authorized('owner'))return denied();const month=new URL(req.url).searchParams.get('month')||new Date(Date.now()+25200000).toISOString().slice(0,7);monthRange(month);
 const db=database();const [employees,salaries]=await Promise.all([db.prepare('SELECT id,name,bank,account,rate,pay_type AS payType,monthly_rate AS monthlyRate FROM employees ORDER BY name').all(),db.prepare('SELECT * FROM salaries WHERE substr(date,1,7)=? ORDER BY date DESC,id').bind(month).all<any>()]);
 return json({employees:employees.results,salaries:salaries.results.map(r=>({...JSON.parse(r.detail),id:r.id,employeeId:r.employee_id,week:r.week,date:r.date,total:r.total,paidAt:r.paid_at,version:r.version,deletedAt:r.deleted_at,deleteReason:r.delete_reason}))});
}catch{return json({error:'Data gaji belum dapat dimuat.'},400)}}
export async function POST(req:Request){
 if(!await authorized('owner'))return denied();if(!sameOrigin(req))return json({error:'Permintaan tidak diizinkan.'},403);
 let b:any;try{b=await req.json();if(!b||typeof b!=='object'||Array.isArray(b))throw Error()}catch{return json({error:'Data tidak valid.'},400)}
 const db=database();
 try{
 if(b.action==='delete'||b.action==='restore'){
 if(typeof b.id!=='string'||!Number.isInteger(b.version))return json({error:'Slip tidak valid.'},400);
 const reason=typeof b.reason==='string'?b.reason.trim():'';if(b.action==='delete'&&(!reason||reason.length>200))return json({error:'Isi alasan penghapusan (maksimal 200 karakter).'},400);
 const statement=b.action==='delete'?'UPDATE salaries SET deleted_at=?,delete_reason=?,version=version+1 WHERE id=? AND version=? AND deleted_at IS NULL':'UPDATE salaries SET deleted_at=NULL,version=version+1 WHERE id=? AND version=? AND deleted_at IS NOT NULL';
 const q=db.prepare(statement);const r=await (b.action==='delete'?q.bind(Date.now(),reason,b.id,b.version):q.bind(b.id,b.version)).run();if(!r.meta.changes)return json({error:'Slip sudah berubah. Muat ulang daftar.'},409);return json({ok:true});
 }
 if(b.action==='employee'){
 const v=employeeInput(b);const id=b.id?String(b.id):crypto.randomUUID();
 if(b.id){const r=await db.prepare('UPDATE employees SET name=?,bank=?,account=?,rate=?,pay_type=?,monthly_rate=? WHERE id=?').bind(v.name,v.bank,v.account,v.rate,v.payType,v.monthlyRate,id).run();if(!r.meta.changes)return json({error:'Karyawan tidak ditemukan.'},404)}
 else await db.prepare('INSERT INTO employees(id,name,bank,account,rate,pay_type,monthly_rate) VALUES(?,?,?,?,?,?,?)').bind(id,v.name,v.bank,v.account,v.rate,v.payType,v.monthlyRate).run();return json({ok:true});
 }
 if(b.action==='salary'){
 const v=salaryInput(b);if(typeof b.employeeId!=='string'||!await db.prepare('SELECT id FROM employees WHERE id=?').bind(b.employeeId).first())return json({error:'Pilih karyawan terdaftar.'},400);
 if(b.id){if(!Number.isInteger(b.version))return json({error:'Versi slip tidak valid.'},400);const r=await db.prepare('UPDATE salaries SET week=?,date=?,detail=?,total=?,version=version+1 WHERE id=? AND employee_id=? AND version=? AND paid_at IS NULL AND deleted_at IS NULL').bind(v.week,v.date,JSON.stringify(v),v.total,b.id,b.employeeId,b.version).run();if(!r.meta.changes)return json({error:'Slip sudah dibayar atau berubah. Muat ulang daftar.'},409)}
 else await db.prepare('INSERT INTO salaries(id,employee_id,week,date,detail,total) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),b.employeeId,v.week,v.date,JSON.stringify(v),v.total).run();return json({ok:true});
 }
 if(b.action==='pay'){
 const paidAt=dateStamp(b.date);if(paidAt>Date.now())return json({error:'Tanggal pembayaran tidak boleh di masa depan.'},400);
 if(typeof b.id!=='string'||!Number.isInteger(b.version))return json({error:'Slip tidak valid.'},400);
 const r=await db.prepare('UPDATE salaries SET paid_at=?,date=?,version=version+1 WHERE id=? AND version=? AND paid_at IS NULL AND deleted_at IS NULL').bind(paidAt,b.date,b.id,b.version).run();if(!r.meta.changes)return json({error:'Slip sudah dibayar atau berubah. Muat ulang daftar.'},409);return json({ok:true});
 }
 return json({error:'Tindakan tidak valid.'},400);
 }catch(e){const msg=(e as Error).message;if(msg.includes('UNIQUE'))return json({error:'Slip karyawan dengan tanggal awal periode ini sudah ada. Edit slip tersebut.'},409);if(/D1|SQL|database/i.test(msg))return json({error:'Gaji belum tersimpan. Coba lagi.'},503);return json({error:msg},400)}
}
