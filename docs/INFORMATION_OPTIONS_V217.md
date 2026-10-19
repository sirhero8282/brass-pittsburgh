# v217 — initial setup information advantages

Date: 2026-10-19 (Asia/Seoul). Executor: `plan-executor-v217-information-options-v1`.

## Setup choices

Two independent opt-in buttons are OFF by default, including legacy saves. Strict booleans are read from optional per-actor `aiInformationAccess`. These are disclosed information advantages, not changes to card legality or deck allocation. Setup confirmation locks both controls; changes invalidate an existing proposal and are undoable. Reroll preserves choices; a fresh game defaults to public-only. Switching to physical mode clears opponent-hand access, which is unavailable without a tracked hand. Own next-draw access remains possible because the app manages the Automa deck.

- **Opponent current hand:** uses the actual current `playerHand` for 0/1 natural card access instead of the public random-distribution estimate. Existing cash/resource/slot/unlock checks and bounded card influence remain. Does not read `playerDeck` or infer opponent intent from possession. Whiskey still represents possible wildcard access, not a committed move.
- **Own next refill:** exposes at most the next two known cards in the current era to reservation coverage and turn-boundary lookahead. Future cards are not legal construction cards until drawn. No refill is inserted between the two actions of one turn. At a turn boundary, only the copied search state is refilled. Last-round previews/refills are omitted rather than predicting next-era shuffle. No seed reconstruction, opponent future deck reading, extra candidate expansion or depth increase is added.

## Limits

This is a bounded next-refill option, NOT full-deck clairvoyance. Reservations can defer a target until the known refill but do not constitute a verified timed multistep schedule. Boundary lookahead is the existing approximate own continuation; intervening opponent actions, round settlement and every future card are not simulated. Therefore a known card does not certify the whole plan. A favorable hand alone does not imply the rival will choose a particular move.

Public-only mode returns before future-deck access in the new helpers. With both options off, v216 reservation/scoring/search behavior is retained aside from disclosed metadata and version identifiers. Champion, base difficulty settings, rules, save keys, map/4P engine and Pages analytics are unchanged. Lab perspective swaps must exchange per-actor options.

## Existing difficulty actually does

`AUTOMA_SEARCH_CONFIG` keeps easy/standard/hard base candidate limits 3/5/7 and next-action discount .35/.58/.70, further adjusted by installed policy and turn-boundary handling. Selected strategic candidates can supplement the base limit, so these are not absolute candidate caps. Easy adds deterministic small choice offsets. Hard adds explicit productive/confirmed-score profile bonuses. Information advantages are independent of this setting. No monotonic win-rate ranking or faster decision promise is asserted.

## Verification contract

Paired app/engine fixtures cover defaults, old-save reload, strict opt-in, setup lock/undo/physical mode, exact hand information without opponent future access, public-only no-future-read guards, bounded/pure previews, reservation loss, no current illegal future-card build, real refill correspondence, same-turn/era boundaries and actual lookahead restoration. Existing actual-next.js parity tests remain required. Browser setup QA uses a separate local origin and must not touch production saved games. Complete-game information-mode trials are integration checks, not strength evidence; timing is VM-specific, not a mobile latency guarantee.
