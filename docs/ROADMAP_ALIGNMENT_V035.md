# Roadmap alignment｜v0.35.0

## Completed and frozen

- v0.29.1 contract closure: complete.
- v0.30 village and farm: complete.
- v0.31 characters and companions: complete.
- v0.32 equipment and combat: complete.
- v0.33 regions, forest, creatures and encounter silhouettes: complete at 649 Canonical GLB.
- v0.34 interior kit and deterministic 100-floor trial tower: complete at 745 Canonical GLB.
- v0.35 festivals, relationships, ecology, portals, mechanisms and combat VFX: complete at exactly 800 Canonical GLB.

The 800-asset target is now a hard freeze. New release work must not change the Canonical count, target distribution or 24/82/28 legacy disposition unless a future user decision explicitly reopens governance.

## v0.36 gate—not started

v0.36 is exclusively Physical Acceptance and optimization validation. Its entry criteria are the unchanged v0.35 Registry and build. Required work is:

1. Android phone, Android tablet and desktop browser testing on named hardware and browser versions.
2. First-load and scene-transition timing.
3. Draw calls, triangle count and texture-memory capture per representative scene.
4. FPS P50/P95 or equivalent stable distribution plus minimum FPS.
5. Long-session memory-growth and thermal observation.
6. Proof that GPU resources decline after GLB bundle unload.
7. KTX2 fallback and mandatory Meshopt-extension compatibility before enabling compressed runtime rewrites.

Headless viewport QA is evidence that v0.35 runs and routes correctly; it is not evidence that these physical gates have passed.
