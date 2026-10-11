import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {invoiceLogo} from './invoice-logo';
import {Salary,sunday} from './payroll';
export async function payslipPDF(s:Salary){
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),logo=await doc.embedPng(invoiceLogo),page=doc.addPage([595,842]);
 doc.setTitle('Slip Gaji iT Wash');doc.setAuthor('iT Wash');
 const ink=rgb(.10,.17,.20),red=rgb(.86,.15,.04),muted=rgb(.42,.48,.51),light=rgb(.95,.96,.97);
 const clean=(v:string)=>v.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,' ');
 function text(v:string,x:number,y:number,size=10,strong=false,color=ink){page.drawText(clean(v),{x,y,size,font:strong?bold:font,color})}
 function right(v:string,y:number,size=11,strong=false){text(v,551-(strong?bold:font).widthOfTextAtSize(clean(v),size),y,size,strong)}
 function wrap(v:string,x:number,y:number,width:number,size=10){let row='',n=0;for(const c of clean(v)){if(font.widthOfTextAtSize(row+c,size)>width){text(row,x,y-n*14,size);row=c;n++}else row+=c}text(row,x,y-n*14,size);return (n+1)*14}
 const rp=(v:number)=>'Rp '+v.toLocaleString('id-ID');
 page.drawImage(logo,{x:44,y:749,width:148,height:148*logo.height/logo.width});right('SLIP GAJI',775,24,true);right(s.paidAt?'SUDAH DIBAYAR':'DRAFT / BELUM DIBAYAR',753,10,true);
 text('Premium Wash Services',44,726,10,false,muted);text('Jalan AYANI 2, OCTO Sports & Lifestyle',44,706,9,false,muted);text('KubuRaya, Kalimantan Barat',44,692,9,false,muted);text('Tel. 08115747001',44,678,9,false,muted);page.drawRectangle({x:44,y:660,width:507,height:3,color:red});
 text('KARYAWAN',44,636,8,true,muted);wrap(s.name,44,615,290,13);right('Tanggal: '+s.date,635,10);right(s.payType==='monthly'?'Periode bulanan':'Periode harian / mingguan',615,9);right(s.week+' s/d '+(s.periodEnd||sunday(s.week)),598,10);
 text('BANK & NOMOR REKENING',44,566,8,true,muted);wrap(s.bank+' / '+s.account,44,546,507,11);
 page.drawRectangle({x:44,y:493,width:507,height:30,color:ink});text('RINCIAN GAJI',56,504,10,true,rgb(1,1,1));text('NOMINAL (RP)',440,504,10,true,rgb(1,1,1));
 const rows=[['Gaji pokok',rp(s.payType==='monthly'?(s.monthlyRate||0):s.rate*s.days)],[s.payType==='monthly'?'Gaji tetap bulanan':'Tarif harian '+rp(s.rate)+' x '+s.days+' hari kerja',''],['Tambahan / bonus',rp(s.bonus)],['Potongan','- '+rp(s.deduction)]];
 rows.forEach(([l,v],i)=>{const y=470-i*32;text(l,56,y,i===1?9:11,false,i===1?muted:ink);right(v,y,11);});
 page.drawRectangle({x:44,y:314,width:507,height:49,color:light});text('TOTAL GAJI DITERIMA',56,333,11,true);right(rp(s.total),332,19,true);
 text('CATATAN',44,285,8,true,muted);wrap(s.notes||'-',44,266,507,10);
 text('Disiapkan oleh iT Wash',44,155,10);right('Penerima',155,10);text('________________________',44,107,10);right('________________________',107,10);
 text('Dokumen internal - data gaji dan rekening bersifat pribadi.',44,67,8,false,muted);text('No. slip: '+s.id.slice(0,16).toUpperCase(),44,52,8,false,muted);return doc.save();
}
