var S={tasks:[],executors:[],headers:[],visCols:{},filters:{},search:'',groupBy:'',sortCol:'',sortDir:1,assignments:{},saved:[],asgnIdx:null,issueData:null,colWidths:{}};
var $=function(id){return document.getElementById(id);};
var esc=function(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):'';};
var escA=function(s){return s?String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'"):'';};
function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('show');},2500);}
function openModal(id){$(id).classList.add('show');if(id==='helpModal')renderHelpFrame();}
function closeModal(id){$(id).classList.remove('show');}
function closeDDs(){document.querySelectorAll('.fd,.cp').forEach(function(d){d.classList.remove('show');});}
function toggleDD(el,id){var dd=$(id);if(!dd)return;var w=dd.classList.contains('show');closeDDs();if(!w)dd.classList.add('show');}
function toggleCP(){var p=$('colPanel');if(!p)return;var w=p.classList.contains('show');closeDDs();if(!w)p.classList.add('show');}
function toggleFilters(){var p=$('fPanel');var h=p.style.display==='none';p.style.display=h?'flex':'none';$('fArr').style.transform=h?'':'rotate(-90deg)';}
function badgeCls(s){if(!s)return '';var v=String(s).toLowerCase();if(v.includes('сорван'))return 'b-dn';if(v.includes('перенес'))return 'b-in';if(v.includes('уточн'))return 'b-wn';if(v.includes('выполня'))return 'b-sc';return '';}
function rowCls(s){var v=String(s||'').toLowerCase();if(v.includes('сорван'))return 'r-dn';if(v.includes('перенес'))return 'r-in';if(v.includes('выполня'))return 'r-sc';if(v.includes('уточн'))return 'r-wn';return '';}
function safeLS(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return v===undefined?null:false;}}
function parseDate(s){if(!s)return null;s=String(s).trim();var m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);if(m)return new Date(+m[3],+m[2]-1,+m[1]);m=s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);if(m)return new Date(+m[1],+m[2]-1,+m[3]);return null;}
function excelToDate(v){if(v instanceof Date)return isNaN(v)?null:v;if(typeof v==='number'){if(v>25000&&v<65000){var d=new Date((v-25569)*86400000);if(!isNaN(d))return d;}return null;}return parseDate(v);}
function fmtD(d){if(!d||isNaN(d))return '';return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear();}
function toYMD(s){var d=parseDate(s);return d?d.toISOString().slice(0,10):'';}

function dlFile(n,t,mime){var b=new Blob([t],{type:(mime||'text/plain;charset=utf-8')});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();URL.revokeObjectURL(a.href);}
function exportConfig(){
  var cfg={assignments:S.assignments,visCols:S.visCols,colWidths:S.colWidths,filters:S.filters,search:S.search,groupBy:S.groupBy,sortCol:S.sortCol,sortDir:S.sortDir};
  dlFile('config_akid.json',JSON.stringify(cfg,null,2),'application/json');
  toast('Конфигурация сохранена в файл');
}
function importConfig(file){
  if(!file)return;var r=new FileReader();
  r.onload=function(e){
    try{
      var cfg=JSON.parse(e.target.result);
      if(cfg.assignments)S.assignments=cfg.assignments;
      if(cfg.visCols)S.visCols=cfg.visCols;
      if(cfg.colWidths)S.colWidths=cfg.colWidths;
      if(cfg.filters)S.filters=cfg.filters;
      if(cfg.search!==undefined)S.search=cfg.search;
      if(cfg.groupBy!==undefined)S.groupBy=cfg.groupBy;
      if(cfg.sortCol!==undefined)S.sortCol=cfg.sortCol;
      if(cfg.sortDir!==undefined)S.sortDir=cfg.sortDir;
      buildGrp();buildFilters();buildColPanel();render();toast('Конфигурация загружена');
    }catch(err){toast('Ошибка файла конфига: '+err.message);}
  };
  r.readAsText(file,'utf-8');
}

