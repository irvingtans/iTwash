export const CAR_PRICES:Record<string,number>={Express:65000,Deluxe:85000,Premium:120000,EXTREME:150000};
export const MOTOR_PRICES:Record<string,number>={Reguler:35000,Superbike:50000,Karyawan:20000};
export const SHOE_PRICE=50000;
export function priceFor(category:string,washType:string):number|undefined{
 if(category==='sepatu')return SHOE_PRICE;
 if(category==='mobil')return Object.hasOwn(CAR_PRICES,washType)?CAR_PRICES[washType]:undefined;
 if(category==='motor')return Object.hasOwn(MOTOR_PRICES,washType)?MOTOR_PRICES[washType]:undefined;
 return undefined;
}
