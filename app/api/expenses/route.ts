import {database} from '../../../db/store';
import {authorized,denied,json,sameOrigin} from '../../../lib/server';
import {dateStamp,monthRange,text} from '../../../lib/payroll';
export async function GET(req:Request){try{
 if(!await authorized('staff')&&!await authorized('owner'))return denied();
 const month=new URL(req.url).searchParams.get('month')||new Date(Date.now()+25200000).toISOString().slice(0,7);monthRange(month);
 const rows=await database().prepare('SELECT id,date,description,amount,recorder,created FROM expenses WHERE substr(date,1,7)=? ORDER BY date DESC,created DESC').bind(month).all();return json({expenses:rows.results});
}catch{return json({error:'Pengeluaran belum dapat dimuat.'},400)}}
export async function POST(req:Request){
 if(!await authorized('staff')&&!await authorized('owner'))return denied();if(!sameOrigin(req))return json({error:'Permintaan tidak diizinkan.'},403);
 let b:any;try{b=await req.json();if(!b||typeof b.id!=='string'||!/^[a-f0-9-]{36}$/.test(b.id))throw Error('Data tidak valid.');dateStamp(b.date);if(b.date>new Date(Date.now()+25200000).toISOString().slice(0,10))throw Error('Tanggal pengeluaran tidak boleh di masa depan.');b.description=text(b.description,200,'Keperluan');b.recorder=text(b.recorder,80,'Nama karyawan');if(!Number.isSafeInteger(b.amount)||b.amount<=0||b.amount>100000000)throw Error('Nominal harus rupiah bulat antara 1 dan 100 juta.');}catch(e){return json({error:(e as Error).message||'Data tidak valid.'},400)}
 try{const db=database();await db.prepare('INSERT INTO expenses(id,date,description,amount,recorder,created) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(b.id,b.date,b.description,b.amount,b.recorder,Date.now()).run();const saved=await db.prepare('SELECT date,description,amount,recorder FROM expenses WHERE id=?').bind(b.id).first<any>();if(!saved||saved.date!==b.date||saved.description!==b.description||saved.amount!==b.amount||saved.recorder!==b.recorder)return json({error:'Permintaan sudah digunakan. Muat ulang formulir.'},409);return json({ok:true});}catch{return json({error:'Pengeluaran belum tersimpan. Coba lagi.'},500)}
}
