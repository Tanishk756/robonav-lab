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

test('costmap penalties decay outside the hard envelope without changing occupancy or LiDAR',()=>{
  const m=R.makeMap('empty');m.cells[12*m.w+15]=1;const before=m.cells.slice();
  const settings={softBand:3,costWeight:4},grid=R.buildCostmap(m,settings);
  assert.deepEqual(grid.cells,R.inflateMap(m,.36).cells);
  assert.ok(grid.penalties[12*m.w+16]>grid.penalties[12*m.w+17]);
  assert.ok(grid.penalties[12*m.w+17]>grid.penalties[12*m.w+18]);
  assert.equal(grid.penalties[12*m.w+19],0);
  assert.equal(R.obstacleDistance(m,16.5,12.5),.5);
  assert.equal(R.raycast(m,18.5,12.5,Math.PI).distance,2.5);
  assert.deepEqual(m.cells,before);
  for(const options of [{softBand:-1},{costWeight:NaN},{costDecay:0}])assert.throws(()=>R.buildCostmap(m,options));
});

test('weighted planners agree and proximity costs prefer a wider route',()=>{
  const m=R.makeMap('empty');m.start={x:3,y:10};m.goal={x:28,y:10};
  for(let x=8;x<=23;x++)m.cells[11*m.w+x]=1;
  const plain=R.plan(R.inflateMap(m,.36),m.start,m.goal,'astar',.36,m);
  const grid=R.buildCostmap(m,{softBand:3,costWeight:10});
  const a=R.plan(grid,m.start,m.goal,'astar',.36,m),d=R.plan(grid,m.start,m.goal,'dijkstra',.36,m);
  assert.ok(Math.abs(a.cost-d.cost)<1e-9);assert.ok(a.length>plain.length);
  assert.ok(a.path.some(p=>p.y<9));assert.ok(a.cost>=a.length);
  for(let i=1;i<a.path.length;i++)assert.ok(R.segmentClear(m,R.center(a.path[i-1]),R.center(a.path[i]),.36));
  for(const options of [{costWeight:0},{softBand:0}]){
    const p=R.plan(R.buildCostmap(m,options),m.start,m.goal,'astar',.36,m);
    assert.deepEqual(p.path,plain.path);assert.equal(p.cost,plain.cost);assert.equal(p.length,plain.cost);
  }
});

test('costmap rebuild follows map edits and soft settings do not expand hard clearance',()=>{
  const m=R.makeMap('empty'),a=R.buildCostmap(m,{costWeight:0,softBand:0});
  const b=R.buildCostmap(m,{costWeight:20,softBand:5});assert.deepEqual(a.cells,b.cells);
  const sim=new R.Simulation(m);sim.compute();const index=10*m.w+10;
  assert.equal(sim.planningMap.penalties[index],0);
  sim.map.cells[index+1]=1;sim.replan();assert.ok(sim.planningMap.penalties[index]>0);
  assert.equal(sim.clearance,.36);assert.equal(sim.map.cells[index],0);
});

test('clearance checks reject tangency, corners and out-of-map footprints',()=>{
  const m=R.makeMap('empty');m.cells[10*m.w+10]=1;
  assert.equal(R.collides(m,11.5,10.5,.5),true);
  assert.equal(R.collides(m,11.51,10.5,.5),false);
  assert.equal(R.segmentClear(m,{x:11.2,y:9.8},{x:11.2,y:11.8},.3),false);
  assert.equal(R.collides(m,-.1,12,.24),true);
});


test('all planners find safe routes on every deterministic environment',()=>{
  for(const name of Object.keys(R.ENVIRONMENTS)){
    const m=R.validateMap(R.makeMap(name)),grid=R.buildCostmap(m);
    assert.deepEqual(m,R.validateMap(R.makeMap(name)));
    const routes=Object.keys(R.PLANNERS).map(algorithm=>R.plan(grid,m.start,m.goal,algorithm,.36,m));
    assert.ok(Math.abs(routes[0].cost-routes[1].cost)<1e-9,name+' optimal cost');
    for(const [routeIndex,route] of routes.entries()){
      const anyAngle=Object.keys(R.PLANNERS)[routeIndex]==='theta';
      assert.deepEqual(route.path[0],m.start);assert.deepEqual(route.path.at(-1),m.goal);
      let cost=0,length=0;
      for(let i=1;i<route.path.length;i++){
        const a=route.path[i-1],b=route.path[i],step=R.dist(a,b);
        if(!anyAngle)assert.ok(step<=Math.SQRT2+1e-9);assert.ok(R.segmentClear(m,R.center(a),R.center(b),.36));
        if(!anyAngle&&a.x!==b.x&&a.y!==b.y){assert.equal(R.blocked(grid,a.x,b.y),false);assert.equal(R.blocked(grid,b.x,a.y),false);}
        length+=step;cost+=anyAngle?R.shortcutCost(grid,a,b):step*(1+grid.weight*(grid.penalties[a.y*m.w+a.x]+grid.penalties[b.y*m.w+b.x])/2);
      }
      assert.ok(Math.abs(route.cost-cost)<1e-9);assert.ok(Math.abs(route.length-length)<1e-9);
      if(!anyAngle)assert.ok(routes[4].path.length<=route.path.length,name+' BFS fewest steps');
    }
  }
});

