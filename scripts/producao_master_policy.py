"""Pure, narrow master-list patch; preserves every byte outside the collection."""
import ast,hashlib

def patch_master(source,variable,identity='alex',excluded='user-alex'):
 tree=ast.parse(source);assignments=[n for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id==variable for t in n.targets)]
 assert len(assignments)==1,('unexpected master declaration',variable)
 node=assignments[0].value
 if isinstance(node,ast.Call):
  assert isinstance(node.func,ast.Name) and node.func.id in ['set','frozenset'] and len(node.args)==1
  node=node.args[0]
 assert isinstance(node,(ast.Set,ast.List,ast.Tuple)),('unsupported master declaration',variable)
 constants={t.id:n.value.value for n in tree.body if isinstance(n,ast.Assign) and isinstance(n.value,ast.Constant) and isinstance(n.value.value,str) for t in n.targets if isinstance(t,ast.Name)}
 def value(item):
  if isinstance(item,ast.Constant) and isinstance(item.value,str):return item.value
  assert isinstance(item,ast.Name) and item.id in constants,('unresolved master identity',variable)
  return constants[item.id]
 before=[value(item) for item in node.elts];kept=[item for item in node.elts if value(item)!=excluded]
 after=[value(item) for item in kept]
 if identity not in after:after.append(identity)
 if set(before)==set(after):return source,{'variable':variable,'before':before,'after':after,'changed':False}
 parts=[ast.get_source_segment(source,item) for item in kept]
 if identity not in [value(item) for item in kept]:parts.append(repr(identity))
 opening,closing=('{','}') if isinstance(node,ast.Set) else ('[',']') if isinstance(node,ast.List) else ('(',')')
 replacement=opening+', '.join(parts)+closing
 lines=source.encode('utf-8').splitlines(keepends=True);start=sum(map(len,lines[:node.lineno-1]))+node.col_offset;end=sum(map(len,lines[:node.end_lineno-1]))+node.end_col_offset
 raw=source.encode('utf-8');result=(raw[:start]+replacement.encode('utf-8')+raw[end:]).decode('utf-8');ast.parse(result)
 return result,{'variable':variable,'before':before,'after':after,'changed':True,'before_sha256':hashlib.sha256(raw).hexdigest(),'after_sha256':hashlib.sha256(result.encode()).hexdigest(),'changes_outside_master_collection':False}
