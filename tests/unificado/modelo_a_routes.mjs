import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { NAV_MODULES, MODULE_COLORS } from '../../unificado/sidebar-modelo-a/src/components/sidebar/navConfig.ts';

const source = readFileSync(new URL('../../unificado/shell/menu.config.js', import.meta.url), 'utf8');
const context = vm.createContext({
  URL,
  document: { currentScript: { src: 'https://example.invalid/unificado/shell/menu.config.js' } },
});
vm.runInContext(source, context);
const menuItems = vm.runInContext('MENU_ITEMS', context);
let checked = 0;
for (const module of NAV_MODULES) {
  for (const section of module.sections) {
    assert.ok(section.items.length > 0, `${module.id}/${section.title} vazia`);
    for (const item of section.items) {
      const encodedView = new URL(item.href, 'https://example.invalid').searchParams.get('view');
      if (module.id === 'ged') {
        assert.match(encodedView, /^ged\/(dashboard|documents|approvals|tasks|calibrations)$/);
      } else {
        const expected = menuItems[item.id];
        assert.ok(expected, `sem rota real: ${item.id}`);
        assert.equal(expected.module, module.id);
        const target = new URL(expected.url);
        assert.equal(encodedView, target.pathname.slice('/unificado/'.length) + target.search, item.id);
      }
      checked++;
    }
  }
}
assert.equal(MODULE_COLORS.laboratorio, '#F2B705');
assert.ok(!NAV_MODULES.find(module => module.id === 'ged').sections.flatMap(section => section.items)
  .some(item => /rnc|usu[aá]rios/i.test(item.label)));
console.log(`Modelo A: ${checked} rotas reais conferidas; GED sem RNC/Usuários; Laboratório #F2B705.`);