function mdInline(s){
  var x=esc(s);
  x=x.replace(/`([^`]+)`/g,'<code>$1</code>');
  x=x.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  x=x.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  x=x.replace(/(^|[\s>])(https?:\/\/[^\s<]+)/g,'$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
  return x;
}
function renderGuideMarkdown(md){
  var out=[],inCode=false,list=null;
  function closeList(){if(list){out.push('</'+list+'>');list=null;}}
  String(md||'').split(/\r?\n/).forEach(function(line){
    if(/^```/.test(line)){closeList();if(inCode){out.push('</code></pre>');inCode=false;}else{out.push('<pre><code>');inCode=true;}return;}
    if(inCode){out.push(esc(line)+'\n');return;}
    if(!line.trim()){closeList();return;}
    if(/^---+$/.test(line.trim())){closeList();out.push('<hr>');return;}
    var m=line.match(/^(#{1,3})\s+(.*)$/);if(m){closeList();var n=m[1].length;out.push('<h'+n+'>'+mdInline(m[2])+'</h'+n+'>');return;}
    m=line.match(/^>\s?(.*)$/);if(m){closeList();out.push('<blockquote>'+mdInline(m[1])+'</blockquote>');return;}
    m=line.match(/^[-*]\s+(.*)$/);if(m){if(list!=='ul'){closeList();list='ul';out.push('<ul>');}out.push('<li>'+mdInline(m[1])+'</li>');return;}
    m=line.match(/^\d+\.\s+(.*)$/);if(m){if(list!=='ol'){closeList();list='ol';out.push('<ol>');}out.push('<li>'+mdInline(m[1])+'</li>');return;}
    closeList();out.push('<p>'+mdInline(line)+'</p>');
  });
  closeList();if(inCode)out.push('</code></pre>');return out.join('');
}
function guideDocument(md){
  var dark=document.documentElement.getAttribute('data-theme')==='dark';
  var bg=dark?'#0F1520':'#FFFFFF',fg=dark?'#E8EDF3':'#0F172A',muted=dark?'#A5B4C4':'#475569',accent=dark?'#00D4AA':'#047857',panel=dark?'#151D2B':'#F8FAFC',border=dark?'#2A3A50':'#CBD5E1';
  return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+
  'html{background:'+bg+';color:'+fg+'}body{font-family:Segoe UI,Arial,sans-serif;max-width:900px;margin:0 auto;padding:28px 34px 48px;line-height:1.62;font-size:14px}h1{font-size:28px;margin:0 0 22px;line-height:1.2}h2{font-size:21px;margin:32px 0 12px;padding-bottom:7px;border-bottom:1px solid '+border+'}h3{font-size:17px;margin:24px 0 10px}p{margin:9px 0;color:'+fg+'}ul,ol{margin:9px 0 14px 25px}li{margin:5px 0}strong{font-weight:700}code{font-family:Consolas,monospace;background:'+panel+';border:1px solid '+border+';border-radius:5px;padding:1px 5px;font-size:.92em}pre{background:'+panel+';border:1px solid '+border+';border-radius:8px;padding:14px 16px;overflow:auto;margin:12px 0}pre code{border:0;padding:0;background:transparent}blockquote{margin:14px 0;padding:10px 14px;border-left:3px solid '+accent+';background:'+panel+';color:'+muted+'}hr{border:0;border-top:1px solid '+border+';margin:28px 0}a{color:'+accent+';text-decoration:none}a:hover{text-decoration:underline}@media(max-width:640px){body{padding:20px 18px 36px;font-size:13px}h1{font-size:23px}h2{font-size:19px}}'+
  '</style></head><body>'+renderGuideMarkdown(md)+'</body></html>';
}
async function loadGuideMarkdown(){
  var md=null;
  if(window.aimetonDesktop&&window.aimetonDesktop.getUserGuide)md=await window.aimetonDesktop.getUserGuide();
  if(!md){var r=await fetch('docs/USER_GUIDE_RU.md');if(r.ok)md=await r.text();}
  if(!md)throw new Error('Руководство недоступно');
  return md;
}
async function renderHelpFrame(){
  var frame=document.querySelector('#helpModal .help-frame');if(!frame)return;
  if(frame.dataset.loaded==='1'&&frame.dataset.theme===document.documentElement.getAttribute('data-theme'))return;
  try{
    var md=await loadGuideMarkdown();
    frame.removeAttribute('src');
    frame.srcdoc=guideDocument(md);
    frame.dataset.loaded='1';frame.dataset.theme=document.documentElement.getAttribute('data-theme');
  }catch(e){frame.removeAttribute('src');frame.srcdoc='<!doctype html><meta charset="utf-8"><body style="font-family:Segoe UI,Arial,sans-serif;padding:24px"><h2>Не удалось открыть руководство</h2><p>'+esc(e.message||e)+'</p></body>';}
}
async function openHelp(){openModal('helpModal');}

function syncScroll(){
  var w=$('tWrap'),t=$('scrollSyncTop');
  if(!w||!t)return;
  if(!t.firstChild){var d=document.createElement('div');d.style.height='1px';t.appendChild(d);}
  t.firstChild.style.width=w.scrollWidth+'px';
  w.onscroll=function(){t.scrollLeft=w.scrollLeft;};
  t.onscroll=function(){w.scrollLeft=t.scrollLeft;};
}

