import type {Plugin} from 'vite';
import {readFileSync} from 'node:fs';
export function visualHead():Plugin {
 const version=readFileSync(new URL('../../VERSION',import.meta.url),'utf8').trim();
 return {name:'unificado-visual-head',transformIndexHtml:{order:'post',handler:()=>[
  {tag:'script',attrs:{defer:true,src:`/unificado/shell/components.js?v=${version}`},injectTo:'head' as const},
  ...['tokens','module-components','laboratorio-visual','review-complete'].map(name=>({tag:'link',attrs:{rel:'stylesheet',href:`/unificado/shell/${name}.css?v=${version}`},injectTo:'head' as const}))
 ]}};
}
