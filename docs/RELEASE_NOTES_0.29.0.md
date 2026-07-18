# MathQuest 3D v0.29.0｜Art Governance Foundation

## 已完成

- 134個Canonical GLB集中至單一Registry。
- 修正GitHub Pages子路徑尋址風險。
- 統一靜態、動畫與LOD Loader。
- 夥伴、角色、怪物、Boss、橋梁、農場、森林與八區環境改用assetId。
- 森林現有GLB優先，程序幾何降為Fallback。
- Runtime Asset Registry改為實例級記錄與引用計數。
- 裝備改為8欄＋6個外觀欄。
- 裝備庫改為Instance制；同款裝備可有不同等級、詞綴與品質。
- Save Schema升級為6，保留舊weapon、pet、等級與詞綴遷移。
- 新增Equipment Visual Resolver、Attachment Layer及Animation State Service。
- 建立800 GLB固定分配、資產預算、LOD、Material、Atlas契約。
- 建立10張程序Texture、8種SVG Source及14種GLSL Shader Profile。
- 新增完整134 GLB驗證與Art Governance Test。

## 尚未完成

- GLB數量仍為134，尚未批量提升至800。
- 現有134個GLB仍是0 Image／0 Texture；本版只完成自動生成基礎，未將Texture嵌入全部GLB。
- KTX2、BasisU、Meshopt及正式Atlas封裝尚未完成。
- 現有角色缺少feet、legs等完整裝備Socket，全部穿戴可視化延至角色重製。
- 未執行真實Android、平板及桌機操作驗收；靜態、Build與Node模擬不可冒充實機試玩。

## 相容性

- 舊存檔會由Schema 6轉換。
- 玩家原有主武器轉入`mainHand`。
- 舊寵物轉入守護夥伴名冊。
- 原操作按鍵與Smart Tool習慣不變。