S.saved=safeLS('pm_sv')||[];
function copyTxt(id){var ta=$(id);navigator.clipboard.writeText(ta.value).then(function(){toast('Скопировано');}).catch(function(){ta.select();document.execCommand('copy');toast('Скопировано');});}
function toggleTheme(){var h=document.documentElement;var n=h.getAttribute('data-theme')==='dark'?'light':'dark';h.setAttribute('data-theme',n);safeLS('pm_theme',n);updThemeBtn(n);var f=document.querySelector('#helpModal .help-frame');if(f)f.dataset.loaded='0';}
function updThemeBtn(t){$('themeBtn').innerHTML=t==='dark'?'<i class="fa-solid fa-sun"></i>':'<i class="fa-solid fa-moon"></i>';}
(function(){var t=safeLS('pm_theme');if(t){document.documentElement.setAttribute('data-theme',t);updThemeBtn(t);}})();

function syncScroll(){var w=$('tWrap'),t=$('scrollSyncTop');if(!w||!t)return;if(!t.firstChild){var d=document.createElement('div');d.style.height='1px';t.appendChild(d);}t.firstChild.style.width=w.scrollWidth+'px';w.onscroll=function(){t.scrollLeft=w.scrollLeft;};t.onscroll=function(){w.scrollLeft=t.scrollLeft;};}
function handleTasksFile(file){if(!file)return;var r=new FileReader();r.onload=function(e){try{var wb=XLSX.read(e.target.result,{type:'array',cellDates:true,dateNF:'yyyy.mm.dd'});var ws=wb.Sheets[wb.SheetNames[0]];var raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});if(raw.length<3){toast('Короткий файл');return;}var hRow=0;for(var i=0;i<Math.min(raw.length,10);i++){for(var j=0;j<raw[i].length;j++){if(String(raw[i][j]).trim()==='Тема'){hRow=i;break;}}}S.headers=[];for(var j=0;j<raw[hRow].length;j++)S.headers.push(String(raw[hRow][j]).trim()||'Col_'+j);S.tasks=[];S.colWidths={};for(var i=hRow+1;i<raw.length;i++){var row=raw[i];if(!row||row.every(function(c){return String(c).trim()==='';}))continue;var obj={};S.headers.forEach(function(h,idx){obj[h]=row[idx]!==undefined?row[idx]:'';});S.tasks.push(obj);}var prio={'Тема':1,'Тип':1,'Основание':1,'Сектор (группа)':1,'Задача исполнителя':1,'Контр. Срок':1,'Фамилия И.О.':1,'Статус':1,'Начало':1,'Окончание':1,'План':1,'Факт':1,'Подтверждающий документ':1};S.visCols={};S.headers.forEach(function(h){S.visCols[h]=!!prio[h];});S.filters={};S.search='';S.groupBy='';S.sortCol='';S.sortDir=1;S.assignments={};$('fileInfo').textContent=file.name+' — '+S.tasks.length+' записей';initApp();toast('Загружено: '+S.tasks.length);}catch(err){toast('Ошибка: '+err.message);}};r.readAsArrayBuffer(file);}

function handleExecFile(file){if(!file)return;var r=new FileReader();r.onload=function(e){try{var text=e.target.result;var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});if(lines.length<2){toast('Пусто');return;}var delim=lines[0].indexOf(';')>-1?';':lines[0].indexOf('\t')>-1?'\t':',';var hdrs=lines[0].split(delim).map(function(h){return h.trim();});S.executors=[];for(var i=1;i<lines.length;i++){var vals=lines[i].split(delim).map(function(v){return v.trim();});var obj={};hdrs.forEach(function(h,j){obj[h]=vals[j]||'';});if(obj['ФИО'])S.executors.push(obj);}$('execCount').textContent='('+S.executors.length+')';if(S.tasks.length>0){buildFilters();render();}toast('Исполнителей: '+S.executors.length);}catch(err){toast('Ошибка: '+err.message);}};r.readAsText(file,'utf-8');}

