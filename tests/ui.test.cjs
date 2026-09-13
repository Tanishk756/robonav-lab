// Dependency-free adapter smoke test. A minimal DOM double checks event wiring
// and rendering calls; it is deliberately NOT a substitute for browser QA.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function boot(){
  const handlers={},raf=[],downloads=[],nodes=new Map();
  const drawing=new Proxy({}, {get:(_,k)=>k==='measureText'?()=>({width:10}):()=>{},set:()=>true});
  class Element{
    constructor(id=''){this.id=id;this.textContent='';this.children=[];this.style={};this.dataset={};this.events={};this.checked=true;this.disabled=false;this.hidden=false;this.classList={toggle(){}};}
    getContext(){return drawing;}append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}setAttribute(k,v){this[k]=v;}
    addEventListener(k,v){this.events[k]=v;}click(){this.onclick?.();if(this.download)downloads.push(this.download);}focus(){}setPointerCapture(){}
    showModal(){this.open=true;}close(){this.open=false;}getBoundingClientRect(){return {left:0,top:0,width:960,height:720};}toDataURL(){return 'data:image/png,';}
  }
  for(const match of html.matchAll(/id="([^"]+)"/g))nodes.set(match[1],new Element(match[1]));
  nodes.get('algorithm').value='astar';nodes.get('speed').value='1.6';nodes.get('scenario').value='warehouse';
  for(const [id,value] of Object.entries({controller:'waypoint',radius:'0.24',margin:'0.12',lookahead:'0.9'}))nodes.get(id).value=value;
  const buttons=['wall','erase','start','goal'].map(t=>{const b=new Element();b.dataset.tool=t;return b;});
  const document={getElementById:id=>{assert.ok(nodes.has(id),'unknown DOM id '+id);return nodes.get(id);},querySelectorAll:()=>buttons,createElement:()=>new Element(),createTextNode:t=>t,addEventListener:(k,v)=>handlers[k]=v};
  const context={window:{RoboNav:require('../core.js')},document,navigator:{userAgent:'DOM-double'},requestAnimationFrame:f=>raf.push(f),setTimeout:()=>1,clearTimeout(){},Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}},console};
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8'),context);
  return {nodes,raf,buttons,downloads,handlers};
}
test('UI initializes, runs, pauses, replans, compares, exports, and resets',()=>{
  const {nodes:n,raf,downloads}=boot();
  assert.equal(n.get('status').textContent,'Ready to navigate');
  n.get('run').click();assert.equal(n.get('status').textContent,'Mission in progress');
  for(let i=0;i<180;i++)raf.shift()(i*1000/60);
  assert.notEqual(n.get('poseX').textContent,'3.50 m');
  n.get('obstacle').click();assert.equal(n.get('replans').textContent,1);
  n.get('run').click();assert.equal(n.get('status').textContent,'Mission paused');
  n.get('compare').click();assert.equal(n.get('results').children.length,2);assert.equal(n.get('exportResults').disabled,false);
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
  n.get('compareControllers').click();assert.equal(n.get('controllerResults').children.length,2);
  n.get('exportControllers').click();assert.ok(downloads.includes('robonav-controller-comparison.csv'));
  n.get('radius').value='0.6';n.get('radius').onchange();assert.equal(n.get('exportControllers').disabled,true);
  n.get('radius').value='NaN';n.get('radius').onchange();assert.match(n.get('toast').textContent,/Invalid radius/);
});
test('map import restores robot settings and accepts legacy maps',async()=>{
  const {nodes:n}=boot(),R=require('../core.js');
  const data={...R.makeMap('empty'),robot:{controller:'pursuit',radius:.4,margin:.2,lookahead:1.2},speed:2,algorithm:'dijkstra'};
  await n.get('mapFile').onchange({target:{files:[{size:4000,text:async()=>JSON.stringify(data)}],value:'map.json'}});
  assert.equal(n.get('controller').value,'pursuit');assert.equal(n.get('radius').value,.4);assert.equal(n.get('algorithm').value,'dijkstra');
  await n.get('mapFile').onchange({target:{files:[{size:4000,text:async()=>JSON.stringify(R.makeMap('empty'))}],value:'legacy.json'}});
  assert.equal(n.get('controller').value,'waypoint');assert.equal(n.get('radius').value,.24);
});
