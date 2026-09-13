/* Run: node benchmark.cjs. Outputs CSV to stdout, diagnostics to stderr. */
const R=require('./core.js');
console.log('scenario,algorithm,cruise_m_s,path_m,expanded_cells,median_planning_ms,arrival_time_s,driven_m,tracking_rmse_m,status');
for(const name of ['empty','warehouse','corridors','clutter'])for(const algorithm of ['astar','dijkstra']){
  const map=R.makeMap(name),times=[];R.plan(map,map.start,map.goal,algorithm);
  for(let i=0;i<25;i++)times.push(R.plan(map,map.start,map.goal,algorithm).ms);
  times.sort((a,b)=>a-b);
  const sim=new R.Simulation(map,algorithm,1.6);sim.start();
  for(let i=0;i<60000&&sim.status==='running';i++)sim.step(1/60);
  console.log([name,algorithm,sim.speed,sim.cost.toFixed(6),sim.expanded.length,times[12].toFixed(6),sim.time.toFixed(6),sim.distance.toFixed(6),sim.rmse.toFixed(6),sim.status].join(','));
  if(sim.status!=='arrived')process.exitCode=1;
}
