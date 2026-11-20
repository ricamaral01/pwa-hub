"""Read existing homolog emissions; hashes and rendered documents stay unchanged."""
import hashlib,io,json
from pathlib import Path
import fitz,requests
from pypdf import PdfReader
from visual_phase05_sessions import sessions
R=Path(__file__).resolve().parents[2];O=R/'docs/revisao-visual-unificado/homolog/login-uni-20261120';BASE='https://concrefer.concretrack.com.br:18446'
actor=sessions()['ADMIN'];session=requests.Session();session.headers['Authorization']='Bearer '+actor['token'];session.cookies.set('mapa_unificado_homolog_session',actor['cookie'],domain='concrefer.concretrack.com.br',path='/unificado/')
source=json.loads((O.parent/'fase-4/flows-results.json').read_text(encoding='utf-8'));checks=[]
for kind,key,path,screen in [('armaduras','armaduras_emission','armaduras','armadurasRelatorio'),('series','series_emission','postes-series','postesNumerosSerie')]:
 response=session.get(BASE+'/unificado/pcp/api/'+path+'/emissoes/'+str(source[key]['id'])+'/pdf',headers={'X-Unificado-Screen':screen},timeout=40);assert response.status_code==200
 raw=response.content;digest=hashlib.sha256(raw).hexdigest();assert digest==source[kind+'_pdf_sha256']
 reader=PdfReader(io.BytesIO(raw));text='\n'.join(page.extract_text() or '' for page in reader.pages)
 pdf=fitz.open(stream=raw,filetype='pdf');pdf[0].get_pixmap(matrix=fitz.Matrix(1,1)).save(str(O/('pdf-'+kind+'-preview.png')))
 checks.append({'kind':kind,'sha256':digest,'byte_identical_to_original_emission':True,'pages':len(reader.pages),'unificado_label_occurrences':text.lower().count('unificado'),'layout_unchanged_by_byte_identity':True,'preview':'pdf-'+kind+'-preview.png'})
(O/'pdf-checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8');print(json.dumps({'existing_pdfs':len(checks),'all_byte_identical':True,'legacy_brand_occurrences':[r['unificado_label_occurrences'] for r in checks]}))
