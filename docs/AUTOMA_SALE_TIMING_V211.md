# v211 sale timing — 2026-10-19 (Asia/Seoul)

The uploaded v210-v2 match ended player 144 / Automa 136. Industry +6 and network +1 did not offset other rewards -15. Two Typewriters were sold separately after sequential replacement, without a quality reward. This is evidence for investigating timing, not proof that waiting would have won that game.

## Confirmed execution mismatch

`applyAutomaCandidateForSearch` unconditionally called `flipIndustryAt` after building, even for goods with no resource production. Real `execute` flips automatically only when a resource-producing industry's output is depleted. Search now uses the same output guard. A new Typewriter remains unsold and does not receive sale income/VP in simulation. No game rules or existing saved scores are changed.

## Strategy

- Ready target sales count as conversion in BUILD, UNBLOCK and UNLOCK; they no longer receive a wrong-stage penalty or get blocked by that stage's deadline gate.
- The Typewriter plan is labeled a sales engine. It reports QUALITY_READY only for an actual legal quality-bearing sale candidate; otherwise REPEAT_SALES. Efficiency includes quality reward value only from a verified execution quality key. Sold Typewriters do not require a fictitious Infinity unlock.
- A bounded extra review considers up to four current sales and eight legal sale-industry builds. It compares build + combined sale against immediate sale + the same physical build + sale. Both branches use actual candidates, card expenditure, sources, oil depletion, income, pipeline ownership payouts, quality execution, covered-tile scores and end-score margin. There must be an additional quality claim; repeating the same reward or destroying the pending sale earns no credit.
- Net value includes the saved action at 3.9, cash at the existing phase-dependent valuation, and estimated income delayed across a round end. If waiting crosses an opponent turn with a ready opponent sale, no waiting credit is granted. A positive verified continuation gets at most +24 build / -12 immediate-sale comparison points, never a legality ban. Resource builds, immediate sales and replacements remain eligible. Repeated finalization removes the previous timing adjustment first. Exact final-action margin ranking remains authoritative.

## Boundaries

This is not a full game solver or exact replay of the upload. It does not reserve future oil, predict future cards, add future loans/rail construction, or simulate opponent responses. Without enough current cards to execute the comparable three-action branch it conservatively grants no waiting credit. Preview simulations restore the original state. No save migration, champion retraining, player-rule change, asset/layout change, or analytics change.

Validation and deployment results are recorded in CODEX_CONTEXT.md.
