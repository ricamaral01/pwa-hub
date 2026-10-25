import {useEffect,useState,type ReactNode} from 'react';
import '../../../service/server/static/novo/assets/tokens.css';

type Area='cura'|'postes';
type Item={label:string;icon:string;href:string;key:string;group:'cura'|'postes'|'footer';restricted?:boolean};
const items:Item[]=[
 {label:'Monitoramento',icon:'◫',href:'/novo',key:'monitor',group:'cura'},
 {label:'Histórico',icon:'▥',href:'/novo?view=history',key:'history',group:'cura'},
 {label:'Dispositivo',icon:'⚙',href:'/novo?view=settings',key:'settings',group:'cura'},
 {label:'Ensaio',icon:'▤',href:'/novo/postes',key:'ensaio',group:'postes'},
 {label:'Absorção',icon:'◉',href:'/novo/postes?tab=absorcao',key:'absorcao',group:'postes'},
 {label:'Histórico de ensaios',icon:'▦',href:'/novo/postes?tab=historico',key:'historico',group:'postes'},
 {label:'Cadastros',icon:'▧',href:'/novo/postes?tab=cadastros',key:'cadastros',group:'postes'},
 {label:'Critérios',icon:'⚑',href:'/novo/postes?tab=criterios',key:'criterios',group:'postes',restricted:true},
 {label:'Como funciona',icon:'?',href:'/novo?view=help',key:'help',group:'footer'},
];
function setTheme(theme:'light'|'dark'){document.documentElement.dataset.previewTheme=theme;localStorage.setItem('concretrack-preview-theme',theme)}
export function PreviewShell({area,page,active,user,role,context,children,onLogout,onCriteria}:{area:Area;page:string;active:string;user?:string;role?:string;context?:ReactNode;children:ReactNode;onLogout?:()=>void;onCriteria?:()=>void}){
 const[theme,setCurrentTheme]=useState<'light'|'dark'>(()=>{const saved=localStorage.getItem('concretrack-preview-theme');return saved==='dark'||(!saved&&matchMedia('(min-width: 1200px)').matches)?'dark':'light'});
 const[more,setMore]=useState(false),[fullscreen,setFullscreen]=useState(Boolean(document.fullscreenElement));
 useEffect(()=>{setTheme(theme)},[theme]);
 const toggleTheme=()=>setCurrentTheme(current=>current==='light'?'dark':'light');
 useEffect(()=>{const sync=()=>setFullscreen(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',sync);return()=>document.removeEventListener('fullscreenchange',sync)},[]);
 async function toggleFullscreen(){if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}
 function goBack(){if(document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1)history.back();else location.assign('/unificado/')}
 const visible=items.filter(item=>!item.restricted||role==='admin'||role==='engenheiro');
 const nav=(item:Item)=>item.key==='criterios'&&onCriteria?<button key={item.key} className="preview-nav-item" onClick={onCriteria}><span className="preview-nav-icon">{item.icon}</span><span className="preview-nav-label">{item.label}</span></button>:<a key={item.key} className="preview-nav-item" aria-current={active===item.key?'page':undefined} href={item.href}><span className="preview-nav-icon">{item.icon}</span><span className="preview-nav-label">{item.label}</span></a>;
 return <div className="preview-shell"><aside className="preview-sidebar"><a className="preview-brand" href="/novo"><span className="preview-brand-mark">C</span>CONCRETRACK</a><div className="preview-group-title">Cura térmica</div>{visible.filter(i=>i.group==='cura').map(nav)}<div className="preview-group-title">Postes</div>{visible.filter(i=>i.group==='postes').map(nav)}<div className="preview-sidebar-bottom">{visible.filter(i=>i.group==='footer').map(nav)}{user&&<div className="preview-user" style={{padding:'12px 13px',fontSize:12}}>{user}</div>}{onLogout&&<button className="preview-nav-item" onClick={onLogout}><span className="preview-nav-icon">↪</span><span className="preview-nav-label">Sair</span></button>}</div></aside><div className="preview-main"><header className="preview-top"><button className="preview-button preview-back" onClick={goBack}>← Voltar</button><div className="preview-crumb">{area==='cura'?'Cura térmica':'Postes'} / <strong>{page}</strong></div><div className="preview-top-right">{context}<button className="preview-button" onClick={()=>void toggleFullscreen()}>{fullscreen?'Sair da tela cheia':'Tela cheia'}</button><button className="preview-button" type="button" onClick={toggleTheme} aria-pressed={theme==='dark'}>Tema {theme==='light'?'escuro':'claro'}</button></div></header><main className="preview-content"><div className="preview-embedded-toolbar"><button className="preview-button" type="button" onClick={toggleTheme} aria-pressed={theme==='dark'}>Tema {theme==='light'?'escuro':'claro'}</button></div>{children}</main></div><nav className="preview-bottom-nav" aria-label="Navegação do Laboratório"><a href="/novo"><span className="preview-nav-icon">◫</span>Cura</a><a href="/novo/postes"><span className="preview-nav-icon">▤</span>Postes</a><a href="/novo/postes?tab=absorcao"><span className="preview-nav-icon">◉</span>Absorção</a><button onClick={()=>setMore(!more)}><span className="preview-nav-icon">☰</span>Mais</button></nav>{more&&<div className="preview-more" role="dialog" aria-label="Mais opções" style={{position:'fixed',bottom:70,left:12,right:12,zIndex:101,padding:12,background:'var(--pv-card)',borderRadius:16,boxShadow:'var(--pv-shadow)'}}>{visible.filter(i=>!['monitor','ensaio','absorcao'].includes(i.key)).map(nav)}{user&&<div style={{padding:12}}>{user}</div>}{onLogout&&<button className="preview-nav-item" onClick={onLogout}>Sair</button>}</div>}</div>;
}
