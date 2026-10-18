// One-time mechanical typing pass over the literal reference port. Numeric
// behavior is unchanged; the public API gets precise types in engine-types.ts.
const fs = require('fs');
const ts = require('../../../unificado/laboratorio/frontend/node_modules/typescript');
const path = require('path');
const file = path.resolve(__dirname, '../../../unificado/laboratorio/frontend/src/cronoanalise/engine.ts');
let source = fs.readFileSync(file, 'utf8');
const tree = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
const edits = [];
const bareArrow = new Set();
function walk(node) {
  if (ts.isArrowFunction(node) && node.parameters.length === 1) {
    const param = node.parameters[0];
    if (source.slice(node.getStart(tree), param.name.getStart(tree)).indexOf('(') === -1) {
      bareArrow.add(param.pos);
      edits.push([param.name.getStart(tree), '(']);
      edits.push([param.name.end, ': any)']);
    }
  }
  if (ts.isParameter(node) && !bareArrow.has(node.pos) && !node.type && !node.questionToken && !node.dotDotDotToken)
    edits.push([node.name.end, ': any']);
  if (ts.isClassDeclaration(node)) {
    const body = source.indexOf('{', node.name.end);
    edits.push([body + 1, '\n  [key: string]: any;']);
  }
  if (ts.isVariableDeclaration(node) && !node.type && node.initializer) {
    if (ts.isArrayLiteralExpression(node.initializer) && node.initializer.elements.length === 0)
      edits.push([node.name.end, ': any[]']);
    if (ts.isObjectLiteralExpression(node.initializer) && node.initializer.properties.length === 0)
      edits.push([node.name.end, ': Record<string, any>']);
  }
  ts.forEachChild(node, walk);
}
walk(tree);
for (const [at, value] of edits.sort((a, b) => b[0] - a[0]))
  source = source.slice(0, at) + value + source.slice(at);
fs.writeFileSync(file, source);
console.log(`Inserted ${edits.length} internal annotations`);
