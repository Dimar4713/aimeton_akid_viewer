var S={tasks:[],executors:[],headers:[],visCols:{},filters:{},search:'',groupBy:'',sortCol:'',sortDir:1,assignments:{},saved:[],asgnIdx:null,issueData:null,colWidths:{}};
var $=function(id){return document.getElementById(id);};
var esc=function(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):'';};
var escA=function(s){return s?String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'"):'';};
function toast(m){var t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('show');},2500);}
function openModal(id){$(id).classList.add('show');}
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

function mdInline(s){return esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');}
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
async function openHelp(){
  var body=$('helpContent');
  if(!body.dataset.loaded){
    body.innerHTML='<div class="help-loading">Загрузка руководства...</div>';
    try{
      var md=null;
      if(window.aimetonDesktop&&window.aimetonDesktop.getUserGuide)md=await window.aimetonDesktop.getUserGuide();
      if(!md){
        var r=await fetch('docs/USER_GUIDE_RU.md');
        if(r.ok)md=await r.text();
      }
      if(!md)throw new Error('Руководство недоступно');
      body.innerHTML=renderGuideMarkdown(md);body.dataset.loaded='1';
    }catch(e){body.innerHTML='<div class="help-error">Не удалось открыть встроенное руководство.<br><small>'+esc(e.message||e)+'</small></div>';}
  }
  openModal('helpModal');
}

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
function toggleTheme(){var h=document.documentElement;var n=h.getAttribute('data-theme')==='dark'?'light':'dark';h.setAttribute('data-theme',n);safeLS('pm_theme',n);updThemeBtn(n);}
function updThemeBtn(t){$('themeBtn').innerHTML=t==='dark'?'<i class="fa-solid fa-sun"></i>':'<i class="fa-solid fa-moon"></i>';}
(function(){var t=safeLS('pm_theme');if(t){document.documentElement.setAttribute('data-theme',t);updThemeBtn(t);}})();

function syncScroll(){var w=$('tWrap'),t=$('scrollSyncTop');if(!w||!t)return;if(!t.firstChild){var d=document.createElement('div');d.style.height='1px';t.appendChild(d);}t.firstChild.style.width=w.scrollWidth+'px';w.onscroll=function(){t.scrollLeft=w.scrollLeft;};t.onscroll=function(){w.scrollLeft=t.scrollLeft;};}