function initApp(){$('emptyState').classList.add('hidden');$('mainApp').classList.remove('hidden');buildGrp();buildFilters();buildColPanel();renderSaved();render();}
function renderStats(){var t=S.tasks.length,c={};S.tasks.forEach(function(r){var s=String(r['Статус']||'').trim();if(s)c[s]=(c[s]||0)+1;});var items=[{l:'Всего',v:t,c:'c0',i:'fa-list-check'},{l:'Сорвана',v:c['Сорвана']||0,c:'c1',i:'fa-circle-xmark'},{l:'Уточнена',v:c['Уточнена']||0,c:'c2',i:'fa-pen'},{l:'Перенесена',v:c['Перенесена']||0,c:'c3',i:'fa-arrow-right'},{l:'Выполняется',v:c['Выполняется']||0,c:'c4',i:'fa-spinner'},{l:'Назначено',v:Object.keys(S.assignments).length,c:'c5',i:'fa-user-check'}];$('statsBar').innerHTML=items.map(function(x){return '<div class="sc '+x.c+'"><div class="flex items-center justify-between"><span class="text-[10px] text-[var(--mt)] uppercase tracking-wide font-semibold">'+x.l+'</span><i class="fa-solid '+x.i+' text-[10px] text-[var(--mt)] opacity-40"></i></div><div class="text-xl font-bold mono mt-1">'+x.v+'</div></div>';}).join('');}
function uniq(c){var s={};S.tasks.forEach(function(t){var v=String(t[c]||'').trim();if(v)s[v]=1;});return Object.keys(s).sort(function(a,b){return a.localeCompare(b,'ru');});}
function safeId(s){return s.replace(/[^a-zA-Zа-яА-Я0-9]/g,'_');}
function buildFilters(){var p=$('fPanel'),fC=S.headers.filter(function(h){return uniq(h).length>1&&uniq(h).length<80;});p.innerHTML=fC.map(function(c){var v=uniq(c),a=S.filters[c]||{},n=0;for(var k in a)if(a[k])n++;var h=n>0,l=c.length>16?c.slice(0,14)+'…':c;return '<div class="relative"><button class="fb '+(h?'on':'')+'" onclick="toggleDD(this,\'f_'+safeId(c)+'\')">'+esc(l)+(h?' ('+n+')':'')+' <i class="fa-solid fa-chevron-down text-[8px]"></i></button><div class="fd" id="f_'+safeId(c)+'"><div style="padding:3px 7px 5px;border-bottom:1px solid var(--bd);margin-bottom:4px"><button class="text-[10px] text-[var(--mt)] font-semibold" style="background:none;border:none;cursor:pointer" onclick="filterAll(\''+escA(c)+'\',true)">Все</button><span class="text-[10px] text-[var(--bd)] mx-1">|</span><button class="text-[10px] text-[var(--mt)] font-semibold" style="background:none;border:none;cursor:pointer" onclick="filterAll(\''+escA(c)+'\',false)">Сброс</button></div>'+v.map(function(x){return '<label class="fi"><input type="checkbox" '+(a[x]?'checked':'')+' onchange="toggleF(\''+escA(c)+'\',\''+escA(x)+'\',this.checked)">'+esc(x)+'</label>';}).join('')+'</div></div>';}).join('')+'<input type="search" placeholder="Поиск..." class="flex-1 min-w-[150px]" value="'+esc(S.search)+'" oninput="S.search=this.value;render()">';}
function toggleF(c,v,on){if(!S.filters[c])S.filters[c]={};if(on)S.filters[c][v]=1;else delete S.filters[c][v];if(!Object.keys(S.filters[c]).length)delete S.filters[c];buildFilters();render();}
function filterAll(c,a){if(a)delete S.filters[c];else S.filters[c]={};buildFilters();render();}
function buildGrp(){$('grpBy').innerHTML='<option value="">Нет</option>'+S.headers.map(function(h){return '<option value="'+esc(h)+'" '+(S.groupBy===h?'selected':'')+'>'+esc(h)+'</option>';}).join('');}
function buildColPanel(){if(!$('colPanel'))return;$('colPanel').innerHTML='<div class="flex justify-between mb-2"><span class="text-xs font-bold">Столбцы</span><div class="flex gap-1"><button class="text-[10px] font-bold text-[var(--mt)]" style="background:none;border:none;cursor:pointer" onclick="setAllVis(true)">Все</button><span class="text-[10px] text-[var(--bd)]">|</span><button class="text-[10px] font-bold text-[var(--mt)]" style="background:none;border:none;cursor:pointer" onclick="setAllVis(false)">Нет</button></div></div>'+S.headers.map(function(h){return '<label class="fi"><input type="checkbox" '+(S.visCols[h]?'checked':'')+' onchange="S.visCols[\''+escA(h)+'\']=this.checked;render()"> '+esc(h)+'</label>';}).join('');}
function setAllVis(v){S.headers.forEach(function(h){S.visCols[h]=v;});buildColPanel();render();}
function getFiltered(oA){var d=S.tasks.map(function(t,i){var r={};for(var k in t)r[k]=t[k];r._i=i;return r;});for(var c in S.filters){var k=Object.keys(S.filters[c]);if(!k.length)continue;d=d.filter(function(t){return k.indexOf(String(t[c]||'').trim())>-1;});}if(S.search.trim()){var q=S.search.toLowerCase();d=d.filter(function(t){return S.headers.some(function(h){return String(t[h]||'').toLowerCase().indexOf(q)>-1;});});}if(oA)d=d.filter(function(t){return S.assignments[t._i];});return d;}
function doSort(c){if(S.sortCol===c)S.sortDir*=-1;else{S.sortCol=c;S.sortDir=1;}render();}

