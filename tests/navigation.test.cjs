const test=require('node:test'),assert=require('node:assert/strict'),R=require('../core.js');

test('mapping reads only scan evidence and leaves unobserved walls unknown',()=>{
  const m=R.makeMap('empty');m.cells[3*m.w+20]=1;
  const mapper=new R.OccupancyMapper(m),pose={x:3.5,y:3.5,theta:0};
  mapper.update(pose,R.lidar(m,pose));
  assert.equal(mapper.seen[3*m.w+20],0);assert.equal(mapper.grid().cells[3*m.w+20],0);
  const local={x:16.5,y:3.5,theta:0};mapper.update(local,R.lidar(m,local));
  assert.equal(mapper.seen[3*m.w+20],1);assert.equal(mapper.grid().cells[3*m.w+20],1);
  assert.ok(mapper.coverage>0&&mapper.coverage<1);
});

test('free observations clear stale occupancy and policies distinguish unknown cells',()=>{
  const m=R.makeMap('empty'),pose={x:5.5,y:10.5,theta:0},index=10*m.w+8;m.cells[index]=1;
  const mapper=new R.OccupancyMapper(m);mapper.update(pose,R.lidar(m,pose));assert.equal(mapper.grid().cells[index],1);
  m.cells[index]=0;for(let i=0;i<4;i++)mapper.update(pose,R.lidar(m,pose));assert.equal(mapper.grid().cells[index],0);
  const conservative=new R.OccupancyMapper(m,'conservative');assert.equal(conservative.grid().cells[20*m.w+28],1);
  assert.equal(new R.OccupancyMapper(m).grid().cells[20*m.w+28],0);
});

test('identical observations produce identical maps regardless of hidden world contents',()=>{
  const a=R.makeMap('empty'),b=R.makeMap('warehouse'),pose={x:3.5,y:3.5,theta:0},rays=R.lidar(a,pose);
  const one=new R.OccupancyMapper(a),two=new R.OccupancyMapper(b);one.update(pose,rays);two.update(pose,rays);
  assert.deepEqual(one.grid().cells,two.grid().cells);
});

test('exact segment clearance catches tiny corner contacts and preserves true gaps',()=>{
  const m=R.makeMap('empty');m.cells[10*m.w+10]=1;
  assert.equal(R.segmentClear(m,{x:11.5,y:9},{x:11.5,y:12},.5),false);
  assert.equal(R.segmentClear(m,{x:11.50001,y:9},{x:11.50001,y:12},.5),true);
  assert.equal(R.segmentClear(m,{x:9.9,y:9.9},{x:10.1,y:10.1},0),false);
});

test('dynamic-window commands respect acceleration and reject blocked rollouts',()=>{
  const m=R.makeMap('empty'),pose={x:3.5,y:3.5,theta:0},current={v:0,w:0},dt=1/60;
  const cmd=R.dynamicWindow(R,m,pose,current,{x:6,y:3.5},1.6,.36,dt);
  assert.ok(cmd.v>=0&&cmd.v<=dt+1e-9);assert.ok(Math.abs(cmd.w)<=3*dt+1e-9);
  const braking=R.dynamicWindow(R,m,pose,{v:2,w:0},{x:6,y:3.5},.4,.36,dt);assert.ok(braking.v>=2-dt-1e-9);assert.ok(braking.v<=2+dt+1e-9);
  m.cells[3*m.w+3]=1;const stopped=R.dynamicWindow(R,m,pose,current,{x:6,y:3.5},1.6,.36,dt);
  assert.equal(stopped.emergency,true);assert.equal(stopped.v,0);
});

test('grid carts move deterministically, preserve base occupancy and yield to robot',()=>{
  const m=R.makeMap('empty'),before=m.cells.slice(),a=R.createCarts(m),b=R.createCarts(m);assert.ok(a.length);
  for(let i=0;i<20;i++){R.advanceCarts(a,.5,{x:3.5,y:3.5},.36);R.advanceCarts(b,.5,{x:3.5,y:3.5},.36);}
  assert.deepEqual(a,b);assert.deepEqual(m.cells,before);
  assert.ok(R.worldWithCarts(m,a).cells.some((v,i)=>v&&!m.cells[i]));
  const cart={x:5,y:10,a:3,b:20,direction:1,elapsed:0};R.advanceCarts([cart],1,{x:6.5,y:10.5},.36);assert.equal(cart.x,5);
});

test('sensor DWA navigation discovers routes and completes with or without moving carts',()=>{
  for(const name of ['empty','warehouse','rooms'])for(const movingObstacles of [false,true]){
    const sim=new R.Simulation(R.makeMap(name),'astar',1.6,{navigation:'sensor',controller:'dwa',movingObstacles});sim.start();
    for(let i=0;i<12000&&sim.status==='running';i++){sim.step(1/60);assert.equal(R.collides(sim.worldMap,sim.pose.x,sim.pose.y,sim.clearance),false);}
    assert.equal(sim.status,'arrived',name+' carts='+movingObstacles+' '+sim.reason);assert.ok(sim.replans>0);
    assert.ok(sim.minClearance>=sim.settings.margin-1e-8);assert.ok(sim.peakAcceleration<=1+1e-7);
  }
});

test('conservative unknown policy reports an unreachable unobserved goal',()=>{
  const sim=new R.Simulation(R.makeMap('empty'),'astar',1.6,{navigation:'sensor',unknownPolicy:'conservative'});sim.start();
  assert.equal(sim.status,'blocked');assert.equal(sim.navigationState,'unreachable');assert.match(sim.reason,/unknown/);
});

test('stalled dynamic-window recovery is bounded and stops with a reason',()=>{
  const sim=new R.Simulation(R.makeMap('empty'),'astar',1.6,{controller:'dwa'});sim.start();
  // A zero-speed experiment is intentionally stalled, not a reachable-motion test.
  sim.speed=0;for(let i=0;i<40000&&sim.status==='running';i++)sim.step(1/60);
  assert.equal(sim.status,'blocked');assert.equal(sim.navigationState,'failed');assert.match(sim.reason,/limit reached/);
});

test('navigation settings validate and old defaults remain fully known and static',()=>{
  assert.equal(R.config().navigation,'known');assert.equal(R.config().movingObstacles,false);
  for(const settings of [{navigation:'bad'},{unknownPolicy:'bad'},{movingObstacles:'yes'}])assert.throws(()=>R.config(settings));
});
