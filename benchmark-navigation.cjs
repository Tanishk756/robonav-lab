/* Sensor/dynamic smoke matrix. Run: node benchmark-navigation.cjs */
const R=require('./core.js');
console.log('scenario,navigation,moving_obstacles,controller,status,time_s,distance_m,min_clearance_m,replans,recoveries,reason');
for(const name of ['empty','warehouse','rooms'])for(const navigation of ['known','sensor'])for(const movingObstacles of [false,true]){
  const run=R.benchmarkMission(R.makeMap(name),'astar',1.6,{navigation,movingObstacles,controller:'dwa'});
  console.log([name,navigation,movingObstacles,'dwa',run.status,run.time.toFixed(6),run.distance.toFixed(6),run.minClearance.toFixed(6),run.replans,run.recoveries,run.reason].join(','));
  if(run.status!=='arrived')process.exitCode=1;
}
