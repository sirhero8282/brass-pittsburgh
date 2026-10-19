# v220 · local save quota recovery

Scope: persistence, backup/restore and failure UI only. No AI scoring, cards, costs, resource rules, champion, board assets, four-player mode or account changes. Save key remains brass-p-next-v1. Pages keeps its existing local-session and metrics adapters unchanged.

## Compact storage

The live state and in-memory undo snapshots retain their existing shape. packGameSave creates an independent persisted representation with _saveCodec:1. Current logs remain canonical; undo log lists reference their entries. Historical logs removed from the current list (for example clear-log followed by undo) live in _undoLogs. Proposal audits share references to log audits or _undoAudits. unpackGameSave restores ordinary JSON-string undo snapshots before normal load migration. Old unencoded saves still load.

This removes persisted duplication, not the existing in-memory snapshot cost. The codec is not encryption and backups contain complete game information, including hidden hands/decks. Backups are local JSON files; no network upload. Use trusted own backups. Import validates structure and rejects executable web markup; log rendering escapes text. Import cancellation and validation failure leave the live game unchanged. Restoring a file invalidates the outstanding proposal and requires confirmation before replacing the current game.

## Quota handling

save attempts compact persistence first. Quota errors retry with fewer oldest undo records (roughly halving above 10, then one at a time down to zero). Actual live undo history is pruned only after a successful write. No current logs are truncated and the previous persisted value is never removed first. Non-quota errors do not trigger history pruning. Exhausted retries preserve the live game and all its undo data, mark it unsaved, render the already completed action, pause automatic execution and block another manual action. Retry saves only; it does not replay the action. A beforeunload warning protects unsaved state.

The failure banner exposes retry and full current-game download. Setup also exposes download/import. Download filenames use Asia/Seoul KST. If a backup restore cannot persist, the imported state remains in memory, the previous disk value remains, and the unsaved banner stays visible.

Important: deploying this fix cannot recover a last unsaved action from an already-running v219 tab after that tab is reloaded or closed. Back up/preserve that tab before updating if that action matters. Do not delete browser storage to solve the quota. Refresh old-version tabs before continuing to avoid stale clients writing an older save representation.

## Verification

Regression coverage includes 30-snapshot log/audit roundtrip, clear-log undo, legacy/compact migration, quota count and byte-budget fallbacks, SecurityError handling, all-failure old-data preservation, retry, actual player construction completing once, subsequent-action guard, asynchronous AI proposal-save failure, backup import cancellation/failure and malicious markup rejection.

Stress reconstruction from the attached game's 27 audit texts (NOT its exact original save): 30 snapshots, about9.44MB estimated UTF-16 raw representation versus0.557MB compact,94% reduction; current logs and every undo log list matched. Synthetic downloaded backup validated. Isolated localhost4200 UI tested desktop/mobile warning, real file download and retry to saved. No production saved game was edited. Scratch quota fixture is outside the Site source and is not published.
