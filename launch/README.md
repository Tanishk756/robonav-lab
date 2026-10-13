# RoboNav Lab v1.5 launch kit

Ready-to-use assets:

- replan.mp4 / replan.srt: 12-second recorded obstacle/replanning demonstration.
- costs.mp4 / costs.srt: 12-second planned-route comparison under different proximity costs. This is a route illustration, not controller playback.
- fit.mp4 / fit.srt: 12-second intentional doorway failure followed by a reachable smaller-footprint plan.
- demo.gif: lightweight README preview.
- poster.png: actual guided-demo result card, suitable as a project preview.
- LINKEDIN.md, DEV-ARTICLE.md, COMMUNITY-POSTS.md: editable LinkedIn/DEV drafts and community preparation guidance.
- USER-TESTING.md: first-time participant and physical-device test protocol; no fabricated results.
- MEASUREMENT.md: honest launch measurement plan and opt-in local-counter scope.

All videos have burned-in English captions, with separate SRT files. H.264 MP4 uses yuv420p and fast-start metadata. There is no voiceover or background music. LinkedIn format guidance: https://www.linkedin.com/help/linkedin/answer/a548372 . Check the upload preview and keep important text visible in the platform's crop.

The simulator is at https://tanishk756.github.io/robonav-lab/ and source at https://github.com/Tanishk756/robonav-lab .

These materials are prepared for the maintainer to post. No social account posts or outreach messages were sent. Reach, stars, engagement and user-test outcomes are not invented or guaranteed.

Regenerate clips with python scripts/create_launch_assets.py (development dependencies: installed Chromium, websockets and ffmpeg). Runtime delivery remains dependency-free.
