'use client';
import {useEffect,useState} from 'react';
import {Car} from 'lucide-react';
export default function WashingCounts(){
 const [counts,setCounts]=useState<{mobil:number;motor:number}|null>(null),[error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
 async function load(){try{const r=await fetch('/api/washing-counts',{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error();const d=await r.json() as {mobil:number;motor:number};if(!controller.signal.aborted){setCounts(d);setError(false)}}catch{if(!controller.signal.aborted)setError(true)}finally{if(!controller.signal.aborted)timer=setTimeout(load,10000)}}
 void load();return()=>{controller.abort();clearTimeout(timer)};
 },[]);
 return <section className="washing-counts" aria-labelledby="washing-counts-title"><div className="washing-count" aria-live="polite" aria-atomic="true"><Car size={25} aria-hidden="true"/><span id="washing-counts-title">Kendaraan sedang dicuci</span><strong>{error?'—':counts?counts.mobil+counts.motor:'…'}</strong></div>{error&&<p className="field-note">Jumlah belum tersedia. Mencoba lagi secara otomatis.</p>}</section>
}
