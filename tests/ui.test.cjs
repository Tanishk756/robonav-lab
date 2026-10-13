// Dependency-free adapter smoke test. A minimal DOM double checks event wiring
// and rendering calls; it is deliberately NOT a substitute for browser QA.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function boot(extra={}){
  const handlers={},raf=[],downloads=[],blobs=[],nodes=new Map();
  const drawing=new Proxy({}, {get:(_,k)=>k==='measureText'?()=>({width:10}):()=>{},set:()=>true});
  class Element{
    constructor(id=''){this.id=id;this.textContent='';this.children=[];this.style={};this.dataset={};this.events={};this.checked=true;this.disabled=false;this.hidden=false;this.classList={toggle(){}};}
    set value(v){this._value=this.options&&!this.options.some(o=>o.value===String(v))?'':v;}get value(){return this._value;}
    getContext(){return drawing;}append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}setAttribute(k,v){this[k]=v;}getAttribute(k){return this[k];}
    addEventListener(k,v){this.events[k]=v;}click(){this.onclick?.();if(this.download)downloads.push(this.download);}focus(){}setPointerCapture(){}
    showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return {left:0,top:0,width:960,height:720};}toDataURL(){return 'data:image/png,';}
  }
  for(const match of html.matchAll(/id="([^"]+)"/g))nodes.set(match[1],new Element(match[1]));
  for(const match of html.matchAll(/<select id="([^"]+)">([\s\S]*?)<\/select>/g)){nodes.get(match[1]).options=[...match[2].matchAll(/<option value="([^"]+)">/g)].map(o=>({value:o[1]}));}
  nodes.get('example').value='warehouse';nodes.get('algorithm').value='astar';nodes.get('speed').value='1.6';nodes.get('scenario').value='warehouse';
  for(const [id,value] of Object.entries({controller:'waypoint',radius:'0.24',margin:'0.12',lookahead:'0.9',softBand:'1.5',costWeight:'2',costDecay:'2',navigation:'known',unknownPolicy:'optimistic'}))nodes.get(id).value=value;
  nodes.get('challenge').value='fit';nodes.get('replayTime').value='0';nodes.get('comparisonTime').value='0';nodes.get('usageOptIn').checked=false;nodes.get('movingObstacles').checked=false;nodes.get('showObserved').checked=false;
  const buttons=['wall','erase','start','goal'].map(t=>{const b=new Element();b.dataset.tool=t;return b;});
  const document={getElementById:id=>{assert.ok(nodes.has(id),'unknown DOM id '+id);return nodes.get(id);},querySelectorAll:()=>buttons,createElement:()=>new Element(),createTextNode:t=>t,addEventListener:(k,v)=>handlers[k]=v};
  const context={window:{RoboNav:require('../core.js'),RoboNavSharing:require('../sharing.js'),RoboNavShowcase:require('../showcase.js'),location:{protocol:'file:',hash:'',href:'file:///index.html'}},document,navigator:{userAgent:'DOM-double'},requestAnimationFrame:f=>raf.push(f),setTimeout:()=>1,clearTimeout(){},Blob,URL:{createObjectURL:blob=>{blobs.push(blob);return ''},revokeObjectURL(){}},console,...extra};
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8'),context);
  return {nodes,raf,buttons,downloads,handlers,blobs};
}
test('UI initializes, runs, pauses, replans, compares, exports, and resets',()=>{
  const {nodes:n,raf,downloads}=boot();
  assert.equal(n.get('status').textContent,'Ready to navigate');
  assert.match(n.get('inflationValue').textContent,/Obstacle inflation: 0\.36 m/);
  n.get('run').click();assert.equal(n.get('status').textContent,'Mission in progress');
  for(let i=0;i<180;i++)raf.shift()(i*1000/60);
  assert.notEqual(n.get('poseX').textContent,'3.50 m');
  n.get('obstacle').click();assert.equal(n.get('replans').textContent,1);
  n.get('run').click();assert.equal(n.get('status').textContent,'Mission paused');
  n.get('compare').click();assert.equal(n.get('results').children.length,5);assert.equal(n.get('exportResults').disabled,false);
  n.get('exportResults').click();n.get('exportTelemetry').click();n.get('saveMap').click();n.get('snapshot').click();assert.equal(downloads.length,4);
  n.get('help').click();assert.equal(n.get('guide').open,true);n.get('closeGuide').click();assert.equal(n.get('guide').open,false);
  n.get('reset').click();assert.equal(n.get('poseX').textContent,'3.50 m');assert.equal(n.get('status').textContent,'Ready to navigate');
});
test('map editor and preset controls invalidate comparison and change route',()=>{
  const {nodes:n,buttons}=boot();n.get('compare').click();
  buttons.find(b=>b.dataset.tool==='wall').click();
  const map=n.get('map');map.events.pointerdown({button:0,pointerId:1,clientX:165,clientY:165});map.events.pointerup();
  assert.equal(n.get('exportResults').disabled,true);
  n.get('scenario').value='corridors';n.get('scenario').onchange();
  n.get('algorithm').value='dijkstra';n.get('algorithm').onchange();assert.equal(n.get('status').textContent,'Ready to navigate');
  n.get('speed').value='3';n.get('speed').oninput();assert.equal(n.get('speedValue').textContent,'3.0 m/s');
});
test('invalid map import gives a readable error and preserves the app',async()=>{
  const {nodes:n}=boot();await n.get('mapFile').onchange({target:{files:[{size:2,text:async()=>'{}'}],value:'bad.json'}});
  assert.match(n.get('toast').textContent,/Import failed/);assert.equal(n.get('status').textContent,'Ready to navigate');
});
test('robot configuration resets mission and controller comparison exports results',()=>{
  const {nodes:n,downloads}=boot();n.get('controller').value='pursuit';n.get('controller').onchange();
  n.get('compareControllers').click();assert.equal(n.get('controllerResults').children.length,3);
  n.get('exportControllers').click();assert.ok(downloads.includes('robonav-controller-comparison.csv'));
  n.get('radius').value='0.6';n.get('radius').onchange();assert.equal(n.get('exportControllers').disabled,true);
  assert.match(n.get('inflationValue').textContent,/Robot safety radius: 0\.72 m/);
  n.get('radius').value='NaN';n.get('radius').onchange();assert.match(n.get('toast').textContent,/Invalid radius/);
});
test('map import restores robot settings and accepts legacy maps',async()=>{
  const {nodes:n}=boot(),R=require('../core.js');
  const data={...R.makeMap('empty'),robot:{controller:'pursuit',radius:.4,margin:.2,lookahead:1.2},speed:2,algorithm:'dijkstra'};
  await n.get('mapFile').onchange({target:{files:[{size:4000,text:async()=>JSON.stringify(data)}],value:'map.json'}});
  assert.equal(n.get('controller').value,'pursuit');assert.equal(n.get('radius').value,.4);assert.equal(n.get('algorithm').value,'dijkstra');
  await n.get('mapFile').onchange({target:{files:[{size:4000,text:async()=>JSON.stringify(R.makeMap('empty'))}],value:'legacy.json'}});
  assert.equal(n.get('controller').value,'waypoint');assert.equal(n.get('radius').value,.24);
  assert.equal(n.get('softBand').value,1.5);assert.equal(n.get('costWeight').value,2);
});

