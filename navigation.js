/* Sensor mapping and reactive navigation. No browser or third-party dependencies. */
(function(root){
  'use strict';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  class OccupancyMapper {
    constructor(map,policy='optimistic'){
      this.w=map.w;this.h=map.h;this.policy=policy;this.template={...map};
      this.odds=new Float32Array(map.w*map.h);this.seen=new Uint8Array(map.w*map.h);this.revision=0;
    }
    update(pose,rays){
      const before=this.grid().cells;
      const evidence=new Int8Array(this.odds.length);
      for(const ray of rays){
        const dx=ray.x-pose.x,dy=ray.y-pose.y,length=Math.hypot(dx,dy),n=Math.max(1,Math.ceil(length/.1));
        for(let k=0;k<n;k++){
          const t=k/n,x=Math.floor(pose.x+t*dx),y=Math.floor(pose.y+t*dy);
          if(x>=0&&y>=0&&x<this.w&&y<this.h)evidence[y*this.w+x]=-1;
        }
      }
      // Occupied endpoints win over free evidence from neighbouring rays.
      for(const ray of rays)if(ray.hit){
        const dx=ray.x-pose.x,dy=ray.y-pose.y,d=Math.hypot(dx,dy)||1;
        const x=Math.floor(ray.x+dx/d*1e-5),y=Math.floor(ray.y+dy/d*1e-5);
        if(x>=0&&y>=0&&x<this.w&&y<this.h)evidence[y*this.w+x]=1;
      }
      for(let i=0;i<evidence.length;i++)if(evidence[i]){this.seen[i]=1;this.odds[i]=clamp(this.odds[i]+(evidence[i]>0?1.2:-1.5),-4,4);}
      const after=this.grid().cells,changed=after.some((v,i)=>v!==before[i]);if(changed)this.revision++;
      return changed;
    }
    grid(){return {...this.template,cells:Array.from(this.odds,(v,i)=>!this.seen[i]?Number(this.policy==='conservative'):Number(v>.5))};}
    get coverage(){return this.seen.reduce((a,b)=>a+b,0)/this.seen.length;}
  }
  function createCarts(map){
    // Deterministic grid-aligned one-cell carts. Choose free horizontal tracks.
    const tracks=[];
    for(let y=3;y<map.h-3;y++){
      let start=2;
      for(let x=2;x<=map.w-2;x++)if(x===map.w-2||map.cells[y*map.w+x]){
        if(x-start>=6&&Math.abs(y-map.start.y)>2&&Math.abs(y-map.goal.y)>2)tracks.push({y,a:start,b:x-1});
        start=x+1;
      }
    }
    tracks.sort((a,b)=>(b.b-b.a)-(a.b-a.a)||Math.abs(a.y-12)-Math.abs(b.y-12));
    const chosen=[];for(const t of tracks)if(chosen.every(c=>Math.abs(c.y-t.y)>3)){chosen.push(t);if(chosen.length===2)break;}
    return chosen.map((t,i)=>({...t,x:i?t.b:t.a,direction:i?-1:1,elapsed:0}));
  }
  function advanceCarts(carts,dt,pose,clearance,map=null){
    let changed=false;
    for(const cart of carts){cart.elapsed+=dt;if(cart.elapsed<1)continue;cart.elapsed-=1;
      let x=cart.x+cart.direction;if(x<cart.a||x>cart.b){cart.direction*=-1;x=cart.x+cart.direction;}
      if(map?.cells[cart.y*map.w+x]){cart.direction*=-1;continue;}
      // Cart yields if its next occupied cell would touch the robot envelope.
      if(Math.hypot(pose.x-clamp(pose.x,x,x+1),pose.y-clamp(pose.y,cart.y,cart.y+1))<=clearance+.1)continue;
      cart.x=x;changed=true;
    }return changed;
  }
  function worldWithCarts(map,carts){const world={...map,cells:map.cells.slice()};for(const c of carts)world.cells[c.y*map.w+c.x]=1;return world;}
  function dynamicWindow(R,map,pose,current,target,speed,clearance,dt){
    const acceleration=1,angularAcceleration=3,lo=Math.max(0,current.v-acceleration*dt),hi=Math.max(lo,Math.min(speed,current.v+acceleration*dt));
    const wlo=Math.max(-2.5,current.w-angularAcceleration*dt),whi=Math.min(2.5,current.w+angularAcceleration*dt);
    let best=null;
    for(let i=0;i<=4;i++)for(let j=0;j<=8;j++){
      const v=lo+(hi-lo)*i/4,w=wlo+(whi-wlo)*j/8;
      let p={...pose},safe=true,minClearance=Infinity;
      // Include stopping distance beyond the nominal 1.2 s command rollout.
      const horizon=1.2+v/acceleration;
      for(let t=0;t<horizon;t+=.1){
        const next=R.integrate(p,v-w*.21,v+w*.21,.42,.1);
        const sag=Math.abs(w)<1e-9?0:Math.abs(v/w)*(1-Math.cos(w*.1/2));
        if(!R.segmentClear(map,p,next,clearance+sag+.02)){safe=false;break;}
        p=next;minClearance=Math.min(minClearance,R.obstacleDistance(map,p.x,p.y,2)-clearance);
      }
      if(!safe)continue;
      const angle=Math.atan2(target.y-p.y,target.x-p.x),heading=Math.abs(Math.atan2(Math.sin(angle-p.theta),Math.cos(angle-p.theta)));
      const score=-3*R.dist(p,target)-.8*heading+.25*v+.12*Math.min(minClearance,1);
      if(!best||score>best.score)best={v,w,score};
    }
    // Emergency stop overrides acceleration when no sampled command is safe.
    return best??{v:0,w:0,score:-Infinity,emergency:true};
  }
  const api={OccupancyMapper,createCarts,advanceCarts,worldWithCarts,dynamicWindow};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RoboNavNavigation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
