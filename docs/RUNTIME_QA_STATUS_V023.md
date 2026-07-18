# v0.23.0 Runtime QA 狀態

- Production Build、資料驗證、通行破壞性測試與 HTTP 啟動均納入工程回歸。
- Chromium 仍受執行環境 `URLBlocklist=["*"]` 管理政策阻擋。
- 桌機、平板、手機的實際 WebGL 畫面、橋梁通過、跌落復原及高地跳躍操作未標示 PASS。
- 本版所有 Runtime 畫面結論均維持 BLOCKED，而不是以 HTTP 200 代替畫面驗收。
