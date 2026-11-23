/* Existing unified-user admin policy protects both read and write endpoints. */
export async function openQuickAccess(user){
  const base='/unificado/mapa/api/unified/users/'+encodeURIComponent(user.id)+'/quick-access';
  const request=async(method='GET',body)=>{const r=await fetch(base,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Não foi possível carregar o acesso rápido.');return data;};
  const data=await request();
  if(!document.getElementById('uqa-css')){const css=document.createElement('link');css.id='uqa-css';css.rel='stylesheet';css.href='/unificado/shell/quick-access.css?v=20261111-uqa1';document.head.append(css);}
  const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  const dialog=node('dialog','uqa-dialog');dialog.setAttribute('aria-label','Acesso rápido de '+data.user.name);
  const panel=node('section','uqa-admin');panel.append(node('h2','','Acesso rápido'),node('p','',data.user.name+' · selecione e ordene os atalhos.'));
  const settings=node('div','uqa-settings');const check=(label,value)=>{const wrap=node('label'),input=node('input');input.type='checkbox';input.checked=value;wrap.append(input,document.createTextNode(label));settings.append(wrap);return input;};
  const enabled=check('Ativar acesso rápido',data.config.enabled),home=check('Abrir esta página após o login',data.config.home);panel.append(settings);
  const selected=new Set(data.config.items),catalog=data.catalog;let order=[...data.config.items,...catalog.map(row=>row.id).filter(id=>!selected.has(id))];
  const list=node('div'),error=node('div'),status=node('div');error.setAttribute('role','alert');status.setAttribute('role','status');
  function draw(){list.replaceChildren();order.forEach((id,index)=>{const item=catalog.find(row=>row.id===id);if(!item)return;const row=node('div','uqa-config-row'),input=node('input');input.type='checkbox';input.id='uqa-pick-'+id;input.checked=selected.has(id)&&item.available;input.disabled=!item.available;input.setAttribute('aria-label','Exibir '+item.label);if(!item.available)selected.delete(id);input.onchange=()=>{input.checked?selected.add(id):selected.delete(id);status.textContent='';};
    const label=node('label','',item.label);label.htmlFor=input.id;label.append(node('small','',item.available?(item.module==='planejamento'?'Planejamento':'Produção · Controle'):'Sem permissão de tela. Ajuste em Editar usuário.'));
    const actions=node('div','uqa-order');for(const [delta,symbol,text] of [[-1,'↑','Subir'],[1,'↓','Descer']]){const button=node('button','',symbol);button.type='button';button.setAttribute('aria-label',text+' '+item.label);button.disabled=index+delta<0||index+delta>=order.length;button.onclick=()=>{[order[index],order[index+delta]]=[order[index+delta],order[index]];draw();};actions.append(button);}row.append(input,label,actions);list.append(row);
  });}
  draw();panel.append(list,node('p','','Os atalhos respeitam as permissões existentes. Esta configuração não concede novas telas.'),error,status);
  const actions=node('div','uqa-admin-actions'),close=node('button','uqa-button','Fechar'),save=node('button','uqa-button uqa-primary','Salvar configuração');close.type=save.type='button';close.onclick=()=>dialog.close();
  save.onclick=async()=>{save.disabled=close.disabled=true;error.textContent='';status.textContent='';try{const result=await request('PUT',{enabled:enabled.checked,home:home.checked,items:order.filter(id=>selected.has(id)),revision:data.config.revision});data.config=result.config;status.textContent='Configuração salva. A página será atualizada no próximo acesso ou ao voltar para a janela.';}catch(e){error.textContent=e.message;}finally{save.disabled=close.disabled=false;}};
  actions.append(close,save);panel.append(actions);dialog.append(panel);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.addEventListener('cancel',event=>{if(save.disabled)event.preventDefault();});dialog.showModal();
}
