# v212 economic plan recovery — 2026-10-19 (Asia/Seoul)

Evidence: the supplied v211 game ended player119 / Automa110. Late coke built for $46 with zero immediate sales; only two of four units were subsequently used. Old unresolved coke development plus deadline pressure excluded legal locomotive/steel alternatives at -1000. Kerosene built earlier was never sold.

## Changes

- Removed the deadline/sunk-development finalization gate that assigned -1000 to every non-plan action. Existing stage guidance still applies, as do actual legality, bankruptcy, necessary development-inventory protection and exact final-action margin ranking. A regression explicitly supersedes the old hard-commitment expectation.
- Coke intent is now a pure bounded quote. It tests current, one-loan, and one-existing-legal-development prefixes, regenerates real coke-II builds after actual card/resource expenditure, and examines up to four highest-sale/lowest-cost locations. It simulates up to two affordable subsequent own resource consumers; no speculative opponent consumption counts. Reachable immediate sales, fully depleted factory VP, confirmed own consumption, actual net construction cash, action opportunity cost, loan income cost and stranded units determine economic feasibility. These are conservative heuristics, not an exact money-to-VP conversion. Nonprofitable coke plans abort, but legal coke construction remains an ordinary candidate. The old fixed24VP plan estimate is gone. Loan actions already included in coke quotes are not counted twice.
- A cooling locomotive plan recovers only when a currently generated legal factory build is feasible and its simulated immediate/end-game VP increase is positive. No cooldown is blindly reset; unrelated/non-recovered plans retain cooldown behavior.
- Last-eight-action recovery review tests up to two existing unsold industries, three short routes and six leading alternatives. Actual network/card/oil/sale execution is compared with the candidate-then-recovery sequence, using end-score margin plus a small cash valuation per action. Adjustments are bounded -24/+12 and idempotent, not bans. Paths with no currently affordable continuation confer no recovery credit.

## Limits

No full human-game replay or guaranteed win claim. Coke prefixes do not combine loan plus development, consumers are bounded and greedily chosen, and the quote does not forecast round income, opponent actions, future cards or future market changes. Recovery routes are at most three actions and do not add implicit loans or reserve shared oil. No rule/score/save migration, policy retraining, layout or analytics changes. Validation and deployment provenance are in the release checkout contexts.
