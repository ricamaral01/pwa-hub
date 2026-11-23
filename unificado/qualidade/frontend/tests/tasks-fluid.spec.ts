import { expect, test } from '@playwright/test';

test('busca: digitar não recarrega contadores e só a resposta mais recente prevalece',async({page})=>{
  await page.goto('task-fixture.html');
  await expect(page.locator('.task-row')).toHaveCount(6);
  await page.evaluate(()=>{
    const original=window.fetch;
    (window as typeof window & {taskCalls?:string[]}).taskCalls=[];
    window.fetch=async(...args)=>{
      const url=String(args[0]);(window as typeof window & {taskCalls:string[]}).taskCalls.push(url);
      const q=new URL(url,location.href).searchParams.get('busca');
      const response=await original(...args);
      if(q){await new Promise(resolve=>setTimeout(resolve,q==='Aprovar'?1000:20));const data=await response.json();data.rows=data.rows.filter((row:{titulo:string})=>row.titulo.toLowerCase().includes(q.toLowerCase()));return new Response(JSON.stringify(data),{status:200})}
      return response;
    };
  });
  const search=page.getByRole('searchbox',{name:'Buscar tarefas'});
  await search.pressSequentially('Aprovar',{delay:25});
  await page.waitForFunction(()=>(window as typeof window & {taskCalls:string[]}).taskCalls.some(url=>url.includes('busca=Aprovar')));
  await search.fill('NC-2026');
  await expect(page.locator('.task-row')).toHaveCount(1);
  await expect(page.locator('.task-row-title')).toContainText('NC-2026-041');
  await page.waitForTimeout(1100);
  await expect(page.locator('.task-row')).toHaveCount(1);
  const calls=await page.evaluate(()=>(window as typeof window & {taskCalls:string[]}).taskCalls);
  expect(calls.filter(url=>url.includes('busca='))).toHaveLength(2);
  expect(calls.filter(url=>url.includes('/contadores')||url.includes('/listas'))).toHaveLength(0);
  await expect(search).toBeFocused();
});

test('detalhe: clicar rapidamente em outra tarefa não abre uma resposta antiga',async({page})=>{
  await page.goto('task-fixture.html');await expect(page.locator('.task-row')).toHaveCount(6);
  await page.evaluate(()=>{
    const original=window.fetch;
    window.fetch=async(...args)=>{if(String(args[0]).endsWith('/a1'))await new Promise(resolve=>setTimeout(resolve,800));return original(...args)};
  });
  await page.locator('.task-row-main').first().click();
  await expect(page.getByText('Carregando detalhes…')).toBeVisible();
  await page.locator('.task-row-main').nth(2).click();
  await expect(page.locator('.task-detail h2')).toContainText('Aprovar IT-CQC-03');
  await page.waitForTimeout(900);
  await expect(page.locator('.task-detail h2')).toContainText('Aprovar IT-CQC-03');
  await page.keyboard.press('Escape');await expect(page.locator('.task-detail')).toHaveCount(0);
});

test('atualização mantém lista visível e metadados lentos não bloqueiam a lista',async({page})=>{
  await page.goto('task-fixture.html');await expect(page.locator('.task-row')).toHaveCount(6);
  await page.evaluate(()=>{
    const original=window.fetch;
    window.fetch=async(...args)=>{await new Promise(resolve=>setTimeout(resolve,String(args[0]).includes('/contadores')?1500:500));return original(...args)};
  });
  await page.getByRole('button',{name:'↻ Atualizar'}).click();
  await expect(page.locator('.task-row')).toHaveCount(6);
  await expect(page.getByText('Atualizando tarefas…')).toBeVisible();
  await expect(page.getByText('Atualizando tarefas…')).toBeHidden();
});

test('filtros, concluídas e limpar são explícitos em telas estreitas',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('task-fixture.html');
  await expect(page.locator('.task-row')).toHaveCount(6);
  await page.getByRole('combobox',{name:'Visão de tarefas'}).selectOption('concluidas');
  await expect(page.locator('.tasks-title h1')).toHaveText('Concluídas');
  await page.getByRole('combobox',{name:'Filtrar por módulo'}).selectOption('nc');
  await page.getByRole('button',{name:'Limpar filtros',exact:true}).first().click();
  await expect(page.getByRole('combobox',{name:'Filtrar por módulo'})).toHaveValue('');
  await page.setViewportSize({width:320,height:700});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('nova lista usa formulário, mantém foco e fecha por Escape',async({page})=>{
  await page.goto('task-fixture.html');await expect(page.locator('.task-row')).toHaveCount(6);
  await page.getByRole('button',{name:'＋ Nova lista'}).click();
  const modal=page.getByRole('dialog',{name:'Nova lista'});
  await expect(modal).toBeVisible();
  await modal.getByRole('textbox',{name:'Nome da lista'}).pressSequentially('Semana',{delay:25});
  await expect(modal.getByRole('textbox',{name:'Nome da lista'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);
});

test('paginação expõe registros além da primeira página sem duplicar',async({page})=>{
  await page.goto('task-fixture.html');await expect(page.locator('.task-row')).toHaveCount(6);
  await page.evaluate(()=>{
    const original=window.fetch;
    window.fetch=async(...args)=>{
      const url=new URL(String(args[0]),location.href);const response=await original(...args);
      if(url.pathname.endsWith('/tarefas')){const data=await response.json();data.rows=url.searchParams.has('cursor')?data.rows.slice(3):data.rows.slice(0,3);data.proximo_cursor=url.searchParams.has('cursor')?null:3;return new Response(JSON.stringify(data),{status:200})}
      return response;
    };
  });
  await page.getByRole('button',{name:'↻ Atualizar'}).click();
  await expect(page.locator('.task-row')).toHaveCount(3);
  await page.getByRole('button',{name:'Carregar mais tarefas'}).click();
  await expect(page.locator('.task-row')).toHaveCount(6);
  await expect(page.getByRole('button',{name:'Carregar mais tarefas'})).toHaveCount(0);
});

test('falha ao comentar preserva o texto e mostra erro persistente',async({page})=>{
  await page.goto('task-fixture.html');await expect(page.locator('.task-row')).toHaveCount(6);
  await page.locator('.task-row-main').nth(2).click();
  await page.evaluate(()=>{const original=window.fetch;window.fetch=(...args)=>String(args[0]).endsWith('/comentarios')?Promise.resolve(new Response(JSON.stringify({detail:'Sem permissão para comentar.'}),{status:403})):original(...args)});
  const input=page.getByRole('textbox',{name:'Novo comentário'});
  await input.fill('Conferir com a equipe');
  await page.getByRole('button',{name:'Enviar comentário'}).click();
  await expect(page.getByRole('alert')).toContainText('Sem permissão para comentar.');
  await expect(input).toHaveValue('Conferir com a equipe');
});
