# MathQuest 3D execution contract

## Current truth

- Current release: v0.35.0.
- Canonical source assets: exactly 800 GLB under `public/models`; the 800 files under `dist/models` are build copies and never count as additional assets.
- Frozen target distribution: characters 80, companions 32, equipment 140, village 80, farm 80, forest 45, regions 120, creatures 72, interiors 60, trial tower 36, events 35, effects 20.
- Legacy disposition is locked at keep 24, rework 82, replace 28; the project adds exactly 666 new assets over the original 134.
- v0.35 is the asset-count freeze. Do not add Canonical GLB or begin v0.36 Physical Acceptance without explicit user authorization.

## Execution discipline

1. Start work with one bounded slice that has a visible runtime outcome and a targeted permanent test. Do not spend an open-ended turn producing only analysis.
2. Use this order inside a release: contract and exact allocation, recipes and generators, Registry, Runtime wiring, targeted tests, full regression, build, package.
3. After a slice passes its targeted test, continue directly to the next approved slice. Pause only for a choice that changes architecture or allocation, a missing required source asset, or authority outside the requested scope.
4. Give the user a short progress update at every slice boundary. State completed evidence, the active slice, and any real blocker.
5. Run the smallest relevant test while editing. Run `npm run test:foundation`, the legacy regression matrix, browser QA, and `npm run build` only after targeted tests pass.
6. Prefer permanent contract tests under `scripts/`. Do not add one-off migration scripts, self-check documents, duplicate registries, or generated evidence files unless explicitly requested.

## Asset and Runtime invariants

- Formal loaders accept `assetId`; only `AssetPathService` resolves deployment URLs.
- A new GLB is not complete until Recipe, Registry, Runtime consumer, residency/disposal behavior, and a permanent reachability test all agree.
- Keep player, resident, companion, equipment, animation, material, shader, LOD, and Socket contracts centralized; never fork a second production pipeline for a category.
- Respect the mobile scene budget of 70 simultaneously resident GLBs. New event, interior, tower, region and equipment bundles must retain and release through their residency services rather than widening global residency.
- Preserve Save Schema 6 compatibility unless a future feature cannot be represented safely without a schema bump.
- Never claim physical WebGL acceptance from static tests. Android phone, Android tablet, desktop browser, GPU memory, draw calls, FPS, and long-session checks remain physical acceptance work.

## Release handoff

- Required gates: targeted release test, `npm run test:foundation`, legacy audit/test scripts, `npm run build`, 24-case headless WebGL QA, HTTP base-path checks, `npm run release:v035:verify`, and public/dist hash parity.
- Package source plus `public` and `dist`; exclude `node_modules`, caches, temporary logs, and any prior delivery ZIP.
- Report Canonical counts separately from build copies. Headless desktop/tablet/mobile viewports are not physical-device acceptance; Android phone, Android tablet, desktop GPU, memory, thermals, FPS and long-session work remain v0.36.
