import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {database} from '../db/store';
export type Scope='staff'|'customers'|'owner';
export const scopes=['staff','customers','owner'];
export async function hash(value:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('')}
export async function authorized(scope:Scope){const c=(await cookies()).get('itwash_'+scope)?.value;if(!c||c.length>150)return false;return !!await database().prepare('SELECT token_hash FROM pin_sessions WHERE token_hash=? AND scope=? AND expires>?').bind(await hash(c),scope,Date.now()).first()}
export const sameOrigin=(req:Request)=>!req.headers.get('origin')||req.headers.get('origin')===new URL(req.url).origin;
export const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export const denied=()=>json({error:'Masukkan PIN untuk mengakses halaman ini.'},401);
export const phoneSQL="CASE WHEN substr(phone,1,1)='0' THEN '62'||substr(phone,2) WHEN substr(phone,1,1)='+' THEN substr(phone,2) ELSE phone END";
export const publicFields='id,group_id AS groupId,plate,vehicle,category,wash_type AS washType,brand,color,status,created,updated,estimated_at AS estimatedAt';
export const staffFields=publicFields+',customer_name AS customerName,phone,amount,paid_at AS paidAt,payment_method AS paymentMethod';

export async function derivePin(pin:string,salt:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256);return Array.from(new Uint8Array(bits),x=>x.toString(16).padStart(2,'0')).join('')}

export async function matchesPin(scope:Scope,pin:string){
 const setting=await database().prepare('SELECT pin_hash AS pinHash,salt FROM pin_settings WHERE scope=?').bind(scope).first<{pinHash:string;salt:string}>();
 if(setting)return await derivePin(pin,setting.salt)===setting.pinHash;
 const secret=(env as unknown as Record<string,string>)[{staff:'STAFF_PIN',customers:'CUSTOMERS_PIN',owner:'OWNER_PIN'}[scope]];
 return !!secret && await hash(pin)===await hash(secret);
}