test('costmap controls, weighted comparison and versioned settings round trip',async()=>{
  const {nodes:n,blobs,raf}=boot();
  n.get('costWeight').value='8';n.get('costWeight').onchange();
  n.get('softBand').value='3';n.get('softBand').onchange();
  n.get('costDecay').value='1';n.get('costDecay').onchange();
  n.get('showCostmap').checked=false;raf.shift()(1000);
  n.get('showCostmap').checked=true;raf.shift()(1017);
  n.get('compare').click();assert.equal(n.get('results').children[0].children.length,6);
  n.get('exportResults').click();const csv=await blobs.at(-1).text();assert.match(csv,/weighted_cost/);assert.match(csv,/costmap_build_ms/);
  n.get('saveMap').click();const saved=JSON.parse(await blobs.at(-1).text());
  assert.equal(saved.settingsVersion,3);assert.equal(saved.robot.costWeight,8);assert.equal(saved.robot.softBand,3);
  n.get('costWeight').value='0';n.get('costWeight').onchange();
  await n.get('mapFile').onchange({target:{files:[{size:5000,text:async()=>JSON.stringify(saved)}],value:'saved.json'}});
  assert.equal(n.get('costWeight').value,8);assert.equal(n.get('softBand').value,3);assert.equal(n.get('costDecay').value,1);
  n.get('costWeight').value='-1';n.get('costWeight').onchange();assert.match(n.get('toast').textContent,/Invalid costWeight/);assert.equal(n.get('costWeight').value,8);
});