function render(){renderStats();var data=getFiltered(),vH=S.headers.filter(function(h){return S.visCols[h];}),hA=S.executors.length>0,grp=S.groupBy;if(S.sortCol){data.sort(function(a,b){var va=String(a[S.sortCol]||''),vb=String(b[S.sortCol]||''),da=parseDate(va),db=parseDate(vb);if(da&&db)return(da-db)*S.sortDir;var na=parseFloat(va.replace(/,/g,'.')),nb=parseFloat(vb.replace(/,/g,'.'));if(!isNaN(na)&&!isNaN(nb))return(na-nb)*S.sortDir;return va.localeCompare(vb,'ru')*S.sortDir;});}var ncol=vH.length+(hA?1:0),cg='';if(hA)cg+='<col style="width:32px">';vH.forEach(function(h){cg+='<col style="width:'+(S.colWidths[h]||'auto')+'">';});$('tCols').innerHTML=cg;var th='<tr>';if(hA)th+='<th style="width:32px;cursor:default"><i class="fa-solid fa-user-check text-[8px]"></i></th>';vH.forEach(function(h){var s=S.sortCol===h,ico=s?(S.sortDir===1?'fa-arrow-up':'fa-arrow-down'):'fa-sort';th+='<th class="'+(s?'sorted':'')+'" onclick="doSort(\''+escA(h)+'\')">'+esc(h)+' <i class="fa-solid '+ico+'" style="font-size:8px;opacity:'+(s?1:.25)+'"></i><div class="rh" onmousedown="startResize(event,\''+escA(h)+'\')"></div></th>';});th+='</tr>';$('tHead').innerHTML=th;var tb='';if(!data.length){tb='<tr><td colspan="'+ncol+'" style="text-align:center;padding:40px;color:var(--mt)"><i class="fa-solid fa-filter-circle-xmark text-2xl mb-2 block opacity-30"></i>Нет данных</td></tr>';}else if(grp){var g={};data.forEach(function(t){var k=String(t[grp]||'').trim()||'(пусто)';if(!g[k])g[k]=[];g[k].push(t);});Object.keys(g).sort(function(a,b){return a.localeCompare(b,'ru');}).forEach(function(gn){tb+='<tr class="gh"><td colspan="'+ncol+'"><i class="fa-solid fa-layer-group mr-2 text-[10px]"></i>'+esc(gn)+' <span class="text-xs text-[var(--mt)] font-normal ml-2">('+g[gn].length+')</span></td></tr>';g[gn].forEach(function(t){tb+=mkRow(t,vH,hA);});});}else{data.forEach(function(t){tb+=mkRow(t,vH,hA);});}$('tBody').innerHTML=tb;$('rowCnt').textContent=data.length+' из '+S.tasks.length;syncScroll();}

function mkRow(t,vH,hA){var h='<tr class="'+rowCls(t['Статус'])+'" ondblclick="toggleWrap(event)">';if(hA){var a=S.assignments[t._i];h+='<td><button class="ab '+(a?'on':'')+'" onclick="event.stopPropagation();openAsgn('+t._i+')" title="'+(a?esc(a):'Назначить')+'"><i class="fa-solid '+(a?'fa-user-check':'fa-user-plus')+'"></i></button></td>';}vH.forEach(function(c){var v=String(t[c]||'');if(c==='Статус'&&v)v='<span class="b '+badgeCls(v)+'">'+esc(v)+'</span>';else if((c==='План'||c==='Факт')&&v){var n=parseFloat(v.replace(/,/g,'.'));if(!isNaN(n)&&n>0){var b='';if(c==='Факт'){var p=parseFloat(String(t['План']||'0').replace(/,/g,'.'));if(p>0){var pc=Math.min(100,n/p*100);b='<div class="pb"><div class="pf" style="width:'+pc+'%;background:'+(pc>=95?'var(--sc)':pc>=50?'var(--wn)':'var(--dn)')+'"></div></div>';}}v='<span class="mono text-xs">'+esc(v)+'</span>'+b;}}else if((c==='Начало'||c==='Окончание')&&v){var d=excelToDate(t[c]);v='<span class="mono text-xs">'+esc(d?fmtD(d):v)+'</span>';}else if(c==='Контр. Срок')v='<span class="mono text-xs">'+esc(v)+'</span>';else v=esc(v);h+='<td>'+v+'</td>';});return h+'</tr>';}
function toggleWrap(e){var td=e.target.closest('td');if(td)td.classList.toggle('wrap');}

