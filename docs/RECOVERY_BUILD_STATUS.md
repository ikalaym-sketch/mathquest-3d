# v0.15.0 P1–P5 Recovery Engineering Build

## Classification

`IMPLEMENTED_UNTESTED`

This artifact is produced to preserve all real source changes and the evidence chain. It is **not** the final P1–P5 release because the current managed browser blocks local Runtime QA.

## Static gates

- Production build: PASS (`docs/BUILD_20260714_qa08.txt`)
- Static audit: PASS, 0 failures / 0 warnings (`docs/VALIDATION_20260714_qa08.txt`)
- Production dependency vulnerabilities: 0 (`docs/DEPENDENCY_AUDIT_20260714_qa08.json`)
- Package and package-lock version: synchronized at `0.15.0`

## Runtime gate

`BLOCKED`. See `docs/RUNTIME_20260714_BLOCKED.md`.

## Do not infer

The static gates do not prove that layout, WebGL rendering, collision, input, memory disposal, all 100 tower floors, or multi-device interaction are visually correct. Those remain subject to Runtime QA.