test('new planner selections and environments work and import/export preserves planner',async()=>{
  const {nodes:n,blobs}=boot();
  for(const name of ['office','slalom','rooms','loading'])for(const planner of ['weighted','greedy','bfs']){
    n.get('scenario').value=name;n.get('scenario').onchange();
    n.get('algorithm').value=planner;n.get('algorithm').onchange();
    assert.equal(n.get('status').textContent,'Ready to navigate');
  }
  n.get('saveMap').click();const data=JSON.parse(await blobs.at(-1).text());assert.equal(data.algorithm,'bfs');assert.equal(data.name,'loading');
  await n.get('mapFile').onchange({target:{files:[{size:5000,text:async()=>JSON.stringify(data)}],value:'map.json'}});
  assert.equal(n.get('algorithm').value,'bfs');n.get('compare').click();assert.equal(n.get('results').children.length,5);
});


test('real HTML select options exactly match engine planner and environment catalogs',()=>{
  const R=require('../core.js');
  for(const [id,catalog] of [['algorithm',R.PLANNERS],['scenario',R.ENVIRONMENTS],['controller',R.CONTROLLERS],['example',require('../sharing.js').EXAMPLES],['challenge',require('../showcase.js').CHALLENGES]]){
    const select=html.match(new RegExp('<select id="'+id+'">([\\s\\S]*?)</select>'));
    assert.ok(select,'missing '+id);const values=[...select[1].matchAll(/<option value="([^"]+)">/g)].map(m=>m[1]);
    assert.deepEqual(values,Object.keys(catalog));assert.equal(new Set(values).size,values.length);
  }
  const {nodes:n}=boot();n.get('algorithm').value='missing';assert.equal(n.get('algorithm').value,'');
});


test('sensor mode, moving carts and DWA settings survive version-three export/import',async()=>{
  const {nodes:n,blobs}=boot();n.get('navigation').value='sensor';n.get('navigation').onchange();
  n.get('controller').value='dwa';n.get('controller').onchange();n.get('movingObstacles').checked=true;n.get('movingObstacles').onchange();
  n.get('saveMap').click();const saved=JSON.parse(await blobs.at(-1).text());assert.equal(saved.settingsVersion,3);
  assert.equal(saved.robot.navigation,'sensor');assert.equal(saved.robot.controller,'dwa');assert.equal(saved.robot.movingObstacles,true);
  await n.get('mapFile').onchange({target:{files:[{size:5000,text:async()=>JSON.stringify(saved)}],value:'sensor.json'}});
  assert.equal(n.get('navigation').value,'sensor');assert.equal(n.get('controller').value,'dwa');assert.equal(n.get('movingObstacles').checked,true);
});


test('worker comparisons stay asynchronous and discard stale responses',()=>{
  let worker;
  class FakeWorker{constructor(){worker=this;this.messages=[];}postMessage(data){this.messages.push(data);}terminate(){}}
  const {nodes:n}=boot({Worker:FakeWorker});n.get('compare').click();assert.equal(n.get('compare').disabled,true);
  const stale=worker.messages[0];n.get('costWeight').value='4';n.get('costWeight').onchange();
  worker.onmessage({data:{id:stale.id,result:require('../core.js').comparePlanners(stale.map,stale.settings)}});
  assert.equal(n.get('exportResults').disabled,true);assert.equal(n.get('compare').disabled,false);
  n.get('compare').click();const current=worker.messages.at(-1);
  worker.onmessage({data:{id:current.id,result:require('../core.js').comparePlanners(current.map,current.settings)}});
  assert.equal(n.get('results').children.length,5);assert.equal(n.get('exportResults').disabled,false);
});


