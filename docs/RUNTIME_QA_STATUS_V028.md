# v0.28.0 Runtime QA 狀態

- Production Build：可在容器中重現。
- 村莊／夥伴資料與 GLB 契約：由 `npm run village:companion:test` 驗證。
- 既有 Simulation、Region、59 GLB Production Runtime、Region Gameplay、Release、Traversal、Environment／Life、Life Core：需全部回歸通過。
- Vite HTTP：以本機服務回應 HTTP 200 驗證。
- 多裝置實際 WebGL：**BLOCKED**。

阻擋原因：受管理 Chromium 套用 `URLBlocklist=["*"]`，無法可信載入本地／HTTP 頁面。此狀態不是功能失敗，也不是畫面通過；正式驗收必須在未受此政策限制的桌機、平板與手機完成。
