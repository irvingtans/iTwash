// Only this server-side adapter contacts InterActive. Never log credential-bearing URLs.
export type QrisConfig={apiKey:string;merchantId:string;nmid:string};
export class QrisError extends Error {constructor(message:string,public status=503){super(message)}}
const HOST='https://qris.interactive.co.id/restapi/qris/';
export function parseQr(content:string,amount:number,nmid:string){
 const fields:Record<string,string>={};let at=0;
 while(at<content.length){const tag=content.slice(at,at+2),size=content.slice(at+2,at+4);if(!/^\d{2}$/.test(tag)||!/^\d{2}$/.test(size)||fields[tag]!==undefined)throw new QrisError('Konten QRIS dari penyedia tidak valid.');const end=at+4+Number(size);if(end>content.length)throw new QrisError('Konten QRIS tidak lengkap.');fields[tag]=content.slice(at+4,end);at=end}
 if(fields['01']!=='12'||fields['53']!=='360'||!/^\d+(?:\.0{1,2})?$/.test(fields['54']||'')||Number(fields['54'])!==amount||!content.includes(nmid)||!/^6304[\dA-F]{4}$/i.test(content.slice(-8)))throw new QrisError('Nominal atau identitas merchant QRIS tidak sesuai.');
 let crc=0xffff;for(const char of new TextEncoder().encode(content.slice(0,-4))){crc^=char<<8;for(let bit=0;bit<8;bit++)crc=crc&0x8000?(crc<<1)^0x1021:crc<<1;crc&=0xffff}
 if(crc.toString(16).padStart(4,'0').toUpperCase()!==fields['63'].toUpperCase())throw new QrisError('Checksum QRIS tidak valid.');
}
async function call(config:QrisConfig,path:string,params:Record<string,string>){
 const url=new URL(HOST+path);url.search=new URLSearchParams({...params,apikey:config.apiKey,mID:config.merchantId}).toString();
 try{const response=await fetch(url,{signal:AbortSignal.timeout(15000),cache:'no-store',redirect:'error'});if(!response.ok)throw Error();return await response.json() as {status?:string;data?:Record<string,unknown>}}catch{throw new QrisError('InterActive belum merespons. Coba cek kembali; jangan meminta pelanggan membayar ulang.')}
}
export async function createProviderQr(config:QrisConfig,id:string,amount:number,now=Date.now()){
 const result=await call(config,'show_qris.php',{do:'create-invoice',cliTrxNumber:id,cliTrxAmount:String(amount),useTip:'no'}),d=result.data;
 if(result.status!=='success'||!d)throw new QrisError('QRIS belum dapat dibuat. Periksa aktivasi Open API dan konfigurasi merchant.');
 if(d.qris_nmid!==config.nmid||typeof d.qris_content!=='string'||d.qris_content.length>4096||!/^\d+$/.test(String(d.qris_invoiceid))||typeof d.qris_request_date!=='string'||!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(d.qris_request_date))throw new QrisError('Respons QRIS tidak sesuai merchant iT Wash.');
 const issued=Date.parse(d.qris_request_date.replace(' ','T')+'+07:00');
 if(!Number.isFinite(issued)||issued>now+60000||issued<now-120000)throw new QrisError('Waktu penerbitan QRIS tidak valid.');
 parseQr(d.qris_content,amount,config.nmid);
 return {invoiceId:String(d.qris_invoiceid),content:d.qris_content,requestDate:d.qris_request_date,expires:issued+30*60000};
}
export async function checkProviderQr(config:QrisConfig,invoiceId:string,amount:number,date:string){
 const result=await call(config,'checkpaid_qris.php',{do:'checkStatus',invid:invoiceId,trxvalue:String(amount),trxdate:date});
 if(result.status==='success'&&result.data?.qris_status==='paid')return true;
 if(result.status==='failed'&&result.data?.qris_status==='unpaid')return false;
 throw new QrisError('Status pembayaran belum bisa diverifikasi. Cek kembali atau hubungi InterActive.');
}
