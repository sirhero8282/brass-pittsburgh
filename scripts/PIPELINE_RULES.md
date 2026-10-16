# Pipeline rule source

Edit only `oilOnBuild` on pipeline network catalog items in
`dist/assets/data/pittsburgh-2p-layout.json`. Endpoints use the catalog's stable
`fromId` / `toId`; the generator normalizes them to direction-independent edge IDs.
Catalog notes retain source-sheet provenance, not a second execution rule.
An explicit zero is valid. A missing, negative, duplicate or contradictory rule
fails validation rather than silently becoming zero.

Run `node scripts/sync-pipeline-rules.cjs` after changing the source.
It regenerates the marked rule blocks in both engine files and the browser
layout export. Do not edit generated tables or the layout JavaScript by hand.

Before publishing, run:

```
node scripts/sync-pipeline-rules.cjs --check
node --test tests/*.test.cjs
```

The test suite also enforces synchronization. Construction, manual map entry and
the legacy map renderer all use `pipelineOilBonus(a,b)` from the generated data.
Reserve placement adds one extra oil; replacing it returns the tile without
adding route oil or granting opening rewards again. This change does not
retroactively alter saved stock because previous oil may already be consumed.
