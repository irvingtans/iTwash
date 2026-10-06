export const CAR_PACKAGES=['Luar','Full','Plus+'] as const;
export const CAR_PRICES:Record<string,Record<string,number>>={
 Deluxe:{Luar:65000,Full:90000,'Plus+':120000},
 Premium:{Luar:85000,Full:120000,'Plus+':150000},
 Executive:{Luar:120000,Full:150000,'Plus+':180000},
 EXTREME:{Luar:180000,Full:220000,'Plus+':250000},
};
export const CAR_EXAMPLES:Record<string,string>={Deluxe:'Brio, Calya, Avanza dan sekelasnya',Premium:'CR-V, Sealion 7, Pajero, Fortuner dan sekelasnya',Executive:'Alphard, Denza D9, XPeng X9 dan sekelasnya',EXTREME:'Double Cabin & kendaraan sekelasnya'};
export const PACKAGE_DETAILS:Record<string,string>={Luar:'Body wash, wheels & tires, drying',Full:'Body wash, wheels & tires, interior vacuum, interior wipe down, dashboard & panel clean, drying','Plus+':'Semua layanan Full + GLACO front glass coating'};
export const MOTOR_PRICES:Record<string,number>={Basic:35000,Super:50000,'Big Bike':85000,Karyawan:20000};
export const ADD_ON_PRICES:Record<string,number>={'GLACO Front Glass Coating':85000,'Air Wiper Distilled Water':35000,'Body Wax Soft99':150000};
export const POLISH_PRICES:Record<string,number>={Deluxe:800000,Premium:1000000,Executive:1500000,EXTREME:1500000};
export const SHOE_PRICE=50000;
export function carService(carClass:string,pack:string,extras:string[]=[]){return [carClass+' / '+pack,...extras].join(' | ')}
export function glassService(price:number,count:number){return `Glass Treatment per kaca (${count} × Rp${price})`}
export function extrasPrice(extras:string[],pack=''):number|undefined{
 if(new Set(extras).size!==extras.length||extras.length>6)return undefined;
 let total=0,glass=0,polish=0;
 for(const extra of extras){
  if(Object.hasOwn(ADD_ON_PRICES,extra)){if(pack==='Plus+'&&extra==='GLACO Front Glass Coating')return undefined;total+=ADD_ON_PRICES[extra];continue}
  if(extra==='Glass Treatment Full Mobil'){total+=450000;glass++;continue}
  if(extra.startsWith('Body Polish / ')){const cls=extra.slice(14);if(!Object.hasOwn(POLISH_PRICES,cls))return undefined;total+=POLISH_PRICES[cls];polish++;continue}
  const match=/^Glass Treatment per kaca \(([1-9]\d?) × Rp(\d+)\)$/.exec(extra);
  if(!match)return undefined;
  const count=Number(match[1]),price=Number(match[2]);
  if(count>30||price<70000||price>150000)return undefined;
  total+=count*price;glass++;
 }
 return glass>1||polish>1?undefined:total;
}
// Preserve the recorded base price when editing historical orders.
export function revisedService(washType:string,amount:number|null,extras:string[]){
 const [base,...oldExtras]=washType.split(' | '),pack=base.split(' / ')[1]||'';
 const oldPrice=extrasPrice(oldExtras,pack),newPrice=extrasPrice(extras,pack);
 if(amount===null||!Number.isSafeInteger(amount)||oldPrice===undefined||newPrice===undefined||amount<oldPrice)return undefined;
 return {washType:[base,...extras].join(' | '),amount:amount-oldPrice+newPrice};
}
export function priceFor(category:string,washType:string):number|undefined{
 if(category==='sepatu')return SHOE_PRICE;
 if(category==='motor')return Object.hasOwn(MOTOR_PRICES,washType)?MOTOR_PRICES[washType]:undefined;
 if(category!=='mobil')return undefined;
 const [base,...extras]=washType.split(' | '),[carClass,pack,...rest]=base.split(' / ');
 if(rest.length||!Object.hasOwn(CAR_PRICES,carClass)||!Object.hasOwn(CAR_PRICES[carClass],pack))return undefined;
 const additional=extrasPrice(extras,pack);
 return additional===undefined?undefined:CAR_PRICES[carClass][pack]+additional;
}
