# v0.27 Runtime QA Status

- Production Build：PASS，1624 modules。
- Life Simulation Core：17／17 PASS，0 Error／0 Warning。
- Existing regression：Simulation 7／7、Region Production、Production Runtime 59／59 GLB、Region Gameplay、Release Destructive、Terrain Traversal、Environment／Life 均 PASS。
- Static Audit：0 Failure／0 Warning。
- Production dependencies：0 vulnerabilities。
- Chromium 多裝置 WebGL：BLOCKED，原因為管理政策 `URLBlocklist=["*"]`；不得標示為 PASS。
