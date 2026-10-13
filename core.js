/* RoboNav Lab: dependency-free robotics engine. Units: metres, seconds, radians.
 * One grid cell = one metre. CommonJS export permits the same code to be tested
 * with Node and loaded by a classic browser script (including file://).
 */
(function (root) {
  'use strict';
  const N=typeof module!=='undefined'&&module.exports?require('./navigation.js'):root.RoboNavNavigation;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const center=p=>({x:p.x+.5,y:p.y+.5});
  const blocked=(m,x,y)=>x<0||y<0||x>=m.w||y>=m.h||m.cells[y*m.w+x]===1;
  const now=()=>typeof performance!=='undefined'?performance.now():Date.now();

  const CONTROLLERS={waypoint:'Waypoints',pursuit:'Guarded pursuit',dwa:'Dynamic window (DWA)'};
  const PLANNERS={astar:'A*',dijkstra:'Dijkstra',weighted:'Weighted A* (1.8)',greedy:'Greedy best-first',bfs:'Breadth-first',bidijkstra:'Bidirectional Dijkstra',bibfs:'Bidirectional BFS',fringe:'Fringe Search',theta:'Theta* (any-angle)',euclidean:'A* (Euclidean)',chebyshev:'A* (Chebyshev)'};
  const PLANNER_INFO={
    astar:'Octile heuristic; minimum weighted eight-connected grid cost.',
    dijkstra:'Uniform-cost search; minimum weighted grid cost.',
    weighted:'1.8 times octile heuristic; approximate weighted grid route.',
    greedy:'Heuristic-only best-first search; no cost or distance optimum.',
    bfs:'Minimum grid-edge count; ignores diagonal length and soft costs.',
    bidijkstra:'Two uniform-cost frontiers; minimum weighted grid cost.',
    bibfs:'Two breadth-first frontiers; minimum grid-edge count, not weighted cost.',
    fringe:'Iterative f-threshold frontier search; minimum weighted grid cost.',
    theta:'Any-angle parent shortcuts with collision checks; sampled soft line costs, no global optimum guarantee.',
    euclidean:'A* with a Euclidean lower bound; minimum weighted grid cost.',
    chebyshev:'A* with a Chebyshev lower bound; minimum weighted grid cost.'
  };
  const ENVIRONMENTS={warehouse:'Warehouse aisles',corridors:'Alternating corridors',clutter:'Seeded clutter (731)',empty:'Open floor',office:'Office suites',slalom:'Slalom barriers',rooms:'Four rooms',loading:'Loading dock'};

  class Heap {
    constructor(){this.a=[];}
    push(n){let i=this.a.push(n)-1;while(i>0){const p=(i-1)>>1;if(this.a[p].f<=n.f)break;this.a[i]=this.a[p];i=p;}this.a[i]=n;}
    pop(){const first=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(2*i+1<this.a.length){let c=2*i+1;if(c+1<this.a.length&&this.a[c+1].f<this.a[c].f)c++;if(last.f<=this.a[c].f)break;this.a[i]=this.a[c];i=c;}this.a[i]=last;}return first;}
  }

  function makeMap(name='warehouse') {
    if(!Object.hasOwn(ENVIRONMENTS,name))throw Error('Unknown environment.');
    const w=32,h=24,cells=Array(w*h).fill(0);
    const rect=(x,y,rw,rh)=>{for(let j=y;j<y+rh;j++)for(let i=x;i<x+rw;i++)cells[j*w+i]=1;};
    rect(0,0,w,1);rect(0,h-1,w,1);rect(0,0,1,h);rect(w-1,0,1,h);
    if(name==='warehouse')for(const x of [7,14,21])for(const y of [4,13])rect(x,y,3,6);
    if(name==='corridors'){rect(8,1,1,17);rect(16,6,1,17);rect(24,1,1,17);}
    if(name==='clutter'){
      let seed=731;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      for(let i=0;i<65;i++){const x=4+Math.floor(random()*24),y=3+Math.floor(random()*18);rect(x,y,1,1);}
    }
    if(name==='office'){
      for(const x of [10,21]){rect(x,1,1,22);for(const y of [5,17])cells[y*w+x]=0;}
      for(const y of [8,15]){rect(1,y,9,1);rect(22,y,9,1);cells[y*w+5]=0;cells[y*w+26]=0;}
      for(const x of [3,24])for(const y of [10,18])rect(x,y,2,2);
    }
    if(name==='slalom')for(const [x,y] of [[8,1],[15,7],[22,1]])rect(x,y,2,16);
    if(name==='rooms'){
      rect(16,1,1,22);rect(1,12,30,1);
      for(const y of [5,6,17,18])cells[y*w+16]=0;
      for(const x of [7,8,24,25])cells[12*w+x]=0;
    }
    if(name==='loading'){
      for(const x of [7,14,21]){rect(x,6,4,3);rect(x,15,4,3);}
      rect(27,6,4,2);rect(27,15,4,2);
    }
    return {version:1,name,w,h,cells,start:{x:3,y:3},goal:{x:28,y:20}};
  }
  function validateMap(m) {
    if(!m||m.w!==32||m.h!==24||!Array.isArray(m.cells)||m.cells.length!==768||m.cells.some(c=>c!==0&&c!==1))throw Error('Map must contain a 32 × 24 grid of 0/1 cells.');
    for(const key of ['start','goal']){const p=m[key];if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||blocked(m,p.x,p.y))throw Error('Start and goal must be inside free cells.');}
    if(dist(m.start,m.goal)===0)throw Error('Choose different start and goal cells.');
    return {version:1,name:typeof m.name==='string'?m.name.slice(0,60):'Imported map',w:m.w,h:m.h,cells:m.cells.slice(),start:{...m.start},goal:{...m.goal}};
  }

  /** Shared collision-checked graph. Any-angle Theta* additionally validates shortcuts. */
  function plan(m,start,goal,algorithm='astar',clearance=0,physicalMap=m) {
    if(!Object.hasOwn(PLANNERS,algorithm))throw Error('Unknown planner.');
    const began=now(),expanded=[],point=i=>({x:i%m.w,y:Math.floor(i/m.w)}),id=p=>p.y*m.w+p.x;
    const result=(path=[],cost=Infinity)=>({path,cost,length:path.length?path.slice(1).reduce((sum,p,i)=>sum+dist(p,path[i]),0):Infinity,expanded,ms:now()-began});
    if(blocked(m,start.x,start.y)||blocked(m,goal.x,goal.y))return result();
    if(clearance>0&&(collides(physicalMap,start.x+.5,start.y+.5,clearance)||collides(physicalMap,goal.x+.5,goal.y+.5,clearance)))return result();
    const s=id(start),t=id(goal),n=m.w*m.h;
    const h=u=>{const p=point(u),dx=Math.abs(p.x-goal.x),dy=Math.abs(p.y-goal.y);
      return algorithm==='dijkstra'?0:algorithm==='euclidean'||algorithm==='theta'?Math.hypot(dx,dy):algorithm==='chebyshev'?Math.max(dx,dy):Math.max(dx,dy)+(Math.SQRT2-1)*Math.min(dx,dy);};
    const edge=(u,v)=>dist(point(u),point(v))*(1+(m.weight??0)*((m.penalties?.[u]??0)+(m.penalties?.[v]??0))/2);
    const neighborCache=new Map();
    const neighbors=u=>{
      if(neighborCache.has(u))return neighborCache.get(u);
      const {x,y}=point(u),out=[];
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if((!dx&&!dy)||blocked(m,x+dx,y+dy))continue;
        if(dx&&dy&&(blocked(m,x+dx,y)||blocked(m,x,y+dy)))continue;
        if(clearance>0&&!segmentClear(physicalMap,{x:x+.5,y:y+.5},{x:x+dx+.5,y:y+dy+.5},clearance))continue;
        out.push((y+dy)*m.w+x+dx);
      }
      neighborCache.set(u,out);return out;
    };
    const trace=(parent,u)=>{const path=[];for(let v=u;v!==-1;v=parent[v])path.push(point(v));return path.reverse();};
    if(algorithm==='bidijkstra'||algorithm==='bibfs'){
      const steps=algorithm==='bibfs',g=[new Float64Array(n).fill(Infinity),new Float64Array(n).fill(Infinity)],parents=[new Int32Array(n).fill(-1),new Int32Array(n).fill(-1)],closed=[new Uint8Array(n),new Uint8Array(n)],open=[new Heap(),new Heap()];
      g[0][s]=0;g[1][t]=0;open[0].push({id:s,f:0});open[1].push({id:t,f:0});let best=Infinity,meet=-1,tie=0;
      const clean=k=>{while(open[k].a.length&&(closed[k][open[k].a[0].id]||open[k].a[0].f!==g[k][open[k].a[0].id]))open[k].pop();};
      while(true){
        clean(0);clean(1);if(!open[0].a.length||!open[1].a.length)break;
        if(open[0].a[0].f+open[1].a[0].f>=best)break;
        const f0=open[0].a[0].f,f1=open[1].a[0].f,k=f0===f1?(tie++%2):Number(f1<f0),other=1-k,u=open[k].pop().id;
        closed[k][u]=1;expanded.push(point(u));
        if(g[k][u]+g[other][u]<best){best=g[k][u]+g[other][u];meet=u;}
        for(const v of neighbors(u)){
          const c=g[k][u]+(steps?1:edge(u,v));
          if(!closed[k][v]&&c<g[k][v]){g[k][v]=c;parents[k][v]=u;open[k].push({id:v,f:c});}
          if(g[k][v]+g[other][v]<best){best=g[k][v]+g[other][v];meet=v;}
        }
      }
      if(meet<0)return result();
      const path=trace(parents[0],meet).concat(trace(parents[1],meet).reverse().slice(1));
      return result(path,path.slice(1).reduce((sum,p,i)=>sum+edge(id(path[i]),id(p)),0));
    }
    const g=new Float64Array(n).fill(Infinity),parent=new Int32Array(n).fill(-1);g[s]=0;
    if(algorithm==='fringe'){
      // Iterative f thresholds, retaining deferred nodes instead of a priority heap.
      let limit=h(s),current=[s];const processed=new Float64Array(n).fill(Infinity);
      while(current.length){
        let nextLimit=Infinity;const later=new Set();
        for(let i=0;i<current.length;i++){
          const u=current[i],f=g[u]+h(u);
          if(f>limit+1e-10){later.add(u);nextLimit=Math.min(nextLimit,f);continue;}
          if(g[u]>=processed[u])continue;processed[u]=g[u];expanded.push(point(u));
          if(u===t)return result(trace(parent,t),g[t]);
          for(const v of neighbors(u)){const c=g[u]+edge(u,v);if(c<g[v]){g[v]=c;parent[v]=u;current.push(v);}}
        }
        current=Array.from(later);limit=nextLimit;
      }
      return result();
    }
    const closed=new Uint8Array(n),hops=new Float64Array(n).fill(Infinity),open=new Heap();hops[s]=0;
    const priority=(cost,heuristic,steps)=>algorithm==='greedy'?heuristic:algorithm==='weighted'?cost+1.8*heuristic:algorithm==='bfs'?steps:cost+heuristic;
    open.push({id:s,f:priority(0,h(s),0),g:0});
    while(open.a.length){
      const entry=open.pop(),u=entry.id;if(closed[u])continue;closed[u]=1;expanded.push(point(u));
      if(u===t)return result(trace(parent,t),g[t]);
      for(const v of neighbors(u)){
        if(closed[v])continue;
        let from=u,c=g[u]+edge(u,v);
        if(algorithm==='theta'&&parent[u]!==-1){
          const ancestor=parent[u],a=center(point(ancestor)),b=center(point(v));
          if(segmentClear(m,a,b,0)&&segmentClear(physicalMap,a,b,clearance)){
            const candidate=g[ancestor]+shortcutCost(m,point(ancestor),point(v));
            if(candidate<c){from=ancestor;c=candidate;}
          }
        }
        if(algorithm==='bfs'?hops[u]+1<hops[v]:c<g[v]){g[v]=c;hops[v]=hops[u]+1;parent[v]=from;open.push({id:v,f:priority(c,h(v),hops[v]),g:c});}
      }
    }
    return result();
  }
  // Theta* line cost: exact length, midpoint quadrature of the cell penalty field
  // with <=0.25 m intervals. Adjacent grid edges retain the standard edge cost.
  function shortcutCost(m,a,b){
    const length=dist(a,b);
    if(length<=Math.SQRT2+1e-9)return length*(1+(m.weight??0)*((m.penalties?.[a.y*m.w+a.x]??0)+(m.penalties?.[b.y*m.w+b.x]??0))/2);
    const count=Math.ceil(length/.25);let sum=0;
    for(let i=0;i<count;i++){const t=(i+.5)/count,x=Math.floor(a.x+.5+(b.x-a.x)*t),y=Math.floor(a.y+.5+(b.y-a.y)*t);sum+=m.penalties?.[y*m.w+x]??0;}
    return length*(1+(m.weight??0)*sum/count);
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
    // Include the cell on the lower side when the footprint is exactly tangent
    // to an integer boundary. floor(x-r) alone would omit that occupied cell.
    for(let j=Math.ceil(y-r)-1;j<=Math.floor(y+r);j++)for(let i=Math.ceil(x-r)-1;i<=Math.floor(x+r);i++){
      if(blocked(m,i,j)&&Math.hypot(x-clamp(x,i,i+1),y-clamp(y,j,j+1))<=r)return true;
    }return false;
  }
  // Configuration space: an occupied cell means its centre cannot safely hold
  // the circular footprint. Edge checks also validate travel between centres.
  function inflateMap(m,clearance){
    return {...m,cells:m.cells.map((value,i)=>value||Number(collides(m,i%m.w+.5,Math.floor(i/m.w)+.5,clearance)))};
  }
  // Exact point-to-occupied-rectangle distance within the requested band.
  // Outside the map is occupied, even when imported maps omit boundary walls.
  function obstacleDistance(m,x,y,limit=Infinity){
    if(x<0||y<0||x>m.w||y>m.h)return 0;
    let best=Math.min(limit,x,y,m.w-x,m.h-y);
    for(let j=Math.max(0,Math.floor(y-best));j<=Math.min(m.h-1,Math.floor(y+best));j++)
      for(let i=Math.max(0,Math.floor(x-best));i<=Math.min(m.w-1,Math.floor(x+best));i++)
        if(m.cells[j*m.w+i])best=Math.min(best,Math.hypot(x-clamp(x,i,i+1),y-clamp(y,j,j+1)));
    return best;
  }
  function buildCostmap(m,options={}){
    const settings=config(options),clearance=settings.radius+settings.margin,began=now(),grid=inflateMap(m,clearance);
    const penalties=m.cells.map((_,i)=>{
      if(grid.cells[i]||settings.softBand===0)return 0;
      const d=obstacleDistance(m,i%m.w+.5,Math.floor(i/m.w)+.5,clearance+settings.softBand);
      return Math.pow(clamp(1-(d-clearance)/settings.softBand,0,1),settings.costDecay);
    });
    return {...grid,penalties,weight:settings.costWeight,buildMs:now()-began};
  }
  // Exact distance from a line segment to each nearby occupied rectangle.
  // Tangency counts as collision. Map exterior is occupied.
  function segmentClear(m,a,b,clearance){
    const r=clearance+1e-9;
    if(Math.min(a.x,b.x)<=r||Math.min(a.y,b.y)<=r||Math.max(a.x,b.x)>=m.w-r||Math.max(a.y,b.y)>=m.h-r)return false;
    for(let y=Math.max(0,Math.ceil(Math.min(a.y,b.y)-r)-1);y<=Math.min(m.h-1,Math.floor(Math.max(a.y,b.y)+r));y++)
      for(let x=Math.max(0,Math.ceil(Math.min(a.x,b.x)-r)-1);x<=Math.min(m.w-1,Math.floor(Math.max(a.x,b.x)+r));x++)if(m.cells[y*m.w+x]){
        let enter=0,leave=1;
        for(const [p,d,low] of [[a.x,b.x-a.x,x],[a.y,b.y-a.y,y]]){
          if(Math.abs(d)<1e-12){if(p<low||p>low+1){enter=1;leave=0;break;}}
          else {const t1=(low-p)/d,t2=(low+1-p)/d;enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));}
        }
        if(enter<=leave)return false;
        let distance=Math.min(Math.hypot(a.x-clamp(a.x,x,x+1),a.y-clamp(a.y,y,y+1)),Math.hypot(b.x-clamp(b.x,x,x+1),b.y-clamp(b.y,y,y+1)));
        for(const corner of [{x,y},{x:x+1,y},{x,y:y+1},{x:x+1,y:y+1}])distance=Math.min(distance,segmentDistance(corner,a,b));
        if(distance<=r)return false;
      }
    return true;
  }
  function config(options={}){
    const number=(name,fallback,min,max)=>{const v=options[name]??fallback;if(!Number.isFinite(v)||v<min||v>max)throw Error(`Invalid ${name}: use ${min}–${max}.`);return v;};
    const controller=options.controller??'waypoint';if(!Object.hasOwn(CONTROLLERS,controller))throw Error('Unknown controller.');
    const navigation=options.navigation??'known',unknownPolicy=options.unknownPolicy??'optimistic';
    if(!['known','sensor'].includes(navigation)||!['optimistic','conservative'].includes(unknownPolicy))throw Error('Invalid navigation mode or unknown policy.');
    if(options.movingObstacles!==undefined&&typeof options.movingObstacles!=='boolean')throw Error('Invalid movingObstacles.');
    return {navigation,unknownPolicy,movingObstacles:options.movingObstacles??false,controller,radius:number('radius',.24,.15,.7),margin:number('margin',.12,0,.3),lookahead:number('lookahead',.9,.4,1.6),softBand:number('softBand',1.5,0,5),costWeight:number('costWeight',2,0,20),costDecay:number('costDecay',2,.25,8)};
  }
  function pursuitTarget(p,path,from,lookahead){
    let best={distance:Infinity,index:from,t:0,point:path[from]};
    for(let i=from;i<Math.min(path.length-1,from+4);i++){
      const a=path[i],b=path[i+1],dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1),point={x:a.x+t*dx,y:a.y+t*dy};
      if(dist(p,point)<best.distance)best={distance:dist(p,point),index:i,t,point};
    }
    let point=best.point,left=lookahead;
    for(let i=best.index;i<path.length-1;i++){
      const end=path[i+1],length=dist(point,end);if(left<=length)return {index:best.index,point:{x:point.x+(end.x-point.x)*left/length,y:point.y+(end.y-point.y)*left/length}};
      left-=length;point=end;
    }
    return {index:best.index,point:path[path.length-1]};
  }
  /** Exact differential-drive integration, wheel velocities in m/s. */
  function integrate(p,left,right,track,dt){
    const v=(left+right)/2,w=(right-left)/track,a=p.theta+w*dt;
    if(Math.abs(w)<1e-9)return {x:p.x+v*Math.cos(p.theta)*dt,y:p.y+v*Math.sin(p.theta)*dt,theta:wrap(a)};
    return {x:p.x+v/w*(Math.sin(a)-Math.sin(p.theta)),y:p.y-v/w*(Math.cos(a)-Math.cos(p.theta)),theta:wrap(a)};
  }
  function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}

  class Simulation {
    constructor(map,algorithm='astar',speed=1.6,options={}){if(!Object.hasOwn(PLANNERS,algorithm))throw Error('Unknown planner.');if(!Number.isFinite(speed)||speed<.4||speed>3)throw Error('Invalid speed.');this.map=validateMap(map);this.algorithm=algorithm;this.speed=speed;this.settings=config(options);this.reset();}
    reset(){
      this.pose={...center(this.map.start),theta:0};this.navigationState='idle';this.reason='Ready to plan';this.minClearance=Infinity;this.angularTravel=0;this.peakAcceleration=0;this.stallTime=0;this.recoveryAttempts=0;this.lastReplan=-Infinity;this.scanElapsed=0;this.pendingReplan=false;
      this.carts=this.settings.movingObstacles?N.createCarts(this.map):[];this.worldMap=N.worldWithCarts(this.map,this.carts);this.mapper=new N.OccupancyMapper(this.map,this.settings.unknownPolicy);this.rays=lidar(this.worldMap,this.pose);this.mapper.update(this.pose,this.rays);this.navigationMap=this.settings.navigation==='sensor'?this.mapper.grid():this.worldMap;this.status='ready';this.path=[];this.expanded=[];this.target=1;
      this.time=0;this.distance=0;this.replans=0;this.planMs=0;this.cost=0;this.pathLength=0;this.v=0;this.omega=0;this.left=0;this.right=0;
      this.errorSq=0;this.samples=0;this.error=0;this.trail=[{...this.pose}];this.telemetry=[];this.lastSample=-1;this.events=[];this.progress=0;this.fallbacks=0;this.fallbackActive=false;this.carrot=null;this.planningMap=buildCostmap(this.navigationMap,this.settings);
    }
    log(message){this.events.unshift({time:this.time,message});this.events=this.events.slice(0,30);}
    compute(){
      this.worldMap=N.worldWithCarts(this.map,this.carts);this.rays=lidar(this.worldMap,this.pose);this.mapper.update(this.pose,this.rays);this.navigationMap=this.settings.navigation==='sensor'?this.mapper.grid():this.worldMap;
      this.planningMap=buildCostmap(this.navigationMap,this.settings);
      if(collides(this.navigationMap,this.pose.x,this.pose.y,this.clearance)){this.path=[];this.expanded=[];this.cost=this.pathLength=Infinity;this.planMs=0;this.status='blocked';this.v=this.omega=this.left=this.right=0;this.navigationState='failed';this.reason='Current footprint does not fit in the navigation map';this.log(this.reason);return false;}
      const s={x:Math.floor(this.pose.x),y:Math.floor(this.pose.y)},p=plan(this.planningMap,s,this.map.goal,this.algorithm,this.clearance,this.navigationMap);
      this.path=p.path;this.expanded=p.expanded;this.planMs=p.ms;this.cost=p.cost;this.pathLength=p.length;this.target=0;this.progress=0;this.carrot=null;
      if(!p.path.length){this.status='blocked';this.v=this.omega=this.left=this.right=0;this.navigationState='unreachable';this.reason=this.settings.navigation==='sensor'?'No observed route: unknown cells may be blocked. Choose optimistic exploration or edit the goal.':'No route to goal. Edit the map or reduce clearance.';this.log(this.reason);return false;}
      this.reason='Route available';this.navigationState=this.status==='running'?'navigating':'idle';
      this.log(`${PLANNERS[this.algorithm]}: ${p.expanded.length} cells expanded, ${p.length.toFixed(2)} m route, ${p.cost.toFixed(2)} weighted cost`);return true;
    }
    start(){if(this.status==='arrived')this.reset();if(this.status==='paused'){this.status='running';this.navigationState='navigating';return;}if(this.compute()){this.status='running';this.navigationState='navigating';}}
    replan(){this.pendingReplan=false;this.navigationState='replanning';this.replans++;this.lastReplan=this.time;const wasRunning=this.status==='running';if(this.compute())this.status=wasRunning?'running':'ready';else if(wasRunning&&this.carts.length){this.recoveryAttempts++;this.status='running';this.navigationState='recovering';this.reason='Route blocked by changing occupancy: waiting to retry';}}
    get rmse(){return this.samples?Math.sqrt(this.errorSq/this.samples):0;}
    get clearance(){return this.settings.radius+this.settings.margin;}
    safeCommand(v,w,horizon=.4){
      let p=this.pose;const dt=.025;
      for(let t=0;t<horizon;t+=dt){const next=integrate(p,v-w*.42/2,v+w*.42/2,.42,dt),sag=Math.abs(w)<1e-9?0:Math.abs(v/w)*(1-Math.cos(w*dt/2));if(!segmentClear(this.navigationMap,p,next,this.clearance+sag+.005))return false;p=next;}
      return true;
    }
    step(dt){
      if(this.status!=='running')return;
      dt=clamp(dt,0,.05);
      if(dt===0)return;
      if(this.time>=600){this.status='blocked';this.navigationState='failed';this.reason='Mission time limit reached (600 simulation seconds)';this.v=this.omega=this.left=this.right=0;return;}
      const cartChanged=N.advanceCarts(this.carts,dt,this.pose,this.clearance,this.map);
      this.worldMap=N.worldWithCarts(this.map,this.carts);this.scanElapsed+=dt;
      if(this.scanElapsed>=.2||cartChanged){
        this.scanElapsed=0;this.rays=lidar(this.worldMap,this.pose);const changed=this.mapper.update(this.pose,this.rays);
        this.navigationMap=this.settings.navigation==='sensor'?this.mapper.grid():this.worldMap;
        const needsReplan=this.settings.navigation==='sensor'?changed:cartChanged;this.pendingReplan=this.pendingReplan||needsReplan;
        if(this.pendingReplan&&this.time-this.lastReplan>=.5){this.replan();if(this.status!=='running')return;}
      }
      const goal=center(this.map.goal);
      if(dist(this.pose,goal)<.12){this.status='arrived';this.v=this.omega=this.left=this.right=0;this.navigationState='arrived';this.reason='Goal reached';this.log('Goal reached. Mission complete.');return;}
      if(!this.path.length){
        this.time+=dt;this.stallTime+=dt;this.v=this.omega=this.left=this.right=0;
        if(this.time-this.lastReplan>=2){this.recoveryAttempts++;this.replan();}
        if(this.stallTime>8&&this.recoveryAttempts>=3){this.status='blocked';this.navigationState='failed';this.reason='Recovery limit reached: route remains blocked';}
        return;
      }
      while(this.target<this.path.length-1&&dist(this.pose,center(this.path[this.target]))<.09)this.target++;
      let target=center(this.path[this.target]),d=dist(this.pose,target),e=wrap(Math.atan2(target.y-this.pose.y,target.x-this.pose.x)-this.pose.theta);
      // Rotate first on sharp turns; reduce forward speed near each waypoint.
      let v=Math.abs(e)>.38?0:Math.min(this.speed,2.8*d)*Math.max(0,Math.cos(e)),w=clamp(4.5*e,-2.5,2.5);const track=.42;
      if(this.settings.controller==='pursuit'&&this.path.length>1){
        const aim=pursuitTarget(this.pose,this.path.map(center),this.progress,this.settings.lookahead);this.progress=aim.index;this.carrot=aim.point;
        const error=wrap(Math.atan2(aim.point.y-this.pose.y,aim.point.x-this.pose.x)-this.pose.theta),range=dist(this.pose,aim.point);
        const pv=Math.abs(error)>.65?0:Math.min(this.speed,2*dist(this.pose,goal))/(1+Math.abs(2*Math.sin(error)/Math.max(range,.05)));
        const pw=pv===0?clamp(4.5*error,-2.5,2.5):clamp(2*pv*Math.sin(error)/Math.max(range,.05),-2.5,2.5);
        const safe=this.safeCommand(pv,pw);
        if(safe){v=pv;w=pw;this.target=Math.min(this.progress+1,this.path.length-1);}
        else {
          target=center(this.path[Math.min(this.progress+1,this.path.length-1)]);d=dist(this.pose,target);e=wrap(Math.atan2(target.y-this.pose.y,target.x-this.pose.x)-this.pose.theta);
          v=Math.abs(e)>.25?0:Math.min(this.speed,2*d)*Math.max(0,Math.cos(e));w=clamp(4.5*e,-2.5,2.5);
          if(!this.fallbackActive)this.fallbacks++;
        }
        this.fallbackActive=!safe;
      }
      if(this.settings.controller==='dwa'){
        const aim=pursuitTarget(this.pose,this.path.map(center),this.progress,this.settings.lookahead);this.progress=aim.index;this.target=Math.min(this.progress+1,this.path.length-1);this.carrot=aim.point;
        const command=N.dynamicWindow(api,this.navigationMap,this.pose,{v:this.v,w:this.omega},aim.point,this.speed,this.clearance,dt);v=command.v;w=command.w;
      }
      if(Math.abs(v)<.01&&Math.abs(w)<.05){this.stallTime+=dt;this.navigationState='recovering';this.reason='Waiting for a safe local command';}
      else {this.stallTime=0;this.navigationState='navigating';this.reason='Following route';}
      if(this.stallTime>2&&this.time-this.lastReplan>2){this.recoveryAttempts++;this.replan();if(this.status!=='running')return;}
      if(this.recoveryAttempts>=3&&this.stallTime>8){this.status='blocked';this.navigationState='failed';this.reason='Recovery limit reached: no safe progress';this.v=this.omega=this.left=this.right=0;return;}
      this.left=v-w*track/2;this.right=v+w*track/2;
      const next=integrate(this.pose,this.left,this.right,track,dt);
      const sag=Math.abs(w)<1e-9?0:Math.abs(v/w)*(1-Math.cos(w*dt/2));
      if(!segmentClear(this.worldMap,this.pose,next,this.clearance+sag)){this.status='blocked';this.v=this.omega=this.left=this.right=0;this.navigationState='failed';this.reason='Physical safety guard stopped motion; observe or replan the route';this.log(this.reason);return;}
      this.minClearance=Math.min(this.minClearance,obstacleDistance(this.worldMap,next.x,next.y)-this.settings.radius);this.angularTravel+=Math.abs(w)*dt;this.peakAcceleration=Math.max(this.peakAcceleration,Math.abs(v-this.v)/Math.max(dt,1e-9));
      this.distance+=dist(this.pose,next);this.pose=next;this.v=v;this.omega=w;this.time+=dt;
      this.error=Infinity;
      for(let i=1;i<this.path.length;i++)this.error=Math.min(this.error,segmentDistance(this.pose,center(this.path[i-1]),center(this.path[i])));
      if(!Number.isFinite(this.error))this.error=dist(this.pose,goal);
      this.errorSq+=this.error*this.error;this.samples++;
      if(this.time-this.lastSample>=.1){this.lastSample=this.time;this.trail.push({...this.pose});this.telemetry.push({time:this.time,x:this.pose.x,y:this.pose.y,theta:this.pose.theta,v,w,left:this.left,right:this.right,error:this.error,clearance:this.minClearance,coverage:this.mapper.coverage,state:this.navigationState,replans:this.replans});}
    }
  }
  function benchmarkMission(map,algorithm,speed,options){
    const sim=new Simulation(map,algorithm,speed,options);sim.start();
    for(let i=0;i<36000&&sim.status==='running';i++)sim.step(1/60);
    return {controller:sim.settings.controller,status:sim.status==='running'?'timeout':sim.status,time:sim.time,distance:sim.distance,rmse:sim.rmse,fallbacks:sim.fallbacks,minClearance:sim.minClearance,angularTravel:sim.angularTravel,peakAcceleration:sim.peakAcceleration,replans:sim.replans,recoveries:sim.recoveryAttempts,reason:sim.reason,trajectory:sim.telemetry.map(p=>({time:p.time,x:p.x,y:p.y,theta:p.theta}))};
  }
  function comparePlanners(map,settings={}){
    const cfg=config(settings),clearance=cfg.radius+cfg.margin,grid=buildCostmap(map,cfg),results=[];
    for(const algorithm of Object.keys(PLANNERS)){
      plan(grid,map.start,map.goal,algorithm,clearance,map);const times=[];let p;
      for(let i=0;i<25;i++){p=plan(grid,map.start,map.goal,algorithm,clearance,map);times.push(p.ms);}
      times.sort((a,b)=>a-b);results.push({algorithm,objective:PLANNER_INFO[algorithm],costModel:algorithm==='theta'?'sampled-any-angle':'weighted-grid',path:p.path,cost:Number.isFinite(p.cost)?p.cost:null,length:Number.isFinite(p.length)?p.length:null,expanded:p.expanded.length,ms:times[12],buildMs:grid.buildMs,status:p.path.length?'Reachable':'No route'});
    }return results;
  }
  const api={PLANNER_INFO,CONTROLLERS,comparePlanners,...N,PLANNERS,ENVIRONMENTS,makeMap,validateMap,plan,shortcutCost,raycast,lidar,collides,integrate,Simulation,center,dist,blocked,inflateMap,buildCostmap,obstacleDistance,segmentClear,config,pursuitTarget,benchmarkMission};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RoboNav=api;
})(typeof globalThis!=='undefined'?globalThis:this);
