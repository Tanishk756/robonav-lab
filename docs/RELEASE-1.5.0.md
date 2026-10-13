# RoboNav Lab v1.5.0 - Interactive challenges

Start a guided mission, watch obstacle-triggered replanning, try a navigation challenge and share a result card.

- Four separate challenge objectives: doorway fit, shortest grid route, simulation time and physical body clearance.
- Actual planner route overlays and synchronized recorded controller playback.
- Bounded mission replay with pose/observation snapshots and event markers, isolated from live physics.
- PNG result cards, readable HTML reports, contextual explanations and a smaller simple view.
- Explicitly opt-in, local-only usage counters; no remote analytics tracker.
- Actual Edge/Chrome/Firefox checks plus Chromium/Firefox CI and native export tests.

55 Node regressions pass. Navigation physics is unchanged; existing 120+12 deterministic benchmark snapshots are retained and CI reruns the matrices. Local challenges are educational outcomes, not trusted leaderboard scores or hardware safety certificates. Carts remain cooperative and sensing/pose idealized.

Human newcomer studies and physical-phone checks are documented but not claimed complete.

Try https://tanishk756.github.io/robonav-lab/ . Download the offline ZIP and checksum from this release. See docs/USER-TESTING.md for testing protocols.
