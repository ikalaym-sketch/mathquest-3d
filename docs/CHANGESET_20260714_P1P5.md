# MathQuest 3D v0.15.0 — P1–P5 Recovery Changeset

## Baseline

- Package: `mathquest-3d-v0.14.0-phase45-foundation-checkpoint.zip`
- SHA-256: `95cded26205ca781b4019df3c85f15c0e602f9b5dd6622eb14bf9565b2b8a626`

## Evidence policy

All items below are `IMPLEMENTED_UNTESTED` unless stated otherwise. Static audit/build success is not treated as runtime verification.

## P1 — Input, player, failure flow

- Added gamepad movement, camera, jump, dodge, and attack input.
- Added first-run character creation and persisted character profile.
- Replaced immediate silent auto-respawn with a child-safe defeat and explicit respawn flow.
- Added a modular programmatic player avatar driven by body, skin, hair, face, accessory, and equipment state.

## P2 — World environment and spawn rules

- Moved time/weather to a persistent global world state across outdoor scenes.
- Added scene-aware sky, sun, stars, fog, rain, and indoor precipitation suppression.
- Added weather/time spawn rule support for monster fields.
- Added a QA-only bridge activated exclusively with `?qa=1`.

## P3 — HUD and child-oriented interaction

- Reworked status, clock/weather, task, main menu, joystick, fairy, reward, and quick-item placement.
- Added character name/face integration in HUD.
- Removed the Boss click-to-damage development shortcut.

## P4 — Modular scene structure

- Added reusable surface detail generation with instanced grass, flowers, leaves, and rain puddles.
- Added geometry exclusion rules for paths, buildings, ponds, fields, and protected interaction spaces.
- Added canonical indoor definitions and zone detection for 11 village buildings plus farm house/barn.
- Added modular building shells, split colliders, interiors, furniture colliders, roof/front-wall visibility rules, pond/bridge structure, and revised village placement.
- Added NPC work/rest/shelter schedule logic.

## P5 — Mathematics and Trial Tower

- Added a 132-node, 12-domain Skill Graph with prerequisites, misconceptions, representations, hints, scene mapping, templates, and mastery metadata.
- Added Skill Graph validation and staged remediation in the math modal.
- Expanded question generation beyond four operations.
- Added data definitions for 100 Trial Tower floors, 10 themes, 8 room archetypes, 10 milestone bosses, and skill mappings.
- Added puzzle, treasure, rest, battle, swarm, elite, endurance, and boss room control.
- Added completion tracking to prevent repeat reward farming.
- Fixed puzzle-room incorrect-answer retry so the challenge can reopen rather than remain stalled.

## Static evidence

- Validation: `docs/VALIDATION_20260714_qa08.txt`
- Production build: `docs/BUILD_20260714_qa08.txt`
- Production dependency audit: `docs/DEPENDENCY_AUDIT_20260714_qa08.json`
- File-level comparison: `docs/FILE_DIFF_20260714_P1P5.txt`

## Runtime status

Blocked by the managed Chromium URL policy in the current execution environment. See `docs/RUNTIME_20260714_BLOCKED.md`. This package is a recovery engineering build, not the final P1–P5 release.