test('worker failure falls back to the same comparison engine',()=>{
  let worker;
  class FailingWorker{constructor(){worker=this;}postMessage(){}terminate(){}}
  const {nodes:n}=boot({Worker:FailingWorker});n.get('compare').click();worker.onerror();
  assert.equal(n.get('compare').disabled,false);assert.equal(n.get('results').children.length,5);
  assert.equal(n.get('exportResults').disabled,false);
});


test('gallery loads sensor settings and sharing preserves a custom experiment',async()=>{
  const {nodes:n,blobs}=boot();n.get('example').value='discovery';n.get('example').onchange();n.get('loadExample').click();
  assert.equal(n.get('navigation').value,'sensor');assert.equal(n.get('controller').value,'dwa');assert.equal(n.get('showObserved').checked,true);
  await n.get('shareExperiment').onclick();const link=n.get('shareLink').value;assert.ok(link.startsWith('https://tanishk756.github.io/robonav-lab/#experiment='));
  const e=require('../sharing.js').decode(require('../core.js'),link.split('#experiment=')[1]);assert.equal(e.robot.navigation,'sensor');
  n.get('downloadReport').click();const report=JSON.parse(await blobs.at(-1).text());assert.equal(report.version,'1.5.0');assert.equal(report.experiment.robot.controller,'dwa');
});

test('shared links load on startup and malformed links leave a usable default scene',()=>{
  const S=require('../sharing.js'),R=require('../core.js'),token=S.encode(R,S.example(R,'carts'));
  const valid=boot({window:{RoboNav:R,RoboNavSharing:S,RoboNavShowcase:require('../showcase.js'),location:{protocol:'https:',hostname:'tanishk756.github.io',href:S.PUBLIC_URL+'#experiment='+token,hash:'#experiment='+token}}});
  assert.equal(valid.nodes.get('navigation').value,'sensor');assert.equal(valid.nodes.get('movingObstacles').checked,true);
  const bad=boot({window:{RoboNav:R,RoboNavSharing:S,RoboNavShowcase:require('../showcase.js'),location:{protocol:'https:',hostname:'tanishk756.github.io',href:S.PUBLIC_URL,hash:'#experiment=bad'}}});
  assert.match(bad.nodes.get('toast').textContent,/Shared link rejected/);assert.equal(bad.nodes.get('status').textContent,'Ready to navigate');
});


test('guided demo injects an obstacle, compares routes and pauses with recorded replay',()=>{
  const {nodes:n,raf,downloads}=boot();n.get('startDemo').click();
  assert.equal(n.get('status').textContent,'Mission in progress');
  for(let i=0;i<420;i++)raf.shift()(i*1000/60);
  assert.equal(n.get('status').textContent,'Mission paused');assert.ok(Number(n.get('replans').textContent)>0);
  assert.equal(n.get('results').children.length,5);assert.match(n.get('demoText').textContent,/Demo complete/);
  assert.ok(Number(n.get('replayTime').max)>10);const pose=n.get('poseX').textContent;
  n.get('replayTime').value='0';n.get('replayTime').oninput();raf.shift()(8000);assert.match(n.get('replayLabel').textContent,/Replay/);
  n.get('exitReplay').click();raf.shift()(8200);assert.equal(n.get('poseX').textContent,pose);
  n.get('downloadCard').click();n.get('downloadHtml').click();assert.ok(downloads.includes('robonav-result-card.png'));assert.ok(downloads.includes('robonav-report.html'));
});

test('challenge settings are shareable and counters require explicit opt in',async()=>{
  const {nodes:n,blobs}=boot();n.get('challenge').value='safe';n.get('loadChallenge').click();assert.equal(n.get('margin').value,.3);
  await n.get('shareExperiment').onclick();const shared=require('../sharing.js').decode(require('../core.js'),n.get('shareLink').value.split('#experiment=')[1]);assert.equal(shared.challenge,'safe');
  n.get('exportUsage').click();assert.deepEqual(JSON.parse(await blobs.at(-1).text()).counts,{});
  n.get('usageOptIn').checked=true;n.get('usageOptIn').onchange();await n.get('shareExperiment').onclick();n.get('exportUsage').click();assert.equal(JSON.parse(await blobs.at(-1).text()).counts.share,1);
  n.get('usageOptIn').checked=false;n.get('usageOptIn').onchange();n.get('exportUsage').click();assert.deepEqual(JSON.parse(await blobs.at(-1).text()).counts,{});
});
