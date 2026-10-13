# Release checklist

1. Verify clean source state and the correct application version/badge/changelog.
2. Run all four Node test files and both benchmarks; inspect failures rather than altering expected outcomes to hide them.
3. Run the browser smoke test against a local HTTP server and direct-file opening. Check gallery, sharing, malformed-link recovery, worker results and desktop/mobile layout.
4. Verify the staged package contains every relative runtime asset, LICENSE, README and startup guide. Test the packaged page, not just the source checkout.
5. Update documentation, test output and validation scope. Leave historical measurements labeled or state which snapshots are unchanged.
6. Push main and wait for successful Actions validation and Pages deployment.
7. Run the browser smoke test against the actual public URL, including a share-link reload. Check the expected release badge.
8. Create an annotated version tag and a GitHub release with the offline ZIP, SHA-256 checksum and release notes. Include known limitations.
9. Confirm downloadable release assets and public site remain accessible. Never claim a deployment succeeded based only on a push.

The workflow validates pull requests without deploying them. Main deployment uses the protected github-pages environment. Runtime delivery stays static and account-free.
