# MathQuest 3D Production Release

## Current Release

- Version: `0.27.0`
- Baseline: `0.26.0`
- Classification: `ENGINEERING_BUILD_RUNTIME_VISUAL_QA_BLOCKED`
- Scope: `Stage A Equipment／Item Runtime Truth` + `Stage B Farming Economy and Operation`

## Completed Runtime

### Equipment and items

- 10 consumables use registered Effect IDs and real Runtime handlers.
- 20 weapons have effective Lv5 profiles; spell MP costs and weapon-specific combat rules are enforced.
- 10 armor sets require exactly four matching pieces; Lv5 requires all four pieces at Lv5.
- Equipment validates ownership and slot compatibility before state mutation.
- Scene teleport, temporary buffs, fishing bait and growth powder use controlled requests and preconditions.

### Farming and economy

- New fields require hoe preparation before planting.
- Tool selection and stamina costs are centralized for eight farm actions.
- Four seasons use 28-day cycles; crop-season rules and Lv5 greenhouse override are active.
- Farm products preserve quality, quantity, unit value, harvest time, source and metadata.
- Legacy crop IDs migrate into product instances without quantity loss.
- Animal feed, petting and brushing affect hunger, health, mood, affinity and product quality.
- Processing uses canonical world minutes rather than wall-clock `Date.now()`.
- Farm upgrades require currency, materials and 1440 world minutes of construction.

## Validation Status

- Production Build: PASS, 1624 modules.
- Life Simulation Core: 17／17 PASS, 0 errors／0 warnings.
- Simulation: 7／7 PASS.
- Terrain, Region Production, Production Runtime 59 GLBs, Region Gameplay, Release Destructive and Environment／Life: PASS.
- Static Audit: PASS, 0 failures／0 warnings.
- Production dependencies: 0 vulnerabilities.

## Evidence Limits

- Managed Chromium enforces `URLBlocklist=["*"]`; 24 desktop／tablet／mobile WebGL visual cases remain `BLOCKED`, not `PASS`.
- Full development dependency audit retains 2 known vulnerabilities: 1 moderate and 1 high.
- Formal village relationships, animal guardian companions, final art and physical-device acceptance are not claimed complete.
- Historical v0.17 sealing work remains deferred.
