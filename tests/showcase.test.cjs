const test=require('node:test'),assert=require('node:assert/strict'),R=require('../core.js'),S=require('../sharing.js'),E=require('../showcase.js');

test('challenge definitions round trip and evaluate separate completed categories',()=>{
  for(const id of Object.keys(E.CHALLENGES)){
    const experiment=E.challenge(R,S,id);assert.equal(S.decode(R,S.encode(R,experiment)).challenge,id);
    const settings={...experiment.robot};if(id==='fit')settings.radius=.24;if(id==='fast')settings.controller='pursuit';
    const sim=new R.Simulation(experiment,experiment.algorithm,experiment.speed,settings);sim.start();const context={length:sim.pathLength,invalid:false};
    for(let i=0;i<36000&&sim.status==='running';i++)sim.step(1/60);
    assert.equal(sim.status,'arrived',id);assert.equal(E.evaluate(R,id,sim,context).state,'passed',id);
    assert.equal(E.evaluate(R,id,sim,{...context,invalid:true}).state,'failed');
    sim.map.cells[5*sim.map.w+5]=1-sim.map.cells[5*sim.map.w+5];assert.equal(E.evaluate(R,id,sim,context).state,'failed');
  }
});

test('replay captures observations and route events without mutating live simulation',()=>{
  const sim=new R.Simulation(R.makeMap('empty'),'astar',1.6,{navigation:'sensor'}),rec=new E.Recorder(40);sim.start();rec.capture(sim);
  for(let i=0;i<90;i++){sim.step(1/60);rec.capture(sim);}const pose={...sim.pose},time=sim.time;
  const historical=rec.view(R,sim,0);assert.notDeepEqual(historical.pose,sim.pose);assert.equal(historical.time,0);
  assert.deepEqual(sim.pose,pose);assert.equal(sim.time,time);assert.ok(rec.scenes[0].seen.length===768);
  sim.status='paused';rec.capture(sim);assert.equal(rec.frames.at(-1).status,'paused');
  for(let i=0;i<100;i++){sim.time+=.11;rec.capture(sim);}assert.equal(rec.frames.length,40);assert.equal(rec.truncated,true);
});

test('local counters are disabled by default, bounded and clear on opt out',()=>{
  const data={},storage={getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v},usage=new E.UsageCounters(storage);
  usage.increment('share');assert.deepEqual(usage.counts,{});usage.setEnabled(true);usage.increment('share');usage.increment('unknown');
  assert.equal(new E.UsageCounters(storage).counts.share,1);assert.equal(usage.counts.unknown,undefined);
  usage.counts.share=1e6;usage.increment('share');assert.equal(usage.counts.share,1e6);
  usage.setEnabled(false);assert.deepEqual(new E.UsageCounters(storage).counts,{});
});

test('planner overlays and controller playback expose actual engine paths and traces',()=>{
  const map=R.makeMap('empty'),plans=R.comparePlanners(map);assert.ok(plans.every(p=>p.path.length));
  const mission=R.benchmarkMission(map,'astar',1.6,{controller:'pursuit'});assert.ok(mission.trajectory.length>10);assert.ok(mission.trajectory.at(-1).time<=mission.time);
});
