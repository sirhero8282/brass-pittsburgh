# GitHub Pages release handoff — 2026-10-17

- Baseline: published Sites v83, source 5269bd26d901016c9646ed5b88d2912632b60c97; copied from clean sites-v196-publish checkout.
- Dedicated release repository avoids publishing the private development repository/history and unrelated uncommitted experiments.
- Runtime preserved under dist. New DOM-free local session handles save/load and isolated state subscriptions; future room protocol is independent and not an online implementation.
- GitHub Actions tests and deploys dist on main. Static validation covers project-subpath asset references. Paid hosting is not configured.
- Existing origin-local saves do not transfer automatically. Current app remains a two-seat Automa game; 4-player online engine/server and rule generalization remain next-phase work, documented in docs/MULTIPLAYER.md.
- Validation and production deployment results will be recorded after execution.
