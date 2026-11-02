const $=s=>document.querySelector(s),LV=['Iniciante','Intermediário','Avançado'],LIM=[100,300,Infinity],KEY='vg_estado',
DIAS=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
NAV=[['home','Home','🏠'],['modulos','Módulos','📚'],['tarefas','Tarefas','🏆'],['evolucao','Evolução','📈'],['agenda','Agenda','📅'],['forum','Fórum','💬']];
let D,S,fmod='';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hoje=()=>new Date().toLocaleDateString('sv'),save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const novo=()=>({nome:'',nivel:null,xp:0,aulas:[],treinos:[],broches:[],perfil:[],agenda:{dias:[2,4],min:30},forum:[]});
const nvXP=x=>x>300?2:x>100?1:0,nv=()=>Math.max(S.nivel||0,nvXP(S.xp)),mod=id=>D.modulos.find(m=>m.id==id);
const pend=()=>D.modulos.filter(m=>m.nivel<=nv()&&!S.aulas.includes(m.id));
const prog=c=>({xp:S.xp,treinos:S.treinos.length,aulas:S.aulas.length,modulo:S.treinos.filter(t=>t.mid==c.modulo).length,
 melhor:S.treinos.filter(t=>t.percentual>80).length,dias:new Set(S.treinos.map(t=>t.data)).size})[c.tipo];
const aviso=t=>{const e=$('#toast');e.textContent=t;e.className='on';clearTimeout(aviso.t);aviso.t=setTimeout(()=>e.className='',3800)};
const dm=d=>d.slice(8)+'/'+d.slice(5,7);

async function init(){
 try{D=await(await fetch('data.json')).json()}catch(e){
  document.body.innerHTML='<p style="padding:2rem">Não foi possível ler data.json. Abra a pasta com um servidor local (<code>python -m http.server</code>) e acesse http://localhost:8000</p>';return}
 try{S=Object.assign(novo(),JSON.parse(localStorage.getItem(KEY)))}catch(e){S=novo()}
 if(!localStorage.getItem(KEY)){S.forum=D.forum;save()}
 addEventListener('hashchange',()=>{render();scrollTo(0,0)});render()}

function ganhar(n,msg){const antes=nvXP(S.xp);S.xp+=n;
 const novos=D.conquistas.filter(c=>prog(c)>=c.alvo&&!S.broches.includes(c.id));S.broches.push(...novos.map(c=>c.id));save();
 aviso(`+${n} XP: ${msg}`+novos.map(c=>`. Broche conquistado: ${c.icone} ${c.nome}`).join('')+(nvXP(S.xp)>antes?'. Novo nível!':''));render()}
function assistir(id){if(!S.aulas.includes(id)){S.aulas.push(id);ganhar(D.xp.video,'aula concluída')}}
function treinar(e,id){e.preventDefault();const f=e.target,t=+f.tent.value,a=+f.ac.value;
 if(a>t){aviso('Os acertos não podem ser maiores que as tentativas.');return false}
 const pc=Math.round(a/t*100);S.treinos.push({data:hoje(),modulo:mod(id).titulo,mid:id,tentativas:t,acertos:a,percentual:pc});
 ganhar(D.xp.treino+(pc>80?D.xp.bonus:0),`treino salvo com ${pc}% de acerto`);return false}
function usar(id){const i=S.perfil.indexOf(id);if(i>=0)S.perfil.splice(i,1);else if(S.perfil.length<3)S.perfil.push(id);else aviso('Você pode usar até 3 broches no perfil.');save();render()}
function iniciar(e){e.preventDefault();const f=new FormData(e.target);let s=0;D.quiz.forEach((_,i)=>s+=+f.get('q'+i));
 S.nome=f.get('nome').trim()||'Jogador';S.nivel=s<=3?0:s<=7?1:2;save();location.hash='home';render();return false}
function busca(e){e.preventDefault();location.hash='modulos/'+encodeURIComponent(e.target.q.value);render();return false}
function setAg(){S.agenda.dias=[...document.querySelectorAll('.dias input:checked')].map(i=>+i.value);S.agenda.min=+$('#min').value;save();render()}
function topico(e){e.preventDefault();const f=e.target;S.forum.unshift({id:Date.now(),autor:S.nome,topico:f.t.value,texto:f.x.value,respostas:[]});save();f.reset();$('#dlg').close();location.hash='forum';render();return false}
function responder(e,id){e.preventDefault();S.forum.find(t=>t.id==id).respostas.push({autor:S.nome,texto:e.target.x.value});save();render();return false}
function compartilhar(){const d={title:'Volleyball Guide',text:'Aprenda vôlei comigo no Volleyball Guide!',url:location.href};
 navigator.share?navigator.share(d).catch(()=>{}):navigator.clipboard.writeText(d.url).then(()=>aviso('Link copiado!'))}
