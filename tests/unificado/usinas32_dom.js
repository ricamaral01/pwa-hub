/* Actual rendered boxes and character ranges; also used against the old release. */
() => {
 const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
 const links=[...document.querySelectorAll('.legacy-card,.ct-home-card,.native-card')].filter(visible).map(e=>{
  const title=e.querySelector('strong'),description=e.querySelector('.legacy-card>span,.ct-home-card>small:not(.ct-home-action),.native-card>span');
  if(!title||!description||!visible(title)||!visible(description))return null;
  const textBox=e=>{const r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height}};
  const a=textBox(title),b=textBox(description),overlap=Math.min(a.right,b.right)-Math.max(a.x,b.x)>.5&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>.5;
  return {title:title.textContent.trim(),description:description.textContent.trim(),titleBox:a,descriptionBox:b,titleElementBox:box(title),rowHeight:box(e).height,fontSize:getComputedStyle(title).fontSize,fontWeight:getComputedStyle(title).fontWeight,overlap};
 }).filter(Boolean);
 const headers=[...document.querySelectorAll('th')].filter(visible).map(e=>{
  const walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let node;const brokenWords=[];
  while(node=walker.nextNode())for(const match of node.textContent.matchAll(/[\p{L}\p{N}]+/gu)){
   const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
   const lines=[...range.getClientRects()].filter(r=>r.width>.1&&r.height>.1).map(r=>Math.round(r.y*2)/2);if(new Set(lines).size>1)brokenWords.push(match[0]);
  }
  const style=getComputedStyle(e);return {text:e.textContent.trim().replace(/\s+/g,' '),brokenWords,whiteSpace:style.whiteSpace,wordBreak:style.wordBreak,overflowWrap:style.overflowWrap,width:box(e).width};
 });
 const tables=[...document.querySelectorAll('table')].filter(visible).map(e=>{let parent=e.parentElement,scrollParent=null;while(parent&&parent!==document.body){const s=getComputedStyle(parent);if(['auto','scroll'].includes(s.overflowX)){scrollParent={className:parent.className,scrollWidth:parent.scrollWidth,clientWidth:parent.clientWidth};break}parent=parent.parentElement}return {width:box(e).width,scrollParent}});
 return {url:location.pathname+location.search,viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,links,headers,tables,overlaps:links.filter(x=>x.overlap),brokenHeaders:headers.filter(x=>x.brokenWords.length)};
}
