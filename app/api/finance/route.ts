import {database} from '../../../db/store';
import {authorized,denied,json} from '../../../lib/server';
import {monthRange} from '../../../lib/payroll';
export async function GET(req:Request){try{
 if(!await authorized('owner'))return denied();const month=new URL(req.url).searchParams.get('month')||new Date(Date.now()+25200000).toISOString().slice(0,7);const {start,end}=monthRange(month);const db=database();
 const [income,salary,draft,services,methods,daily]=await Promise.all([
 db.prepare('SELECT COALESCE(SUM(amount),0) AS total,COUNT(*) AS count FROM jobs WHERE voided_at IS NULL AND paid_at>=? AND paid_at<?').bind(start,end).first<any>(),
 db.prepare('SELECT COALESCE(SUM(total),0) AS total,COUNT(*) AS count FROM salaries WHERE paid_at>=? AND paid_at<?').bind(start,end).first<any>(),
 db.prepare('SELECT COALESCE(SUM(total),0) AS total FROM salaries WHERE paid_at IS NULL AND substr(date,1,7)=?').bind(month).first<any>(),
 db.prepare('SELECT category,wash_type AS service,COUNT(*) AS count,SUM(amount) AS total FROM jobs WHERE voided_at IS NULL AND paid_at>=? AND paid_at<? GROUP BY category,wash_type ORDER BY total DESC').bind(start,end).all(),
 db.prepare('SELECT payment_method AS method,SUM(amount) AS total FROM jobs WHERE voided_at IS NULL AND paid_at>=? AND paid_at<? GROUP BY payment_method').bind(start,end).all(),
 db.prepare("SELECT strftime('%Y-%m-%d',paid_at/1000,'unixepoch','+7 hours') AS date,SUM(amount) AS total FROM jobs WHERE voided_at IS NULL AND paid_at>=? AND paid_at<? GROUP BY date ORDER BY date").bind(start,end).all(),
 ]);return json({month,income:income.total,count:income.count,salary:salary.total,salaryCount:salary.count,draft:draft.total,balance:income.total-salary.total,services:services.results,methods:methods.results,daily:daily.results});
}catch{return json({error:'Laporan keuangan belum dapat dimuat.'},400)}}
