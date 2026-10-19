# v218 — search candidate setting and Cheating Automa

Date: 2026-10-19 (Asia/Seoul). Executor: `plan-executor-v218-search-candidates-v1`.

## Candidate count, not difficulty

Initial setup now offers **3 / 5 / 7 base candidates**. Existing saved `aiDifficulty` keys easy/standard/hard remain storage-compatible aliases for those counts; absent/invalid values retain the five-candidate default. The labels/logs no longer present them as skill grades. Existing important strategic supplements can add candidates beyond the base count.

All three settings use the same .58 base continuation discount (installed-policy and turn-boundary adjustments still apply), the same scoring/profile rules and the same strategic supplements. The easy choice offset and hard productive-score bonus have been removed. Strategy type remains a separate preference; information access remains a separate opt-in. Setup edits reject unknown values, invalidate proposals, support undo and lock on game start. Reroll preserves the base count. No strength or exact latency ranking is asserted.

## 반칙하는 오토마

- Optional per-actor `aiCheatWhiskey` holds enabled, era1/era2 allowances and a spent-by-era ledger. Default is OFF with zero allowances; legacy saves without the field have no advantage.
- Setup offers 0–16 hidden units per era. A unit pays for **one construction card joker only**, when the selector requires a joker under the existing construction/card rules. Natural matching cards continue to be preferred. No extra card, slot, resource or money is granted. Hidden units are consumed before ordinary whiskey.
- Hidden whiskey is NOT added to the ordinary personal/network whiskey count, three-unit cap, quality-star calculations, production or score. Ordinary whiskey functions and quality reward validation remain unchanged. An explicitly forged quality spend beyond actual ordinary holdings is rejected even with hidden units available. Non-construction joker proposals are rejected.
- Current-era remaining allowance is configured amount minus that era's actual spends. Unused era-I allowance is not carried into era II; reloading or bankruptcy does not replenish a spent allowance. Undo restores the ledger with the action snapshot. Reroll preserves configured quantities but clears spends for the new game.
- Proposal validation rechecks hidden availability before action execution. Real and search construction consume the same ledger; hypothetical search stays isolated. A stale secret-joker proposal cannot silently consume ordinary quality whiskey after the hidden pool is exhausted.
- Card reservation coverage may use remaining secret units as joker capacity, but never as free cards or quality stars. Secret joker candidates do not incur the ordinary quality-whiskey reservation penalty. Main game whiskey counters remain ordinary-only; setup/audit and action logs disclose the separate cheat pool and usage for verification.
- Lab perspective swapping exchanges the entire allowance/usage object with its actor; it cannot grant the rival a second pool.

Champion, core construction/sale/resource/scoring rules, save keys, board/4P engine and Pages session/analytics overlay are preserved. This is an explicit opt-in exception, not a silent difficulty advantage. Browser checks must use an isolated local origin, not production saves. Small actual-next.js paired games validate integration only, not strength.
