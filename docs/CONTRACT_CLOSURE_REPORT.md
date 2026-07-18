# v0.29.1 Contract Closure Report

## 1. 結論

v0.29.1 已完成 v0.30 大量資產擴充前的治理收口。正式基準維持 **134 個 Canonical GLB**，800 個目標包含現有資產，尚需淨新增 **666 個**。

已鎖定：

- Canonical Registry：134
- Keep／Rework／Replace：24／82／28
- 正式裝備欄：8
- 外觀欄：6
- 玩家 Socket：15
- Base Combat Archetype：12
- Texture Atlas Profile：16
- Shader Profile：14
- Material Runtime Profile：14

本版不是 v0.30 的資產擴充版，沒有把 GLB 數量灌高；它的目的，是先消除分散 Registry、URL 直連、生成器分裂、材質膨脹及動畫契約未接線等高風險問題。

---

## 2. 模組架構與依賴

### 2.1 Runtime資產鏈

```text
assetId
→ productionAssetCatalog.js
→ AssetPathService.js
→ Model／AnimatedProductionModel／LodEnvironmentModel
→ AssetRuntimeService.js
→ RuntimeMaterialService.js
→ Telemetry／dispose
```

約束：

- Registry 只保存 `canonicalPath`，不保存部署 URL。
- 模型元件只接受 `assetId`。
- `AssetPathService` 統一套用 Vite `BASE_URL`。
- Runtime Key 使用 `assetId + instanceId`，避免同模型多實例互相覆蓋。
- Bundle Residency 由 `AssetBundleService` 管理；農場與森林已接入。

### 2.2 裝備與動畫鏈

```text
Save Schema
→ equipmentInstances[instanceId]
→ Item Definition
→ 12種 Base Combat Archetype
→ EquipmentAttachmentLayer
→ Character Socket
→ AnimationStateService
→ CharacterActorRig
```

約束：

- 存檔只保存狀態與 ID，不保存 GLB URL。
- `weapon` 遷移至 `mainHand`。
- 舊 `pet` 轉入 `companionState`。
- 裝備等級與詞綴保存於獨立 instance。
- 雙手武器自動封鎖副手。
- 20件武器外觀定義映射至12種基礎戰鬥契約。

### 2.3 正式 Art Pipeline

```text
Asset Recipe
→ Geometry Builder
→ Skeleton／Animation Builder
→ Socket／Collider Builder
→ Texture／Material Resolver
→ LOD Builder
→ GLB Exporter
→ Vertex Color Material Consolidator
→ Contract Validator
→ Canonical Registry
```

正式維護模組位於：

- `scripts/art-pipeline/recipes/`
- `scripts/art-pipeline/geometry/`
- `scripts/art-pipeline/animation/`
- `scripts/art-pipeline/texture/`
- `scripts/art-pipeline/material/`
- `scripts/art-pipeline/lod/`
- `scripts/art-pipeline/export/`
- `scripts/art-pipeline/optimization/`
- `scripts/art-pipeline/validation/`

原三個領域生成器保留為 Domain Adapter，但全部改接同一 Exporter；不再各自維護 GLB 輸出規格。

---

## 3. 數據流 Dry Run

情境：玩家裝備長槍後進入農場，使用 Smart Tool 鋤地。

1. 存檔的 `mainHand` 保存裝備 `instanceId`。
2. 裝備實例解析到武器 Definition。
3. Definition 的視覺類型映射為 `polearm` Base Combat Archetype。
4. Canonical Registry 依 `assetId` 找到長槍資產。
5. `AssetPathService` 產生 GitHub Pages 子路徑安全 URL。
6. `EquipmentAttachmentLayer` 將長槍掛到 `SOCKET_main_hand`。
7. 攻擊鍵連續輸入，`comboIndex` 依序為 1、2、3；逾時後回到1。
8. 動畫候選依序尋找 Polearm 專屬 Clip，再退回 Generic `Attack`，避免現有GLB因缺Clip而中斷。
9. 進入農地互動時，`toolAction=hoe` 暫時掛載鋤頭並播放 `Hoe` 候選動畫。
10. 互動結束後卸下暫時農具，恢復長槍；不改寫主手裝備存檔。
11. 離開農場後釋放農場 Bundle 引用；引用歸零後才清除 GLTF Cache。

Rollback：

- GLB載入失敗時，使用既有Fallback模型，不寫壞存檔。
- 動畫Clip缺失時，依候選序列回退，不中止角色狀態機。
- Bundle引用未歸零時禁止清除共享資產。

---

## 4. UI與操作狀態

玩家操作習慣未改：

- 主要攻擊仍為單一按鈕。
- 連續攻擊自動進入三段Combo。
- 跳躍與翻滾鍵保持原規則。
- 農場維持 Smart Tool 自動判斷。
- 裝備武器後自動切換動畫契約與命中契約。
- 雙手武器自動鎖定副手。
- 守護夥伴仍從既有名冊切換。

狀態機：

```text
Input
→ locomotionState
→ actionState
→ weaponArchetype
→ comboIndex／toolAction／interactionType
→ Clip Candidate Resolver
→ CharacterActorRig
```

本版沒有重新設計UI，也沒有新增要求玩家手動選取GLB、Texture、Material或Shader的介面。

