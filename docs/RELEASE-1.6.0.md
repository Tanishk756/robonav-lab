# RoboNav Lab v1.6.0 - Eleven planner choices

Added bidirectional Dijkstra, bidirectional BFS, Fringe Search and collision-checked any-angle Theta*, plus Euclidean and Chebyshev A* heuristic variants. All eleven choices are available in the actual dropdown, route overlays, comparison workers, custom-map imports and shared experiment links.

The app explains each objective and labels Theta*'s sampled any-angle cost model in reports/CSV. Grid-optimal, minimum-hop and approximate searches are distinguished; A* heuristic variants are not presented as unrelated algorithm families. See docs/PLANNERS.md for geometry, cost assumptions and research references.

Validation: 58 Node tests, 40 seeded weighted-map oracle comparisons, 264 static planner/controller missions and 12 sensor/navigation missions. Browser validation covers eleven options and 88 planner/environment selections, asynchronous comparisons, reports, replay and share reload. Human usability and physical-phone testing remain follow-up work.

No backend or runtime dependencies. Extract the complete offline ZIP and open index.html, or use the public simulator at https://tanishk756.github.io/robonav-lab/ . Ideal sensing, known pose and cooperative discrete carts remain educational assumptions; this is not physical robot validation.
