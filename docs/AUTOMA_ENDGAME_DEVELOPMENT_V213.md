# Accepted v213 scope: endgame valuation and development runway

Runtime: plan-executor-v213-endgame-development-v1. Existing champion, schema, rules, saves, player UI, assets/layout and analytics are unchanged.

## Accepted changes

1. Preserve v212 early sale-quality scores and estimated quality values exactly. Later income utility declines with actual remaining settlements; final-round income has zero cash utility, while the actual income-level change still contributes to an existing sold sewing machine's final score. Cash/free-development/unused Whiskey utility declines with usable remaining actions. Tactical income utility also reaches zero in the final round; projected sewing industry score remains intact.
2. The strategic permission for locomotive-path Typewriter/Automobile development now requires ceil(remaining tiles / 2) + 1 own actions rather than remaining tiles + 2. A real funded two-tile development then factory build is regression-tested by executing both actions with real cards/resources. One final action still cannot promise development plus construction. Paid gameplay legality and costs are unchanged.

## Rejected experiment (not production)

`experiments/v213-funded-completion/` retains the attempted bounded real development/loan/income-wait/build planner, completion comparison, $18 estimate removal and speculative factory-value removal. The preliminary four-game screen was 2W/2L mean -9.75; final and early-quality-narrowed seed102216 both-seat screens were 0W/2L mean -32 (99:109,85:139). Errors and bankruptcies were zero but strength regressed; the planner policy changes were rejected, not shipped. Normal v212 planning, alternatives, resource evaluation and pass policy remain in the accepted runtime. Full-plan liquidity/completion inconsistency is **not fixed by this narrow release**.

Ten paired production fixtures cover exact early quality preservation, final quality versus sewing, clamped nonnegative sewing VP loss, actual two-action funded development/build, and one-action exclusion. More extensive experimental tests are outside the production suite. Full-suite, small-screen and publication results follow in CODEX_CONTEXT.md. Small screens are not general strength evidence; no exact supplied-game replay or browser manual-play QA is claimed. No production save is modified.
