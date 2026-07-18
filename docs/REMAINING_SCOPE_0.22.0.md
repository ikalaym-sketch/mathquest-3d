# v0.22.0 尚未完成／明確延後範圍

## 依使用者指示延後的封版缺口

1. v0.17 舊證據檔 `VALIDATION_20260714_V017.json` 與舊 Inventory Hash 不一致。
2. `CharacterPhysicalValidationService` 仍需由 Profile 宣告驗證升級為實際 JSX／Runtime Collider、Socket 契約驗證。
3. 玩家 Runtime Capsule 與 `player_child` Profile、`socket_work_tool` 與角色 Rig 的契約漂移尚未封版修正。
4. 八區全圖可行走底板仍使水域／裂隙無法強制橋梁通行；蘑菇螢光池幾何侵入仍待封版處理。
5. 完整開發依賴仍有 Vite／esbuild 相關 2 項漏洞；Production dependencies 為 0。

## 最終內容與驗收

- 現有 59 個 GLB 是可替換的工程生產資產，不是最終委製角色、怪物、建築與裝備美術。
- 正式動畫、VFX、區域音樂及完整音效混音仍需最終資產階段。
- Chromium 受環境政策阻擋，桌機／平板／手機共 24 個 Runtime WebGL 畫面案例未能執行。
- 裝置語音朗讀依賴瀏覽器與作業系統是否提供 `zh-TW` SpeechSynthesis Voice；未提供時會安全略過，不影響遊戲。

## 下一階段建議

先進行最終美術與真實裝置驗收，最後再一次處理上述 v0.17 封版缺口、依賴治理與完整工程證據鏈。
