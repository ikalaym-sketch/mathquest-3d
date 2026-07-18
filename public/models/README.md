# MathQuest 3D Canonical GLB Runtime

## 正式原則

- `public/models/` 是唯一 Canonical GLB 根目錄。
- Runtime 僅能使用 `assetId`，由 `productionAssetCatalog.js` 與 `AssetPathService.js` 解析實際 URL。
- 禁止場景元件、NPC資料、怪物資料或夥伴資料自行拼接 `/models/...`。
- 程序幾何只允許用於遠景、大量重複物、Loading Fallback 或 GLB 載入失敗備援。
- `dist/models/` 是建置輸出複本，不是第二套來源。

## 不需要手動外部素材

本專案不要求使用者下載、貼入或手動指定外部 GLB、圖片或 Texture。正式美術資產由專案內持續維護的 Art Pipeline 產生、驗證及登錄：

```text
Asset Recipe
→ Geometry / Skeleton / Animation Builder
→ Socket / Collider
→ Procedural Texture / SVG Source
→ Material / Shader Profile
→ LOD
→ GLB Export
→ Canonical Registry
→ Runtime Validation
```

## Runtime 載入方式

```jsx
<Model assetId="forest:great_tree" />
<AnimatedProductionModel assetId="character:player_child" />
<LodEnvironmentModel assetId="region-environment:wind_grass_patch" />
```

不可再使用：

```jsx
<Model url="/models/forest/great_tree.glb" />
```

## v0.29 基準

- Canonical GLB：134
- 最終治理目標：800
- 當前資產處置：58 `rework`、76 `replace`
- 當前 Texture/Image：0，屬既有工程資產缺口；v0.29 已建立全自動 Texture／SVG／Shader 基礎管線，但尚未將新貼圖批次嵌回全部 GLB。
