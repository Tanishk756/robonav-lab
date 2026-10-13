const test=require('node:test'),assert=require('node:assert/strict'),R=require('../core.js'),S=require('../sharing.js');

test('every map and settings combination round trips through a compact share token',()=>{
  for(const name of Object.keys(R.ENVIRONMENTS))for(const algorithm of Object.keys(R.PLANNERS)){
    const source={...R.makeMap(name),name:'Experiment \u2603',algorithm,speed:2,robot:{controller:'dwa',navigation:'sensor',movingObstacles:true}};
    const normalized=S.validateExperiment(R,source),token=S.encode(R,source);
    assert.ok(token.length<2000);assert.match(token,/^[A-Za-z0-9_-]+$/);assert.deepEqual(S.decode(R,token),normalized);
  }
});

test('custom edited occupancy and endpoints are preserved exactly',()=>{
  const m=R.makeMap('empty');m.cells[10*m.w+15]=1;m.start={x:4,y:4};m.goal={x:26,y:19};
  const copy=S.decode(R,S.encode(R,m));assert.deepEqual(copy.cells,m.cells);assert.deepEqual(copy.start,m.start);assert.deepEqual(copy.goal,m.goal);
});

test('malformed, oversized and unsupported links are rejected without execution',()=>{
  for(const token of ['', 'a', '%%%', 'a'.repeat(6001),Buffer.from('null').toString('base64url'),Buffer.from('{"v":99}').toString('base64url')])assert.throws(()=>S.decode(R,token));
  for(const data of [null,[],{...R.makeMap('empty'),speed:NaN},{...R.makeMap('empty'),algorithm:'bad'},{...R.makeMap('empty'),robot:[]},{...R.makeMap('empty'),settingsVersion:999}])assert.throws(()=>S.validateExperiment(R,data));
  assert.throws(()=>S.example(R,'__proto__'));
});

test('gallery examples are valid and intended failure cases explain their constraints',()=>{
  for(const id of Object.keys(S.EXAMPLES))assert.doesNotThrow(()=>S.example(R,id));
  const failure=S.example(R,'clearance'),sim=new R.Simulation(failure,failure.algorithm,failure.speed,failure.robot);sim.start();assert.equal(sim.status,'blocked');
  const unknown=S.example(R,'unknown'),observed=new R.Simulation(unknown,unknown.algorithm,unknown.speed,unknown.robot);observed.start();assert.equal(observed.status,'blocked');
});
