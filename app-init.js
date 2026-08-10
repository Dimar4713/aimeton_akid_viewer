S.saved=safeLS('pm_sv')||[];
document.addEventListener('keydown',function(e){if(e.key==='Escape')document.querySelectorAll('.mo.show').forEach(function(m){closeModal(m.id);});});
document.addEventListener('click',function(e){if(!e.target.closest('.fd')&&!e.target.closest('.cp')&&!e.target.closest('.fb'))closeDDs();});
document.querySelectorAll('.mo').forEach(function(m){m.addEventListener('click',function(e){if(e.target===m)closeModal(m.id);});});

(function setupMultiAssignmentUi(){
  var title=document.querySelector('#asgnModal .mh h2');
  if(title)title.textContent='Назначить исполнителей';
  var style=document.createElement('style');
  style.textContent='.selected-assignees{padding:8px 10px 10px;margin-bottom:6px;border-bottom:1px solid var(--bd)}.asgn-chip{display:inline-flex;align-items:center;gap:5px;margin:3px 5px 3px 0;padding:4px 8px;border-radius:999px;border:1px solid var(--acd);background:var(--acg);color:var(--fg);font-size:10px;font-weight:700;cursor:pointer}.asgn-chip:hover{border-color:var(--dn);color:var(--dn)}.ab{position:relative}.asgn-count{position:absolute;right:-5px;top:-6px;min-width:15px;height:15px;padding:0 3px;border-radius:8px;background:var(--ac);color:#07110e;font-size:9px;font-weight:900;line-height:15px;text-align:center;border:1px solid var(--sf)}';
  document.head.appendChild(style);
})();

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
