function assigneesFor(i){
  var v=S.assignments[i];
  if(Array.isArray(v))return v.filter(Boolean);
  if(v===undefined||v===null||v==='')return [];
  return [String(v)];
}
function setAssignees(i,list){
  var clean=[],seen={};
  (list||[]).forEach(function(x){x=String(x||'').trim();if(x&&!seen[x]){seen[x]=1;clean.push(x);}});
  if(clean.length)S.assignments[i]=clean;else delete S.assignments[i];
}
function hasAssignee(i,f){return assigneesFor(i).indexOf(f)>-1;}
function assigneesLabel(i){var a=assigneesFor(i);return a.length?a.join(', '):'';}

function renderStats(){
  var t=S.tasks.length,c={};
  S.tasks.forEach(function(r){var s=String(r['Статус']||'').trim();if(s)c[s]=(c[s]||0)+1;});
  var assignedTasks=0,links=0;
  for(var i=0;i<S.tasks.length;i++){var a=assigneesFor(i);if(a.length)assignedTasks++;links+=a.length;}
  var items=[
    {l:'Всего',v:t,c:'c0',i:'fa-list-check'},
    {l:'Сорвана',v:c['Сорвана']||0,c:'c1',i:'fa-circle-xmark'},
    {l:'Уточнена',v:c['Уточнена']||0,c:'c2',i:'fa-pen'},
    {l:'Перенесена',v:c['Перенесена']||0,c:'c3',i:'fa-arrow-right'},
    {l:'Выполняется',v:c['Выполняется']||0,c:'c4',i:'fa-spinner'},
    {l:'Назначено',v:assignedTasks,c:'c5',i:'fa-user-check',tip:links+' назначений'}
  ];
  $('statsBar').innerHTML=items.map(function(x){return '<div class="sc '+x.c+'" title="'+esc(x.tip||'')+'"><div class="flex items-center justify-between"><span class="text-[10px] text-[var(--mt)] uppercase tracking-wide font-semibold">'+x.l+'</span><i class="fa-solid '+x.i+' text-[10px] text-[var(--mt)] opacity-40"></i></div><div class="text-xl font-bold mono mt-1">'+x.v+'</div></div>';}).join('');
}

function buildGrp(){
  $('grpBy').innerHTML='<option value="">Нет</option><option value="__assigned__" '+(S.groupBy==='__assigned__'?'selected':'')+'>Назначенные исполнители</option>'+S.headers.map(function(h){return '<option value="'+esc(h)+'" '+(S.groupBy===h?'selected':'')+'>'+esc(h)+'</option>';}).join('');
}

function getFiltered(oA){
  var d=S.tasks.map(function(t,i){var r={};for(var k in t)r[k]=t[k];r._i=i;return r;});
  for(var c in S.filters){var k=Object.keys(S.filters[c]);if(!k.length)continue;d=d.filter(function(t){return k.indexOf(String(t[c]||'').trim())>-1;});}
  if(S.search.trim()){var q=S.search.toLowerCase();d=d.filter(function(t){
    if(assigneesLabel(t._i).toLowerCase().indexOf(q)>-1)return true;
    return S.headers.some(function(h){return String(t[h]||'').toLowerCase().indexOf(q)>-1;});
  });}
  if(oA)d=d.filter(function(t){return assigneesFor(t._i).length>0;});
  return d;
}

