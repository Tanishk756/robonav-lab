# RoboNav Lab v1.4.0

RoboNav Lab is now easier to try, share and contribute to.

- Six guided examples explain expected navigation behavior and intentional failure cases.
- Share experiment links include custom occupancy, endpoints and validated initial settings, without accounts or a database.
- Versioned JSON reports collect settings, mission metrics and available comparisons.
- Contributor, extension, conduct and security guides, issue forms and a PR template establish the public contribution path.
- Deterministic offline ZIP/checksum packaging complements the live static simulator.
- Browser CI checks native selectors, worker responsiveness, sharing and extracted packages. Deployment is followed by an actual live-site check.

Open https://tanishk756.github.io/robonav-lab/ or download the attached ZIP and extract it before opening index.html. Keep all seven runtime files together. SHA256SUMS.txt verifies the ZIP.

Validation: 49 Node tests pass. The unchanged navigation engine retains its 120 static and 12 sensor/dynamic passing benchmark snapshots. Browser checks cover local HTTP, direct-file use, actual shared-page reload and desktop/mobile layout.

Limits: shared links contain readable experiment data and save initial configuration, not mission progress. Ideal sensing, ground-truth pose, fixed grid and cooperative grid carts remain assumptions. Clipboard access can be denied; the link field remains manually copyable. The direct-file worker fallback can block during long comparisons. This is an educational simulator, not a safety-certified controller.

MIT licensed; maintained by Tanishk Singhal. See CONTRIBUTING.md to help.
