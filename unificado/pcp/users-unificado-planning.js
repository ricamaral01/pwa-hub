/* User lifecycle and screen grants for Planning-only administrators. */
(() => {
  const base='/unificado/mapa/api/unified/planning-users';
  const token=() => localStorage.getItem('pcp_token') || '';
  const request=async(path='',options={}) => {
    const response=await fetch(base+path,{
      cache:'no-store',headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},...options
    });
    const data=await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.detail || 'Ação não concluída.');
    return data;
  };
  const editor=document.createElement('div');
  editor.id='unified-planning-user-editor';
  editor.hidden=true;
  editor.innerHTML=`<div class="section-card" role="dialog" aria-modal="true" aria-label="Permissões por tela">
    <div class="section-title">Permissões por tela</div>
    <p>O nível define o que pode fazer. As caixas definem o que pode ver.</p>
    <div data-groups></div>
    <div class="d-flex gap-2 justify-content-end mt-3"><button type="button" class="btn btn-outline-secondary" data-close>Cancelar</button><button type="button" class="btn btn-accent" data-save>Salvar</button></div>
    <p data-error role="alert"></p></div>`;
  document.body.append(editor);
  let current=null;
  editor.querySelector('[data-close]').onclick=()=>{editor.hidden=true;current=null;};
  editor.querySelector('[data-save]').onclick=async()=>{
    if (!current) return;
    const button=editor.querySelector('[data-save]');button.disabled=true;
    try {
      await request('/'+current.id+'/screens',{method:'PUT',body:JSON.stringify({
        screens:[...editor.querySelectorAll('input[data-screen]:checked:not(:disabled)')].map(node=>node.value)
      })});
      editor.hidden=true;current=null;showToast('Permissões salvas.','success');
      await window.unifiedPlanningLoadUsers();
    } catch(error) {editor.querySelector('[data-error]').textContent=error.message;}
    finally {button.disabled=false;}
  };
  const edit=async user=>{
    const result=await request('/'+user.id+'/screens');
    current=user;
    const wrap=editor.querySelector('[data-groups]');wrap.replaceChildren();
    for (const [module,label] of [['planejamento','Planejamento'],['producao','Produção'],['laboratorio','Laboratório']]) {
      const section=document.createElement('section');section.className='unified-planning-screen-group';
      const heading=document.createElement('div');heading.className='d-flex justify-content-between align-items-center';
      const title=document.createElement('strong');title.textContent=label;
      const actions=document.createElement('span');
      for (const [text,checked] of [['Marcar todas',true],['Limpar',false]]) {
        const button=document.createElement('button');button.type='button';button.className='btn btn-outline-secondary btn-sm me-1';button.textContent=text;
        button.onclick=()=>section.querySelectorAll('input:not(:disabled)').forEach(input=>{input.checked=checked;});
        actions.append(button);
      }
      heading.append(title,actions);section.append(heading);
      for (const screen of result.screens.filter(item=>item.module===module)) {
        const label=document.createElement('label');label.className='d-block';
        const input=document.createElement('input');input.type='checkbox';input.dataset.screen='1';input.value=screen.id;
        input.checked=screen.checked;input.disabled=!screen.profile_allowed;
        label.append(input,document.createTextNode(' '+screen.label));section.append(label);
      }
      wrap.append(section);
    }
    editor.querySelector('[data-error]').textContent='';
    editor.hidden=false;
  };
  window.unifiedPlanningLoadUsers=async()=>{
    const [result,sectors]=await Promise.all([request(),API.get('/api/setores')]);
    const names=Object.fromEntries(sectors.map(sector=>[sector.id,sector.nome]));
    const body=document.getElementById('tbody-users');body.replaceChildren();
    for (const user of result.users) {
      const row=document.createElement('tr');
      for (const value of [user.name,user.login,user.linked?'Vinculada':(names[user.setor_id] || '—'),
                           user.role,user.active?'Sim':'Não','—']) {
        const cell=document.createElement('td');cell.textContent=value;row.append(cell);
      }
      const cell=document.createElement('td');cell.className='text-end';
      const add=(label,callback,disabled=false)=>{
        const button=document.createElement('button');button.type='button';button.className='btn btn-outline-secondary btn-sm me-1';
        button.textContent=label;button.disabled=disabled;
        button.onclick=async()=>{button.disabled=true;try{await callback();}catch(error){showToast(error.message,'error');button.disabled=disabled;}};
        cell.append(button);
      };
      if (!user.linked) {
        add('Editar',()=>edit(user));
        add(user.active?'Desativar':'Reativar',async()=>{
          await request('/'+user.id+'/action',{method:'POST',body:JSON.stringify({action:user.active?'deactivate':'reactivate'})});
          await window.unifiedPlanningLoadUsers();showToast('Conta atualizada.','success');
        },user.id===Number(JSON.parse(localStorage.getItem('pcp_user')||'{}').id));
        add('Excluir',async()=>{
          const typed=prompt(`Digite o login ${user.login} para confirmar a exclusão:`);
          if (typed!==user.login) return;
          await request('/'+user.id+'/action',{method:'POST',body:JSON.stringify({action:'delete',confirm_login:typed})});
          await window.unifiedPlanningLoadUsers();showToast('Conta excluída; histórico preservado.','success');
        },user.id===Number(JSON.parse(localStorage.getItem('pcp_user')||'{}').id));
        add('Redefinir senha',()=>redefinirSenha(user.id,user.name));
      } else {
        cell.textContent='Gerenciar na Produção';
      }
      row.append(cell);body.append(row);
    }
  };
  window.unifiedPlanningLoadUsers().catch(error=>showToast(error.message,'error'));
})();
