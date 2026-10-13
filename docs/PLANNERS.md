# Planner behavior and implementation

RoboNav has eleven choices: A* with octile, Euclidean and Chebyshev heuristics; Dijkstra; Weighted A*; greedy best-first; BFS; bidirectional Dijkstra; bidirectional BFS; Fringe Search; and Theta*. A* heuristic variants are explicitly labeled as variants.

## Shared graph and objectives

Grid searches use eight neighbors, lengths 1 and sqrt(2), prohibit diagonal corner cutting and validate transitions against the circular footprint. Edge cost is length times one plus the weighted mean of endpoint proximity penalties. Penalties and weights are nonnegative; the three A* heuristics are consistent lower bounds for this graph. A*, Dijkstra, bidirectional Dijkstra and Fringe Search minimize this weighted grid cost. BFS and bidirectional BFS minimize edge count, while reported metres and weighted costs still describe their actual routes. Weighted A* (1.8) and greedy have no optimality claim here.

Bidirectional searches maintain independent distances, parents, heaps and settled sets from both endpoints. A candidate joins their discovered paths. They terminate when the minimum unsettled distances sum to at least the best complete candidate; merely encountering the other frontier is insufficient. BFS uses unit hop costs during search and reconstructs the usual weighted cost for reporting.

Fringe Search uses an iterative f threshold and a deferred frontier instead of a priority heap. It retains best costs and reprocesses a node when its cost improves. It stores graph-sized state and is not presented as memory-bounded IDA*. Expansion counts can include repeated work. No speed advantage is promised on this small map.

## Theta* differences

Theta* considers the current node's parent as a shortcut parent for a neighbor. The shortcut must be clear on the inflated occupancy grid and pass exact segment-to-physical-obstacle clearance checks. Its path coordinates remain integer cell indices, interpreted at cell centers by the renderer and controllers, but consecutive waypoints may be nonadjacent. Map exterior and tangencies remain blocked.

Adjacent edges retain the ordinary endpoint-mean cost. Longer shortcuts use exact Euclidean length and midpoint quadrature of the cellwise proximity penalty with intervals no longer than 0.25 m. This approximation is deterministic but is not an exact continuous cost integral. Exported comparisons identify it as `sampled-any-angle`; other routes use `weighted-grid`. Theta* is an educational cost-aware adaptation, with no global any-angle optimality guarantee. Its route length can be shorter than the grid optimum; the shortest-grid challenge deliberately remains a grid benchmark.

All choices support custom maps, shared links, sensor-derived occupancy, footprint inflation, moving-cart replanning and the existing controllers. These searches recompute from scratch; bidirectional search is not incremental D* Lite. RRT/PRM, nonholonomic Hybrid A* and incremental planners need additional state/models rather than cosmetic dropdown aliases.

## Verification and references

The tests compare new optimal choices against Dijkstra on forty deterministic randomized weighted maps, compare both BFS hop counts, and check all environments, footprint clearance, unsafe corners, unreachable goals, deterministic shortcuts, exact empty-map any-angle length, UI catalog parity and sharing round trips. The benchmark runs 8 environments x 11 choices x 3 controllers (264 missions).

Original implementation in this repository; no third-party algorithm code was copied. Research references:

- Daniel, Nash, Koenig and Felner, [Theta*: Any-Angle Path Planning on Grids](https://arxiv.org/abs/1401.3843). The local cost-aware implementation and conservative inflated-cell visibility differ from the paper's basic setting.
- Bjornsson, Enzenberger, Holte and Schaeffer, [Fringe Search: Beating A* at Pathfinding on Game Maps](https://webdocs.cs.ualberta.ca/~jonathan/PREVIOUS/Papers/Papers/fringe.pdf). This repository uses deferred arrays/sets and shared graph checks, not the paper's tuned linked-list implementation.
