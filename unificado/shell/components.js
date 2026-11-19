/* Add accessible mobile labels without replacing framework-owned elements. */
(() => {
  const originals=new Map();
  const acronyms=new Set(['GED','CP','CEC','PCP','MOD','DT','PDF','QR','MCC','IQT','NC','RNC','S1','S2','S3','S4']);
  function sentence(text){
    return text.replace(/ vs /gi,' \u00d7 ').split(/(\s+)/).map((word,i)=>{
      if(acronyms.has(word)||!/[A-Za-zÀ-ÿ]/.test(word))return word;
      const lower=word.toLocaleLowerCase('pt-BR');
      return i===0?lower.charAt(0).toLocaleUpperCase('pt-BR')+lower.slice(1):lower;
    }).join('');
  }
  function presentation(){
    if(printing)return;
    document.querySelectorAll('.review-ged .grid').forEach(grid=>{
      const cards=[...grid.children];
      if(cards.length<2||cards.length>6||!cards.every(card=>card.querySelector('.text-3xl,.text-2xl')?.textContent.trim().match(/^\d+$/)))return;
      grid.classList.add('strip');
      cards.forEach(card=>{const icon=card.querySelector('svg');if(icon&&icon.parentElement!==card)icon.parentElement.classList.add('review-decoration');card.querySelectorAll('p.text-sm,span.text-sm').forEach(label=>label.classList.add('review-kpi-label'))});
    });
    document.querySelectorAll('.review-ged td span').forEach(el=>{if(/^\d+$/.test(el.textContent.trim())&&/(green|gray|slate)/.test(el.className))el.classList.add('review-plain-state')});
    document.querySelectorAll('h1').forEach(title=>{
      const before=title.previousElementSibling,after=title.nextElementSibling;
      if(before?.tagName==='P'&&before.textContent.trim()&&before.textContent===before.textContent.toLocaleUpperCase('pt-BR'))before.classList.add('review-decoration');
      if(after?.tagName==='P'&&after.textContent.trim()&&!/[0-9]|Campinas|Pederneiras|Ribeir\u00e3o|Noroeste|pend\u00eancia|atualizad/i.test(after.textContent))after.classList.add('review-decoration');
    });
    document.querySelectorAll('h1,h2,h3,h4,th,.section-title,.grouped-card-title,.module-page-category,.module-page-link-title,.nav-item-label,.nav-item,.nav-group-label,.module-page-group-head,.uqa-link,.review-kpi-label').forEach(el=>{
      if(el.closest('.login-layout,[contenteditable],.nav-account-title'))return;
      for(const child of [...el.childNodes])if(child.nodeType===3&&child.textContent.trim()){
        const value=child.textContent;
        const next=sentence(value);
        if(next!==value){if(!originals.has(child))originals.set(child,value);child.textContent=next;}
      }
    });
    document.querySelectorAll('.badge,.pill,.tag,.status-badge,.urgency-badge,span').forEach(el=>{
      if(/^(Normal|Concluída|Concluida|Aprovada|Aprovado|Entregue|Vigente)$/i.test(el.textContent.trim()))el.classList.add('review-plain-state');
    });
  }
  function labelTables() {
    document.querySelectorAll('[data-review-date]:not([data-date-formatted])').forEach(el=>{const d=new Date(el.textContent.trim());if(!Number.isNaN(d.getTime())){el.textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}).format(d);el.dataset.dateFormatted='true'}});
    document.querySelectorAll('table').forEach(table => {
      if (table.dataset.mobileLabels || table.querySelector('thead [colspan],thead [rowspan]')) return;
      const headings = [...table.querySelectorAll('thead tr:last-child th')].map(th => th.textContent.trim());
      if (!headings.length) return;
      table.classList.add('responsive-records');
      table.querySelectorAll('tbody tr').forEach(row => [...row.cells].forEach((cell, index) => {
        if (cell.colSpan === 1 && headings[index]) cell.dataset.label = headings[index];
      }));
    });
  }
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; labelTables(); presentation(); });
  }).observe(document.documentElement, {childList: true, subtree: true});
  document.addEventListener('DOMContentLoaded', labelTables);
  document.addEventListener('DOMContentLoaded',presentation);
  let printing=false;
  if(document.readyState!=='loading'){labelTables();presentation();}
  addEventListener('beforeprint',()=>{printing=true;for(const [node,text] of originals)if(node.isConnected)node.textContent=text;});
  addEventListener('afterprint',()=>{printing=false;presentation();});
})();