function exportar(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download='progresso-volleyball-guide.json';a.click()}
function importar(f){f&&f.text().then(t=>{try{S=Object.assign(novo(),JSON.parse(t));save();aviso('Progresso importado.');render()}catch(e){aviso('Arquivo inválido.')}})}
function reiniciar(){if(confirm('Apagar todo o progresso?')){localStorage.removeItem(KEY);S=novo();S.forum=D.forum;save();render()}}

function plano(){const a=S.agenda,u=D.modulos.filter(m=>m.nivel<=nv()),p=pend().length?pend():u;
 return[...a.dias].sort((x,y)=>(x||7)-(y||7)).map((d,i)=>{const m=p[i%p.length],v=a.min>=30,
  pt=[(v||i%2==0)&&'assistir à aula',(v||i%2==1)&&`treino de ${a.min} tentativas`].filter(Boolean).join(' + ');
  return{d,m,txt:`${m.titulo}: ${pt}`}})}
function cal(){const n=new Date(),y=n.getFullYear(),mo=n.getMonth(),off=(new Date(y,mo,1).getDay()+6)%7,tot=new Date(y,mo+1,0).getDate();
 let c='';for(let i=0;i<off;i++)c+='<i></i>';
 for(let d=1;d<=tot;d++)c+=`<i class="${d==n.getDate()?'hj':S.agenda.dias.includes(new Date(y,mo,d).getDay())?'ag':''}">${d}</i>`;
 return`<div class=cal><b>${n.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</b><div class=sem>${['S','T','Q','Q','S','S','D'].map(x=>`<i>${x}</i>`).join('')}${c}</div></div>`}
function grafico(p){if(p.length<2)return'<p>Salve pelo menos 2 treinos para ver sua evolução.</p>';
 const W=640,H=260,m=40,x=i=>m+i*(W-2*m)/(p.length-1),y=v=>H-m-v*(H-2*m)/100;
 return`<svg viewBox="0 0 ${W} ${H}" role=img aria-label="Gráfico de acertos por treino">`+[0,25,50,75,100].map(v=>`<line class=g x1=${m} x2=${W-m} y1=${y(v)} y2=${y(v)} /><text x=4 y=${y(v)+4}>${v}%</text>`).join('')
 +`<polyline fill=none stroke=#f97316 stroke-width=3 points="${p.map((d,i)=>x(i)+','+y(d.v)).join(' ')}"/>`
 +p.map((d,i)=>`<circle class=pt cx=${x(i)} cy=${y(d.v)} r=5><title>${d.l}: ${d.v}%</title></circle>`).join('')
 +`<text x=${m} y=${H-12}>${p[0].d}</text><text x=${W-m} y=${H-12} text-anchor=end>${p[p.length-1].d}</text></svg>`}

const card=m=>{const ok=S.aulas.includes(m.id),n=S.treinos.filter(t=>t.mid==m.id).length;
 return`<a class=card href="#modulo/${m.id}"><h4>▶ ${ok?'Revisar aula':'Continue seu treino'}</h4><h3>${m.titulo}</h3><span class=tag>${LV[m.nivel]}</span><p>${m.texto.split('. ')[0]}.</p><div class=meta><span>⏱ ${m.min} min</span><span>${ok?'✔ ':''}${n} treinos</span></div></a>`};
const quiz=()=>`<form class="branco quiz" onsubmit="return iniciar(event)"><h1>Bem-vindo ao Volleyball Guide</h1><p>Responda 5 perguntas rápidas para liberarmos as aulas certas para você.</p><label>Como podemos te chamar?<input name=nome required maxlength=20></label>${D.quiz.map((q,i)=>`<fieldset><legend>${q.p}</legend>${q.o.map((o,j)=>`<label class=op><input type=radio name=q${i} value=${j} required> ${o}</label>`).join('')}</fieldset>`).join('')}<button class=pri>Começar</button></form>`;
function shell(r,h){const l=nvXP(S.xp),b=[0,100,300][l],t=LIM[l],pc=t==Infinity?100:Math.round((S.xp-b)/(t-b)*100);
 return`<aside><div class=logo>🏐 <b>Guia de vôlei</b></div><nav>${NAV.map(n=>`<a href="#${n[0]}" class="${r==n[0]||(r=='modulo'&&n[0]=='modulos')?'on':''}"><i>${n[2]}</i>${n[1]}</a>`).join('')}</nav><div class=rod><a href="#config">⚙️ Configurações</a></div></aside>
<main><header><form class=busca onsubmit="return busca(event)"><input name=q placeholder="Pesquise aqui" aria-label="Pesquisar módulos"></form>
<div class=perfil><span class=av>${S.perfil.map(id=>D.conquistas.find(c=>c.id==id).icone).join('')||'🙂'}</span><div><b>${esc(S.nome)}</b>, ${LV[nv()]}<div class=xp><i style="width:${pc}%"></i></div><small>${S.xp}${t==Infinity?'':'/'+t} XP</small></div></div></header>${h}</main>`}

