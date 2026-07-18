# v0.19.0 Runtime QA Status

- Vite production preview application URL：HTTP 200。
- Production Build、資料契約、事件狀態機與 GLB 檔案可重現驗證：PASS。
- 本容器 Chromium 仍受既有企業政策 `URLBlocklist=["*"]` 限制。
- 因此桌機、平板、手機 × 八區的實際 WebGL 畫面驗收仍標示 **BLOCKED**，不是 PASS。
- v0.19 新增的 8 套核心機制已通過編譯與資料契約驗證，但仍需在未封鎖瀏覽器環境逐項操作。
