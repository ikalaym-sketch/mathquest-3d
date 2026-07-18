# MathQuest 3D v0.32.0｜Equipment & Combat

## Canonical asset result

- Canonical GLB: 383 → 523.
- Net new: 140; final 800 target remaining: 277.
- Allocation: 20 weapon, 20 delivery, 20 impact, 40 core armor, 20 feet/accessory, 20 off-hand.
- Equipment GLB materials: 140 total, one per file after the shared optimizer.
- Whole-project materials: 531 across 523 GLB; embedded images/textures remain zero because Runtime Atlas owns texture residency.

## Runtime result

- Twenty weapon items map to twelve Base Combat Archetypes.
- Hit shape, projectile speed, VFX, audio family and cooldown are consumed by `CombatExecutionService`.
- Projectile damage resolves when the delivery GLB reaches its target; melee uses arc, line or impact hit geometry.
- All eight equipment slots render Canonical GLB. Dual-wield items mirror to the off-hand socket; two-handed items lock that slot.
- The active loadout bundle retains at most ten equipment/combat GLB and releases the old bundle after equipment changes.
- Village full-detail residents are capped at two so the estimated mobile peak remains 68 of 70 GLB.
- Save Schema remains version 6.

## Texture and validation result

- Runtime Atlas: eight atlases and 34 KTX2 + PNG channel pairs, including Equipment Metal and Equipment Cloth.
- Player GLB: 81 animation clips, including all 68 combat contract clips.
- Required gates passed: `equipment:combat:test`, `test:foundation`, legacy audit/test matrix and production build.
- Static and HTTP validation do not replace desktop, Android phone or Android tablet WebGL performance acceptance; that remains v0.36 work.
