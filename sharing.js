/* Versioned, bounded experiment links. Occupancy is bit-packed, never executed. */
(function(root){
  'use strict';
  const VERSION='1.4.0',PUBLIC_URL='https://tanishk756.github.io/robonav-lab/';
  const toBase64=bytes=>typeof Buffer!=='undefined'?Buffer.from(bytes).toString('base64'):btoa(String.fromCharCode(...bytes));
  const fromBase64=text=>typeof Buffer!=='undefined'?Uint8Array.from(Buffer.from(text,'base64')):Uint8Array.from(atob(text),c=>c.charCodeAt(0));
  const pack=bytes=>toBase64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  function unpack(text,max){
    if(typeof text!=='string'||!text.length||text.length>max||!/^[A-Za-z0-9_-]+$/.test(text)||text.length%4===1)throw Error('Invalid or oversized shared experiment.');
    return fromBase64(text.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-text.length%4)%4));
  }
  function validateExperiment(R,data){
    if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid experiment.');
    if(data.settingsVersion!==undefined&&![1,2,3].includes(data.settingsVersion))throw Error('Unsupported settings version.');
    if(data.robot!==undefined&&(!data.robot||typeof data.robot!=='object'||Array.isArray(data.robot)))throw Error('Invalid robot settings.');
    const map=R.validateMap(data),robot=R.config(data.robot??{}),algorithm=data.algorithm??'astar',speed=data.speed??1.6;
    if(!Object.hasOwn(R.PLANNERS,algorithm))throw Error('Invalid planner.');
    if(!Number.isFinite(speed)||speed<.4||speed>3)throw Error('Invalid speed.');
    return {...map,settingsVersion:3,robot,algorithm,speed};
  }
  function encode(R,data){
    const e=validateExperiment(R,data),bytes=new Uint8Array(96);
    e.cells.forEach((value,i)=>{if(value)bytes[i>>3]|=1<<(i%8);});
    const compact={v:1,n:e.name,c:pack(bytes),s:[e.start.x,e.start.y],g:[e.goal.x,e.goal.y],r:e.robot,a:e.algorithm,p:e.speed};
    return pack(new TextEncoder().encode(JSON.stringify(compact)));
  }
  function decode(R,token){
    let c;try{c=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(unpack(token,6000)));}catch{throw Error('Invalid shared experiment encoding.');}
    if(!c||typeof c!=='object'||Array.isArray(c))throw Error('Invalid shared experiment.');
    if(c.v!==1)throw Error('Unsupported share version.');
    const bytes=unpack(c.c,128);if(bytes.length!==96)throw Error('Invalid shared map size.');
    if(!Array.isArray(c.s)||c.s.length!==2||!Array.isArray(c.g)||c.g.length!==2)throw Error('Invalid shared endpoints.');
    return validateExperiment(R,{version:1,w:32,h:24,name:c.n,cells:Array.from({length:768},(_,i)=>(bytes[i>>3]>>(i%8))&1),start:{x:c.s[0],y:c.s[1]},goal:{x:c.g[0],y:c.g[1]},robot:c.r,algorithm:c.a,speed:c.p});
  }
  const EXAMPLES={
    warehouse:{title:'First mission',description:'Known warehouse map with A* and waypoints. Run, pause, then compare all five planners.',map:'warehouse',settings:{}},
    discovery:{title:'Discover the warehouse',description:'LiDAR mapping and DWA. Turn on the observed view and watch unknown space become mapped.',map:'warehouse',settings:{navigation:'sensor',controller:'dwa'}},
    carts:{title:'Moving cart encounter',description:'Sensor DWA with cooperative grid carts. Inspect clearance and replanning; carts yield to the robot.',map:'rooms',settings:{navigation:'sensor',controller:'dwa',movingObstacles:true}},
    clearance:{title:'Doorway does not fit',description:'A large robot cannot cross the one-cell office doors. Reduce radius plus margin below 0.5 m to investigate.',map:'office',settings:{radius:.6,margin:.12}},
    costs:{title:'Prefer wider routes',description:'Loading dock with a strong soft proximity cost. Compare optimal and approximate planners.',map:'loading',settings:{softBand:3,costWeight:10}},
    unknown:{title:'Unknown is blocked',description:'Conservative sensor mapping rejects a distant unobserved goal. Switch unknown policy to Explore to proceed.',map:'empty',settings:{navigation:'sensor',unknownPolicy:'conservative',controller:'dwa'}}
  };
  function example(R,id){const item=EXAMPLES[id];if(!Object.hasOwn(EXAMPLES,id))throw Error('Unknown example.');return validateExperiment(R,{...R.makeMap(item.map),robot:item.settings});}
  const api={VERSION,PUBLIC_URL,EXAMPLES,validateExperiment,encode,decode,example};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RoboNavSharing=api;
})(typeof globalThis!=='undefined'?globalThis:this);