test('every planner rejects unreachable goals and unknown choices fail explicitly',()=>{
  const m=R.makeMap('empty');for(let y=1;y<23;y++)m.cells[y*m.w+16]=1;
  const grid=R.buildCostmap(m);
  for(const algorithm of Object.keys(R.PLANNERS)){
    const p=R.plan(grid,m.start,m.goal,algorithm,.36,m);assert.equal(p.path.length,0);assert.equal(p.cost,Infinity);
  }
  assert.throws(()=>R.plan(m,m.start,m.goal,'typo'),/Unknown planner/);
  assert.throws(()=>R.makeMap('typo'),/Unknown environment/);
});

test('all new environments and planners complete collision-free controller missions',()=>{
  for(const name of ['office','slalom','rooms','loading'])for(const algorithm of Object.keys(R.PLANNERS))for(const controller of ['waypoint','pursuit']){
    const sim=new R.Simulation(R.makeMap(name),algorithm,1.6,{controller});sim.start();
    for(let i=0;i<36000&&sim.status==='running';i++){sim.step(1/60);assert.equal(R.collides(sim.map,sim.pose.x,sim.pose.y,sim.clearance),false);}
    assert.equal(sim.status,'arrived',`${name} ${algorithm} ${controller}`);
  }
});

test('new optimal searches match Dijkstra and bidirectional BFS matches BFS on seeded weighted maps',()=>{
  let seed=209;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let trial=0;trial<40;trial++){
    const w=12,h=10,m={w,h,cells:Array.from({length:w*h},()=>Number(random()<.22)),weight:trial%4,penalties:Array.from({length:w*h},()=>random())};
    const start={x:1,y:1},goal={x:10,y:8};m.cells[13]=m.cells[106]=0;
    const oracle=R.plan(m,start,goal,'dijkstra'),bfs=R.plan(m,start,goal,'bfs');
    for(const algorithm of ['bidijkstra','fringe','euclidean','chebyshev']){
      const p=R.plan(m,start,goal,algorithm);assert.equal(Boolean(p.path.length),Boolean(oracle.path.length),algorithm+' reachability');
      if(p.path.length)assert.ok(Math.abs(p.cost-oracle.cost)<1e-8,algorithm+' weighted optimum');
    }
    assert.equal(R.plan(m,start,goal,'bibfs').path.length,bfs.path.length,'bidirectional minimum hops');
  }
});

test('Theta star produces direct any-angle routes and collision-checked weighted shortcuts',()=>{
  const m=R.makeMap('empty'),settings={costWeight:0,softBand:0},g=R.buildCostmap(m,settings);
  const p=R.plan(g,m.start,m.goal,'theta',.36,m);
  assert.equal(p.path.length,2);assert.ok(Math.abs(p.length-R.dist(m.start,m.goal))<1e-9);assert.equal(p.cost,p.length);
  m.cells[12*m.w+16]=1;const grid=R.buildCostmap(m,{costWeight:8,softBand:3});
  const a=R.plan(grid,m.start,m.goal,'theta',.36,m),b=R.plan(grid,m.start,m.goal,'theta',.36,m);
  assert.deepEqual(a.path,b.path);assert.equal(a.cost,b.cost);assert.ok(a.cost>=a.length);
  for(let i=1;i<a.path.length;i++)assert.ok(R.segmentClear(m,R.center(a.path[i-1]),R.center(a.path[i]),.36));
});

test('all eleven choices reject unsafe corners and oversized footprints and handle equal endpoints',()=>{
  assert.equal(Object.keys(R.PLANNERS).length,11);assert.deepEqual(Object.keys(R.PLANNER_INFO),Object.keys(R.PLANNERS));
  for(const algorithm of Object.keys(R.PLANNERS)){
    assert.equal(R.plan({w:2,h:2,cells:[0,1,1,0]},{x:0,y:0},{x:1,y:1},algorithm).path.length,0,algorithm);
    const m=R.makeMap('office'),grid=R.buildCostmap(m,{radius:.6});
    assert.equal(R.plan(grid,m.start,m.goal,algorithm,.72,m).path.length,0,algorithm+' doorway');
    const same=R.plan(m,m.start,m.start,algorithm);assert.equal(same.path.length,1);assert.equal(same.cost,0);assert.equal(same.length,0);
  }
});
