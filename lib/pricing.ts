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
export const SHOE_PRICE=50000;
export function carService(carClass:string,pack:string,extras:string[]=[]){return [carClass+' / '+pack,...extras].join(' | ')}
// Historical orders retain their stored amount; this catalog prices new orders only.
export function priceFor(category:string,washType:string):number|undefined{
 if(category==='sepatu')return SHOE_PRICE;
 if(category==='motor')return Object.hasOwn(MOTOR_PRICES,washType)?MOTOR_PRICES[washType]:undefined;
 if(category!=='mobil')return undefined;
 const [base,...extras]=washType.split(' | '),[carClass,pack,...rest]=base.split(' / ');
 if(rest.length||!Object.hasOwn(CAR_PRICES,carClass)||!Object.hasOwn(CAR_PRICES[carClass],pack)||new Set(extras).size!==extras.length)return undefined;
 let total=CAR_PRICES[carClass][pack];
 for(const extra of extras){if(!Object.hasOwn(ADD_ON_PRICES,extra)||(pack==='Plus+'&&extra==='GLACO Front Glass Coating'))return undefined;total+=ADD_ON_PRICES[extra]}
 return total;
}