function render(){
  renderStats();
  var data=getFiltered(),vH=S.headers.filter(function(h){return S.visCols[h];}),hA=S.executors.length>0,grp=S.groupBy;
  if(S.sortCol){data.sort(function(a,b){var va=String(a[S.sortCol]||''),vb=String(b[S.sortCol]||''),da=parseDate(va),db=parseDate(vb);if(da&&db)return(da-db)*S.sortDir;var na=parseFloat(va.replace(/,/g,'.')),nb=parseFloat(vb.replace(/,/g,'.'));if(!isNaN(na)&&!isNaN(nb))return(na-nb)*S.sortDir;return va.localeCompare(vb,'ru')*S.sortDir;});}
  var ncol=vH.length+(hA?1:0),cg='';if(hA)cg+='<col style="width:32px">';vH.forEach(function(h){cg+='<col style="width:'+(S.colWidths[h]||'auto')+'">';});$('tCols').innerHTML=cg;
  var th='<tr>';if(hA)th+='<th style="width:32px;cursor:default"><i class="fa-solid fa-user-check text-[8px]"></i></th>';vH.forEach(function(h){var s=S.sortCol===h,ico=s?(S.sortDir===1?'fa-arrow-up':'fa-arrow-down'):'fa-sort';th+='<th class="'+(s?'sorted':'')+'" onclick="doSort(\''+escA(h)+'\')">'+esc(h)+' <i class="fa-solid '+ico+'" style="font-size:8px;opacity:'+(s?1:.25)+'"></i><div class="rh" onmousedown="startResize(event,\''+escA(h)+'\')"></div></th>';});th+='</tr>';$('tHead').innerHTML=th;
  var tb='';
  if(!data.length){tb='<tr><td colspan="'+ncol+'" style="text-align:center;padding:40px;color:var(--mt)"><i class="fa-solid fa-filter-circle-xmark text-2xl mb-2 block opacity-30"></i>Нет данных</td></tr>';}
  else if(grp==='__assigned__'){
    var ag={};
    data.forEach(function(t){var aa=assigneesFor(t._i);if(!aa.length)aa=['Без исполнителя'];aa.forEach(function(name){if(!ag[name])ag[name]=[];ag[name].push(t);});});
    Object.keys(ag).sort(function(a,b){if(a==='Без исполнителя')return 1;if(b==='Без исполнителя')return -1;return a.localeCompare(b,'ru');}).forEach(function(gn){tb+='<tr class="gh"><td colspan="'+ncol+'"><i class="fa-solid fa-user-group mr-2 text-[10px]"></i>'+esc(gn)+' <span class="text-xs text-[var(--mt)] font-normal ml-2">('+ag[gn].length+')</span></td></tr>';ag[gn].forEach(function(t){tb+=mkRow(t,vH,hA);});});
  }else if(grp){
    var g={};data.forEach(function(t){var k=String(t[grp]||'').trim()||'(пусто)';if(!g[k])g[k]=[];g[k].push(t);});Object.keys(g).sort(function(a,b){return a.localeCompare(b,'ru');}).forEach(function(gn){tb+='<tr class="gh"><td colspan="'+ncol+'"><i class="fa-solid fa-layer-group mr-2 text-[10px]"></i>'+esc(gn)+' <span class="text-xs text-[var(--mt)] font-normal ml-2">('+g[gn].length+')</span></td></tr>';g[gn].forEach(function(t){tb+=mkRow(t,vH,hA);});});
  }else data.forEach(function(t){tb+=mkRow(t,vH,hA);});
  $('tBody').innerHTML=tb;$('rowCnt').textContent=data.length+' из '+S.tasks.length;syncScroll();
}

function mkRow(t,vH,hA){
  var h='<tr class="'+rowCls(t['Статус'])+'" ondblclick="toggleWrap(event)">';
  if(hA){var a=assigneesFor(t._i),label=a.join(', ');h+='<td><button class="ab '+(a.length?'on':'')+'" onclick="event.stopPropagation();openAsgn('+t._i+')" title="'+(a.length?esc(label):'Назначить')+'"><i class="fa-solid '+(a.length>1?'fa-users':a.length?'fa-user-check':'fa-user-plus')+'"></i>'+(a.length>1?'<span class="asgn-count">'+a.length+'</span>':'')+'</button></td>';}
  vH.forEach(function(c){var v=String(t[c]||'');if(c==='Статус'&&v)v='<span class="b '+badgeCls(v)+'">'+esc(v)+'</span>';else if((c==='План'||c==='Факт')&&v){var n=parseFloat(v.replace(/,/g,'.'));if(!isNaN(n)&&n>0){var b='';if(c==='Факт'){var p=parseFloat(String(t['План']||'0').replace(/,/g,'.'));if(p>0){var pc=Math.min(100,n/p*100);b='<div class="pb"><div class="pf" style="width:'+pc+'%;background:'+(pc>=95?'var(--sc)':pc>=50?'var(--wn)':'var(--dn)')+'"></div></div>';}}v='<span class="mono text-xs">'+esc(v)+'</span>'+b;}}else if((c==='Начало'||c==='Окончание')&&v){var d=excelToDate(t[c]);v='<span class="mono text-xs">'+esc(d?fmtD(d):v)+'</span>';}else if(c==='Контр. Срок')v='<span class="mono text-xs">'+esc(v)+'</span>';else v=esc(v);h+='<td>'+v+'</td>';});return h+'</tr>';
}

function openAsgn(i){
  S.asgnIdx=i;var t=S.tasks[i];
  $('asgnInfo').innerHTML='<div class="font-medium text-[var(--fg)] mb-1">'+esc(String(t['Задача исполнителя']||t['Основание']||'').slice(0,150))+'</div><div>Тема: <span class="mono text-[var(--ac)]">'+esc(t['Тема']||'')+'</span> · Сектор: <span class="mono text-[var(--ac)]">'+esc(t['Сектор (группа)']||'')+'</span></div><div class="mt-2">Назначено: <strong>'+assigneesFor(i).length+'</strong></div>';
  var s=[],ss={};S.executors.forEach(function(e){if(e['Сектор']&&!ss[e['Сектор']]){ss[e['Сектор']]=1;s.push(e['Сектор']);}});s.sort();
  $('asgnSek').innerHTML='<option value="">Все</option>'+s.map(function(x){return '<option value="'+esc(x)+'" '+(x===String(t['Сектор (группа)']||'').trim()?'selected':'')+'>'+esc(x)+'</option>';}).join('');$('asgnQ').value='';renderExecList();openModal('asgnModal');
}

