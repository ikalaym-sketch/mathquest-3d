# Phase 4/5 Governance and Acceptance Gates

## Roles
- Game Director: defines child-facing experience and acceptance criteria.
- Technical Art / Level Design: owns modular breakdown, terrain, roads, water, interiors and art composition.
- Engineering: implements React, R3F, Rapier, loading, state and UI.
- Independent QA: executes runtime, collision, overlap, RWD, performance and destructive tests.

## Approval rule
No role may approve its own output. Every completion claim requires build evidence, validator output and runtime screenshots.

## Gates
1. Architecture and dependency gate.
2. Structural / placement validator gate.
3. Navigation and collision gate.
4. Child UI readability gate.
5. Desktop / tablet / mobile runtime gate.
6. Low-memory and repeated-scene-transition destructive gate.
