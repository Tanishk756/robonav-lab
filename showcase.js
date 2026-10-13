/* Interactive experiences: local challenges, bounded replay and canvas reports. */
(function(root){
  'use strict';
  const CHALLENGES={
    fit:{title:'Fit through the doorway',category:'Reachability',map:'office',settings:{radius:.6,margin:.12},help:'Reduce robot radius plus margin below 0.5 m and complete the fixed office route.'},
    shortest:{title:'Find the shortest grid route',category:'Distance',map:'loading',settings:{costWeight:0,softBand:0},help:'Complete the loading dock route using a minimum-distance plan. Keep the default footprint and known static map.'},
    fast:{title:'Beat 35 simulation seconds',category:'Time',map:'warehouse',settings:{},help:'Complete the fixed warehouse scene in at most 35 simulation seconds. Try changing the controller; keep the default footprint.'},
    safe:{title:'Keep 30 cm clearance',category:'Clearance',map:'loading',settings:{margin:.3},help:'Complete the loading dock with a 0.24 m body radius and at least 0.30 m physical body clearance.'}
  };
  const signature=m=>JSON.stringify([m.w,m.h,m.cells,m.start,m.goal]);
  function challenge(R,S,id){if(!Object.hasOwn(CHALLENGES,id))throw Error('Unknown challenge.');const c=CHALLENGES[id];return S.validateExperiment(R,{...R.makeMap(c.map),robot:c.settings,challenge:id});}
  function evaluate(R,id,sim,context){
    if(!Object.hasOwn(CHALLENGES,id))return {state:'none',text:'Choose a challenge to begin.'};
    const c=CHALLENGES[id],fail=text=>({state:'failed',text});
    if(signature(sim.map)!==signature(R.makeMap(c.map)))return fail('Restore the fixed challenge map and endpoints.');
    if(sim.status!=='arrived')return {state:'pending',text:sim.status==='blocked'?sim.reason:c.help};
    if(!context||context.invalid)return fail('Start a fresh mission without changing the scene or manually replanning during the run.');
    if(sim.settings.navigation!=='known'||sim.settings.movingObstacles)return fail('Use the fully known, static challenge scene.');
    if(id!=='fit'&&Math.abs(sim.settings.radius-.24)>1e-9)return fail('Keep the challenge body radius at 0.24 m.');
    if(id==='shortest'){
      const settings={...sim.settings,costWeight:0,softBand:0},grid=R.buildCostmap(sim.map,settings),clearance=settings.radius+settings.margin;
      const optimum=R.plan(grid,sim.map.start,sim.map.goal,'dijkstra',clearance,sim.map);
      if(Math.abs(sim.settings.margin-.12)>1e-9||Math.abs(context.length-optimum.length)>1e-7)return fail('The initial route is not the shortest route for the default footprint.');
    }
    if(id==='fast'&&(sim.time>35||Math.abs(sim.settings.margin-.12)>1e-9))return fail('Finish within 35 simulation seconds with the default margin.');
    if(id==='safe'&&(!Number.isFinite(sim.minClearance)||sim.minClearance<.30-1e-8))return fail('Minimum physical body clearance must be at least 0.30 m.');
    return {state:'passed',text:'Simulated challenge completed: '+c.category+'. Local result, not a safety certificate or trusted leaderboard score.'};
  }
  class Recorder{
    constructor(limit=6000){this.limit=limit;this.reset();}
    reset(){this.frames=[];this.scenes=[];this.events=[];this.lastScene='';this.eventKeys=new Set();this.truncated=false;}
    capture(sim){
      const last=this.frames.at(-1);if(last&&sim.time<last.time)this.reset();
      if(this.frames.length>=this.limit){this.truncated=true;return;}
      if(this.frames.length&&sim.time-this.frames.at(-1).time<.099&&sim.status==='running')return;
      if(this.frames.length&&sim.time===this.frames.at(-1).time&&sim.status===this.frames.at(-1).status)return;
      const scene={world:sim.worldMap.cells.slice(),observed:sim.mapper.grid().cells,seen:Array.from(sim.mapper.seen),planning:sim.planningMap.cells.slice(),penalties:sim.planningMap.penalties?.slice()??[],path:sim.path.map(p=>({...p})),carts:sim.carts.map(c=>({...c}))};
      const key=JSON.stringify(scene);if(key!==this.lastScene){this.scenes.push(scene);this.lastScene=key;}
      const frame={time:sim.time,scene:this.scenes.length-1,pose:{...sim.pose},v:sim.v,omega:sim.omega,status:sim.status,state:sim.navigationState,reason:sim.reason,distance:sim.distance,rmse:sim.rmse,minClearance:sim.minClearance,coverage:sim.mapper.coverage,replans:sim.replans,cost:sim.cost,pathLength:sim.pathLength,left:sim.left,right:sim.right,angularTravel:sim.angularTravel,peakAcceleration:sim.peakAcceleration,recoveryAttempts:sim.recoveryAttempts,planMs:sim.planMs};
      for(const event of sim.events){const k=event.time+':'+event.message;if(!this.eventKeys.has(k)){this.eventKeys.add(k);this.events.push({time:event.time,text:event.message});}}
      if(last&&frame.replans>last.replans)this.events.push({time:frame.time,text:'Replanned route'});
      if(last&&frame.coverage>last.coverage+.005)this.events.push({time:frame.time,text:'New space observed'});
      if(last&&frame.status!==last.status&&['arrived','blocked'].includes(frame.status))this.events.push({time:frame.time,text:frame.reason});
      this.frames.push(frame);
    }
    view(R,sim,index){
      const i=Math.max(0,Math.min(this.frames.length-1,index)),f=this.frames[i];if(!f)return sim;
      const scene=this.scenes[f.scene],world={...sim.map,cells:scene.world},observed={...sim.map,cells:scene.observed};
      return {...sim,...f,clearance:sim.clearance,events:this.events.filter(e=>e.time<=f.time).slice(-30).reverse().map(e=>({time:e.time,message:e.text})),pose:f.pose,navigationState:f.state,worldMap:world,map:world,path:scene.path,carts:scene.carts,carrot:null,planningMap:{...sim.planningMap,cells:scene.planning,penalties:scene.penalties},mapper:{seen:scene.seen,coverage:f.coverage,grid:()=>observed},rays:R.lidar(world,f.pose),trail:this.frames.slice(0,i+1).map(item=>item.pose)};
    }
  }
  const COLORS=['#c5f46b','#4cd7cb','#ef99ff','#ffb86b','#7ba7ff'];
  function drawTrajectory(ctx,map,trajectory,time,width,height){
    const sx=width/map.w,sy=height/map.h;ctx.fillStyle='#0e1622';ctx.fillRect(0,0,width,height);
    ctx.fillStyle='#34465e';map.cells.forEach((v,i)=>{if(v)ctx.fillRect(i%map.w*sx,Math.floor(i/map.w)*sy,sx,sy);});
    const points=trajectory.filter(p=>p.time<=time);if(!points.length)return;
    ctx.strokeStyle='#c5f46b';ctx.lineWidth=2;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x*sx,p.y*sy):ctx.moveTo(p.x*sx,p.y*sy));ctx.stroke();
    const p=points.at(-1);ctx.fillStyle='#4cd7cb';ctx.beginPath();ctx.arc(p.x*sx,p.y*sy,4,0,Math.PI*2);ctx.fill();
  }
  function resultCard(ctx,map,image,summary,width=1200,height=900){
    ctx.fillStyle='#0b1018';ctx.fillRect(0,0,width,height);ctx.fillStyle='#c5f46b';ctx.font='bold 34px Arial';ctx.fillText('RoboNav Lab | '+summary.version,40,55);
    ctx.fillStyle='#e9eff7';ctx.font='22px Arial';ctx.fillText(summary.title.slice(0,70),40,95);
    ctx.drawImage(image,40,125,800,600);ctx.font='20px Arial';
    const lines=[summary.status,'Time: '+summary.time.toFixed(2)+' sim s','Driven: '+summary.distance.toFixed(2)+' m','Clearance: '+(Number.isFinite(summary.clearance)?summary.clearance.toFixed(3)+' m':'not sampled'),'Planner: '+summary.planner,'Controller: '+summary.controller];
    lines.forEach((text,i)=>ctx.fillText(text,865,160+i*55));
    ctx.fillStyle='#93a4b9';ctx.font='18px Arial';ctx.fillText('Simulated results | '+summary.category+' | No hardware safety claim',40,780);ctx.fillText('tanishk756.github.io/robonav-lab',40,815);ctx.fillText('Use the accompanying experiment link to reproduce the initial scene.',40,850);
  }
  class UsageCounters{
    constructor(storage=null){this.storage=storage;this.enabled=false;this.counts={};try{const saved=JSON.parse(storage?.getItem('robonav-usage-v1')??'null');if(saved?.enabled){this.enabled=true;for(const key of ['demo_start','mission_complete','share','challenge_pass'])if(Number.isInteger(saved.counts?.[key])&&saved.counts[key]>=0)this.counts[key]=Math.min(saved.counts[key],1e6);}}catch{}}
    save(){try{this.storage?.setItem('robonav-usage-v1',JSON.stringify({enabled:this.enabled,counts:this.counts}));}catch{}}
    setEnabled(value){this.enabled=Boolean(value);if(!this.enabled)this.counts={};this.save();}
    increment(key){if(this.enabled&&['demo_start','mission_complete','share','challenge_pass'].includes(key)){this.counts[key]=Math.min((this.counts[key]??0)+1,1e6);this.save();}}
  }
  const api={CHALLENGES,challenge,evaluate,Recorder,COLORS,drawTrajectory,resultCard,UsageCounters,signature};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RoboNavShowcase=api;
})(typeof globalThis!=='undefined'?globalThis:this);
