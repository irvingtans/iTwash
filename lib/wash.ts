export type Category='mobil'|'motor'|'sepatu';
export type Job={id:string;groupId:string;plate:string;vehicle:string;category:Category;customerName?:string;phone?:string;washType:string;brand:string;color:string;status:number;created:number;updated:number;estimatedAt:number|null;amount:number|null;paidAt:number|null;paymentMethod:string;voidedAt?:number|null};
export const labels=['Menunggu','Sedang dicuci','Siap diambil','Sudah diambil'];
export function normalizePhone(value:unknown){if(typeof value!=='string')return '';let p=value.trim().replace(/[\s().-]/g,'');if(p.startsWith('+'))p=p.slice(1);if(p.startsWith('0'))p='62'+p.slice(1);return /^628\d{8,11}$/.test(p)?p:''}
export const itemTitle=(j:Job)=>j.category==='sepatu'?j.brand+' · '+j.color:j.plate;
export const itemDetail=(j:Job)=>j.category==='sepatu'?'Sepatu':(j.category==='motor'?'Motor':'Mobil')+' · '+j.vehicle+(j.washType?' · '+j.washType:'');
export const money=(n:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export const dateTime=(t:number)=>new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Pontianak',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(t)+' WIB';
export const dayKey=(t:number)=>new Date(t+7*3600000).toISOString().slice(0,10);
export const dayLabel=(t:number)=>dayKey(t)===dayKey(Date.now())?'Hari ini':new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Pontianak',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(t);
export function waLink(j:Job,ready=false){const phone=normalizePhone(j.phone);if(!phone)return '';const message=j.category==='sepatu'?'Halo pelanggan iTwash, Sepatu anda sudah siap diambil yaa..':`Halo pelanggan iTwash dengan kendaraan ${j.plate.replace(/\s/g,'')}. kendaraan anda sudah siap diambil yaa..`;return 'https://wa.me/'+phone+(ready?'?text='+encodeURIComponent(message):'')}
