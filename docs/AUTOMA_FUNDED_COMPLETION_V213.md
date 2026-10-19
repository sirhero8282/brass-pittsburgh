# REJECTED experiment: funded completion (not production v213)

This planner was rejected after both broad/narrowed102216 screens lost99:109 and85:139. See AUTOMA_ENDGAME_DEVELOPMENT_V213.md for accepted scope. Experimental source remains in the authoritative Site checkout, not current production dist.

The supplied v212 game ended 103:138. Network scoring was 15:33; industry 62:77. Sewing (9:14) and Polyphase (0:11) account for the industry deficit. Coal/steel stock was consumed, and kerosene, bicycle and Typewriter were sold; this is not evidence for another blanket resource ban.

## Confirmed issues and changes

- The locomotive estimate used a fixed $18 cash threshold and a hypothetical funding action. With a real action set it now quotes a bounded sequence of actual development candidates, up to one legal loan and one income-wait pass, ending in an affordable real factory build. Current hand cards, consumed resources, own action clock, actual income settlement and deadline are used. No future cards, new heavy trains, opponent actions or era transition are invented. Search is limited to 18 nodes and five own actions. Failure means **unverified**, not proof that no longer route exists.
- Quote economics use actual final score-margin change, cash and income-loss opportunity costs, and 3.9 per action. Factory feasibility remains separate from profitability: a real positive-VP direct factory remains eligible even when its cash/action return is weak. Removed the fixed twelve-point free-development estimate and guaranteed minimum hypothetical heavy train. Actual future free-development builds are not assumed.
- Candidate comparison grants bounded, idempotent completion adjustments (+/-18; unverified detour -12), including existing valid first-step actions. No old investment/deadline hard gate was restored. First-step verified candidates participate in the bounded existing lookahead shortlist. Audit reports completion adjustment and quoted action count.
- Development's old `remaining tiles + 2` strategic restriction incorrectly excluded a real two-tile development plus factory in two actions. It now uses `ceil(tiles/2) + 1`; quotes still verify actual costs and execution. Paid rules/execution legality are unchanged.
- Quality income uses actual income-track level change, declining future settlement value and existing sold sewing's scoring effect. Last-round income gets no cash utility; cash/free-development/unused Whiskey utility declines with usable actions. Tactical income value also declines to zero in the final round, while actual sewing VP remains in projected industry score.

## Limits and verification

This is bounded deterministic own-action planning, not a full adversarial solver. No exact replay of the uploaded human game is claimed. No champion, schema, game rules, player interaction, assets, layout, save migrations or analytics change. Existing alternative/recovery/final-action protections remain. New paired fixtures cover funded development/loan/build purity, impossible funding/card states, two-action development, no fictitious factory value, last-round quality versus sewing, the income clock and bounded/idempotent comparison. Complete-suite and deployment results are recorded in CODEX_CONTEXT.md after verification. Browser manual-play QA is not performed for this engine-only change.
