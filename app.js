/* Browser adapter: all motion and planning live in core.js. */
(() => {
  'use strict';
  const R=window.RoboNav,$=id=>document.getElementById(id);
  const canvas=$('map'),ctx=canvas.getContext('2d'),scan=$('scan'),sc=scan.getContext('2d');
  let sim=new R.Simulation(R.makeMap('warehouse')),tool='wall',drawing=false,dirty=false,results=[],controlResults=[],hover=null;
  const readSettings=()=>R.config({controller:$('controller').value,radius:Number($('radius').value),margin:Number($('margin').value),lookahead:Number($('lookahead').value)});
  let keyboard={x:3,y:3},lastFrame=0,accumulator=0,lastUI=0,toastTimer,logKey='',rays=[];
  const palette={lime:'#c5f46b',teal:'#4cd7cb',amber:'#ffc27d'};
  const toast=message=>{$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000);};
  function download(name,body,type='text/plain'){
    const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const csv=rows=>rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
  function invalidate(){controlResults=[];$('exportControllers').disabled=true;$('controllerResults').innerHTML='<tr><td colspan="5" class="empty-row">Settings or map changed. Run a fresh control experiment.</td></tr>';results=[];$('results').innerHTML='<tr><td colspan="5" class="empty-row">Map or endpoints changed. Run a fresh comparison.</td></tr>';$('exportResults').disabled=true;}
  function fresh(map){sim=new R.Simulation(map,$('algorithm').value,Number($('speed').value),readSettings());sim.compute();sim.status=sim.path.length?'ready':'blocked';invalidate();logKey='';accumulator=0;render();}
  function run(){
    if(sim.status==='running'){sim.status='paused';sim.v=sim.omega=sim.left=sim.right=0;sim.log('Mission paused.');}
    else sim.start();
    accumulator=0;updateUI();
  }
  function selectTool(t){tool=t;document.querySelectorAll('[data-tool]').forEach(b=>{const active=b.dataset.tool===t;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});}
  $('run').onclick=run;
  $('reset').onclick=()=>{sim.reset();sim.compute();accumulator=0;updateUI();};
  $('plan').onclick=()=>{sim.status='ready';sim.v=sim.omega=sim.left=sim.right=0;sim.compute();updateUI();};
  $('scenario').onchange=()=>fresh(R.makeMap($('scenario').value));
  $('algorithm').onchange=()=>{sim.algorithm=$('algorithm').value;invalidate();sim.replan();updateUI();};
  for(const id of ['controller','radius','margin','lookahead'])$(id).onchange=()=>{try{readSettings();fresh(sim.map);}catch(err){toast(err.message);for(const key of ['controller','radius','margin','lookahead'])$(key).value=sim.settings[key];}};
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
  $('saveMap').onclick=()=>download('robonav-map.json',JSON.stringify({...sim.map,robot:sim.settings,speed:sim.speed,algorithm:sim.algorithm},null,2),'application/json');
  $('loadMap').onclick=()=>$('mapFile').click();
  $('mapFile').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>100000)throw Error('Map file exceeds the 100 KB limit.');const data=JSON.parse(await file.text()),m=R.validateMap(data),settings=R.config(data.robot??{});if(data.speed!==undefined&&(!Number.isFinite(data.speed)||data.speed<.4||data.speed>3))throw Error('Invalid speed.');if(data.algorithm!==undefined&&!['astar','dijkstra'].includes(data.algorithm))throw Error('Invalid planner.');for(const key of ['controller','radius','margin','lookahead'])$(key).value=settings[key];$('speed').value=data.speed??1.6;$('speedValue').textContent=Number($('speed').value).toFixed(1)+' m/s';$('algorithm').value=data.algorithm??'astar';fresh(m);$('scenario').selectedIndex=-1;toast('Map imported. Ready to plan.');}
    catch(err){toast('Import failed: '+err.message);}finally{e.target.value='';}
  };
  $('snapshot').onclick=()=>{renderMap();const a=document.createElement('a');a.download='robonav-navigation.png';a.href=canvas.toDataURL('image/png');a.click();};
  $('help').onclick=()=>$('guide').showModal();$('closeGuide').onclick=()=>$('guide').close();
  $('guide').addEventListener('click',e=>{if(e.target===$('guide')){const r=$('guide').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('guide').close();}});
  $('compare').onclick=()=>{
    results=[];
    for(const algorithm of ['astar','dijkstra']){
      // Warm-up is excluded; median attenuates timer noise and scheduling spikes.
      R.plan(sim.planningMap,sim.map.start,sim.map.goal,algorithm,sim.clearance,sim.map);
      const times=[];let p;for(let i=0;i<25;i++){p=R.plan(sim.planningMap,sim.map.start,sim.map.goal,algorithm,sim.clearance,sim.map);times.push(p.ms);}
      times.sort((a,b)=>a-b);results.push({algorithm,cost:Number.isFinite(p.cost)?p.cost:null,expanded:p.expanded.length,ms:times[12],status:p.path.length?'Reachable':'No route'});
    }
    $('results').replaceChildren();for(const r of results){const tr=document.createElement('tr');for(const value of [r.algorithm==='astar'?'A*':'Dijkstra',r.cost===null?'—':r.cost.toFixed(2)+' m',r.expanded,r.ms.toFixed(3)+' ms',r.status]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('results').append(tr);}
    $('exportResults').disabled=false;toast('Comparison complete: 25 measured searches per planner.');
  };
  $('exportResults').onclick=()=>download('robonav-planner-comparison.csv',csv([
    ['scenario','algorithm','path_m','expanded_cells','median_ms','searches','status','start_x','start_y','goal_x','goal_y','radius_m','margin_m','browser'],
    ...results.map(r=>[sim.map.name,r.algorithm,r.cost??'',r.expanded,r.ms,25,r.status,sim.map.start.x,sim.map.start.y,sim.map.goal.x,sim.map.goal.y,sim.settings.radius,sim.settings.margin,navigator.userAgent])
  ]),'text/csv');
  $('compareControllers').onclick=()=>{
    controlResults=['waypoint','pursuit'].map(controller=>R.benchmarkMission(sim.map,sim.algorithm,sim.speed,{...sim.settings,controller}));
    $('controllerResults').replaceChildren();for(const r of controlResults){const tr=document.createElement('tr');for(const value of [r.controller==='pursuit'?'Guarded pursuit':'Waypoints',r.time.toFixed(2),r.distance.toFixed(2),r.rmse.toFixed(3),r.status]){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('controllerResults').append(tr);}
    $('exportControllers').disabled=false;lastFrame=0;accumulator=0;toast('Controller comparison complete. Your live mission is unchanged.');
  };
  $('exportControllers').onclick=()=>download('robonav-controller-comparison.csv',csv([['scenario','planner','controller','speed_m_s','radius_m','margin_m','lookahead_m','time_s','distance_m','rmse_m','fallbacks','status'],...controlResults.map(r=>[sim.map.name,sim.algorithm,r.controller,sim.speed,sim.settings.radius,sim.settings.margin,sim.settings.lookahead,r.time,r.distance,r.rmse,r.fallbacks,r.status])]),'text/csv');
  $('exportTelemetry').onclick=()=>{
    if(!sim.telemetry.length){toast('Run the robot first to collect telemetry.');return;}
    download('robonav-telemetry.csv',csv([['time_s','x_m','y_m','heading_rad','linear_m_s','angular_rad_s','left_wheel_m_s','right_wheel_m_s','tracking_error_m'],...sim.telemetry.map(r=>[r.time,r.x,r.y,r.theta,r.v,r.w,r.left,r.right,r.error].map(v=>v.toFixed(5)))]),'text/csv');
  };

  function line(points,color,width,dash=[]){
    if(!points.length)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x*30,p.y*30):ctx.moveTo(p.x*30,p.y*30));ctx.stroke();ctx.setLineDash([]);
  }
  function renderMap(){
    const m=sim.map;ctx.fillStyle='#0e1622';ctx.fillRect(0,0,960,720);
    if($('showExpanded').checked){ctx.fillStyle='#223c604f';for(const p of sim.expanded)ctx.fillRect(p.x*30+1,p.y*30+1,28,28);}
    ctx.lineWidth=1;ctx.strokeStyle='#23304480';ctx.beginPath();for(let x=0;x<=960;x+=30){ctx.moveTo(x,0);ctx.lineTo(x,720);}for(let y=0;y<=720;y+=30){ctx.moveTo(0,y);ctx.lineTo(960,y);}ctx.stroke();
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(m.cells[y*m.w+x]){
      const boundary=x===0||y===0||x===m.w-1||y===m.h-1;ctx.fillStyle=boundary?'#253043':'#34465e';ctx.fillRect(x*30+1,y*30+1,28,28);
      if(!boundary){ctx.fillStyle='#4d6482';ctx.fillRect(x*30+2,y*30+2,26,2);ctx.fillStyle='#29364a';ctx.fillRect(x*30+2,y*30+26,26,2);}
    }
    if($('showInflation').checked){ctx.fillStyle='#ffc27d25';for(let i=0;i<m.cells.length;i++)if(!m.cells[i]&&sim.planningMap.cells[i])ctx.fillRect(i%m.w*30+1,Math.floor(i/m.w)*30+1,28,28);}
    rays=R.lidar(m,sim.pose);
    if($('showLidar').checked){ctx.lineWidth=.8;ctx.strokeStyle='#4cd7cb22';ctx.beginPath();for(const ray of rays){ctx.moveTo(sim.pose.x*30,sim.pose.y*30);ctx.lineTo(ray.x*30,ray.y*30);}ctx.stroke();ctx.fillStyle='#4cd7cb90';for(const r of rays)if(r.hit)ctx.fillRect(r.x*30-1.2,r.y*30-1.2,2.4,2.4);}
    line(sim.path.map(R.center),'#c5f46b26',10);line(sim.path.map(R.center),palette.lime,2.5,[7,5]);
    if($('showTrail').checked)line(sim.trail,palette.amber,2.5);
    for(const [point,label,color] of [[m.start,'S',palette.teal],[m.goal,'G',palette.lime]]){
      const p=R.center(point);ctx.fillStyle='#111b27';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x*30,p.y*30,11,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.font='bold 12px Segoe UI';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,p.x*30,p.y*30);
    }
    const p=sim.pose;ctx.save();ctx.translate(p.x*30,p.y*30);ctx.rotate(p.theta);
    ctx.strokeStyle='#4cd7cb30';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,sim.clearance*30,0,2*Math.PI);ctx.stroke();
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
    const metric=(id,v,unit)=>{$(id).replaceChildren(document.createTextNode(v+' '));const em=document.createElement('em');em.textContent=unit;$(id).append(em);};
    metric('routeMetric',Number.isFinite(sim.cost)?sim.cost.toFixed(2):'—','m');metric('planMetric',sim.planMs.toFixed(2),'ms');metric('distanceMetric',sim.distance.toFixed(2),'m');metric('errorMetric',sim.rmse.toFixed(3),'m');
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
  sim.compute();render();requestAnimationFrame(frame);
})();
