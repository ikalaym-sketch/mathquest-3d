# v0.29｜Art Foundation & Asset Governance

## 1. 版本目的

v0.29 不以增加 GLB 數量為主要交付，而是先把資產尋址、裝備資料、動畫意圖、材質、Texture、Shader、LOD與驗證建立成唯一 Canonical Runtime。若跳過此階段直接從134個擴充到800個，會放大路徑失效、Material碎裂、動畫不一致與存檔損壞風險。

## 2. Canonical資產規則

- 唯一Registry：`src/data/productionAssetCatalog.js`
- 唯一路徑解析：`src/services/AssetPathService.js`
- 所有場景、角色、怪物、Boss、夥伴、農場與森林資產都以`assetId`尋址。
- Canonical path不含部署根目錄前綴，GitHub Pages的`/mathquest-3d/`由Resolver套用一次。
- `dist`只屬建置輸出，不得被視為第二套資產來源。
- Runtime遙測以`assetId + instanceId`區分重複實例，避免相同GLB互相覆蓋。

## 3. v0.29實際基準

| 指標 | 結果 |
|---|---:|
| Canonical GLB | 134 |
| 預定最終GLB | 800 |
| 尚待新增或重製容量 | 666 |
| 現有頂點 | 61,514 |
| 現有Materials | 573 |
| Animation clips | 285 |
| Skin | 3 |
| Image / Texture | 0 / 0 |
| 需REWORK | 58 |
| 需REPLACE | 76 |

v0.29保留以上缺口作為真實基準，不將生成的示範Texture冒充為134個GLB已完成貼圖化。

## 4. 800 GLB固定分配

| 類別 | 目標 |
|---|---:|
| 玩家、居民、角色模組 | 80 |
| 守護夥伴、住所、附件 | 32 |
| 武器、防具、副手、農具 | 140 |
| 星光村建築與生活物件 | 80 |
| 農場、作物、動物、加工設備 | 80 |
| 森林遺跡與自然物件 | 45 |
| 八區結構與環境物件 | 120 |
| 一般怪、精英、Boss | 72 |
| 八區室內Modular Kit | 60 |
| 試煉塔模組 | 36 |
| 節慶、關係事件、生態物件 | 35 |
| 傳送門、機關、技能及VFX Mesh | 20 |
| **合計** | **800** |

## 5. 資產預算

- Hero角色：15K–25K triangles、最多5個Material。
- 主要居民：8K–15K、最多4個Material。
- 夥伴：4K–8K、最多3個Material。
- 一般怪：3K–8K、最多3個Material。
- Boss：15K–35K、最多6個Material。
- 主要建築：10K–30K、最多4個Material。
- 中型Prop：500–5K、最多2個Material。
- 小型Prop：100–1K、最多1個Material。

## 6. LOD契約

- LOD0：100%。
- LOD1：45%–60%。
- LOD2：15%–25%。
- 角色、Boss與主要建築可依Profile調整，但必須有實際減面。
- 只建立LOD節點名稱、卻複製相同幾何，視為不合格。

## 7. Runtime邊界

只有以下Loader可直接使用`useGLTF`：

- `Model.jsx`
- `AnimatedProductionModel.jsx`
- `LodEnvironmentModel.jsx`

`CompanionActor`、場景與資料層只能傳入`assetId`。所有Loader必須提供Fallback、Telemetry與卸載處理。

## 8. 驗證方式

- `npm run art:governance:test`
- `npm run runtime:production:test`
- `npm run audit`
- `npm run build`

治理警告不等於修復完成。現有Material、Texture與LOD警告會保留至後續資產重製版本。
