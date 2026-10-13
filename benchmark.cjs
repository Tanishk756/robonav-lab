/* Run: node benchmark.cjs. Output is CSV. No dependencies. */
const R=require('./core.js');
console.log('scenario,algorithm,controller,cruise_m_s,radius_m,margin_m,lookahead_m,soft_band_m,cost_weight,cost_decay,path_m,weighted_cost,costmap_build_ms,expanded_cells,median_search_ms,arrival_time_s,driven_m,tracking_rmse_m,fallbacks,status,min_body_clearance_m,angular_travel_rad,peak_acceleration_m_s2,replans,recoveries');
for(const name of Object.keys(R.ENVIRONMENTS))for(const algorithm of Object.keys(R.PLANNERS))for(const controller of Object.keys(R.CONTROLLERS)){
  const map=R.makeMap(name),settings=R.config({controller}),clearance=settings.radius+settings.margin,grid=R.buildCostmap(map,settings),times=[];
  R.plan(grid,map.start,map.goal,algorithm,clearance,map);
  let p;for(let i=0;i<25;i++){p=R.plan(grid,map.start,map.goal,algorithm,clearance,map);times.push(p.ms);}
  times.sort((a,b)=>a-b);
  const run=R.benchmarkMission(map,algorithm,1.6,settings);
  console.log([name,algorithm,controller,1.6,settings.radius,settings.margin,settings.lookahead,settings.softBand,settings.costWeight,settings.costDecay,p.length.toFixed(6),p.cost.toFixed(6),grid.buildMs.toFixed(6),p.expanded.length,times[12].toFixed(6),run.time.toFixed(6),run.distance.toFixed(6),run.rmse.toFixed(6),run.fallbacks,run.status,run.minClearance.toFixed(6),run.angularTravel.toFixed(6),run.peakAcceleration.toFixed(6),run.replans,run.recoveries].join(','));
  if(run.status!=='arrived')process.exitCode=1;
}
