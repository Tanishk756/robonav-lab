/* Browser adapter: all motion and planning live in core.js. */
(() => {
  'use strict';
  const S=window.RoboNavSharing;
  const R=window.RoboNav,$=id=>document.getElementById(id);
  const canvas=$('map'),ctx=canvas.getContext('2d'),scan=$('scan'),sc=scan.getContext('2d');
  let sim=new R.Simulation(R.makeMap('warehouse')),tool='wall',drawing=false,dirty=false,results=[],controlResults=[],hover=null;
  const readSettings=()=>R.config({controller:$('controller').value,navigation:$('navigation').value,unknownPolicy:$('unknownPolicy').value,movingObstacles:$('movingObstacles').checked,radius:Number($('radius').value),margin:Number($('margin').value),lookahead:Number($('lookahead').value),softBand:Number($('softBand').value),costWeight:Number($('costWeight').value),costDecay:Number($('costDecay').value)});
  let keyboard={x:3,y:3},lastFrame=0,accumulator=0,lastUI=0,toastTimer,logKey='',rays=[];
  const palette={lime:'#c5f46b',teal:'#4cd7cb',amber:'#ffc27d'};
  const toast=message=>{$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000);};
  function download(name,body,type='text/plain'){
    const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const csv=rows=>rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
  let experimentRevision=0,experimentId=0,experimentWorker=null;
  const pendingExperiments=new Map();
  const executeExperiment=data=>data.kind==='planners'?R.comparePlanners(data.map,data.settings):Object.keys(R.CONTROLLERS).map(controller=>R.benchmarkMission(data.map,data.algorithm,data.speed,{...data.settings,controller}));
  function completeExperiment(id,result,error){const job=pendingExperiments.get(id);if(!job)return;pendingExperiments.delete(id);job.button.disabled=false;if(job.revision!==experimentRevision)return;if(error){toast(error);return;}job.done(result);}
  try{if(typeof Worker!=='undefined'){
    experimentWorker=new Worker('./navigation-worker.js?v='+S.VERSION);
    experimentWorker.onmessage=({data})=>completeExperiment(data.id,data.result,data.error);
    experimentWorker.onerror=()=>{experimentWorker.terminate();experimentWorker=null;for(const [id,job] of pendingExperiments){try{completeExperiment(id,executeExperiment(job.data));}catch(error){completeExperiment(id,null,error.message);}}};
  }}catch{experimentWorker=null;}
  function experiment(kind,button,done){
    const data={id:++experimentId,kind,map:kind==='planners'?sim.navigationMap:sim.map,settings:sim.settings,algorithm:sim.algorithm,speed:sim.speed};
    if(!experimentWorker){try{done(executeExperiment(data));}catch(error){toast(error.message);}return;}
    button.disabled=true;pendingExperiments.set(data.id,{data,button,done,revision:experimentRevision});experimentWorker.postMessage(data);
  }
  function invalidate(){experimentRevision++;$('shareLink').value='';$('shareHelp').textContent='Generate a link for the current initial scene.';controlResults=[];$('exportControllers').disabled=true;$('controllerResults').innerHTML='<tr><td colspan="8" class="empty-row">Settings or map changed. Run a fresh control experiment.</td></tr>';results=[];$('results').innerHTML='<tr><td colspan="6" class="empty-row">Map or endpoints changed. Run a fresh comparison.</td></tr>';$('exportResults').disabled=true;}
  function fresh(map){sim=new R.Simulation(map,$('algorithm').value,Number($('speed').value),readSettings());sim.compute();sim.status=sim.path.length?'ready':'blocked';invalidate();logKey='';accumulator=0;render();}
  function run(){
    if(sim.status==='running'){sim.status='paused';sim.navigationState='paused';sim.reason='Mission paused';sim.v=sim.omega=sim.left=sim.right=0;sim.log('Mission paused.');}
    else sim.start();
    accumulator=0;updateUI();
  }
  function selectTool(t){tool=t;document.querySelectorAll('[data-tool]').forEach(b=>{const active=b.dataset.tool===t;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});}
  $('run').onclick=run;
  $('reset').onclick=()=>{sim.reset();sim.compute();accumulator=0;updateUI();};
  $('plan').onclick=()=>{sim.status='ready';sim.v=sim.omega=sim.left=sim.right=0;sim.compute();updateUI();};
  $('scenario').onchange=()=>fresh(R.makeMap($('scenario').value));
  $('algorithm').onchange=()=>{sim.algorithm=$('algorithm').value;invalidate();sim.replan();updateUI();};
  for(const id of ['controller','radius','margin','lookahead','softBand','costWeight','costDecay','navigation','unknownPolicy'])$(id).onchange=()=>{try{readSettings();fresh(sim.map);}catch(err){toast(err.message);for(const key of ['controller','radius','margin','lookahead','softBand','costWeight','costDecay','navigation','unknownPolicy'])$(key).value=sim.settings[key];}};
  $('movingObstacles').onchange=()=>fresh(sim.map);
  $('speed').oninput=()=>{sim.speed=Number($('speed').value);$('speedValue').textContent=sim.speed.toFixed(1)+' m/s';invalidate();};
  document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>selectTool(b.dataset.tool));
  function cellFromEvent(e){const r=canvas.getBoundingClientRect();return {x:Math.floor((e.clientX-r.left)/r.width*sim.map.w),y:Math.floor((e.clientY-r.top)/r.height*sim.map.h)};}
  function edit(p){
    const m=sim.map;if(p.x<=0||p.y<=0||p.x>=m.w-1||p.y>=m.h-1)return;
    const id=p.y*m.w+p.x,same=q=>q.x===p.x&&q.y===p.y;
    if(tool==='start'||tool==='goal'){
      if(sim.status==='running'||sim.status==='paused'){toast('Reset the mission before moving its endpoints.');return;}
      if(m.cells[id]||same(m[tool==='start'?'goal':'start']))return;
      m[tool]={...p};sim.reset();dirty=true;return;
    }
    if(same(m.start)||same(m.goal))return;
    if(tool==='wall'){
      // Reject every cell touching the robot's physical footprint.
      const nx=Math.max(p.x,Math.min(p.x+1,sim.pose.x)),ny=Math.max(p.y,Math.min(p.y+1,sim.pose.y));
      if(Math.hypot(sim.pose.x-nx,sim.pose.y-ny)<=sim.clearance+.03)return;
    }
    const value=tool==='wall'?1:0;if(m.cells[id]!==value){m.cells[id]=value;dirty=true;}
  }
  function finishEdit(){
    drawing=false;if(!dirty)return;dirty=false;invalidate();
    if(sim.status==='running'){sim.replan();}
    else {if(sim.status==='arrived')sim.reset();sim.v=sim.omega=sim.left=sim.right=0;sim.compute();if(sim.path.length)sim.status='ready';}
    updateUI();
  }
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;canvas.focus();drawing=true;canvas.setPointerCapture(e.pointerId);edit(cellFromEvent(e));});
  canvas.addEventListener('pointermove',e=>{hover=cellFromEvent(e);if(drawing)edit(hover);});
  canvas.addEventListener('pointerup',finishEdit);canvas.addEventListener('pointercancel',finishEdit);canvas.addEventListener('pointerleave',()=>hover=null);
  canvas.addEventListener('keydown',e=>{
    const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(dirs[e.key]){e.preventDefault();keyboard.x=Math.max(1,Math.min(30,keyboard.x+dirs[e.key][0]));keyboard.y=Math.max(1,Math.min(22,keyboard.y+dirs[e.key][1]));hover={...keyboard};}
    if(e.key==='Enter'){e.preventDefault();edit(keyboard);finishEdit();}
  });
  document.addEventListener('keydown',e=>{
    if($('guide').open||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName))return;
    if(e.code==='Space'){e.preventDefault();run();}if(e.key.toLowerCase()==='r')$('reset').click();
    if('1234'.includes(e.key)&&e.key.length===1)selectTool(['wall','erase','start','goal'][Number(e.key)-1]);
  });
  $('obstacle').onclick=()=>{
    if(!sim.path.length||sim.status==='arrived'){toast('Plan or run a mission first.');return;}
    const p=sim.path.slice(Math.max(3,sim.target+3),-1).find(p=>R.dist(R.center(p),sim.pose)>2&&R.dist(p,sim.map.start)>1);
    if(!p){toast('The robot is too close to the goal. Reset for another experiment.');return;}
    sim.map.cells[p.y*sim.map.w+p.x]=1;invalidate();sim.log(`Obstacle inserted at (${p.x}, ${p.y}). Replanning.`);sim.replan();updateUI();
  };
  const snapshot=()=>({...sim.map,settingsVersion:3,robot:sim.settings,speed:sim.speed,algorithm:sim.algorithm});
  function loadExperiment(data){
    const e=S.validateExperiment(R,data);
    for(const key of ['controller','radius','margin','lookahead','softBand','costWeight','costDecay','navigation','unknownPolicy'])$(key).value=e.robot[key];
    $('movingObstacles').checked=e.robot.movingObstacles;$('speed').value=e.speed;$('speedValue').textContent=e.speed.toFixed(1)+' m/s';$('algorithm').value=e.algorithm;
    fresh(e);$('scenario').selectedIndex=-1;$('example').selectedIndex=-1;$('exampleDescription').textContent='Custom or shared experiment. Inspect the settings, then run or compare.';$('shareLink').value='';$('showObserved').checked=e.robot.navigation==='sensor';
  }
  $('example').onchange=()=>{$('exampleDescription').textContent=S.EXAMPLES[$('example').value].description;};
  $('loadExample').onclick=()=>{try{const id=$('example').value;loadExperiment(S.example(R,id));$('example').value=id;$('exampleDescription').textContent=S.EXAMPLES[id].description;toast('Example loaded. '+sim.reason);}catch(error){toast(error.message);}};
  $('shareExperiment').onclick=async()=>{
    try{
      const location=window.location,base=location&&/^https?:$/.test(location.protocol)&&!['localhost','127.0.0.1','[::1]'].includes(location.hostname)?location.href.split('#')[0].split('?')[0]:S.PUBLIC_URL;
      const link=base+'#experiment='+S.encode(R,snapshot());
      if(link.length>4000){download('robonav-experiment.json',JSON.stringify(snapshot(),null,2),'application/json');toast('Experiment exported as JSON because its link is too long.');return;}
      $('shareLink').value=link;$('shareHelp').textContent='Link ready. Select and copy the field to share this initial scene.';
      if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(link);$('shareHelp').textContent='Link copied. Anyone with it can open this experiment.';}catch{}}
      $('shareLink').focus();toast('Share link ready.');
    }catch(error){toast('Cannot share: '+error.message);}
  };
  $('downloadReport').onclick=()=>download('robonav-experiment-report.json',JSON.stringify({application:'RoboNav Lab',version:S.VERSION,experiment:snapshot(),mission:{status:sim.status,state:sim.navigationState,reason:sim.reason,time_s:sim.time,distance_m:sim.distance,tracking_rmse_m:sim.rmse,minimum_body_clearance_m:Number.isFinite(sim.minClearance)?sim.minClearance:null,replans:sim.replans,recoveries:sim.recoveryAttempts},plannerComparison:results,controllerComparison:controlResults,note:'Initial scene/settings plus measured results; not a resumable mission. Search timings depend on the machine.'},null,2),'application/json');
  $('saveMap').onclick=()=>download('robonav-map.json',JSON.stringify({...sim.map,settingsVersion:3,robot:sim.settings,speed:sim.speed,algorithm:sim.algorithm},null,2),'application/json');
  $('loadMap').onclick=()=>$('mapFile').click();
  $('mapFile').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>100000)throw Error('Map file exceeds the 100 KB limit.');loadExperiment(JSON.parse(await file.text()));toast('Map imported. Ready to plan.');}
    catch(err){toast('Import failed: '+err.message);}finally{e.target.value='';}
  };
  $('snapshot').onclick=()=>{renderMap();const a=document.createElement('a');a.download='robonav-navigation.png';a.href=canvas.toDataURL('image/png');a.click();};
  $('help').onclick=()=>$('guide').showModal();$('closeGuide').onclick=()=>$('guide').close();
  $('guide').addEventListener('click',e=>{if(e.target===$('guide')){const r=$('guide').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('guide').close();}});
  $('compare').onclick=()=>experiment('planners',$('compare'),data=>{
    results=data;
    $('results').replaceChildren();for(const r of results){const tr=document.createElement('tr');for(const value of [R.PLANNERS[r.algorithm],r.cost===null?'—':r.length.toFixed(2)+' m',r.cost===null?'No route':r.cost.toFixed(2),r.expanded,r.ms.toFixed(3)+' ms',r.status]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('results').append(tr);}
    $('exportResults').disabled=false;toast('Comparison complete: 25 measured searches per planner.');
  });
  $('exportResults').onclick=()=>download('robonav-planner-comparison.csv',csv([
    ['scenario','algorithm','path_m','weighted_cost','costmap_build_ms','soft_band_m','cost_weight','cost_decay','navigation','unknown_policy','moving_obstacles','expanded_cells','median_ms','searches','status','start_x','start_y','goal_x','goal_y','radius_m','margin_m','browser'],
    ...results.map(r=>[sim.map.name,r.algorithm,r.length??'',r.cost??'',r.buildMs,sim.settings.softBand,sim.settings.costWeight,sim.settings.costDecay,sim.settings.navigation,sim.settings.unknownPolicy,sim.settings.movingObstacles,r.expanded,r.ms,25,r.status,sim.map.start.x,sim.map.start.y,sim.map.goal.x,sim.map.goal.y,sim.settings.radius,sim.settings.margin,navigator.userAgent])
  ]),'text/csv');
  $('compareControllers').onclick=()=>experiment('controllers',$('compareControllers'),data=>{
    controlResults=data;
    $('controllerResults').replaceChildren();for(const r of controlResults){const tr=document.createElement('tr');for(const value of [R.CONTROLLERS[r.controller],r.time.toFixed(2),r.distance.toFixed(2),r.rmse.toFixed(3),Number.isFinite(r.minClearance)?r.minClearance.toFixed(3):'-',r.replans,r.recoveries,r.status]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('controllerResults').append(tr);}
    $('exportControllers').disabled=false;lastFrame=0;accumulator=0;toast('Controller comparison complete. Your live mission is unchanged.');
  });
  $('exportControllers').onclick=()=>download('robonav-controller-comparison.csv',csv([['scenario','planner','controller','speed_m_s','radius_m','margin_m','lookahead_m','soft_band_m','cost_weight','cost_decay','navigation','unknown_policy','moving_obstacles','min_clearance_m','angular_travel_rad','peak_acceleration_m_s2','replans','recoveries','reason','time_s','distance_m','rmse_m','fallbacks','status'],...controlResults.map(r=>[sim.map.name,sim.algorithm,r.controller,sim.speed,sim.settings.radius,sim.settings.margin,sim.settings.lookahead,sim.settings.softBand,sim.settings.costWeight,sim.settings.costDecay,sim.settings.navigation,sim.settings.unknownPolicy,sim.settings.movingObstacles,r.minClearance,r.angularTravel,r.peakAcceleration,r.replans,r.recoveries,r.reason,r.time,r.distance,r.rmse,r.fallbacks,r.status])]),'text/csv');
  $('exportTelemetry').onclick=()=>{
    if(!sim.telemetry.length){toast('Run the robot first to collect telemetry.');return;}
    download('robonav-telemetry.csv',csv([['time_s','x_m','y_m','heading_rad','linear_m_s','angular_rad_s','left_wheel_m_s','right_wheel_m_s','tracking_error_m','minimum_body_clearance_m','observed_fraction','navigation_state','replans'],...sim.telemetry.map(r=>[r.time,r.x,r.y,r.theta,r.v,r.w,r.left,r.right,r.error,r.clearance,r.coverage].map(v=>v.toFixed(5)).concat(r.state,r.replans))]),'text/csv');
  };

  function line(points,color,width,dash=[]){
    if(!points.length)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x*30,p.y*30):ctx.moveTo(p.x*30,p.y*30));ctx.stroke();ctx.setLineDash([]);
  }
  function renderMap(){
    const observed=$('showObserved').checked,m=observed?sim.mapper.grid():R.worldWithCarts(sim.map,sim.carts);ctx.fillStyle='#0e1622';ctx.fillRect(0,0,960,720);
    if($('showCostmap').checked&&sim.planningMap.penalties){for(let i=0;i<m.cells.length;i++){const value=sim.planningMap.penalties[i];if(value>0){ctx.fillStyle=`rgba(167,139,250,${.12+.5*value})`;ctx.fillRect(i%m.w*30,Math.floor(i/m.w)*30,30,30);}}}
    if($('showExpanded').checked){ctx.fillStyle='#223c604f';for(const p of sim.expanded)ctx.fillRect(p.x*30+1,p.y*30+1,28,28);}
    ctx.lineWidth=1;ctx.strokeStyle='#23304480';ctx.beginPath();for(let x=0;x<=960;x+=30){ctx.moveTo(x,0);ctx.lineTo(x,720);}for(let y=0;y<=720;y+=30){ctx.moveTo(0,y);ctx.lineTo(960,y);}ctx.stroke();
    if($('showInflation').checked){
      // Stroke physical cell rectangles with round joins: their outer edge is
      // the circular-footprint configuration-space boundary, even below 1 cell.
      ctx.save();ctx.beginPath();
      for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.cells[y*m.w+x])ctx.rect(x*30,y*30,30,30);
      ctx.strokeStyle='#ffc27d40';ctx.lineWidth=sim.clearance*60;ctx.lineJoin='round';ctx.stroke();ctx.restore();
    }
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.cells[y*m.w+x]){
      const boundary=x===0||y===0||x===m.w-1||y===m.h-1;ctx.fillStyle=boundary?'#253043':'#34465e';ctx.fillRect(x*30+1,y*30+1,28,28);
      if(!boundary){ctx.fillStyle='#4d6482';ctx.fillRect(x*30+2,y*30+2,26,2);ctx.fillStyle='#29364a';ctx.fillRect(x*30+2,y*30+26,26,2);}
    }
    if($('showInflation').checked){ctx.fillStyle='#ffc27d25';for(let i=0;i<m.cells.length;i++)if(!m.cells[i]&&sim.planningMap.cells[i])ctx.fillRect(i%m.w*30+1,Math.floor(i/m.w)*30+1,28,28);}
    if(observed){for(let i=0;i<m.cells.length;i++)if(!sim.mapper.seen[i]){ctx.fillStyle='#070a10e8';ctx.fillRect(i%m.w*30,Math.floor(i/m.w)*30,30,30);}}
    for(const cart of sim.carts){if(observed&&(!sim.mapper.seen[cart.y*m.w+cart.x]||!m.cells[cart.y*m.w+cart.x]))continue;ctx.strokeStyle='#ff7799';ctx.lineWidth=2;ctx.strokeRect(cart.x*30+2,cart.y*30+2,26,26);}
    rays=sim.rays;
    if($('showLidar').checked){ctx.lineWidth=.8;ctx.strokeStyle='#4cd7cb22';ctx.beginPath();for(const ray of rays){ctx.moveTo(sim.pose.x*30,sim.pose.y*30);ctx.lineTo(ray.x*30,ray.y*30);}ctx.stroke();ctx.fillStyle='#4cd7cb90';for(const r of rays)if(r.hit)ctx.fillRect(r.x*30-1.2,r.y*30-1.2,2.4,2.4);}
    line(sim.path.map(R.center),'#c5f46b26',10);line(sim.path.map(R.center),palette.lime,2.5,[7,5]);
    if($('showTrail').checked)line(sim.trail,palette.amber,2.5);
    for(const [point,label,color] of [[m.start,'S',palette.teal],[m.goal,'G',palette.lime]]){
      const p=R.center(point);ctx.fillStyle='#111b27';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x*30,p.y*30,11,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.font='bold 12px Segoe UI';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,p.x*30,p.y*30);
    }
    const p=sim.pose;ctx.save();ctx.translate(p.x*30,p.y*30);ctx.rotate(p.theta);
    if($('showInflation').checked){
      ctx.fillStyle='#4cd7cb30';ctx.strokeStyle=palette.teal;ctx.lineWidth=1.5;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.arc(0,0,sim.clearance*30,0,2*Math.PI);ctx.fill();ctx.stroke();ctx.setLineDash([]);
    }
    ctx.fillStyle='#e7fcf6';ctx.fillRect(-6,-10,12,4);ctx.fillRect(-6,6,12,4);ctx.fillStyle=palette.teal;ctx.beginPath();ctx.arc(0,0,sim.settings.radius*30,0,2*Math.PI);ctx.fill();ctx.fillStyle='#102a2b';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(1,-4);ctx.lineTo(1,4);ctx.closePath();ctx.fill();ctx.restore();
    if(sim.carrot&&sim.settings.controller==='pursuit'){ctx.strokeStyle='#ef99ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sim.carrot.x*30,sim.carrot.y*30,5,0,Math.PI*2);ctx.stroke();}
    if(hover&&hover.x>=0&&hover.y>=0&&hover.x<m.w&&hover.y<m.h){ctx.strokeStyle=tool==='erase'?palette.amber:palette.lime;ctx.lineWidth=2;ctx.strokeRect(hover.x*30+1,hover.y*30+1,28,28);}
  }
  function renderScan(){
    sc.clearRect(0,0,240,200);const cx=120,cy=100,scale=10;
    sc.strokeStyle='#2a3b50';sc.lineWidth=1;for(const r of [20,40,60,80]){sc.beginPath();sc.arc(cx,cy,r,0,Math.PI*2);sc.stroke();}
    sc.beginPath();sc.moveTo(25,cy);sc.lineTo(215,cy);sc.moveTo(cx,10);sc.lineTo(cx,190);sc.stroke();
    sc.fillStyle='#93a4b9';sc.font='10px Segoe UI';sc.textAlign='center';sc.fillText('FRONT',cx,11);
    sc.strokeStyle='#4cd7cb44';sc.beginPath();rays.forEach((r,i)=>{const a=i*2*Math.PI/rays.length,x=cx+Math.sin(a)*r.distance*scale,y=cy-Math.cos(a)*r.distance*scale;sc.moveTo(cx,cy);sc.lineTo(x,y);});sc.stroke();
    sc.fillStyle=palette.teal;rays.forEach((r,i)=>{const a=i*2*Math.PI/rays.length;if(r.hit){sc.beginPath();sc.arc(cx+Math.sin(a)*r.distance*scale,cy-Math.cos(a)*r.distance*scale,2,0,2*Math.PI);sc.fill();}});
    sc.fillStyle='#e7fcf6';sc.beginPath();sc.moveTo(cx,cy-7);sc.lineTo(cx-5,cy+5);sc.lineTo(cx+5,cy+5);sc.closePath();sc.fill();
  }
  function updateUI(){
    const f=(id,value)=>$(id).textContent=value;
    f('inflationValue',`Obstacle inflation: ${sim.clearance.toFixed(2)} m. Robot safety radius: ${sim.clearance.toFixed(2)} m (${sim.settings.radius.toFixed(2)} + ${sim.settings.margin.toFixed(2)} m).`);
    const metric=(id,v,unit)=>{$(id).replaceChildren(document.createTextNode(v+' '));const em=document.createElement('em');em.textContent=unit;$(id).append(em);};
    metric('routeMetric',Number.isFinite(sim.pathLength)?sim.pathLength.toFixed(2):'—','m');metric('planMetric',sim.planMs.toFixed(2),'ms');metric('distanceMetric',sim.distance.toFixed(2),'m');metric('errorMetric',sim.rmse.toFixed(3),'m');
    f('navigationState',sim.navigationState);f('missionReason',sim.reason);f('coverage',(sim.mapper.coverage*100).toFixed(1)+'%');f('minClearance',Number.isFinite(sim.minClearance)?sim.minClearance.toFixed(3)+' m':'-');f('recoveries',sim.recoveryAttempts);f('angularTravel',sim.angularTravel.toFixed(2)+' rad');f('peakAcceleration',sim.peakAcceleration.toFixed(2)+' m/s2');
    f('weightedCost',Number.isFinite(sim.cost)?sim.cost.toFixed(2):'No route');f('costmapTime',(sim.planningMap.buildMs??0).toFixed(2)+' ms');
    f('poseX',sim.pose.x.toFixed(2)+' m');f('poseY',sim.pose.y.toFixed(2)+' m');f('heading',(sim.pose.theta*180/Math.PI).toFixed(1)+'°');f('linear',sim.v.toFixed(2)+' m/s');f('angular',sim.omega.toFixed(2)+' rad/s');f('wheels',sim.left.toFixed(2)+' / '+sim.right.toFixed(2));f('replans',sim.replans);f('fallbacks',sim.fallbacks);
    f('status',({ready:'Ready to navigate',running:'Mission in progress',paused:'Mission paused',arrived:'Goal reached',blocked:'No safe route · stopped'})[sim.status]);
    $('statusDot').style.background=sim.status==='running'||sim.status==='arrived'?palette.lime:sim.status==='blocked'?palette.amber:'#93a4b9';
    f('run',sim.status==='running'?'Ⅱ Pause':sim.status==='paused'?'▶ Resume':sim.status==='arrived'?'▶ Run again':'▶ Run mission');
    f('simClock',String(Math.floor(sim.time/60)).padStart(2,'0')+':'+(sim.time%60).toFixed(1).padStart(4,'0')+' sim');
    if(rays.length)f('nearest',Math.min(...rays.map(r=>r.distance)).toFixed(2)+' m min');
    f('cursor',hover?`x ${hover.x} · y ${hover.y}`:'x — · y —');
    const key=JSON.stringify(sim.events);if(logKey!==key){logKey=key;$('log').replaceChildren();for(const item of sim.events){const div=document.createElement('div');div.className='event';const time=document.createElement('time');time.textContent=item.time.toFixed(1)+' s';div.append(time,document.createTextNode(item.message));$('log').append(div);}}
  }
  function render(){renderMap();renderScan();updateUI();}
  function frame(t){
    if(lastFrame&&sim.status==='running'&&!drawing){accumulator+=Math.min((t-lastFrame)/1000,.1);while(accumulator>=1/60){sim.step(1/60);accumulator-=1/60;}}
    else accumulator=0;lastFrame=t;
    renderMap();renderScan();if(t-lastUI>100){updateUI();lastUI=t;}requestAnimationFrame(frame);
  }
  // Fixed timestep and no hidden-tab catch-up keep simulations reproducible.
  document.addEventListener('visibilitychange',()=>{lastFrame=0;accumulator=0;});
  sim.compute();render();
  const loadSharedLink=()=>{try{const hash=window.location?.hash??'';if(hash.startsWith('#experiment=')){loadExperiment(S.decode(R,hash.slice(12)));toast('Shared experiment loaded.');}}catch(error){toast('Shared link rejected: '+error.message);}};
  loadSharedLink();window.addEventListener?.('hashchange',loadSharedLink);
  requestAnimationFrame(frame);
})();
