# Security policy

RoboNav Lab is an educational browser simulator, not a safety-certified controller. Do not connect it to a physical robot without an independently reviewed integration.

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/Tanishk756/robonav-lab/security/advisories/new). Include the affected release, a minimal reproduction, expected impact and any proposed mitigation. Avoid public exploit details until the maintainer has assessed the report. No response-time guarantee or paid bounty is offered.

## Scope and supported builds

Report issues affecting the latest published release or main. Fixes target main and the next release; old releases are not promised backports.

Shared links and imported JSON are untrusted input. The application validates their size, schema, occupancy, settings and planner IDs. It does not execute imported code. URL fragments contain the experiment map/settings; anyone receiving a link can read them. Sharing does not require an account or store an experiment in a project database. Browser extensions or hosting infrastructure can have their own data behavior.

Runtime assets have no external script/CDN dependencies. Browser-testing dependencies are development-only. See CONTRIBUTING.md for checks and RELEASE-CHECKLIST.md for publication requirements.

Challenge outcomes are local and editable; they are not anti-cheat-verified credentials. Readable HTML reports escape imported strings. Replay is bounded to 6000 frames and is not an imported-code execution mechanism. Optional usage counters stay in localStorage, collect no experiment contents and clear on opt out; no remote tracking is installed.
