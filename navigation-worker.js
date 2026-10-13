/* Expensive comparisons run outside the viewport when workers are available. */
importScripts('navigation.js'+self.location.search,'core.js'+self.location.search);
self.onmessage=({data})=>{
  try {
    const R=self.RoboNav;
    const result=data.kind==='planners'?R.comparePlanners(data.map,data.settings):
      Object.keys(R.CONTROLLERS).map(controller=>R.benchmarkMission(data.map,data.algorithm,data.speed,{...data.settings,controller}));
    self.postMessage({id:data.id,result});
  } catch(error){self.postMessage({id:data.id,error:error.message});}
};
