import React from 'react';
import {createRoot,Root} from 'react-dom/client';
import {App} from './ui';
import './style.css';
let root:Root|null=null,host:HTMLElement|null=null;
export function mountLogistica(container:HTMLElement,route:{path:string,search:string,navigate:(path:string)=>void}){
 if(host!==container){root?.unmount();root=createRoot(container);host=container}
 root!.render(<App route={route}/>);
}
export function unmountLogistica(){root?.unmount();root=null;host=null}
