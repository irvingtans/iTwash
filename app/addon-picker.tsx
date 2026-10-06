'use client';
import {ADD_ON_PRICES,POLISH_PRICES,glassService} from '../lib/pricing';
import {money} from '../lib/wash';
export default function AddonPicker({extras,onChange,pack}:{extras:string[];onChange:(value:string[])=>void;pack:string}){
 const glass=extras.find(x=>x.startsWith('Glass Treatment'))||'',polish=extras.find(x=>x.startsWith('Body Polish / '))||'';
 const match=/\((\d+) × Rp(\d+)\)/.exec(glass),count=Number(match?.[1]||1),price=Number(match?.[2]||70000);
 function replace(prefix:string,value:string){onChange([...extras.filter(x=>!x.startsWith(prefix)),...(value?[value]:[])])}
 return <fieldset><legend>Add-ons (opsional)</legend><div className="addon-choices">{Object.entries(ADD_ON_PRICES).map(([name,amount])=>{const included=pack==='Plus+'&&name==='GLACO Front Glass Coating';return <label key={name}><input type="checkbox" checked={included||extras.includes(name)} disabled={included} onChange={e=>onChange(e.target.checked?[...extras,name]:extras.filter(x=>x!==name))}/><span>{name}<small>{included?'Sudah termasuk Plus+':money(amount)}</small></span></label>})}</div>
 <label>Glass Treatment<select value={glass?(glass==='Glass Treatment Full Mobil'?'full':'piece'):''} onChange={e=>replace('Glass Treatment',e.target.value==='full'?'Glass Treatment Full Mobil':e.target.value==='piece'?glassService(70000,1):'')}><option value="">Tanpa Glass Treatment</option><option value="piece">Per kaca · Rp70.000–Rp150.000</option><option value="full">Full mobil · Rp450.000</option></select></label>
 {glass&&glass!=='Glass Treatment Full Mobil'&&<div className="form-grid"><label>Harga per kaca (Rp)<input required type="number" min={70000} max={150000} step={1} value={price} onChange={e=>replace('Glass Treatment',glassService(Number(e.target.value),count))}/></label><label>Jumlah kaca<input required type="number" min={1} max={30} step={1} value={count} onChange={e=>replace('Glass Treatment',glassService(price,Number(e.target.value)))}/></label></div>}
 <label>Body Polish · Koch Chemie<select value={polish} onChange={e=>replace('Body Polish / ',e.target.value)}><option value="">Tanpa Body Polish</option>{Object.entries(POLISH_PRICES).map(([cls,amount])=><option key={cls} value={'Body Polish / '+cls}>{cls} · {money(amount)}</option>)}</select></label>
 </fieldset>
}
