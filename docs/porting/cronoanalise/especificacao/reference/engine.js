// CronoTrack — motor de referência (JavaScript) extraído do app protótipo.
// O Codex deve portar este arquivo 1:1 para TypeScript (frontend/src/engine/) mantendo a MESMA ordem de sorteios,
// para que os testes de paridade (tests/golden.json) batam exatamente.

// ---------- utilidades numéricas ----------
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function lognormal(rnd,m,cv){if(!(m>0))return 0;if(!(cv>0))return m;const s2=Math.log(1+cv*cv);let u=rnd()||1e-12,v=rnd();const z=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);return Math.exp(Math.log(m)-s2/2+Math.sqrt(s2)*z)}
function tcrit(df){const t=[12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131,2.120,2.110,2.101,2.093,2.086,2.080,2.074,2.069,2.064,2.060,2.056,2.052,2.048,2.045,2.042];return df<1?NaN:df<=30?t[df-1]:df<=60?2.000:1.96}
function meanCI(xs){const n=xs.length;if(!n)return{m:NaN,h:NaN};const m=xs.reduce((a,b)=>a+b,0)/n;if(n<2)return{m,h:NaN};const s=Math.sqrt(xs.reduce((a,b)=>a+(b-m)**2,0)/(n-1));return{m,h:tcrit(n-1)*s/Math.sqrt(n)}}

