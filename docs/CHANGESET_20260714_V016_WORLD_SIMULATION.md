# v0.16.0 World Simulation & Farm/Home Integration

## Baseline

- `mathquest-3d-v0.15.0-p1p5-recovery-build.zip`
- This build continues the existing append-only evidence chain. It does not replace the baseline history.

## Implemented source changes

### Farm Lv1–Lv5

- Added canonical `FARM_LEVEL_CONFIG` with five visible progression tiers.
- Lv1/Lv2/Lv3 unlock 9/25/49 plots.
- Lv4 adds irrigation, rain collection, shelter and moisture protection.
- Lv5 adds climate protection, automation multipliers and a visible star greenhouse.
- Build and carpenter panels now use the same canonical progression source.

### Crop simulation

- Replaced the old two/three-state crop calculation with:
  - prepared
  - seeded
  - sprout
  - growing
  - mature
  - withered
- Growth now uses persisted game-world minutes instead of only device wall-clock time.
- Soil moisture responds to watering, sun, breeze and light rain.
- Rain only records cells that were newly watered; repeated simulation ticks do not inflate that statistic.
- Lv5 climate protection prevents withering.
- Harvest quantity and quality use moisture, mathematics result and farm level.

### Animal production

- Added game-time cooldowns for cow, sheep and chicken products.
- Repeated clicking can no longer generate unlimited products.
- Lv4/Lv5 reduce cooldown through farm development.

### Farmhouse and barn interactions

- Added a unified farmhouse panel with Life, Storage and Yard tabs.
- Rest advances the persistent world clock to the next 07:00 and restores HP/MP/Stamina.
- Storage supports Items, Materials and Seeds in both directions.
- Wardrobe reopens the character editor without deleting progress.
- Farmhouse and barn indoor hotspots expose rest, storage, wardrobe, building and machine actions.

### Sky presentation

- Added a quality-scaled procedural cloud layer.
- Added a moon positioned opposite the sun during evening/night segments.
- External time jumps, including sleep, now synchronize back into the global environment clock.

### QA

- Added deterministic simulation tests for farm levels, crop growth, rain, climate protection, animal cooldown, sleep and persisted store upgrade path.
- Extended QA Bridge and Runtime QA cases for farm Lv5, crop simulation and farmhouse UI.
- Runtime browser execution remains blocked by the managed Chromium URL policy; the failed attempt is preserved in the evidence directory.

## Classification

- Logic and static validation: `VERIFIED`
- WebGL visual, collision and multi-device runtime: `BLOCKED`
- Final commissioned art: `PENDING`
