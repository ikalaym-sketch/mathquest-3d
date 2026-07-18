# Runtime QA status｜v0.35.0

## Automated runtime result

- Production HTTP smoke: 11/11 passed at `/mathquest-3d/`.
- Headless WebGL matrix: 24/24 passed.
- Viewports: desktop 1440×900, tablet 1024×768, mobile 390×844 at device scale factor 2.
- Regions per viewport: wind highlands, snow valley, farm plains, star village, crystal lake, sun canyon, mushroom grove and clockwork ruins.
- Each case asserts active scene and region, WebGL availability, scene mesh population, player character, four region structures, three normal monsters, one elite, one boss and performance sampling.
- Runtime exceptions and browser error logs: zero.
- Screenshot evidence: 24 PNG files under `docs/runtime-production-qa/`.

The trial run found and fixed two QA infrastructure defects before the final pass: Vite startup depended on restricted network-interface enumeration, and the QA bridge could not enter story-locked regions. Both fixes are scoped to the QA path; normal player progression is unchanged.

## Production-serving result

The HTTP test validates the hashed production entry, Canonical GLB `glTF` signature, KTX2 signature and MIME type, PNG fallback signature, and the v0.35 atlas manifest with 16 atlases and 73 channel pairs. Detailed machine-readable evidence is in `docs/HTTP_SMOKE_V035.json` and `docs/runtime-production-qa/runtime-report.json`.

## Not physical acceptance

Viewport emulation is not a physical Android or desktop GPU test. v0.36 must still measure actual phone, tablet and desktop first-load time, FPS, draw calls, triangles, texture memory, scene-transition peaks, thermals, long-session memory growth and GPU resource decline after unloading. No physical-device result is claimed in v0.35.
