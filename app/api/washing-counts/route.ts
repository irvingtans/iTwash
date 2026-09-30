import {database} from '../../../db/store';
import {json} from '../../../lib/server';
export async function GET(){try{
 const counts=await database().prepare("SELECT COALESCE(SUM(CASE WHEN category='mobil' THEN 1 ELSE 0 END),0) AS mobil,COALESCE(SUM(CASE WHEN category='motor' THEN 1 ELSE 0 END),0) AS motor FROM jobs WHERE status=1 AND voided_at IS NULL AND category IN ('mobil','motor')").first<{mobil:number;motor:number}>();
 return json(counts||{mobil:0,motor:0});
}catch{return json({error:'Jumlah kendaraan belum dapat dimuat.'},503)}}
