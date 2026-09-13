const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../core.js');
test('both planners find the known shortest diagonal route', () => {
  const m = R.makeMap('empty');
  for (const algorithm of ['astar','dijkstra']) {
    const p = R.plan(m, {x:2,y:2}, {x:7,y:7}, algorithm);
    assert.equal(p.path.length, 6);
    assert.ok(Math.abs(p.cost-5*Math.SQRT2) < 1e-9);
  }
});
test('unreachable goal and occupied endpoint are rejected', () => {
  const m = R.makeMap('empty');
  for(let y=0;y<m.h;y++) m.cells[y*m.w+12]=1;
  assert.equal(R.plan(m,{x:2,y:2},{x:20,y:2}).path.length,0);
  assert.equal(R.plan(m,{x:0,y:0},{x:20,y:2}).path.length,0);
});
test('diagonal corner cutting is forbidden', () => {
  const m = {w:2,h:2,cells:[0,1,1,0]};
  assert.equal(R.plan(m,{x:0,y:0},{x:1,y:1}).path.length,0);
});
test('planner costs agree on repeatable scenarios', () => {
  for (const name of ['warehouse','corridors','clutter']) {
    const m=R.makeMap(name);
    const a=R.plan(m,m.start,m.goal,'astar'), d=R.plan(m,m.start,m.goal,'dijkstra');
    assert.ok(a.path.length>0,name);
    assert.ok(Math.abs(a.cost-d.cost)<1e-9,name);
  }
});
test('raycast measures exact wall distance', () => {
  const m=R.makeMap('empty');
  assert.ok(Math.abs(R.raycast(m,2.5,2.5,Math.PI,8).distance-1.5)<1e-8);
});
test('differential drive integrates straight and curved motion', () => {
  const p=R.integrate({x:0,y:0,theta:0},1,1,0.5,1);
  assert.ok(Math.abs(p.x-1)<1e-9); assert.equal(p.y,0);
  const q=R.integrate({x:0,y:0,theta:0},0,1,0.5,Math.PI/4);
  assert.ok(Math.abs(q.x-.25)<1e-9); assert.ok(Math.abs(q.y-.25)<1e-9);
});
test('controller completes every preset without a collision', () => {
  for (const name of ['empty','warehouse','corridors','clutter']) {
    const sim=new R.Simulation(R.makeMap(name)); sim.start();
    for(let i=0;i<60000&&sim.status==='running';i++) sim.step(1/60);
    assert.equal(sim.status,'arrived',name);
    assert.ok(sim.distance>0);
  }
});
test('all presets complete at minimum and maximum configurable speeds',()=>{
  for(const name of ['empty','warehouse','corridors','clutter'])for(const speed of [.4,3]){
    const sim=new R.Simulation(R.makeMap(name),'astar',speed);sim.start();
    for(let i=0;i<60000&&sim.status==='running';i++)sim.step(1/60);
    assert.equal(sim.status,'arrived',`${name} at ${speed} m/s`);
  }
});
test('inserting an obstacle forces a valid replan', () => {
  const sim=new R.Simulation(R.makeMap('empty')); sim.start();
  for(let i=0;i<120;i++)sim.step(1/60);
  const target=sim.path[Math.min(sim.target+4,sim.path.length-2)];
  sim.map.cells[target.y*sim.map.w+target.x]=1;
  sim.replan(); assert.equal(sim.replans,1);
  assert.ok(!sim.path.some(p=>p.x===target.x&&p.y===target.y));
  for(let i=0;i<60000&&sim.status==='running';i++)sim.step(1/60);
  assert.equal(sim.status,'arrived');
});
test('map import rejects malformed maps',()=>{
  assert.throws(()=>R.validateMap({w:32,h:24,cells:[]}));
  const m=R.makeMap('empty');m.start={x:NaN,y:2};assert.throws(()=>R.validateMap(m));
});
test('inflation closes a passage too narrow for the robot and preserves sensor map',()=>{
  const m=R.makeMap('empty');for(let y=1;y<23;y++)if(y!==12)m.cells[y*m.w+16]=1;
  const before=m.cells.slice();
  const small=R.inflateMap(m,.36),large=R.inflateMap(m,.72);
  assert.ok(R.plan(small,m.start,m.goal,'astar',.36,m).path.length>0);
  assert.equal(R.plan(large,m.start,m.goal,'astar',.72,m).path.length,0);
  assert.deepEqual(m.cells,before);
});
test('planning transitions respect circular footprint clearance',()=>{
  const m=R.makeMap('warehouse'),clearance=.72,grid=R.inflateMap(m,clearance);
  const route=R.plan(grid,m.start,m.goal,'astar',clearance,m).path;assert.ok(route.length>0);
  for(let i=1;i<route.length;i++)assert.ok(R.segmentClear(m,R.center(route[i-1]),R.center(route[i]),clearance));
});
test('pure pursuit completes all presets for both planners at all speed settings',()=>{
  for(const name of ['empty','warehouse','corridors','clutter'])for(const planner of ['astar','dijkstra'])for(const speed of [.4,1.6,3]){
    const sim=new R.Simulation(R.makeMap(name),planner,speed,{controller:'pursuit'});sim.start();
    for(let i=0;i<36000&&sim.status==='running';i++){sim.step(1/60);assert.equal(R.collides(sim.map,sim.pose.x,sim.pose.y,sim.clearance),false);}
    assert.equal(sim.status,'arrived',`${name} ${planner} ${speed}`);
  }
});
test('pure pursuit handles an inserted obstacle and repeated experiments are deterministic',()=>{
  const sim=new R.Simulation(R.makeMap('empty'),'astar',1.6,{controller:'pursuit'});sim.start();
  for(let i=0;i<180;i++)sim.step(1/60);
  const p=sim.path[sim.target+4];sim.map.cells[p.y*sim.map.w+p.x]=1;sim.replan();
  for(let i=0;i<36000&&sim.status==='running';i++)sim.step(1/60);assert.equal(sim.status,'arrived');assert.equal(sim.replans,1);
  const a=R.benchmarkMission(R.makeMap('warehouse'),'astar',1.6,{controller:'pursuit'}),b=R.benchmarkMission(R.makeMap('warehouse'),'astar',1.6,{controller:'pursuit'});assert.deepEqual(a,b);
});
test('invalid robot settings are rejected',()=>{
  for(const options of [{radius:NaN},{radius:2},{margin:-1},{lookahead:Infinity},{controller:'unknown'}])assert.throws(()=>R.config(options));
});
