/* Run: node benchmark.cjs. Output is CSV. No dependencies. */
const R=require('./core.js');
console.log('scenario,algorithm,controller,cruise_m_s,radius_m,margin_m,lookahead_m,path_m,expanded_cells,median_search_ms,arrival_time_s,driven_m,tracking_rmse_m,fallbacks,status');
for(const name of ['empty','warehouse','corridors','clutter'])for(const algorithm of ['astar','dijkstra'])for(const controller of ['waypoint','pursuit']){
  const map=R.makeMap(name),settings=R.config({controller}),clearance=settings.radius+settings.margin,grid=R.inflateMap(map,clearance),times=[];
  R.plan(grid,map.start,map.goal,algorithm,clearance,map);
  let p;for(let i=0;i<25;i++){p=R.plan(grid,map.start,map.goal,algorithm,clearance,map);times.push(p.ms);}
  times.sort((a,b)=>a-b);
  const run=R.benchmarkMission(map,algorithm,1.6,settings);
  console.log([name,algorithm,controller,1.6,settings.radius,settings.margin,settings.lookahead,p.cost.toFixed(6),p.expanded.length,times[12].toFixed(6),run.time.toFixed(6),run.distance.toFixed(6),run.rmse.toFixed(6),run.fallbacks,run.status].join(','));
  if(run.status!=='arrived')process.exitCode=1;
}