function renderExecList(){
  var q=$('asgnQ').value.toLowerCase(),sf=$('asgnSek').value,selected=assigneesFor(S.asgnIdx);
  var l=S.executors.filter(function(e){if(q&&e['ФИО'].toLowerCase().indexOf(q)<0&&(e['Должность']||'').toLowerCase().indexOf(q)<0)return false;if(sf&&e['Сектор']!==sf)return false;return true;});
  var h='';
  if(selected.length)h+='<div class="selected-assignees"><div class="text-[10px] text-[var(--mt)] font-bold uppercase mb-1">Назначены</div>'+selected.map(function(f){return '<button class="asgn-chip" onclick="rmAsgn(\''+escA(f)+'\')" title="Снять назначение">'+esc(f)+' <i class="fa-solid fa-xmark"></i></button>';}).join('')+'</div>';
  if(!l.length)h+='<div class="text-xs text-[var(--mt)] text-center py-4 font-semibold">'+(S.executors.length?'Не найдено':'Не загружены')+'</div>';
  else h+=l.map(function(e){var on=selected.indexOf(e['ФИО'])>-1;return '<div class="ei" onclick="doAsgn(\''+escA(e['ФИО'])+'\')" style="'+(on?'background:var(--acg);border:1px solid var(--acd);border-radius:6px':'')+'"><div class="flex-1 min-w-0 truncate"><div class="text-xs font-semibold truncate">'+esc(e['ФИО'])+'</div><div class="esek">Сектор '+esc(e['Сектор']||'?')+'</div><div class="text-[10px] text-[var(--mt)] truncate">'+esc(e['Должность']||'')+'</div></div><i class="fa-solid '+(on?'fa-square-check':'fa-square')+' '+(on?'text-[var(--ac)]':'text-[var(--mt)]')+'"></i></div>';}).join('');
  $('asgnList').innerHTML=h;
}
function doAsgn(f){var a=assigneesFor(S.asgnIdx);var p=a.indexOf(f);if(p>-1)a.splice(p,1);else a.push(f);setAssignees(S.asgnIdx,a);renderExecList();render();toast(p>-1?'Назначение снято: '+f:'Добавлен: '+f);}
function rmAsgn(f){var a=assigneesFor(S.asgnIdx);if(f)a=a.filter(function(x){return x!==f;});else a=[];setAssignees(S.asgnIdx,a);renderExecList();render();toast('Назначение снято');}

function openIssueList(){
  var dd=$('issueDD'),c={};
  for(var i=0;i<S.tasks.length;i++)assigneesFor(i).forEach(function(f){c[f]=(c[f]||0)+1;});
  var ks=Object.keys(c);if(!ks.length){dd.innerHTML='<div class="p-3 text-xs text-[var(--mt)] font-semibold">Нет назначенных</div>';toggleDD(dd.previousElementSibling,'issueDD');return;}
  dd.innerHTML=ks.sort(function(a,b){return a.localeCompare(b,'ru');}).map(function(f){var e=S.executors.find(function(x){return x['ФИО']===f;});return '<div class="ei" onclick="closeDDs();genIssue(\''+escA(f)+'\')"><div class="flex-1"><div class="text-xs font-semibold">'+esc(f)+'</div><div class="esek">Сектор '+(e?esc(e['Сектор']):'?')+' · '+c[f]+' задач</div></div></div>';}).join('');toggleDD(dd.previousElementSibling,'issueDD');
}
function genIssue(f){
  var ex=S.executors.find(function(e){return e['ФИО']===f;});
  var ts=S.tasks.map(function(t,i){var r={};for(var k in t)r[k]=t[k];r._i=i;return r;}).filter(function(t){return hasAssignee(t._i,f);});
  S.issueData={fio:f,exec:ex,tasks:ts};var inf='<strong>'+esc(f)+'</strong>'+(ex?'<br>Сектор: <span class="mono text-[var(--ac)]">'+esc(ex['Сектор']||'')+'</span><br>'+esc(ex['Должность']||''):'');inf+='<br>Задач: <strong>'+ts.length+'</strong>';$('issueExecInfo').innerHTML=inf;$('issueTitle').textContent='Выдача: '+f;$('issueArea').value=genText(ts,true,true,f);openModal('issueModal');
}
function doExpXLSX(){var d=getFiltered($('expAsgn').checked),vH=S.headers.filter(function(h){return S.visCols[h];});var ex=d.map(function(t){var r={};vH.forEach(function(h){r[h]=t[h];});if(S.executors.length)r['Назначены']=assigneesLabel(t._i);return r;});var ws=XLSX.utils.json_to_sheet(ex);var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Выборка");XLSX.writeFile(wb,'Выборка.xlsx');}