// ---------- motor de eventos discretos ----------
class Env{
  constructor(){this.now=0;this.h=[];this.seq=0}
  at(t,fn){const h=this.h,e={t,s:this.seq++,fn};h.push(e);let i=h.length-1;while(i>0){const p=(i-1)>>1;if(Env.lt(h[p],e))break;h[i]=h[p];i=p}h[i]=e}
  static lt(a,b){return a.t<b.t||(a.t===b.t&&a.s<b.s)}
  pop(){const h=this.h,top0=h[0],last=h.pop();if(h.length){let i=0;const n=h.length;for(;;){let l=2*i+1,r=l+1,m=i;if(l<n&&Env.lt(h[l],last))m=l;if(r<n&&Env.lt(h[r],m===i?last:h[m]))m=r;if(m===i)break;h[i]=h[m];i=m}h[i]=last}return top0}
  run(until){while(this.h.length&&this.h[0].t<=until){const e=this.pop();this.now=e.t;e.fn()}this.now=until}
  proc(gen){const env=this;const step=v=>{const r=gen.next(v);if(r.done)return;const c=r.value;
      if(c[0]==='t')env.at(env.now+Math.max(0,c[1]),step);
      else if(c[0]==='req')c[1].request(step,c[2]);
      else if(c[0]==='get')c[1].get(step);
      else if(c[0]==='call')c[1](step);
      else throw new Error('comando desconhecido')};
    env.at(env.now,step)}
}
class Res{
  constructor(env,name,cap,warm){this.env=env;this.name=name;this.cap=cap;this.warm=warm;this.inUse=0;this.q=[];this.last=0;this.area=0;this.waits=[]}
  acc(){const e=this.env,a=Math.max(this.last,this.warm);if(e.now>a)this.area+=(e.now-a)*this.inUse;this.last=e.now}
  request(cb){this.acc();if(this.inUse<this.cap){this.inUse++;this.rec(0);this.env.at(this.env.now,cb)}else this.q.push({cb,t:this.env.now})}
  rec(w){if(this.env.now>=this.warm)this.waits.push(w)}
  release(){this.acc();if(this.q.length){const n=this.q.shift();this.rec(this.env.now-n.t);this.env.at(this.env.now,n.cb)}else this.inUse--}
  util(T){this.acc();return this.area/(this.cap*Math.max(1e-9,T-this.warm))}
  wait(){return this.waits.length?this.waits.reduce((a,b)=>a+b,0)/this.waits.length:0}
}
// monovia de trilho único: ordem no trilho S4 · usina · S3 · S2 · S1. Os carrinhos não se ultrapassam:
// o carrinho 2 fica sempre do lado da usina/S4 e o carrinho 1 do lado do S1. Carrinho parado bloqueia o outro.
function makeRail(env,cfg,lay,mov,warm){
  const L=k=>Math.abs(+((lay&&lay[k]&&lay[k].dm)||0));
  const x=[-L(4),0,L(3),L(2),L(1)],node={4:0,3:2,2:3,1:4};
  const mk=(name,n)=>({name,node:n,moving:false,from:n,to:n,assigned:false,pushing:false,loaded:false,waiting:false,yieldTo:null,busy:0,t0:0,blocked:0,trips:0,inbox:new Store(env)});
  const c1=mk('Carrinho 1',2),c2=mk('Carrinho 2',0),carts=[c1,c2];
  const waiters=[],queue=[];
  const idle=c=>!c.assigned&&!c.moving&&!c.pushing;
  const span=c=>c.moving?[Math.min(c.from,c.to),Math.max(c.from,c.to)]:[c.node,c.node];
  const other=c=>c===c1?c2:c1;
  function allowed(s){s=+s;return s===1?[c1]:s===4?[c2]:[c2,c1]}
  function dispatch(){while(queue.length){const q=queue[0];const c=allowed(q.s).find(idle);if(!c)break;queue.shift();c.assigned=true;c.t0=env.now;c.inbox.put(q.job)}}
  function changed(){const w=waiters.splice(0);for(const cb of w)env.at(env.now,cb);dispatch()}
  function feasible(c,j){return c===c2?j<span(c1)[0]:j>span(c2)[1]}
  // carrinho livre no caminho é empurrado; carrinho vazio que espera no caminho de um carregado cede passagem
  function push(c,j){const o=other(c);const tgt=c===c2?Math.min(4,j+1):Math.max(0,j-1);if(tgt===o.node)return;
    if(idle(o)){o.pushing=true;env.proc((function*(){yield* moveTo(o,tgt);o.pushing=false;changed()})());return}
    if(o.waiting&&!o.loaded&&c.loaded&&o.yieldTo==null){o.yieldTo=tgt;changed()}}
  function* step(c,j){c.from=c.node;c.to=j;c.moving=true;const d=Math.abs(x[j]-x[c.node]);yield['t',mov(d,cfg.vMono)];c.node=j;c.moving=false;changed()}
  function* moveTo(c,j){for(;;){
      if(c.yieldTo!=null){const y=c.yieldTo;c.yieldTo=null;if(y!==c.node&&feasible(c,y)){yield* step(c,y);continue}}
      if(c.node===j)return;
      if(feasible(c,j)){yield* step(c,j);return}
      push(c,j);
      const o=other(c);if(!c.loaded&&o.loaded&&o.waiting){const y=c===c1?Math.min(4,o.target+1):Math.max(0,o.target-1);if(y!==c.node&&feasible(c,y)){yield* step(c,y);continue}}
      const t0=env.now;c.target=j;c.waiting=true;yield['call',cb=>waiters.push(cb)];c.waiting=false;if(env.now>=warm)c.blocked+=env.now-t0}}
  function* worker(c){for(;;){const job=yield['get',c.inbox];
      yield* moveTo(c,1);job.atU.put(1);yield['get',job.filled];
      c.loaded=true;yield* moveTo(c,node[+job.s]);yield['req',job.ponte];yield['t',job.swap()];c.loaded=false;env.proc(job.after());
      if(env.now>=warm){c.busy+=env.now-Math.max(c.t0,warm);c.trips++}
      c.assigned=false;changed()}}
  return{assign(s,job){queue.push({s,job});dispatch()},start(){for(const c of carts)env.proc(worker(c))},
    report:carts.map(c=>({name:c.name,util:T=>c.busy/Math.max(1e-9,T-warm),wait:()=>c.trips?c.blocked/c.trips:0}))}
}
class Store{constructor(env){this.env=env;this.items=[];this.getters=[]}
  put(x){if(this.getters.length){const g=this.getters.shift();this.env.at(this.env.now,()=>g(x))}else this.items.push(x)}
  get(cb){if(this.items.length){const x=this.items.shift();this.env.at(this.env.now,()=>cb(x))}else this.getters.push(cb)}}

// ---------- formas do layout e regra de caçambas ----------
// regra de caçambas por forma: "1/3" (todas) ou faixas "1-20: 1/2; 21-40: 1; 41-52: 1,5" (posição na fila a partir da monovia)
function parseNum(v){v=String(v).trim().replace(',','.');if(v.includes('/')){const [a,b]=v.split('/').map(Number);return b?a/b:NaN}return Number(v)}
function parseRegra(txt){const parts=String(txt||'1').split(/[;\n]+/).map(p=>p.trim()).filter(Boolean),faixas=[];
  for(const p of parts){const m=p.match(/^(\d+)\s*[-–a]\s*(\d+)\s*[:=]\s*(.+)$/i);if(m){faixas.push({de:+m[1],ate:+m[2],q:parseNum(m[3])});continue}
    const t=p.replace(/^(todas|tudo)\s*[:=]?\s*/i,'');faixas.push({de:1,ate:1e9,q:parseNum(t)})}
  return i=>{const f=faixas.find(f=>i>=f.de&&i<=f.ate)||faixas[faixas.length-1];return f&&f.q>0?f.q:1}}
