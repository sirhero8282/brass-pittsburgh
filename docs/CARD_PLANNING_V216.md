# v216 — card reservation, discard comparison, public-card inference

Date: 2026-10-19 (Asia/Seoul). Executor: `plan-executor-v216-card-planning-v1`.

## Own cards

- Every action's arbitrary discard compares all physical hand positions, not just index zero. Construction compares natural industry/city cards; the existing whiskey wildcard is considered only if no natural card exists. Actual execution and search both consume the selected position and reject stale card/index proposals before mutating state.
- Reservations are derived anew from current-plan targets, available slots, unlock distance (at most two development actions), resource quotes, current-era actions, and a bounded funding allowance. An unlocked era-II factory may be an independent option when two heavy trains already exist, without imposing a factory commitment.
- Locomotive factories require **manufacturing** cards under the unchanged construction rules. No coal-card exception was introduced.
- Weighted matching covers at most three future construction demands. One physical card cannot cover two constructions; wildcard coverage consumes both a card and a whiskey allowance. A construction that fulfills a demand is not penalized for using that reserved card.
- Losing coverage is a soft score cost (maximum 12), never a new legality restriction. Duplicate cards dilute the small generic flexibility cost. On the last action of an era there is no reservation or flexibility cost: hands are reshuffled for the next era.
- These are feasible reservation candidates, not guaranteed multistep schedules. They do not model every intervening sale, rival move, future draw or future development opportunity. Distant/unaffordable targets are not a reason to lock all cards indefinitely.

## Opponent cards

- Inputs: fixed deck composition, own currently visible hand/discards, the maximum number of each own card previously observed, opponent current-era public discards, public hand size, public whiskey, public resources/slots/cash/unlocks.
- Does **not** read opponent hidden hand contents, either future deck's contents, shuffle seed or private strategy labels. A pre-existing replacement-link-growth heuristic's hidden opponent hand read was also replaced with this public estimate. This is not a claim that every legacy heuristic has been audited for hidden information.
- Own observed counts persist in optional per-actor `aiCardKnowledge` across era reshuffles; opponent discarded counts reset with the actual era discard pile. Old saves without the field start with currently visible knowledge. No save key or schema version changed. Lab perspective swaps exchange this memory between actors.
- Availability uses a hypergeometric **random-unseen-distribution baseline**. It does not know a human's selective card retention and is not a calibrated posterior. Whiskey gives possible wildcard access, not a claim the opponent will spend it. Inconsistent visible counts disable inference rather than inventing certainty.
- A contested build receives at most ±1.5 adjustment, only after public cash/resources/unlocks/slot checks. Card inference cannot prohibit an action. Replacement-link growth is also probability-weighted; confirmed printed link scores/rules are unchanged.

## Audit and boundaries

The existing Automa audit records selected card, alternative discard costs, reservation candidates, public discarded copies, baseline hand probabilities, joker access and exact/estimated hand count. No new page layout or live-game mutation is needed.

Champion, scoring/construction/resource rules, board/4P engine, save keys and analytics are unchanged. Site and GitHub Pages must receive the same normalized runtime, retaining the Pages session/metrics overlay. Tests cover both `dist/app.js` and `engine-source.js`; complete-game checks must use real `next.js` selection and actual execution. Small paired screens are integration/regression evidence, not proof of general playing strength.