var _rC=null,_rX=0,_rW=0;
function startResize(e,c){e.preventDefault();e.stopPropagation();_rC=c;_rX=e.clientX;_rW=e.target.parentElement.offsetWidth;e.target.classList.add('act');document.addEventListener('mousemove',doR);document.addEventListener('mouseup',stopR);}
function doR(e){if(!_rC)return;var w=Math.max(20,_rW+(e.clientX-_rX));S.colWidths[_rC]=w;var cols=$('tCols').children,vH=S.headers.filter(function(h){return S.visCols[h];}),o=S.executors.length>0?1:0;for(var i=0;i<vH.length;i++){if(vH[i]===_rC){cols[i+o].style.width=w+'px';break;}}}
function stopR(){closeDDs();document.querySelectorAll('.rh').forEach(function(e){e.classList.remove('act');});_rC=null;document.removeEventListener('mousemove',doR);document.removeEventListener('mouseup',stopR);syncScroll();}
function openAsgn(i){S.asgnIdx=i;var t=S.tasks[i];$('asgnInfo').innerHTML='<div class="font-medium text-[var(--fg)] mb-1">'+esc(String(t['Задача исполнителя']||t['Основание']||'').slice(0,150))+'</div><div>Тема: <span class="mono text-[var(--ac)]">'+esc(t['Тема']||'')+'</span> · Сектор: <span class="mono text-[var(--ac)]">'+esc(t['Сектор (группа)']||'')+'</span></div>';var s=[],ss={};S.executors.forEach(function(e){if(e['Сектор']&&!ss[e['Сектор']]){ss[e['Сектор']]=1;s.push(e['Сектор']);}});s.sort();$('asgnSek').innerHTML='<option value="">Все</option>'+s.map(function(x){return '<option value="'+esc(x)+'" '+(x===String(t['Сектор (группа)']||'').trim()?'selected':'')+'>'+esc(x)+'</option>';}).join('');$('asgnQ').value='';renderExecList();openModal('asgnModal');}
function renderExecList(){var q=$('asgnQ').value.toLowerCase(),sf=$('asgnSek').value,l=S.executors.filter(function(e){if(q&&e['ФИО'].toLowerCase().indexOf(q)<0&&(e['Должность']||'').toLowerCase().indexOf(q)<0)return false;if(sf&&e['Сектор']!==sf)return false;return true;});var c=S.assignments[S.asgnIdx],h='';if(c)h+='<div class="ei" onclick="rmAsgn()" style="border-bottom:1px solid var(--bd);margin-bottom:4px;padding-bottom:8px"><i class="fa-solid fa-user-xmark text-[var(--dn)]"></i><span class="text-xs font-semibold text-[var(--dn)]">Снять: '+esc(c)+'</span></div>';if(!l.length)h+='<div class="text-xs text-[var(--mt)] text-center py-4 font-semibold">'+(S.executors.length?'Не найдено':'Не загружены')+'</div>';else h+=l.map(function(e){var ic=e['ФИО']===c;return '<div class="ei" onclick="doAsgn(\''+escA(e['ФИО'])+'\')" style="'+(ic?'background:var(--acg);border:1px solid var(--acd);border-radius:6px':'')+'"><div class="flex-1 min-w-0 truncate"><div class="text-xs font-semibold truncate">'+esc(e['ФИО'])+'</div><div class="esek">Сектор '+esc(e['Сектор']||'?')+'</div><div class="text-[10px] text-[var(--mt)] truncate">'+esc(e['Должность']||'')+'</div>'+(e['Телефон']?'<div class="text-[10px] text-[var(--mt)]"><i class="fa-solid fa-phone text-[8px] mr-1"></i>'+esc(e['Телефон'])+'</div>':'')+(e['Почта']?'<div class="text-[10px] text-[var(--mt)] truncate"><i class="fa-solid fa-envelope text-[8px] mr-1"></i>'+esc(e['Почта'])+'</div>':'')+'</div>'+(ic?'<i class="fa-solid fa-check text-[var(--ac)]"></i>':'')+'</div>';}).join('');$('asgnList').innerHTML=h;}
function doAsgn(f){S.assignments[S.asgnIdx]=f;closeModal('asgnModal');render();toast('Назначен: '+f);}function rmAsgn(){delete S.assignments[S.asgnIdx];closeModal('asgnModal');render();toast('Снято');}