function formasSetor(s,L){const out=[],n=Math.max(1,Math.round(+L.nf||1)),fil=Math.max(1,Math.round(+L.filas||1)),q=parseRegra(L.regra);
  for(let f=1;f<=fil;f++)for(let i=1;i<=n;i++){const d=n>1?(+L.d1)+((+L.dn)-(+L.d1))*(i-1)/(n-1):(+L.d1);out.push({s,fila:f,i,d,need:q(i),poured:0,conc:null,acab:null})}
  return out}
// ---------- dia de produção (relógio real) ----------
const hm2m=s=>{const m=String(s||'').match(/(\d{1,2}):(\d{2})/);return m?(+m[1])*60+(+m[2]):0};
const m2hm=m=>{if(!Number.isFinite(m))return'–';const d=Math.floor(m/1440),r=Math.round(m-d*1440),h=Math.floor(r/60)%24,mi=r%60;return String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0')+(d>0?' +'+d+'d':'')};
const mod=t=>((t%1440)+1440)%1440;
// recurso com expediente (calendário em minutos do dia) e prioridade
let CRES_SEQ=0;
class CRes{
  constructor(env,name,cap,cal,warm){this.env=env;this.name=name;this.cap=Math.max(1,Math.round(cap));this.cal=cal;this.warm=warm;this.inUse=0;this.q=[];this.last=0;this.area=0;this.waits=[];this.wk=false}
  open(t){if(!this.cal)return true;const m=mod(t);return this.cal.some(([a,b])=>m>=a&&m<b)}
  winStart(t){if(!this.cal)return-Infinity;const m=mod(t);for(const [a,b] of this.cal)if(m>=a&&m<b)return t-(m-a);return t}
  nextOpen(t){if(this.open(t))return t;let best=Infinity;const d0=Math.floor(t/1440);for(let k=0;k<3;k++)for(const [a] of this.cal){const c=(d0+k)*1440+a;if(c>=t&&c<best)best=c}return best}
  acc(){const e=this.env,a=Math.max(this.last,this.warm);if(e.now>a)this.area+=(e.now-a)*this.inUse;this.last=e.now}
  request(cb,prio){this.q.push({cb,t:this.env.now,p:prio||0,s:CRES_SEQ++});this.tryGrant()}
  tryGrant(){const e=this.env;
    if(!this.open(e.now)){if(this.q.length&&!this.wk){this.wk=true;const nt=this.nextOpen(e.now);if(nt<Infinity)e.at(nt,()=>{this.wk=false;this.tryGrant()})}return}
    while(this.inUse<this.cap&&this.q.length){let bi=0;for(let i=1;i<this.q.length;i++){const a=this.q[i],b=this.q[bi];if(a.p>b.p||(a.p===b.p&&a.s<b.s))bi=i}
      const n=this.q.splice(bi,1)[0];this.acc();this.inUse++;if(e.now>=this.warm)this.waits.push(Math.max(0,e.now-Math.max(n.t,this.winStart(e.now))));e.at(e.now,n.cb)}}
  release(){this.acc();this.inUse--;this.tryGrant()}
  openMin(t0,t1){if(!this.cal)return t1-t0;let s=0;for(let d=Math.floor(t0/1440);d*1440<t1;d++)for(const [a,b0] of this.cal){const b=Math.min(b0,this.fim??b0),x=Math.max(t0,d*1440+a),y=Math.min(t1,d*1440+b);if(y>x)s+=y-x}return s}
  util(T){this.acc();return this.area/(this.cap*Math.max(1e-9,this.openMin(this.warm,T)))}
  wait(){return this.waits.length?this.waits.reduce((a,b)=>a+b,0)/this.waits.length:0}
}
// trilho das pontes de um setor: uma ponte só entra num trecho que nenhuma outra ocupa (elas não se sobrepõem)
class Track{
  constructor(env){this.env=env;this.act=new Map();this.w=[]}
  ok(id,lo,hi){for(const [k,s] of this.act)if(k!==id&&s.lo<hi&&lo<s.hi)return false;return true}
  acquire(id,lo,hi,cb){if(this.ok(id,lo,hi)){this.act.set(id,{lo,hi});this.env.at(this.env.now,cb)}else this.w.push({id,lo,hi,cb})}
  release(id){this.act.delete(id);const w=this.w;this.w=[];for(const x of w)this.acquire(x.id,x.lo,x.hi,x.cb)}
}
function planoViagens(fsBySec,lay,pol){
  const S=[1,2,3,4].filter(s=>fsBySec[s]);
  const secs=S.slice().sort((a,b)=>pol.setor==='perto'?lay[a].dm-lay[b].dm:lay[b].dm-lay[a].dm);
  const por={};
  for(const s of S){const fs=fsBySec[s].slice().sort((a,b)=>(pol.dentro==='perto'?a.d-b.d:b.d-a.d)||a.fila-b.fila);
    const trips=[];let cur=null,cap=0;const eps=1e-6;
    for(const f of fs){let q=f.need;while(q>eps){if(!cur||cap<=eps){cur={s,legs:[]};trips.push(cur);cap=1}const tk=Math.min(q,cap);cur.legs.push({f,q:tk});q-=tk;cap-=tk}}
    por[s]=trips}
  if(pol.setor!=='alternado')return secs.flatMap(s=>por[s]);
  const seq=[];for(let k=0;;k++){let any=false;for(const s of secs)if(por[s][k]){seq.push(por[s][k]);any=true}if(!any)break}return seq}
const POL_LIST=[{setor:'longe',dentro:'longe'},{setor:'longe',dentro:'perto'},{setor:'perto',dentro:'longe'},{setor:'perto',dentro:'perto'},{setor:'alternado',dentro:'longe'},{setor:'alternado',dentro:'perto'}];
const polOf=v=>{const [a,b]=String(v||'alternado|longe').split('|');return{setor:a||'alternado',dentro:b||'longe'}};

function diaProducao(cfg,lay,pol,T,seed){
  const rnd=mulberry32(seed),env=new Env(),D=Math.max(2,Math.round(+cfg.dias||3)),warm=1440;
  const t=(id,s)=>T(id,s,rnd),mov=(d,v)=>d>0?lognormal(rnd,(+d)/Math.max(.1,+v||30),0.15):0;
  const H=k=>hm2m(cfg[k]),hDes=H('hDesforma'),hConc=H('hConcIni'),hMont=H('hMontIni'),hExtra=H('hExtraIni'),hFim=H('hFim'),hPinI=H('hPinosIni'),hPinF=H('hPinosFim');
  const END=1439,vC=+cfg.vCarr||30,vV=+cfg.vVazia||45,cura=(+cfg.curaH||16)*60,pinosD=(+cfg.pinosH||4)*60;
  const R=(n,c,cal,fim)=>{const r=new CRes(env,n,c,cal,warm);r.fim=fim??hFim;return r};
  const usina=R('Usina',1,[[hConc,END]]),dupla=R('Dupla de carimbo e pinos',+cfg.nPinos||2,[[hPinI,hPinF]],hPinF);
  const lanc=s=>T.med&&T.med('C03')?t('C03',s):lognormal(rnd,+(lay[s].tl||2),0.2);
  const sec={},fsBy={};
  for(const s of [1,2,3,4]){const L=lay[s];if(!L)continue;const fs=formasSetor(s,L);fsBy[s]=fs;
    const c=(L.cor!==''&&L.cor!=null)?+L.cor:((+L.d1)+(+L.dn))/2,dest=(L.dest!==''&&L.dest!=null)?+L.dest:c;
    sec[s]={s,c,dest,track:new Track(env),corrQ:new Store(env),
      desf:R('Desforma S'+s,1,[[hDes,hConc],[hExtra,END]]),pRet:R('Ponte de retirada S'+s,1,[[hDes,END]]),pTra:R('Ponte corredor → montagem S'+s,1,[[hDes,END]]),
      pConc:R('Ponte de concretagem S'+s,1,[[hConc,END]]),lan:R('Lançador S'+s,1,[[hConc,END]]),aca:R('Acabador S'+s,1,[[hConc,END]]),
      mont:R('Montagem S'+s,Math.max(1,Math.floor((+cfg.nMont||4)/2)),[[hMont,END]]),slots:R('Corredor S'+s,+cfg.corredor||25,null)}}
  const day=x=>Math.floor(x/1440);
  const st={};const DS=d=>st[d]??=({fimConc:-Infinity,nConc:0,fimMont:-Infinity,fimLivre:-Infinity,acab:[],car:[],pinosLate:0,pinosFim:-Infinity,intConc:0,intRet:0,bloq:0,pass:0,idade:[],esperaPronta:0});
  const readyW=[];const wakeReady=()=>{const w=readyW.splice(0);for(const cb of w)env.at(env.now,cb)};
  const rail=makeRail(env,cfg,lay,mov,0);rail.start();
  // ontem: concretagem distribuída das hConc às 16:00 na ordem da política
  const seq0=planoViagens(fsBy,lay,pol),span=Math.max(60,hm2m('16:00')-hConc);
  seq0.forEach((tr,k)=>{for(const l of tr.legs){l.f.conc=-1440+hConc+span*(k+1)/seq0.length}});
  for(const s in fsBy)for(const f of fsBy[s]){f.state='cheia';f.concSig=new Store(env)}
  const P01p=2;
  function* vida(f){const S=sec[f.s],s=f.s;
    for(;;){
      yield['t',Math.max(0,f.conc+cura-env.now)];
      // desforma: abrir, raspar, frisar, varrer (2 da concretagem até o início da concretagem; depois 1 colaborador)
      yield['req',S.desf,-f.d];const fac=mod(env.now)<hConc?1:P01p;yield['t',t('P01',s)*fac+t('P02',s)];S.desf.release();
      // ponte de retirada: forma → corredor
      yield['req',S.pRet,-f.d];
      const lo=Math.min(f.d,S.c),hi=Math.max(f.d,S.c);let t0=env.now;yield['call',cb=>S.track.acquire('ret',lo,hi,cb)];DS(day(env.now)).intRet+=env.now-t0;
      yield['t',mov(Math.abs(f.d-S.c),vV)+t('R02',s)+t('R03',s)+mov(Math.abs(f.d-S.c),vC)];
      t0=env.now;yield['req',S.slots];DS(day(env.now)).bloq+=env.now-t0;
      yield['t',t('R05',s)];S.track.release('ret');S.pRet.release();S.corrQ.put(f);
      f.state='livre';const dl=DS(day(env.now));dl.fimLivre=Math.max(dl.fimLivre,env.now);
      // montagem (duplas)
      yield['req',S.mont];
      for(const id of ['P03','P04','P05','P06','P08','P09','P10','P11','P12','P13'])yield['t',t(id,s)];
      for(;;){yield['t',t('P14',s)];if(rnd()>=(+cfg.probReprov||0)/100)break;yield['t',lognormal(rnd,+cfg.retrabalho||8,0.5)]}
      S.mont.release();f.state='pronta';const dm=DS(day(env.now));dm.fimMont=Math.max(dm.fimMont,env.now);wakeReady();
      yield['get',f.concSig]}}
  function* transf(S){for(;;){const f=yield['get',S.corrQ];yield['req',S.pTra];
      const dd=Math.abs(S.dest-S.c);yield['call',cb=>S.track.acquire('tra',Math.min(S.c,S.dest),Math.max(S.c,S.dest),cb)];
      yield['t',t('R07',S.s)];S.slots.release();yield['t',(dd>0.5?mov(dd,vC):t('R08',S.s))+t('R09',S.s)+(dd>0.5?mov(dd,vV):t('R10',S.s))];
      S.track.release('tra');S.pTra.release()}}
  function* posConc(f){const s=f.s,S=sec[s],tc=f.conc;
    env.proc((function*(){yield['req',S.aca];DS(day(tc)).acab.push(env.now-tc);yield['t',t('P16',s)];S.aca.release();f.acabFim=env.now})());
    env.proc((function*(){yield['req',dupla,2];DS(day(tc)).car.push(env.now-tc);yield['t',t('P17',s)];dupla.release()})());
    yield['t',pinosD];yield['req',dupla,1];yield['t',t('P18',s)];dupla.release();const d=DS(day(tc));d.pinosFim=Math.max(d.pinosFim,env.now);if(mod(env.now)>hPinF||day(env.now)>day(tc))d.pinosLate++}
  function* despacho(dIdx){
    yield['t',Math.max(0,dIdx*1440+hConc-env.now)];
    const seq=planoViagens(fsBy,lay,pol);const done=new Set();
    while(done.size<seq.length){
      if(env.now>=(dIdx+1)*1440)return;
      const tr=seq.find(x=>!done.has(x)&&x.legs.every(l=>l.f.state==='pronta'||l.f.state==='reservada'));
      if(!tr){const t0=env.now;yield['call',cb=>readyW.push(cb)];DS(dIdx).esperaPronta+=env.now-t0;continue}
      done.add(tr);for(const l of tr.legs)l.f.state='reservada';
      const s=tr.s,S=sec[s],job={s,atU:new Store(env),filled:new Store(env),ponte:S.pConc,swap:()=>t('U05',s)+t('U06',s)+t('U07',s)};
      let tb=0;
      job.after=function*(){
        const maxD=Math.max(...tr.legs.map(l=>l.f.d)),mine=new Set(tr.legs.map(l=>l.f));
        for(const o of fsBy[s])if(!mine.has(o)&&o.state==='cheia'&&day(o.conc)===dIdx&&o.acabFim==null&&o.d<maxD)DS(dIdx).pass++;
        const t0=env.now;yield['call',cb=>S.track.acquire('conc',0,maxD,cb)];DS(dIdx).intConc+=env.now-t0;
        let pos=0,first=true;
        for(const l of tr.legs){yield['t',mov(Math.abs(l.f.d-pos),vC)];pos=l.f.d;
          yield['req',S.lan];if(first){DS(dIdx).idade.push(env.now-tb);first=false}yield['t',lanc(s)*l.q/l.f.need];S.lan.release();
          l.f.poured=(l.f.poured||0)+l.q;
          if(l.f.poured>=l.f.need-1e-6){l.f.poured=0;l.f.conc=env.now;l.f.acabFim=null;l.f.state='cheia';const dd=DS(dIdx);dd.nConc++;dd.fimConc=Math.max(dd.fimConc,env.now);env.proc(posConc(l.f));l.f.concSig.put(1)}}
        yield['t',mov(pos,vV)];S.track.release('conc');S.pConc.release()};
      yield['req',usina];rail.assign(s,job);yield['t',t('U01',s)+t('U02',s)];tb=env.now;
      yield['get',job.atU];yield['t',t('U03',s)];usina.release();job.filled.put(1)}}
  for(const s in fsBy){for(const f of fsBy[s])env.proc(vida(f));env.proc(transf(sec[s]))}
  for(let d=0;d<D;d++)env.proc(despacho(d));
  env.run(D*1440);
  const days=[];for(let d=1;d<D;d++)days.push(DS(d));
  const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN,mx=a=>a.length?Math.max(...a):NaN;
  const per=f=>avg(days.map(f));const total=Object.values(fsBy).reduce((a,fs)=>a+fs.length,0);
  const res=[usina,dupla];for(const s of [1,2,3,4]){const S=sec[s];if(!S)continue;res.push(S.desf,S.pRet,S.pTra,S.pConc,S.lan,S.aca,S.mont,S.slots)}
  const T1=D*1440;
  return{total,nConc:per(d=>d.nConc),fimConc:per(d=>mod(d.fimConc)),fimMont:per(d=>mod(d.fimMont)),fimLivre:per(d=>mod(d.fimLivre)),
    extra:per(d=>Math.max(0,Math.max(mod(d.fimConc),mod(d.fimMont))-hFim)),acab:per(d=>avg(d.acab)),acabMax:per(d=>mx(d.acab)),car:per(d=>avg(d.car)),carMax:per(d=>mx(d.car)),
    pinosLate:per(d=>d.pinosLate),pinosFim:per(d=>mod(d.pinosFim)),inter:per(d=>d.intConc+d.intRet),bloq:per(d=>d.bloq),pass:per(d=>d.pass),idade:per(d=>avg(d.idade)),esperaPronta:per(d=>d.esperaPronta),
    res:res.map(r=>({name:r.name,util:r.util?r.util(T1):0,wait:r.wait?r.wait():0}))}
}


if(typeof module!=='undefined')module.exports={mulberry32,lognormal,tcrit,meanCI,Env,Res,Store,makeRail,parseNum,parseRegra,formasSetor,hm2m,m2hm,CRes,Track,planoViagens,POL_LIST,polOf,diaProducao};
