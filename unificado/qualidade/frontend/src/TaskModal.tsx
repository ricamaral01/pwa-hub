import React, { useEffect, useRef } from 'react';

export function TaskModal({title,onClose,busy=false,children}:{title:string;onClose:()=>void;busy?:boolean;children:React.ReactNode}) {
  const panel=useRef<HTMLDivElement>(null),trigger=useRef(document.activeElement as HTMLElement|null);
  const close=useRef(onClose),saving=useRef(busy);close.current=onClose;saving.current=busy;
  useEffect(()=>{
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    const node=panel.current;
    const controls=()=>Array.from(node?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]')||[]).filter(el=>el.getClientRects().length>0);
    const first=controls()[0];if(node&&!node.contains(document.activeElement))first?.focus();
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(!saving.current)close.current()}
      if(event.key==='Tab'){
        const items=controls(),first=items[0],last=items[items.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
      }
    };
    node?.addEventListener('keydown',key);
    return()=>{document.body.style.overflow=previous;node?.removeEventListener('keydown',key);if(trigger.current?.isConnected)trigger.current.focus()};
  },[]);
  return <div className="task-sheet-backdrop" ref={panel} role="dialog" aria-modal="true" aria-label={title} onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}>{children}</div>;
}
