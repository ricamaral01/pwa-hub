import {api,send} from './api';

type Method='PUT'|'POST';
type Pending={id:string;path:string;method:Method;payload:unknown;at:string};
const KEY='pederneiras-pwa-queue-v1';
const CACHE='pederneiras-pwa-cache-v1';
export const pending=():Pending[]=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]');}catch{return [];}};
const save=(rows:Pending[])=>{localStorage.setItem(KEY,JSON.stringify(rows));window.dispatchEvent(new Event('pederneiras-queue'));};
export function queue(path:string,method:Method,payload:unknown){
  const rows=pending().filter(row=>!(row.path===path&&row.method===method));
  rows.push({id:crypto.randomUUID(),path,method,payload,at:new Date().toISOString()});save(rows);
}
export async function flush(){
  if(!navigator.onLine)return 0;
  let rows=pending();let count=0;
  while(rows.length){
    const row=rows[0];
    await send(row.path,row.method,row.payload);
    rows=rows.slice(1);save(rows);count++;
  }
  return count;
}
export async function sendOrQueue<T>(path:string,method:Method,payload:unknown):Promise<T|null>{
  if(!navigator.onLine){queue(path,method,payload);return null;}
  try{return await send<T>(path,method,payload);}catch(error){
    if(error instanceof TypeError){queue(path,method,payload);return null;}
    throw error;
  }
}
export async function cached<T>(path:string):Promise<T>{
  try{const value=await api<T>(path);localStorage.setItem(CACHE+path,JSON.stringify(value));return value;}
  catch(error){const saved=localStorage.getItem(CACHE+path);if(saved)return JSON.parse(saved) as T;throw error;}
}
