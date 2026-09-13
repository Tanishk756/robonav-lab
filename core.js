/* RoboNav Lab: dependency-free robotics engine. Units: metres, seconds, radians.
 * One grid cell = one metre. CommonJS export permits the same code to be tested
 * with Node and loaded by a classic browser script (including file://).
 */
(function (root) {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const center=p=>({x:p.x+.5,y:p.y+.5});
  const blocked=(m,x,y)=>x<0||y<0||x>=m.w||y>=m.h||m.cells[y*m.w+x]===1;
  const now=()=>typeof performance!=='undefined'?performance.now():Date.now();

  class Heap {
    constructor(){this.a=[];}
    push(n){let i=this.a.push(n)-1;while(i>0){const p=(i-1)>>1;if(this.a[p].f<=n.f)break;this.a[i]=this.a[p];i=p;}this.a[i]=n;}
    pop(){const first=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(2*i+1<this.a.length){let c=2*i+1;if(c+1<this.a.length&&this.a[c+1].f<this.a[c].f)c++;if(last.f<=this.a[c].f)break;this.a[i]=this.a[c];i=c;}this.a[i]=last;}return first;}
  }

  function makeMap(name='warehouse') {
    const w=32,h=24,cells=Array(w*h).fill(0);
    const rect=(x,y,rw,rh)=>{for(let j=y;j<y+rh;j++)for(let i=x;i<x+rw;i++)cells[j*w+i]=1;};
    rect(0,0,w,1);rect(0,h-1,w,1);rect(0,0,1,h);rect(w-1,0,1,h);
    if(name==='warehouse')for(const x of [7,14,21])for(const y of [4,13])rect(x,y,3,6);
    if(name==='corridors'){rect(8,1,1,17);rect(16,6,1,17);rect(24,1,1,17);}
    if(name==='clutter'){
      let seed=731;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      for(let i=0;i<65;i++){const x=4+Math.floor(random()*24),y=3+Math.floor(random()*18);rect(x,y,1,1);}
    }
    return {version:1,name,w,h,cells,start:{x:3,y:3},goal:{x:28,y:20}};
  }
  function validateMap(m) {
    if(!m||m.w!==32||m.h!==24||!Array.isArray(m.cells)||m.cells.length!==768||m.cells.some(c=>c!==0&&c!==1))throw Error('Map must contain a 32 × 24 grid of 0/1 cells.');
    for(const key of ['start','goal']){const p=m[key];if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||blocked(m,p.x,p.y))throw Error('Start and goal must be inside free cells.');}
    if(dist(m.start,m.goal)===0)throw Error('Choose different start and goal cells.');
    return {version:1,name:typeof m.name==='string'?m.name.slice(0,60):'Imported map',w:m.w,h:m.h,cells:m.cells.slice(),start:{...m.start},goal:{...m.goal}};
  }

  /** Optimal 8-connected search; diagonals cannot pass between blocked corners. */
  function plan(m,start,goal,algorithm='astar') {
    const began=now(),empty=()=>({path:[],cost:Infinity,expanded:[],ms:now()-began});
    if(blocked(m,start.x,start.y)||blocked(m,goal.x,goal.y))return empty();
    const id=p=>p.y*m.w+p.x,s=id(start),t=id(goal),n=m.w*m.h;
    const g=new Float64Array(n).fill(Infinity),parent=new Int32Array(n).fill(-1),closed=new Uint8Array(n),open=new Heap(),expanded=[];
    const h=(x,y)=>{const dx=Math.abs(x-goal.x),dy=Math.abs(y-goal.y);return algorithm==='dijkstra'?0:Math.max(dx,dy)+(Math.SQRT2-1)*Math.min(dx,dy);};
    g[s]=0;open.push({id:s,f:h(start.x,start.y)});
    while(open.a.length){
      const u=open.pop().id;if(closed[u])continue;closed[u]=1;
      const x=u%m.w,y=Math.floor(u/m.w);expanded.push({x,y});
      if(u===t){const path=[];for(let v=t;v!==-1;v=parent[v])path.push({x:v%m.w,y:Math.floor(v/m.w)});return {path:path.reverse(),cost:g[t],expanded,ms:now()-began};}
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if((!dx&&!dy)||blocked(m,x+dx,y+dy))continue;
        if(dx&&dy&&(blocked(m,x+dx,y)||blocked(m,x,y+dy)))continue;
        const v=(y+dy)*m.w+x+dx,c=g[u]+(dx&&dy?Math.SQRT2:1);
        if(c<g[v]){g[v]=c;parent[v]=u;open.push({id:v,f:c+h(x+dx,y+dy)});}
      }
    }
    return {path:[],cost:Infinity,expanded,ms:now()-began};
  }

  /** Grid DDA raycast: exact intersection with axis-aligned cell boundaries. */
  function raycast(m,x,y,angle,range=8) {
    const dx=Math.cos(angle),dy=Math.sin(angle),sx=dx>=0?1:-1,sy=dy>=0?1:-1;
    let ix=Math.floor(x),iy=Math.floor(y),t=0;
    if(blocked(m,ix,iy))return {x,y,distance:0,hit:true};
    const tx=Math.abs(dx)<1e-12?Infinity:Math.abs(1/dx),ty=Math.abs(dy)<1e-12?Infinity:Math.abs(1/dy);
    let mx=tx===Infinity?Infinity:((sx>0?ix+1-x:x-ix)*tx),my=ty===Infinity?Infinity:((sy>0?iy+1-y:y-iy)*ty);
    while(t<=range){
      if(mx<my){t=mx;mx+=tx;ix+=sx;}else{t=my;my+=ty;iy+=sy;}
      if(t>range)break;
      if(blocked(m,ix,iy))return {x:x+t*dx,y:y+t*dy,distance:t,hit:true};
    }
    return {x:x+range*dx,y:y+range*dy,distance:range,hit:false};
  }
  function lidar(m,pose,count=72,range=8){return Array.from({length:count},(_,i)=>raycast(m,pose.x,pose.y,pose.theta+i*2*Math.PI/count,range));}

  function collides(m,x,y,r=.24){
    for(let j=Math.floor(y-r);j<=Math.floor(y+r);j++)for(let i=Math.floor(x-r);i<=Math.floor(x+r);i++){
      if(blocked(m,i,j)&&Math.hypot(x-clamp(x,i,i+1),y-clamp(y,j,j+1))<=r)return true;
    }return false;
  }
  /** Exact differential-drive integration, wheel velocities in m/s. */
  function integrate(p,left,right,track,dt){
    const v=(left+right)/2,w=(right-left)/track,a=p.theta+w*dt;
    if(Math.abs(w)<1e-9)return {x:p.x+v*Math.cos(p.theta)*dt,y:p.y+v*Math.sin(p.theta)*dt,theta:wrap(a)};
    return {x:p.x+v/w*(Math.sin(a)-Math.sin(p.theta)),y:p.y-v/w*(Math.cos(a)-Math.cos(p.theta)),theta:wrap(a)};
  }
  function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}

  class Simulation {
    constructor(map,algorithm='astar',speed=1.6){this.map=validateMap(map);this.algorithm=algorithm;this.speed=speed;this.reset();}
    reset(){
      this.pose={...center(this.map.start),theta:0};this.status='ready';this.path=[];this.expanded=[];this.target=1;
      this.time=0;this.distance=0;this.replans=0;this.planMs=0;this.cost=0;this.v=0;this.omega=0;this.left=0;this.right=0;
      this.errorSq=0;this.samples=0;this.error=0;this.trail=[{...this.pose}];this.telemetry=[];this.lastSample=-1;this.events=[];
    }
    log(message){this.events.unshift({time:this.time,message});this.events=this.events.slice(0,30);}
    compute(){
      const s={x:Math.floor(this.pose.x),y:Math.floor(this.pose.y)},p=plan(this.map,s,this.map.goal,this.algorithm);
      this.path=p.path;this.expanded=p.expanded;this.planMs=p.ms;this.cost=p.cost;this.target=0;
      if(!p.path.length){this.status='blocked';this.v=this.omega=this.left=this.right=0;this.log('No route to goal. Edit the map and plan again.');return false;}
      this.log(`${this.algorithm==='astar'?'A*':'Dijkstra'}: ${p.expanded.length} cells expanded, ${p.cost.toFixed(2)} m route`);return true;
    }
    start(){if(this.status==='arrived')this.reset();if(this.status==='paused'){this.status='running';return;}if(this.compute())this.status='running';}
    replan(){this.replans++;const wasRunning=this.status==='running';if(this.compute())this.status=wasRunning?'running':'ready';}
    get rmse(){return this.samples?Math.sqrt(this.errorSq/this.samples):0;}
    step(dt){
      if(this.status!=='running')return;
      dt=clamp(dt,0,.05);
      const goal=center(this.map.goal);
      if(dist(this.pose,goal)<.12){this.status='arrived';this.v=this.omega=this.left=this.right=0;this.log('Goal reached. Mission complete.');return;}
      while(this.target<this.path.length-1&&dist(this.pose,center(this.path[this.target]))<.09)this.target++;
      const target=center(this.path[this.target]),d=dist(this.pose,target),e=wrap(Math.atan2(target.y-this.pose.y,target.x-this.pose.x)-this.pose.theta);
      // Rotate first on sharp turns; reduce forward speed near each waypoint.
      const v=Math.abs(e)>.38?0:Math.min(this.speed,2.8*d)*Math.max(0,Math.cos(e));
      const w=clamp(4.5*e,-2.5,2.5),track=.42;
      this.left=v-w*track/2;this.right=v+w*track/2;
      const next=integrate(this.pose,this.left,this.right,track,dt);
      if(collides(this.map,next.x,next.y)){this.status='blocked';this.v=this.omega=this.left=this.right=0;this.log('Collision guard stopped the robot. Change the map, then replan.');return;}
      this.distance+=dist(this.pose,next);this.pose=next;this.v=v;this.omega=w;this.time+=dt;
      this.error=Infinity;
      for(let i=1;i<this.path.length;i++)this.error=Math.min(this.error,segmentDistance(this.pose,center(this.path[i-1]),center(this.path[i])));
      if(!Number.isFinite(this.error))this.error=dist(this.pose,goal);
      this.errorSq+=this.error*this.error;this.samples++;
      if(this.time-this.lastSample>=.1){this.lastSample=this.time;this.trail.push({...this.pose});this.telemetry.push({time:this.time,x:this.pose.x,y:this.pose.y,theta:this.pose.theta,v,w,left:this.left,right:this.right,error:this.error});}
    }
  }
  const api={makeMap,validateMap,plan,raycast,lidar,collides,integrate,Simulation,center,dist,blocked};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RoboNav=api;
})(typeof globalThis!=='undefined'?globalThis:this);