---

## 5. 資產與效能結果

### 5.1 GLB統計

| 指標 | v0.29原始 | v0.29.1 |
|---|---:|---:|
| Canonical GLB | 134 | 134 |
| GLB容量 | 約4.43 MB | 約4.43 MB |
| Vertices | 61,514 | 61,514 |
| Materials | 573 | **137** |
| Animations | 285 | 285 |
| Skins | 3 | 3 |
| Images／Textures | 0／0 | 0／0 |

Material由573降至137，約減少76%。Optimizer將現有純色Material合併為Vertex Color材質，保留節點、骨架、動畫、Socket與Collider契約。

GLSL Runtime已加入Vertex Color Bridge，避免Shared Shader套用後把多色模型壓成單色。

### 5.2 尚未宣稱完成

- KTX2：尚未導入正式BasisU工具鏈。
- Meshopt：尚未作最終壓縮驗收。
- Texture Atlas：契約已鎖定16組，但現有GLB仍沒有圖片Texture。
- LOD實際減面：平均LOD1約80.1%、LOD2約44.5%，尚未達正式目標45–60%／15–25%。
- Android／平板／桌機實機FPS與GPU記憶體：本環境未執行實機WebGL驗收。
- 12種武器專屬動畫Clip：Runtime契約已接線，但現有角色GLB仍主要使用Generic Attack回退；正式Clip屬v0.32。

---

## 6. 回歸與建置結果

下列命令全部通過：

- `npm ci --ignore-scripts`
- `npm run audit`
- `npm run art:governance:test`
- `npm run runtime:production:test`
- `npm run simulation:test`
- `npm run region:test`
- `npm run region:gameplay:test`
- `npm run release:test`
- `npm run traversal:test`
- `npm run environment:life:test`
- `npm run life:core:test`
- `npm run village:companion:test`
- `npm run test:foundation`
- `npm run build`

Production Build：

- Vite 5.4.21
- 1,653 modules transformed
- Build成功
- `dist/models`為建置副本，不計入Canonical數量

依賴安全：

- `npm audit`仍回報2項開發工具鏈風險：1 moderate、1 high。
- 來源為Vite 5／esbuild開發伺服器鏈。
- npm提出的完整修復要求升級至Vite 8.1.4，屬SemVer Major；本版未強制跨大版本升級，避免未經完整回歸直接破壞現有建置。
- GitHub Pages靜態輸出不等同於開放Vite Dev Server，但開發環境仍應限制在可信網路與本機。

---

## 7. 版本藍圖對比

### v0.29.1已完成

- 134筆逐筆處置契約24／82／28。
- 唯一Canonical Registry。
- assetId-only Loader Boundary。
- GitHub Pages Base URL正規化。
- 裝備實例制及8＋6欄位契約。
- 15個玩家Socket。
- 12種Base Combat Archetype。
- Animation State接入玩家與角色Rig。
- Bundle引用計數與延遲清除。
- 16 Atlas／14 Shader／14 Material Profile契約。
- 統一Art Pipeline及正式Optimizer。
- 573→137 Material治理。

### v0.30進場條件

v0.30可開始Village & Farm Expansion，但每批資產必須同時滿足：

1. Recipe已註冊用途、輪廓、比例、區域與材質規則。
2. Registry只存assetId與canonicalPath。
3. Shared Material／Atlas Profile已指定。
4. 建築與中型Prop具有LOD契約。
5. 重複Prop支援Instancing。
6. 場景Bundle可載入及卸載。
7. Contract Validator通過後才能計入Canonical資產數。

建議v0.30累計目標採ZIP內修正版：**約280個GLB**。v0.35完成800個，v0.36凍結資產數量並進行物理驗收。

---

## 8. 強制紅隊：仍可能崩潰的3個破綻

### 破綻一：LOD只有契約，實際減面不足

若v0.30直接大量加入建築與作物，手機端會在視距切換正常的表象下，仍持有過高Triangle成本。正式解法是生成階段做真實Simplification，不能只建立三個名稱不同但面數接近的LOD Node。

### 破綻二：Texture管線尚未完成KTX2與Atlas實體輸出

目前GLB為Vertex Color資產，尚不能證明數百張BaseColor／Normal／ORM進場後的Texture Memory與Sampler數安全。v0.30不得讓每個GLB各帶獨立圖片與Material。

### 破綻三：武器專屬Clip尚不存在

Runtime已能解析12種Archetype，但現有角色模型主要回退至Generic Attack。若v0.32只生成武器模型而未同步生成與驗證專屬Clip，外觀、命中區與動作節奏仍會不一致。

---

## 9. 三個驗收情境

1. **同模型多實例**：同場景產生20棵相同樹，確認Telemetry以`assetId + instanceId`分離，移除其中1棵不會清除其餘19棵的GLTF Cache。
2. **長槍＋Smart Tool**：裝備長槍完成三段攻擊，進農田鋤地後恢復長槍；存檔的`mainHand`與詞綴不變，副手依雙手規則維持鎖定。
3. **GitHub Pages子路徑**：以`/mathquest-3d/`建置，角色、夥伴、區域LOD及Fallback全部從AssetPathService解析，不出現根路徑`/models/...`請求。
