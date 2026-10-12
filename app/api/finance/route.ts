import {database} from '../../../db/store';
import {authorized,denied,json} from '../../../lib/server';
import {monthRange} from '../../../lib/payroll';
export async function GET(req:Request){try{
 if(!await authorized('owner'))return denied();const month=new URL(req.url).searchParams.get('month')||new Date(Date.now()+25200000).toISOString().slice(0,7);const {start,end}=monthRange(month);const db=database();const yearStart=monthRange(month.slice(0,4)+'-01').start,yearEnd=monthRange((Number(month.slice(0,4))+1)+'-01').start;
 const [income,salary,draft,services,methods,daily,dailySalary,monthlyIncome,monthlySalary,expenseRows,yearExpenses]=await Promise.all([
 db.prepare('SELECT COALESCE(SUM(amount),0) AS total,COUNT(*) AS count FROM jobs WHERE voided_at IS NULL AND paid_at>=? AND paid_at<?').bind(start,end).first<any>(),
 db.prepare('SELECT COALESCE(SUM(total),0) AS total,COUNT(*) AS count FROM salaries WHERE paid_at>=? AND paid_at<?').bind(start,end).first<any>(),
 db.prepare('SELECT COALESCE(SUM(total),0) AS total FROM salaries WHERE paid_at IS NULL AND substr(date,1,7)=?').bind(month).first<any>(),
 db.prepare('SELECT category,wash_type AS service,COUNT(*) AS count,SUM(amount) AS total FROM jobs WHERE voided_at IS NULL AND paid_at>=? AND paid_at<? GROUP BY category,wash_type ORDER BY total DESC').bind(start,end).all(),
 db.prepare('SELECT payment_method AS method,SUM(amount) AS total FROM jobs WHERE voided_at IS NULL AND paid_at>=? AND paid_at<? GROUP BY payment_method').bind(start,end).all(),
 db.prepare("SELECT strftime('%Y-%m-%d',paid_at/1000,'unixepoch','+7 hours') AS date,SUM(amount) AS total FROM jobs WHERE voided_at IS NULL AND paid_at>=? AND paid_at<? GROUP BY date ORDER BY date").bind(start,end).all(),
 db.prepare("SELECT strftime('%Y-%m-%d',paid_at/1000,'unixepoch','+7 hours') AS date,SUM(total) AS total FROM salaries WHERE paid_at>=? AND paid_at<? GROUP BY date ORDER BY date").bind(start,end).all(),
 db.prepare("SELECT strftime('%m',paid_at/1000,'unixepoch','+7 hours') AS month,SUM(amount) AS total FROM jobs WHERE voided_at IS NULL AND paid_at>=? AND paid_at<? GROUP BY month").bind(yearStart,yearEnd).all(),
 db.prepare("SELECT strftime('%m',paid_at/1000,'unixepoch','+7 hours') AS month,SUM(total) AS total FROM salaries WHERE paid_at>=? AND paid_at<? GROUP BY month").bind(yearStart,yearEnd).all(),
 db.prepare('SELECT id,date,description,amount,recorder FROM expenses WHERE substr(date,1,7)=? ORDER BY date DESC,created DESC').bind(month).all(),
 db.prepare('SELECT substr(date,6,2) AS month,SUM(amount) AS total FROM expenses WHERE substr(date,1,4)=? GROUP BY month').bind(month.slice(0,4)).all(),
 ]);const expenseDaily=new Map<string,number>();let expenseTotal=0;for(const r of expenseRows.results as any[]){expenseTotal+=r.amount;expenseDaily.set(r.date,(expenseDaily.get(r.date)||0)+r.amount)}const expenseMonths=new Map(yearExpenses.results.map((r:any)=>[r.month,r.total]));const dailyMap=new Map(daily.results.map((r:any)=>[r.date,r.total])),salaryMap=new Map(dailySalary.results.map((r:any)=>[r.date,r.total]));
 const chart=Array.from({length:Math.round((end-start)/86400000)},(_,i)=>{const date=month+'-'+String(i+1).padStart(2,'0');return {date,day:String(i+1),income:dailyMap.get(date)||0,expense:expenseDaily.get(date)||0,salary:salaryMap.get(date)||0}});
 const incomeMonths=new Map(monthlyIncome.results.map((r:any)=>[r.month,r.total])),salaryMonths=new Map(monthlySalary.results.map((r:any)=>[r.month,r.total]));
 const yearly=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'].map((label,i)=>({label,expense:expenseMonths.get(String(i+1).padStart(2,'0'))||0,income:incomeMonths.get(String(i+1).padStart(2,'0'))||0,salary:salaryMonths.get(String(i+1).padStart(2,'0'))||0}));
 return json({chart,yearly,month,income:income.total,count:income.count,salary:salary.total,salaryCount:salary.count,draft:draft.total,expenses:expenseRows.results,expense:expenseTotal,balance:income.total-salary.total-expenseTotal,services:services.results,methods:methods.results,daily:daily.results});
}catch{return json({error:'Laporan keuangan belum dapat dimuat.'},400)}}
