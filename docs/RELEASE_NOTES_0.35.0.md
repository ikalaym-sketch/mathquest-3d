# MathQuest 3D v0.35.0｜Canonical 800 Freeze

## Release outcome

- Canonical GLB is frozen at exactly 800: 134 governed legacy assets plus 666 net-new assets.
- `public/models` contains the 800 Canonical files. `dist/models` contains 800 byte-identical build copies and is not counted as another asset set.
- Legacy disposition remains exactly keep 24, rework 82, replace 28.
- The twelve target groups are complete: characters 80, companions 32, equipment 140, village 80, farm 80, forest 45, regions 120, creatures 72, interiors 60, trial tower 36, events 35, effects 20.

## v0.33–v0.35 production chain

- v0.33 added 126 GLB: 30 forest, 24 region structures, 40 region environment modules and 32 creature modules. Existing 24 normal monsters, eight elites and eight bosses were also rebuilt with region-specific silhouettes without increasing their Registry count.
- v0.34 added 96 GLB: 60 modular interior assets and 36 trial-tower assets. One hundred floors are deterministically composed across ten themes with four retained assets per floor.
- v0.35 added 55 GLB: 12 four-season festival props, ten relationship-memory props, 13 ecology props, four portals, four mechanisms and 12 Base Combat Archetype VFX.
- Village, farm, forest, regions, interiors, tower floors, equipment and event/effect assets are retained through scoped residency services and released through the shared reference-counted loader boundary.

## Material, texture, LOD and compression

- Runtime contains 16 atlas groups and 73 channel pairs, each with Basis Universal KTX2 plus PNG fallback.
- Governance contains 29 Material Profiles and 14 Shader Profiles; generated event/effect assets use one shared material per GLB.
- Across all 800 GLB: 25,116,764 bytes, 379,825 vertices, 808 materials, 500 animations, eight skins, and zero embedded images or textures.
- 465 LOD assets average 52.9% at LOD1 and 20.2% at LOD2.
- Meshopt 1.1.1 completed lossless round-trip validation for 96 assets and 5,286 accessors, with a 0.615 candidate byte ratio. `EXT_meshopt_compression` is not required or written until v0.36 physical compatibility acceptance.

## Trial-run fixes

- Runtime QA now launches Vite directly and binds to loopback, avoiding nested-package-manager startup and restricted network-interface enumeration failures.
- The QA-only region bridge now temporarily unlocks the requested test region before entering it. Player progression and non-QA behavior are unchanged.
- Production preview now has a permanent HTTP smoke test for the `/mathquest-3d/` base path, hashed entry bundle, GLB, KTX2, PNG fallback and atlas manifest.
- Environment-specific package proxy URLs were removed from `package-lock.json`; every affected tarball now resolves through the public npm Registry, and final verification rejects future internal-Registry leakage.

## Verification

- `npm run test:foundation`: passed, including every v0.30–v0.35 permanent contract test.
- Legacy audit, simulation, region production, region gameplay, release, traversal and environment-life regressions: passed with zero errors and warnings.
- `npm run build`: passed.
- `npm ci --dry-run --ignore-scripts`: passed; production `npm audit` reported zero vulnerabilities.
- Production HTTP smoke: 11/11 passed.
- Headless WebGL: 24/24 passed across desktop, tablet and mobile viewports and all eight regions, with 24 screenshots and zero browser errors.
- Final public/dist hash parity: 800/800, zero missing, extra or mismatched GLB.

## Acceptance boundary

v0.35 is released as the Canonical asset freeze. v0.36 has not started. Physical Android phone, Android tablet and desktop GPU measurements—including first load, draw calls, triangles, texture memory, scene-transition peak memory, FPS distribution, thermals, long-session growth and post-unload GPU decline—remain v0.36 work and are not claimed by this release.
