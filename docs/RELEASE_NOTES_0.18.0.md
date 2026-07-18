# v0.18.0｜Production Runtime Content Engineering Build

## 版本定位

本版本從已驗證的 `v0.17.0` 工程包直接延續，完成可替換的 GLB Runtime、角色骨架動畫契約、八區遭遇內容與 Runtime 驗收工具。依指示，`v0.17.0` 封版缺口沒有在本版本中混入修正；因此本包仍屬 **Engineering Build**，不是最終委製美術封版。

## 實際檔案差異

`新增：168　修改：17　刪除：10（舊 Dist Hash）　未變更：278`

差異證據：`docs/FILE_DIFF_V017_TO_V018.txt` 與 `.json`。

## 一、模組架構

### 新增資料與契約

- `src/data/regionEncounters.js`：八區 Canonical 遭遇資料。
- `src/data/productionAssetCatalog.js`：角色、結構、橋梁、怪物、精英、Boss 唯一資產 URL。
- `src/services/ProductionRuntimeValidationService.js`：資料層契約驗證。

### 新增 Runtime 元件

- `AnimatedProductionModel.jsx`：Skinned GLB 複製、Clip 切換、Socket 掛載、載入備援。
- `RuntimeAcceptanceProbe.jsx`：WebGL、Viewport、FPS、Mesh、Draw Call、資產 Ready 狀態。
- `RegionEncounterLayer.jsx`：一般怪物、精英與區域 Boss 分層生成。
- `runtimeAcceptance.js`：Runtime 驗收狀態唯一 Registry。

### 資產與驗證工具

- `generate-production-assets.mjs`：可重複建置 59 個 Canonical GLB。
- `run-production-runtime-tests.mjs`：直接解析 GLB Header／JSON Chunk，驗 Skin、Socket、Clip。
- `export-runtime-production-manifest.mjs`：輸出 Runtime Manifest 與遭遇矩陣。
- `runtime-qa-cdp.mjs`：桌機、平板、手機 × 八區的 Chromium WebGL 驗收工具。

## 二、實際完成內容

| 類別 | 數量 | 狀態 |
|---|---:|---|
| 區域 | 8 | 已接入 Runtime |
| 一般怪物 | 24 | 每區 3 種 |
| 精英 | 8 | 每區 1 種 |
| Boss | 8 | 每區 1 種 |
| 結構 GLB | 15 | 已取代結構視覺，保留程序化備援 |
| 橋梁 GLB | 1 | 依場景長寬縮放，Collider 仍由配置控制 |
| 角色 GLB | 3 | 玩家、成人 NPC、兒童 NPC |
| GLB 總數 | 59 | 1,702,012 bytes |

角色 GLB 具備 1 個 Skin、完整 Socket 節點，以及 `Idle / Walk / Run / Attack / Interact / Hurt / Defeat` Clip。怪物資產具備 `Idle / Move / Attack / Hurt / Defeat` Clip。

## 三、數據流 Dry Run

1. 區域切換讀取 `regionId`。
2. `getRegionEncounter(regionId)` 取得 3 一般怪、1 精英、1 Boss 與出生點。
3. `RegionEncounterLayer` 建立三個獨立生命週期。
4. `AnimatedProductionModel` 依戰鬥狀態切換 Clip。
5. GLB 載入失敗時只回退既有程序化外觀，不改寫狀態或資料。
6. 擊倒後先播放 `Defeat` 720ms，再移除實體並執行掉落／重生。
7. 元件卸載時清除所有延遲 Timer，避免跨場景 setState。

Rollback：直接回復 `v0.17.0` 工程包即可；新增資料沒有修改存檔 Schema，也沒有 Migration。

## 四、UI 與操作推演

- 桌機：1440×900，完整 HUD 與區域場景。
- 平板：1024×768，觸控啟用，維持同一場景狀態。
- 手機：390×844、DPR 2，啟用 Mobile Viewport。
- 模型載入中顯示既有程序化備援，完成後替換為 GLB。
- 攻擊、受擊、死亡均由狀態機切換動畫，不以滑鼠點擊直接傷害 Boss。

本容器未能完成上述 24 個實際畫面案例，原因見「Runtime 驗收限制」。

## 五、驗證結果

- Production Runtime Contract：PASS。
- GLB 檔案：59／59 PASS。
- Skin／Socket／Clip：0 Error、0 Warning。
- Region Production：8 區／32 子區／32 結構／9 橋梁 PASS。
- Existing Simulation：7／7 PASS。
- Static Audit：0 Failure、0 Warning。
- Production Build：PASS，1558 modules transformed。
- Production dependencies：0 vulnerabilities。
- Vite Server：HTTP 200。

完整開發依賴仍有 2 項漏洞（1 Moderate、1 High），屬已延後的封版治理事項。

## 六、Runtime 驗收限制

Chromium 已成功啟動 CDP，但容器強制套用企業政策：

```text
URLBlocklist = ["*"]
```

所有 HTTP／HTTPS URL 均回傳 `ERR_BLOCKED_BY_ADMINISTRATOR`，因此桌機、平板、手機 × 八區共 24 個 WebGL 案例為 **BLOCKED**，不是 PASS。驗收腳本已改為即時識別此狀態並輸出 `runtime-report.json`，不再無限 Loading 或假通過。

## 七、強制紅隊測試

1. **最終 GLB 契約破壞**：若委製檔改名 Socket 或缺 Clip，Runtime 動畫／裝備掛載必定失效；必須先通過 `runtime:production:test`。
2. **低階手機效能**：同屏 8 一般怪、1 精英、1 Boss 加四結構可能造成 FPS 或記憶體不足；本容器無法代表實機 GPU。
3. **跨場景 Boss 封印**：玩家在封印 Modal 開啟期間切場景，外部 Store Callback 仍可能完成獎勵流程；封版階段需加入 Scene Token／Cancellation Guard。

## 八、明確未冒充完成

- 59 個 GLB 是可運行、可替換的低多邊形生產資產，不是最終委製美術。
- 多裝置實際 WebGL 畫面仍未通過。
- `v0.17.0` 已知封版缺口仍保留：證據 Hash、角色 Runtime 契約落差、水域必經橋梁、開發依賴漏洞。
- 水域／落水／游泳／危險區規則尚未封版。
- 完整任務鏈、室內內容與最終 Boss 實戰平衡仍屬後續生產。

## 九、三個必要測試情境

1. 每區進入後確認 4 結構、3 種一般怪、1 精英、1 Boss 均載入且無 Console Error。
2. 玩家連續執行移動、攻擊、受擊、互動、死亡，檢查 Clip 與主手／工作工具 Socket。
3. 在 Boss `Defeat` 動畫與封印 Modal 期間切換場景，確認不重複發獎、不殘留 Timer、不產生幽靈實體。
