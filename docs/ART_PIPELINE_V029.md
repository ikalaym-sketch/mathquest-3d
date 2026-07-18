# v0.29｜全自動GLB、Texture、SVG與Shader管線

## 1. 不要求使用者手動匯入

正式政策：使用者不需要下載或貼入外部模型、圖片、Texture與SVG。所有Canonical來源由專案程式、Recipe及後續模型生成器產生。

## 2. 管線架構

```text
Asset Recipe
→ Geometry Builder
→ Skeleton / Animation Builder
→ Socket / Collider Builder
→ Procedural Texture Generator
→ SVG Pattern Generator
→ Material / Atlas Resolver
→ Shader Profile
→ LOD Generator
→ GLB Exporter
→ Optimizer
→ Contract Validator
→ Canonical Registry
```

v0.29已完成治理、程序Texture、SVG Source、Shader Library與驗證基礎。大批量幾何、骨架及Atlas嵌入會在v0.30之後按類別生產。

## 3. 程序Texture

目前可重建10張128×128 Canonical基礎Texture：

- Wood BaseColor
- Soil BaseColor
- Stone BaseColor
- Cloth BaseColor
- Water Normal
- Moss Mask
- Snow Mask
- Metal ORM
- Crystal Emissive
- Mud ORM

每個輸出都有固定Seed、Bytes與SHA-256，可追溯且可重建。

## 4. SVG Source

目前生成8種：

- 木板接縫
- 童話磚牆
- 星光符文
- 機械控制面板
- 盾牌徽章
- 節慶旗幟
- 數學書封
- 蘑菇斑紋

SVG是來源格式，正式Runtime政策為Rasterize→Atlas→Mipmaps→KTX2，不直接解析大量SVG。

## 5. Shader Library

14種Canonical Profile：

- Terrain Blend
- Grass Wind
- Water Surface
- Snow Accumulation
- Wet Surface
- Crystal Pulse
- Mushroom Spore
- Steam Flow
- Hologram Panel
- Equipment Enchant
- Hit Flash
- Boss Weak Point
- Dissolve Effect
- Festival Light

每種Shader具有Low、Medium、High、Off品質設定。GLSL由Profile套用，不得散落於場景元件。

## 6. KTX2與Meshopt狀態

- v0.29尚未輸出KTX2，也未宣稱已完成。
- 原因：BasisU/KTX2工具鏈尚未納入並完成低階Android實測。
- 當前程序PNG是治理與生成基礎，不是最終壓縮交付。
- KTX2、Meshopt與正式Atlas封裝列入v0.34–v0.36。

## 7. Shared Material安全

- Shared Material不可直接被單一角色換色。
- 需要個別Uniform或染色的資產必須Clone Material或使用Instance資料。
- Material Profile會標記`instanceSafe`與`requiresClone`。