const vHome=()=>{const p=pend().slice(0,3),ult=S.broches.slice(-3).reverse().map(id=>D.conquistas.find(c=>c.id==id)),
 metas=D.conquistas.filter(c=>!S.broches.includes(c.id)).slice(0,4),h=plano().find(x=>x.d==new Date().getDay());
 return`<div class=cols><div><section class="pn hero"><div><h1>Bem-vindo ao Volleyball Guide</h1><p>Aprenda vôlei no seu ritmo, com conteúdos progressivos, vídeos, metas e acompanhamento do seu desempenho.</p></div><div><button class=pri onclick="compartilhar()">Compartilhar</button><p>Juntos por um vôlei mais acessível</p></div></section>
<h2>Continue o curso</h2><div class=grid3>${p.map(card).join('')||'<p>Você viu todas as aulas do seu nível. Treine para ganhar XP e liberar mais!</p>'}</div>
<h2>Suas metas</h2><div class="pn metas">${metas.map(c=>`<div class=item>${c.icone} ${c.nome}<small>${Math.min(prog(c),c.alvo)}/${c.alvo}</small></div>`).join('')||'Todas as metas concluídas!'}</div>
<section class=branco><h3>🏆 Conquistas recentes <a href=#tarefas>ver todas</a></h3><div class=bad>${ult.map(c=>`<div><span>${c.icone}</span>${c.nome}</div>`).join('')||'<p>Salve seu primeiro treino para ganhar um broche.</p>'}</div></section></div>
<div>${cal()}<div class=pn><h3>Hoje</h3>${h?`<a class=item href="#modulo/${h.m.id}">${h.txt}</a>`:'<p>Hoje é dia de descanso. <a href=#agenda>Ver agenda</a></p>'}</div></div></div>`};
const vMods=q=>{const f=m=>!q||(m.titulo+m.texto).toLowerCase().includes(q.toLowerCase()),
 sec=(t,c)=>{const l=D.modulos.filter(m=>m.cat==c&&f(m));return l.length?`<h2>${t}</h2><div class=grid3>${l.map(m=>m.nivel<=nv()?card(m):`<div class="card trava"><h3>🔒 ${m.titulo}</h3><span class=tag>${LV[m.nivel]}</span><p>Ganhe XP para chegar ao nível ${LV[m.nivel]} e liberar este módulo.</p></div>`).join('')}</div>`:''};
 return`<h1>Módulos</h1>${q?`<p>Resultados para “${esc(q)}” <a href=#modulos>limpar</a></p>`:''}${sec('Fundamentos','f')+sec('Fundamentos gerais','g')||'<p>Nenhum módulo encontrado.</p>'}`};
const vMod=id=>{const m=mod(id);if(!m||m.nivel>nv())return'<p>Módulo não disponível. <a href=#modulos>Voltar</a></p>';
 const ok=S.aulas.includes(id),ts=S.treinos.filter(t=>t.mid==id).slice(-5).reverse();
 return`<a href=#modulos>← Módulos</a><h1>${m.titulo}</h1><span class=tag>${LV[m.nivel]}</span><div class=cols2><section class=branco>${m.video?`<iframe src="https://www.youtube.com/embed/${m.video}" allowfullscreen title="Vídeo: ${m.titulo}"></iframe>`:'<div class=vid>Vídeo em breve. Coloque o ID do YouTube no campo “video” de data.json.</div>'}<button class=pri onclick="assistir('${id}')" ${ok?'disabled':''}>${ok?'✔ Vídeo assistido':`Marcar vídeo como assistido (+${D.xp.video} XP)`}</button><p>${m.texto}</p></section>
<section class=branco><h2>Prática</h2><form onsubmit="return treinar(event,'${id}')"><label>Quantas tentativas você fez?<input name=tent type=number min=1 required></label><label>Quantas você acertou?<input name=ac type=number min=0 required></label><button class=pri>Salvar treino (+${D.xp.treino} XP)</button></form><h3>Últimos treinos</h3>${ts.map(t=>`<div class=lin>${dm(t.data)}<span>${t.acertos}/${t.tentativas}</span><b>${t.percentual}%</b></div>`).join('')||'<p>Nenhum treino salvo ainda.</p>'}</section></div>`};
const vTar=()=>`<h1>Tarefas e conquistas</h1><p>Cada meta concluída gera um broche. Clique em um broche conquistado para usá-lo no perfil (até 3).</p>${D.conquistas.map(c=>{const p=Math.min(prog(c),c.alvo),ok=S.broches.includes(c.id);
 return`<div class="meta-c ${ok?'ok':''}"><span class=ic>${c.icone}</span><div><b>${c.nome}</b><small>${c.desc}</small><div class=xp><i style="width:${p/c.alvo*100}%"></i></div><small>${p}/${c.alvo}</small></div>${ok?`<button onclick="usar('${c.id}')">${S.perfil.includes(c.id)?'Tirar do perfil':'Usar no perfil'}</button>`:'🔒'}</div>`}).join('')}`;
const vEvo=()=>{const ts=S.treinos.filter(t=>!fmod||t.mid==fmod),m=ts.length?Math.round(ts.reduce((s,t)=>s+t.percentual,0)/ts.length):0,mx=Math.max(0,...ts.map(t=>t.percentual));
 return`<h1>Evolução</h1><label>Módulo <select onchange="fmod=this.value;render()"><option value="">Todos</option>${D.modulos.map(x=>`<option value="${x.id}" ${fmod==x.id?'selected':''}>${x.titulo}</option>`).join('')}</select></label>
<div class=stats><div class=pn><b>${ts.length}</b>treinos</div><div class=pn><b>${m}%</b>média de acertos</div><div class=pn><b>${mx}%</b>melhor treino</div></div><section class=branco>${grafico(ts.map(t=>({d:dm(t.data),l:dm(t.data)+' '+t.modulo,v:t.percentual})))}</section>`};
const vAg=()=>{const a=S.agenda;return`<h1>Agenda</h1><section class=branco><h3>Quando você pode treinar?</h3><div class=dias>${[1,2,3,4,5,6,0].map(d=>`<label><input type=checkbox value=${d} ${a.dias.includes(d)?'checked':''} onchange="setAg()"><span>${DIAS[d].slice(0,3)}</span></label>`).join('')}</div>
<label>Tempo por dia <select id=min onchange="setAg()">${[15,30,45,60].map(x=>`<option ${a.min==x?'selected':''}>${x}</option>`).join('')}</select> minutos</label></section>
<h2>Seu planejamento semanal</h2>${plano().map(p=>`<a class="item bco" href="#modulo/${p.m.id}"><b>${DIAS[p.d]}</b><small>${p.txt}</small></a>`).join('')||'<p>Escolha pelo menos um dia de treino.</p>'}`};
const vForum=id=>{const t=S.forum.find(x=>x.id==id);
 if(t)return`<a href=#forum>← Fórum</a><section class=branco><h1>${esc(t.topico)}</h1><p><b>${esc(t.autor)}:</b> ${esc(t.texto||'')}</p>${t.respostas.map(r=>`<div class=resp><b>${esc(r.autor)}:</b> ${esc(r.texto)}</div>`).join('')}<form onsubmit="return responder(event,${t.id})"><textarea name=x required rows=3 placeholder="Escreva sua resposta"></textarea><br><br><button class=pri>Responder</button></form></section>`;
 return`<h1>Fórum</h1><p class=aviso>Versão beta local: você cria e responde tópicos, mas eles ficam salvos só neste navegador. A troca entre alunos virá na próxima fase.</p><p><button class=pri onclick="$('#dlg').showModal()">Novo tópico</button></p>${S.forum.map(t=>`<a class="item bco" href="#forum/${t.id}"><b>${esc(t.topico)}</b><small>${esc(t.autor)}, ${t.respostas.length} respostas</small></a>`).join('')}`};
const vCfg=()=>`<h1>Configurações</h1><section class=branco><p>Seu progresso fica salvo como JSON neste navegador. Exporte para guardar um backup ou levar para outro computador.</p><button class=pri onclick="exportar()">Exportar progresso (.json)</button> <label class=btn>Importar progresso<input type=file accept=.json hidden onchange="importar(this.files[0])"></label> <button onclick="S.nivel=null;save();render()">Refazer questionário</button> <button class=perigo onclick="reiniciar()">Apagar tudo</button></section>`;

function render(){const[r,a0]=(location.hash.slice(1)||'home').split('/'),a=decodeURIComponent(a0||''),A=$('#app');
 A.className=S.nivel===null?'q':'';if(S.nivel===null){A.innerHTML=quiz();return}
 const v={home:vHome,modulos:vMods,modulo:vMod,tarefas:vTar,evolucao:vEvo,agenda:vAg,forum:vForum,config:vCfg}[r]||vHome;A.innerHTML=shell(r,v(a))}
init();
