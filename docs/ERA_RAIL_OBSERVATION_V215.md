# v215: era-aware rail investment and public opening context

Scope: strategy evaluation only; rules, card/resource legality, scoring, player choices, champion/schema, saves, physical map, 4P engine and analytics are unchanged. Existing saves can omit the optional `aiStrategicContext` field. No live game state is read or modified during offline verification.

## Rail investment

- Era I uses current/fixed node link values and a small explicitly uncertain Pittsburgh/Buffalo/New York core-growth allowance to recognize a retained second-era rail investment. Current first-era VP remains in the existing tactical evaluation. No factory is assumed.
- Era II compares the actual resource quote with the same-edge legal light train when available, or reports no light alternative. The reasons distinguish free industry/train steel, own resource exhaustion, current replacement swing/payout, double-link incremental value, verified near-term resource-bonus use and a factory already on the board. Empty bonuses and last-action Whiskey are not investment reasons. Soft bounded preferences are evaluation points, not new VP awards or legality bans.
- Bonus-consumer checking runs in a restored simulation after the actual rail payment and card discard. A real legal affordable resource-consuming build or ready oil-consuming sale is required; future cards and opponent purchases are not assumed. This is near-term feasibility, not a guarantee the opponent leaves the resource/route available.
- Profitable heavy-rail candidates bypass conflicting factory-before-rail guidance only inside the locomotive plan; other sale/build commitments remain authoritative. They also bypass generic network-debt and follow-through suppression. Poor rail candidates retain normal penalties. No blanket resource-construction/development requirement is introduced. The factory outlook no longer invents 12 VP from free development or at least one hypothetical heavy train.
- Final-round discretionary loan reserves no longer manufacture a terminal penalty for an affordable rail. Actual affordability and bankruptcy validation remain. Earlier-round reserve behavior remains regression-tested; the existing actual final-score-margin contract can therefore compare a valuable replacement.

## Public opening context

- Read-only evidence: merchant products/claimed first rewards, fixed-market vacancies, opponent public rails/heavy rails, industries, public development count and actually ready sales. Hidden player hands, future cards and private strategy labels are not inputs to this new observer. Existing unrelated heuristic functions are not being claimed as a complete hidden-information audit.
- An optional opening preference requires the first Automa move, West automobile merchant, an actual legal West-Toledo heavy candidate, remaining opening cash and no verified short manufacturing sale in the supplied candidate set. It is a bounded preference, never mandatory construction.
- Three economic orientations (rail/resource, sale, resource) use a switching margin through era I round 4; the later strategy record retains the early observation. Real plan feasibility/cooldowns and existing switching thresholds remain authoritative. Context adds at most 5 plan-comparison points and at most 6 action points. It does not fabricate demand, force a factory, hard-lock a strategy or infer locomotive commitment merely from heavy rails.
- Audit logs show market/early public evidence, orientation and each heavy candidate's era-specific rationale/light alternative. This is transparent bounded adaptation, not machine learning or a full adversarial multistep solver.

## Verification

Paired production/app and Lab-source fixtures cover retained links, no speculative factory/development award, post-payment/card bonus use, era-II unused bonuses, free-steel opportunity, first-move merchant conditions, observer purity/hidden-hand invariance, public sale readiness, bounded context and switching, earlier/final reserve separation and actual final replacement score ranking. Full suites and frozen actual-next.js paired-seat screens are recorded in CODEX_CONTEXT.md after completion. Small screens do not establish general playing strength. UI layout is unchanged; no browser manual-game replay is claimed.

The broad v215 guidance candidate (which also overrode unrelated sale/build commitments) was rejected after its initial four-game screen was 1W/3L, mean margin -13.25. Its source is retained outside production in experiments/v215-broad-rail-guidance; its separate holdout screen is retained too. The narrowed candidate changes only the factory-before-rail conflict. Screens for different source versions must not be pooled as if they tested one candidate.

Final narrowed source: Site406/406, private510/510, Pages419/419 passed. Fresh frozen actual-next.js seeds102223/102224 both seats versus v214:109:59,94:75,82:87,64:16 (3W/1L, mean +28), all62 actions, errors0, candidate bankruptcies0. This small screen does not establish general strength. Normalized runtime SHA25638e8c997d99007b7606f0205a5fc85be46b3e1553fb1344ec4a0cd0e96e6d850.

The previously rejected v213 completion experiment is not restored. Full long-horizon factory scheduling and counterfactual replay of the user's entire game remain separate work; this release does not claim to solve them.