function openIssueList(){var dd=$('issueDD'),c={};for(var k in S.assignments){c[S.assignments[k]]=(c[S.assignments[k]]||0)+1;}var ks=Object.keys(c);if(!ks.length){dd.innerHTML='<div class="p-3 text-xs text-[var(--mt)] font-semibold">Нет назначенных</div>';toggleDD(dd.previousElementSibling,'issueDD');return;}dd.innerHTML=ks.sort(function(a,b){return a.localeCompare(b,'ru');}).map(function(f){var e=S.executors.find(function(x){return x['ФИО']===f;});return '<div class="ei" onclick="closeDDs();genIssue(\''+escA(f)+'\')"><div class="flex-1"><div class="text-xs font-semibold">'+esc(f)+'</div><div class="esek">Сектор '+(e?esc(e['Сектор']):'?')+' · '+c[f]+' задач</div></div></div>';}).join('');toggleDD(dd.previousElementSibling,'issueDD');}
function genIssue(f){var ex=S.executors.find(function(e){return e['ФИО']===f;});var ts=S.tasks.map(function(t,i){var r={};for(var k in t)r[k]=t[k];r._i=i;return r;}).filter(function(t){return S.assignments[t._i]===f;});S.issueData={fio:f,exec:ex,tasks:ts};var inf='<strong>'+esc(f)+'</strong>'+(ex?'<br>Сектор: <span class="mono text-[var(--ac)]">'+esc(ex['Сектор']||'')+'</span><br>'+esc(ex['Должность']||''):'');inf+='<br>Задач: <strong>'+ts.length+'</strong>';$('issueExecInfo').innerHTML=inf;$('issueTitle').textContent='Выдача: '+f;$('issueArea').value=genText(ts,true,true,f);openModal('issueModal');}
function exportIssueXLSX(){if(!S.issueData)return;var ws=XLSX.utils.json_to_sheet(S.issueData.tasks);var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Выдача");XLSX.writeFile(wb,'Выдача_'+S.issueData.fio.replace(/\s+/g,'_')+'.xlsx');}
function exportIssueMD(){if(!S.issueData)return;dlFile('Выдача.md',$('issueArea').value);}
function exportIssueObs(){if(!S.issueData)return;dlFile('Выдача_Tasks.md',genText(S.issueData.tasks,false,true,S.issueData.fio));}

function genText(d,isMD,isG,k){var vH=S.headers.filter(function(h){return S.visCols[h];});var o='';if(isMD){o+='# Выдача: '+(k||'Выборка')+'\n\n**Дата:** '+new Date().toLocaleDateString('ru-RU')+'\n**Записей:** '+d.length+'\n\n| '+vH.join(' | ')+' |\n|'+vH.map(function(){return '---';}).join('|')+'|\n';d.forEach(function(t){o+='| '+vH.map(function(h){return String(t[h]||'').replace(/\|/g,' ').replace(/\n/g,' ');}).join(' | ')+' |\n';});}else{o+='---\ntags: [выдача]\ndate: '+new Date().toISOString().slice(0,10)+'\n---\n\n# Задачи: '+(k||'Выборка')+'\n\n';if(isG){var g={};d.forEach(function(t){var x=String(t['Тема']||t['Основание']||'Без темы').slice(0,80);if(!g[x])g[x]=[];g[x].push(t);});for(var gn in g){o+='## '+gn+'\n';g[gn].forEach(function(t){var tk=String(t['Задача исполнителя']||t['Основание']||'').replace(/\n/g,' ');o+='- [ ] '+tk+(t['Тема']?' [Тема: '+t['Тема']+']':'')+(toYMD(t['Контр. Срок'])?' 📅 '+toYMD(t['Контр. Срок']):'')+'\n';});o+='\n';}}else d.forEach(function(t){o+='- [ ] '+String(t['Задача исполнителя']||t['Основание']||'').replace(/\n/g,' ')+(toYMD(t['Контр. Срок'])?' 📅 '+toYMD(t['Контр. Срок']):'')+'\n';});}return o;}

function openExportModal(){genExpTxt();openModal('expModal');}
function genExpTxt(){var oA=$('expAsgn').checked,g=$('expGrp').checked,d=getFiltered(oA);$('expArea').value=genText(d,true,g,oA?'Назначенные':'Выборка');}
function doExpXLSX(){var d=getFiltered($('expAsgn').checked),vH=S.headers.filter(function(h){return S.visCols[h];});var ex=d.map(function(t){var r={};vH.forEach(function(h){r[h]=t[h];});if(S.executors.length)r['Назначен']=S.assignments[t._i]||'';return r;});var ws=XLSX.utils.json_to_sheet(ex);var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Выборка");XLSX.writeFile(wb,'Выборка.xlsx');}
function doExpMD(){dlFile('Выборка.md',$('expArea').value);}
function doExpObs(){var oA=$('expAsgn').checked,g=$('expGrp').checked;dlFile('Выборка_Tasks.md',genText(getFiltered(oA),false,g,oA?'Назначенные':'Выборка'));}

function openSaveModal(){$('saveName').value='';openModal('saveModal');}
function doSave(){var n=$('saveName').value.trim();if(!n){toast('Введите название');return;}var st={name:n,filters:S.filters,search:S.search,groupBy:S.groupBy,sortCol:S.sortCol,sortDir:S.sortDir,visCols:{},assignments:{},colWidths:{}};S.headers.forEach(function(h){if(S.visCols[h])st.visCols[h]=1;});for(var k in S.assignments)st.assignments[k]=S.assignments[k];for(var k in S.colWidths)st.colWidths[k]=S.colWidths[k];var idx=-1;for(var i=0;i<S.saved.length;i++){if(S.saved[i].name===n){idx=i;break;}}if(idx>-1)S.saved[idx]=st;else S.saved.push(st);safeLS('pm_sv',S.saved);closeModal('saveModal');renderSaved();toast('Сохранено: '+n);}
function loadSaved(i){var sv=S.saved[i];if(!sv)return;S.filters=sv.filters||{};S.search=sv.search||'';S.groupBy=sv.groupBy||'';S.sortCol=sv.sortCol||'';S.sortDir=sv.sortDir||1;S.headers.forEach(function(h){S.visCols[h]=!!sv.visCols[h];});S.assignments=sv.assignments||{};S.colWidths=sv.colWidths||{};buildGrp();buildFilters();buildColPanel();render();toast('Загружено: '+sv.name);}
function rmSaved(i){S.saved.splice(i,1);safeLS('pm_sv',S.saved);renderSaved();toast('Удалено');}
function renderSaved(){if(!S.saved.length){$('savedBar').classList.add('hidden');return;}$('savedBar').classList.remove('hidden');$('savedTags').innerHTML=S.saved.map(function(s,i){return '<span class="stg" onclick="loadSaved('+i+')">'+esc(s.name)+' <span class="x" onclick="event.stopPropagation();rmSaved('+i+')"><i class="fa-solid fa-xmark"></i></span></span>';}).join('');}
function resetAll(){S.filters={};S.search='';S.groupBy='';S.sortCol='';S.sortDir=1;S.assignments={};S.colWidths={};S.headers.forEach(function(h){S.visCols[h]=true;});buildGrp();buildFilters();buildColPanel();render();toast('Сброшено');}
S.saved=safeLS('pm_sv')||[];
document.addEventListener('keydown',function(e){if(e.key==='Escape')document.querySelectorAll('.mo.show').forEach(function(m){closeModal(m.id);});});
document.addEventListener('click',function(e){if(!e.target.closest('.fd')&&!e.target.closest('.cp')&&!e.target.closest('.fb'))closeDDs();});
document.querySelectorAll('.mo').forEach(function(m){m.addEventListener('click',function(e){if(e.target===m)closeModal(m.id);});});

function dlFile(n,t,m){var b=new Blob([t],{type:(m||'text/plain;charset=utf-8')});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();URL.revokeObjectURL(a.href);}
function exportConfig(){var cfg={assignments:S.assignments,visCols:S.visCols,colWidths:S.colWidths,filters:S.filters,search:S.search,groupBy:S.groupBy,sortCol:S.sortCol,sortDir:S.sortDir};dlFile('config_akid.json',JSON.stringify(cfg,null,2),'application/json');toast('Конфиг сохранен в файл');}
function importConfig(file){if(!file)return;var r=new FileReader();r.onload=function(e){try{var cfg=JSON.parse(e.target.result);if(cfg.assignments)S.assignments=cfg.assignments;if(cfg.visCols)S.visCols=cfg.visCols;if(cfg.colWidths)S.colWidths=cfg.colWidths;if(cfg.filters)S.filters=cfg.filters;if(cfg.search!==undefined)S.search=cfg.search;if(cfg.groupBy!==undefined)S.groupBy=cfg.groupBy;if(cfg.sortCol!==undefined)S.sortCol=cfg.sortCol;if(cfg.sortDir!==undefined)S.sortDir=cfg.sortDir;buildGrp();buildFilters();buildColPanel();render();toast('Конфиг загружен');}catch(err){toast('Ошибка файла: '+err.message);}};r.readAsText(file,'utf-8');}

function syncScroll(){
  var w=$('tWrap'),t=$('scrollSyncTop');
  if(!w||!t)return;
  if(!t.firstChild){var d=document.createElement('div');d.style.height='1px';t.appendChild(d);}
  t.firstChild.style.width=w.scrollWidth+'px';
  w.onscroll=function(){t.scrollLeft=w.scrollLeft;};
  t.onscroll=function(){w.scrollLeft=t.scrollLeft;};
}
var _tblObs = new MutationObserver(function(){ syncScroll(); });
if($('tBody')) _tblObs.observe($('tBody'), {childList: true});
setTimeout(syncScroll, 100);

(function setupDesktopRecentFiles(){
  if(!window.aimetonDesktop)return;

  var originalTasks=handleTasksFile;
  var originalExec=handleExecFile;

  handleTasksFile=function(file){
    if(file)window.aimetonDesktop.rememberFile('tasks',file);
    return originalTasks(file);
  };
  handleExecFile=function(file){
    if(file)window.aimetonDesktop.rememberFile('employees',file);
    return originalExec(file);
  };

  function fileFromStartup(info,type){
    if(!info||!info.base64)return null;
    try{
      var raw=atob(info.base64),bytes=new Uint8Array(raw.length);
      for(var i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
      return new File([bytes],info.name,{type:type||'application/octet-stream'});
    }catch(_){return null;}
  }

  window.aimetonDesktop.getStartupFiles().then(function(files){
    if(!files)return;
    var emp=fileFromStartup(files.employees,'text/csv');
    var tasks=fileFromStartup(files.tasks,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    if(emp)originalExec(emp);
    if(tasks)originalTasks(tasks);
  }).catch(function(){});
})();
