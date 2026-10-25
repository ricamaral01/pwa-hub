const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'unificado/shell/menu.config.js'), 'utf8');
const context = {
  document: {currentScript: {src: 'https://concrefer.concretrack.com.br/unificado/shell/menu.config.js'}},
  URL,
  module: {exports: null}
};
vm.runInNewContext(source + '\nmodule.exports = MENU_ITEMS;', context);
const entries = Object.entries(context.module.exports).map(([id, value]) => ({
  id, module: value.module, label: value.label, path: new URL(value.url).pathname,
  query: new URL(value.url).search,
  screen: value.screen || null, require: value.require || null
}));
entries.push({id:'prodUsuarios', module:'producao', label:'Usuários',
  path:'/unificado/mapa/operacao/', query:'?tela=USUARIOS', screen:'USUARIOS', require:'GERENCIA'});
entries.push({id:'pcpUsuarios', module:'planejamento', label:'Usuários',
  path:'/unificado/pcp/usuarios/', query:'', screen:null, require:'ADMIN'});
entries.push({id:'formasPorSetor', module:'planejamento', label:'Formas por Setor',
  path:'/unificado/pcp/formas-por-setor/', query:'', screen:null, require:'PCP'});
entries.push({id:'labUsuarios', module:'laboratorio', label:'Usuários',
  path:'/unificado/laboratorio/novo/postes', query:'?tab=usuarios', screen:null, require:'admin'});
const output = path.join(root, 'unificado/mapa/api/screen_catalog.json');
fs.writeFileSync(output, JSON.stringify(entries, null, 2) + '\n');
console.log(`catalog: ${entries.length} screens`);
