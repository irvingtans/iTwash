import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {Job,dateTime,money,itemTitle,itemDetail} from './wash';
import {invoiceItworksLogo} from './invoice-itworks-logo';
import {invoiceLogo} from './invoice-logo';
export const invoiceNumber=(j:Job)=>'ITW-'+(j.groupId||j.id).toUpperCase();
export const invoiceIsPaid=(jobs:Job[])=>jobs.length>0&&jobs.every(j=>!!j.paidAt&&j.amount!==null&&j.amount>=0);
export async function invoicePDF(jobs:Job[],options:{custom?:boolean;brand?:'itwash'|'itworks'}={}){
 if(!invoiceIsPaid(jobs))throw new Error('Invoice lunas hanya tersedia setelah seluruh pembayaran dicatat.');
 const isWorks=options.custom&&options.brand==='itworks',brandName=isWorks?'iTworks':'iT Wash',tagline=isWorks?'Aksesoris Mobil':'Premium Wash Services';
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),logo=await doc.embedPng(isWorks?invoiceItworksLogo:invoiceLogo);
 doc.setTitle('Invoice '+invoiceNumber(jobs[0]));doc.setAuthor(brandName);
 const ink=rgb(.12,.15,.18),muted=rgb(.40,.45,.49),red=rgb(.84,.18,.06),rule=rgb(.87,.89,.91),light=rgb(.96,.97,.98);
 let page=doc.addPage([595,842]),y=0;
 const clean=(s:string)=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,' ');
 function text(s:string,x:number,yy:number,size=10,strong=false,color=ink){page.drawText(clean(s),{x,y:yy,size,font:strong?bold:font,color})}
 function right(s:string,x:number,yy:number,size=10,strong=false,color=ink){text(s,x-(strong?bold:font).widthOfTextAtSize(clean(s),size),yy,size,strong,color)}
 function lines(s:string,width:number,size=10){const result:string[]=[];let row='';for(const char of clean(s)){if(font.widthOfTextAtSize(row+char,size)>width){const split=row.lastIndexOf(' ');if(split>row.length/2){result.push(row.slice(0,split));row=row.slice(split+1)+char}else{result.push(row);row=char}}else row+=char}if(row)result.push(row);return result}
 function block(s:string,x:number,yy:number,width:number,size=10,strong=false,color=ink){const rows=lines(s,width,size);rows.forEach((r,i)=>text(r,x,yy-i*15,size,strong,color));return rows.length*15}
 function header(){page.drawImage(logo,{x:44,y:738,width:166,height:166*logo.height/logo.width});right('INVOICE',551,772,26,true);text(tagline,44,718,10,false,muted);right('LUNAS',551,747,14,true,rgb(.12,.43,.30));right('@itautoworks',551,724,9,false,muted);text('Jalan AYANI 2, OCTO Sports & Lifestyle',44,701,9,false,muted);text('KubuRaya, Kalimantan Barat',44,687,9,false,muted);page.drawRectangle({x:44,y:670,width:507,height:2,color:red});text('NOMOR INVOICE',44,648,8,true,muted);text(invoiceNumber(jobs[0]),44,632,8.5,true);right(options.custom?'TANGGAL & WAKTU':'TANGGAL MASUK',551,648,8,true,muted);right(dateTime(jobs[0].created),551,632,9);y=597}
 function tableHeader(){page.drawRectangle({x:44,y:y-10,width:507,height:28,color:ink});text('NO.',55,y,9,true,rgb(1,1,1));text(isWorks?'RINCIAN PRODUK':'RINCIAN LAYANAN',88,y,9,true,rgb(1,1,1));text('PEMBAYARAN',368,y,9,true,rgb(1,1,1));right('JUMLAH',539,y,9,true,rgb(1,1,1));y-=33}
 function next(){page=doc.addPage([595,842]);header();text('Rincian layanan (lanjutan)',44,y,11,true);y-=32;tableHeader()}
 header();text('DITAGIHKAN KEPADA',44,y,8,true,muted);y-=20;y-=block(jobs[0].customerName||'Pelanggan iT Wash',44,y,490,13,true);if(!options.custom){text('No. HP  '+(jobs[0].phone||'-'),44,y-3,10,false,muted);y-=42}else y-=24;tableHeader();
 let total=0,paid=0,unknown=false;
 for(const [i,j] of jobs.entries()){
  const title=lines(itemTitle(j),260,11),details=lines(itemDetail(j),260,10);
  const extra=j.category==='sepatu'?'Estimasi: '+dateTime(j.estimatedAt||j.created+48*3600000):j.paidAt?'Dibayar: '+dateTime(j.paidAt):'';
  const extras=extra?lines(extra,260,8.5):[];if(j.category==='sepatu'&&j.paidAt)extras.push(...lines('Dibayar: '+dateTime(j.paidAt),260,8.5));
  const height=Math.max(66,(title.length+details.length+extras.length)*15+25);
  if(y-height<165)next();
  text(String(i+1).padStart(2,'0'),55,y,10,false,muted);let yy=y;
  title.forEach(l=>{text(l,88,yy,11,true);yy-=15});details.forEach(l=>{text(l,88,yy,10,false,muted);yy-=15});extras.forEach(l=>{text(l,88,yy,8.5,false,muted);yy-=15});
  text(j.paidAt?'LUNAS':'BELUM LUNAS',368,y,8.5,true,j.paidAt?rgb(.12,.43,.30):red);
  if(j.paidAt)text(j.paymentMethod.toUpperCase(),368,y-16,9,false,muted);
  right(j.amount===null?'Belum diisi':money(j.amount),539,y,11,true);
  y-=height;page.drawLine({start:{x:44,y:y+15},end:{x:551,y:y+15},thickness:.6,color:rule});
  total+=j.amount||0;if(j.paidAt)paid+=j.amount||0;if(j.amount===null)unknown=true;
 }
 if(y<240){page=doc.addPage([595,842]);header()}
 y-=8;page.drawRectangle({x:304,y:y-113,width:247,height:139,color:light});
 text('Total tagihan',320,y,10);right(money(total),535,y,12,true);text('Sudah dibayar',320,y-28,10,false,muted);right(money(paid),535,y-28,10);
 page.drawLine({start:{x:320,y:y-45},end:{x:535,y:y-45},thickness:.6,color:rule});text('STATUS PEMBAYARAN',320,y-68,9,true);right('LUNAS',535,y-94,21,true,rgb(.12,.43,.30));
 text(unknown?'TOTAL BELUM LENGKAP':total===paid?'LUNAS':paid>0?'DIBAYAR SEBAGIAN':'BELUM LUNAS',44,y,10,true,total===paid&&!unknown?rgb(.12,.43,.30):red);
 block(unknown?'Ada layanan yang harganya belum dicatat.':'Terima kasih telah memilih '+brandName+'.',44,y-25,235,10,false,muted);
 block('Pembayaran telah diterima. Simpan invoice ini sebagai bukti pembayaran.',44,y-66,235,9,false,muted);
 const pages=doc.getPages();pages.forEach((p,i)=>{p.drawLine({start:{x:44,y:56},end:{x:551,y:56},thickness:.6,color:rule});p.drawText(brandName+'  |  '+tagline+'  |  @itautoworks',{x:44,y:38,size:8,font,color:muted});p.drawText(`${i+1} / ${pages.length}`,{x:529,y:38,size:8,font,color:muted})});
 return doc.save();
}
