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
