"""Build the independent preview UI around the current pole test logic.

The source app is read, never changed. The existing diagrams are imported by
the preview rather than copied. Run after changing shared pole test logic.
"""
from pathlib import Path

here = Path(__file__).resolve().parent
source = (here.parent / "main.tsx").read_text(encoding="utf-8")
lines = source.splitlines(keepends=True)
find_line = lambda marker: next(index for index, line in enumerate(lines) if marker in line)
row1_index = find_line('<section className="row1">')
row1 = lines[row1_index][lines[row1_index].index('<section className="row1">'):] + lines[row1_index + 1]
inspection = lines[find_line('<InspectionPanel inspection=')].split('<PhotoPanel')[0]
verdict_line = lines[find_line('<aside className="panel verdict"')]
verdict = verdict_line.split('<aside className="panel verdict"')[1].split('</aside>')[0]
verdict = '<aside className="panel verdict"' + verdict + '</aside>'
history = lines[find_line("{tab==='historico'&&")]
cadastros = lines[find_line("{tab==='cadastros'&&")]
drawer = lines[find_line('{drawer&&')].rsplit('</div>;', 1)[0]

body = (here / "body.inc").read_text(encoding="utf-8")
for name, value in {
    "ROW1": row1,
    "INSPECTION": inspection,
    "VERDICT": verdict,
    "HISTORY": history,
    "CADASTROS": cadastros,
    "DRAWER": drawer,
}.items():
    body = body.replace(f"__{name}__", value)
body = body.replace("void saveDraft()", "void saveDraft().catch(()=>{})")

before = "".join(lines[:find_line('if(loading)return')])
after = "".join(lines[find_line('function History('):]).split("if(!location.pathname.startsWith('/novo'))")[0]
before = before[:before.index('export function PoleDiagram')] + before[before.index('type Photo='):]
before = before.replace("from'./domain/regras'", "from'../domain/regras'")
before = before.replace("import'./styles.css';", "import '../main';\nimport './postes.css';\nimport {PoleDiagram,ElasticityDiagram} from '../main';\nimport {PreviewShell} from './Shell';")
before = before.replace("import AbsorptionModule from './AbsorptionModule';", "import PreviewAbsorptionModule from './PreviewAbsorptionModule';")
before = before.replace("function App(){", "function App(){\n const [phase,setPhase]=useState(0);\n const [absSheets,setAbsSheets]=useState<{id:string;dados:{numero_amostra:string};resultados:{status:string}}[]>([]);")
before = before.replace(" const activeRecord=", " useEffect(()=>{if(phase!==3)return;void api<typeof absSheets>('/api/absorcao').then(setAbsSheets).catch(()=>{})},[phase,form.numero_amostra]);\n const activeRecord=")
before = before.replace(" const activeRecord=", " useEffect(()=>{if(new URLSearchParams(location.search).get('tab')==='criterios'&&user&&user.role!=='tecnico'){setDraftCriteria(structuredClone(criteria));setDrawer(true)}},[user,criteria]);\n const activeRecord=")
before = before.replace("new URLSearchParams(window.location.search).get('tab')==='absorcao'?'absorcao':'ensaio'", "(['absorcao','historico','cadastros'].includes(new URLSearchParams(window.location.search).get('tab')||'')?new URLSearchParams(window.location.search).get('tab'):'ensaio') as 'ensaio'|'absorcao'|'historico'|'cadastros'")
before = before.replace("setTab('ensaio');setStep(0);setDirty(0);", "setTab('ensaio');setStep(0);setPhase(3);setDirty(0);")
before = "\n".join(line for line in before.splitlines() if not any(marker in line for marker in ("const[fullscreen,setFullscreen]", "fullscreenchange", "async function toggleFullscreen"))) + "\n"
output = before + body + after + "\ncreateRoot(document.getElementById('root')!).render(<App/>);\n"
(here / "postes.tsx").write_text(output, encoding="utf-8")
