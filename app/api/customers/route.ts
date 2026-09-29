import {database} from '../../../db/store';
import {normalizePhone} from '../../../lib/wash';
import {authorized,denied,json,phoneSQL,staffFields} from '../../../lib/server';
export async function GET(req:Request){try{
 const owner=await authorized('owner');if(!owner&&!await authorized('staff'))return denied();
 const params=new URL(req.url).searchParams,lookup=params.get('lookup');
 if(lookup!==null){const phone=normalizePhone(lookup);if(!phone)return json({customer:null});const c=await database().prepare(`SELECT customer_name AS name,COUNT(*) OVER() AS visits FROM jobs WHERE phone IN (?,?,?) ORDER BY created DESC,rowid DESC LIMIT 1`).bind(phone,'0'+phone.slice(2),'+'+phone).first();return json({customer:c})}
 if(!owner&&!await authorized('customers'))return denied();
 const phone=normalizePhone(params.get('phone'));
 if(phone){const r=await database().prepare(`SELECT ${staffFields},voided_at AS voidedAt FROM jobs WHERE phone IN (?,?,?) ORDER BY created DESC,rowid DESC`).bind(phone,'0'+phone.slice(2),'+'+phone).all();return json({jobs:r.results})}
 const r=await database().prepare(`WITH data AS (SELECT ${phoneSQL} AS normalized,customer_name,created,group_id,id,ROW_NUMBER() OVER(PARTITION BY ${phoneSQL} ORDER BY created DESC,rowid DESC) AS rn FROM jobs WHERE phone!='') SELECT normalized AS phone,MAX(CASE WHEN rn=1 THEN customer_name END) AS name,COUNT(*) AS items,COUNT(DISTINCT CASE WHEN group_id='' THEN id ELSE group_id END) AS visits,MAX(created) AS lastVisit FROM data GROUP BY normalized ORDER BY lastVisit DESC`).all();
 return json({customers:r.results});
}catch(e){console.error(e);return json({error:'Data pelanggan belum dapat dimuat.'},503)}}
