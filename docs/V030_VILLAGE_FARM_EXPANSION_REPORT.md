# v0.30｜Village & Farm Hero Art 完整報告

## 1. 結論

v0.30已由v0.29.1的134個Canonical GLB擴充至**282個**，新增148個，距離800個目標尚需518個。本版不是只建立檔名與Registry：星光村建築、地標、生活分區物件、農場建築、設施、作物階段及農具均已接入正式場景Runtime。

## 2. Canonical資產配置

| 類別 | 數量 |
|---|---:|
| 玩家／角色 | 3 |
| 區域結構 | 15 |
| 橋梁 | 1 |
| 一般怪 | 24 |
| 精英 | 8 |
| Boss | 8 |
| 區域環境 | 40 |
| 守護夥伴 | 8 |
| 農場 | 80 |
| 森林 | 15 |
| 星光村 | 80 |
| **合計** | **282** |

- v0.29.1既有134筆仍維持：保留24／重製82／替換28。
- v0.30新增148筆全部標示為`artStatus: new`。
- `dist/models`只屬建置輸出，不計入Canonical資產。

## 3. 模組架構

### 資料層

- `productionAssetCatalog.js`仍是唯一Canonical Registry。
- 新增`villageAssetCatalog.js`與`farmExpansionAssetCatalog.js`作為領域定義模組，最後只能由主Registry匯入。
- 場景及元件不保存`/models/...`；一律使用`assetId → AssetPathService → BASE_URL`。

### 生產管線

```text
Asset Recipe
→ Village/Farm Geometry Builder
→ Animation Builder
→ Socket/Collider Builder
→ LOD Budget Enforcer
→ GLB Exporter
→ Vertex Color Material Consolidator
→ Runtime Contract Validator
→ Canonical Registry
```

舊領域生成器保留為正式Domain Adapter，但共同進入`run-canonical-art-pipeline.mjs`，不得各自建立不同契約。

### Runtime

- `VillageAssetService`：核心建築／地標＋最近兩個生活分區。
- `FarmAssetService`：核心農場包＋最近兩個功能分區。
- `AssetBundleService`：引用計數、分包切換及延遲清除。
- `RuntimeTextureAtlasService`：KTX2優先、PNG回退、Renderer級引用計數。
- `Model.jsx`：assetId-only、Skeleton安全複製、Material／Shader、Atlas、Runtime Telemetry及Registry LOD切換。

## 4. 場景實際接線

### 星光村

- 11棟正式GLB建築。
- 星光樹、噴泉、紅橋、任務板及氣球祭壇。
- Plaza／Market／Workshop／Residential／Learning／Portal六個分區包。
- 修正第11棟建築的語意錯配：`town_hall`現在對應星光村公所，不再以故事書屋名稱載入公所模型。
- 手機中畫質契約：同時最多26個GLB資源。

### 農場

- 農舍、穀倉及既有核心農場資產12個。
- 新增68個：8件農具、24個作物階段、動物設施、加工設備、田區設備、出貨及升級設施。
- 10種既有種子均可解析至seeded／sprout／growing／mature四階段Canonical模型，共40組映射。
- 八件正式農具已掛載至玩家主手Socket；動物刷、飼料袋及徒手互動使用低成本Fallback，因不屬本版八件農具配額。
- 手機中畫質契約：同時最多30個GLB資源。

## 5. LOD、Material、Texture及Shader

### LOD

- 188個資產具有LOD0／LOD1／LOD2。
- 平均LOD1頂點比例：53.2%。
- 平均LOD2頂點比例：20.1%。
- 通用`Model.jsx`與環境模型均已依Registry Profile切換，不再只建立節點名稱卻不切換。

### Material

完整282個GLB優化結果：

- Material：285。
- 平均：約1.01個Material／GLB。
- 保留Vertex Color、動畫、骨架、Socket及Collider契約。

### Runtime Atlas

目前正式輸出三組場景Atlas：

1. Village
2. Farm
3. Crop／Animal

合計13組KTX2＋PNG Fallback通道，涵蓋BaseColor、Normal、ORM、Emissive及Mask。16組Atlas治理Profile仍保留，其他區域會依後續版本逐步產出，不把尚未生產的Profile冒充為完成。

### Shader

14種Shader Profile均保留Low／Medium／High及關閉Fallback。Vertex Color Bridge已接入，避免材質合併後套用GLSL時退化為單色。

## 6. 動畫與操作契約

- 12種Base Combat Archetype。
- 正式武器契約Clip：68。
- 玩家GLB實際Clip：75。
- 玩家操作不改：單一攻擊鍵自動進三段Combo、跳躍與翻滾保持不變、Smart Tool保持不變。
- 農務期間只暫時覆蓋主手顯示及Tool Action；不改寫已裝備武器，操作完成後恢復主武器。

## 7. Dry Run

情境：玩家裝備長槍，進入農場鋤地。

1. Save只保存`mainHand`的裝備`instanceId`。
2. Definition解析至Polearm Base Archetype。
3. Registry取得長槍`assetId`並由AssetPathService解析Pages路徑。
4. Attachment Layer掛到`SOCKET_main_hand`。
5. 玩家點擊田地，Smart Tool解析為`hoe`。
6. `resolveFarmToolModelAssetId('hoe')`取得正式鋤頭GLB。
7. 主手暫時顯示鋤頭，Animation State播放`Hoe`。
8. Store不更改長槍裝備實例。
9. 農務動作結束後，鋤頭引用釋放並恢復長槍。
10. 離開農場後，核心包與分區包引用歸零，進入延遲清除流程。

Rollback：若鋤頭GLB、KTX2或Shader載入失敗，Model Error Boundary、PNG Fallback及既有低成本工具Fallback會維持操作可用；存檔不保存模型URL，因此不會污染Save Schema。

## 8. UI與操作模擬

- 桌機、平板、手機的控制按鈕及操作規則未修改。
- 分包切換每0.3秒檢查最近分區，不因每幀距離變化重建Registry。
- Asset Bundle使用集合差異更新，不重複預載相同模型。
- 農具只在短暫Action Window顯示，避免常駐覆蓋主武器。
- GLB載入失敗時保留Fallback，不阻斷點擊、耕作或進出建築。

## 9. 配額與效能

| 指標 | 結果 |
|---|---:|
| Canonical GLB | 282 |
| GLB總大小 | 9,561,488 bytes |
| 頂點 | 125,970 |
| Material | 285 |
| Animation Clip | 353 |
| Skin | 3 |
| 村莊同時資產上限 | 26 |
| 農場同時資產上限 | 30 |
| npm弱點 | 0 |

Vite已升級至8.1.4並改為函式型`manualChunks`。Build成功，Physics與Drei仍為大型Chunk，但已獨立分包，未再出現單一主Bundle極端膨脹。

## 10. 回歸結果

以下均通過：

- Audit／Evidence Chain
- Simulation
- Region Production
- Region Gameplay
- Release Regression
- Terrain Traversal
- Environment Life
- Life Simulation Core
- Village／Companion
- Art Governance
- Village／Farm Expansion
- Production Runtime
- Foundation Integration
- Production Build
- npm audit

環境生命測試原本硬編134個GLB而失敗，已改為直接讀取`CANONICAL_ASSET_COUNT`後通過。這是正式測試契約修正，不是放寬標準。

## 11. 強制紅隊

### 破綻一：KTX2在低階Android轉碼失敗

Runtime會回退PNG，但Texture Memory可能顯著增加。程式契約通過不等於GPU已驗收，必須保留v0.36實機證據。

### 破綻二：程序Atlas具技術正確性，但可能缺少美術語意

目前Tile依Recipe與Hash配置。即使Material、Sampler及KTX2均正確，木材、作物或招牌紋理仍可能與物件用途不完全一致，後續需要逐場景視覺接受測試。

### 破綻三：10種種子共用6種作物輪廓

40個階段映射完整，但部分種子共享作物Family。功能不會崩潰，卻可能造成辨識度不足；需在後續Farm Art Polish增加獨立輪廓，而不是只換顏色。

### 破綻四：容器瀏覽器無法執行畫面驗收

CDP已實際啟動Vite與Chromium，但所有本機URL被組織政策攔截，24個桌機／平板／手機WebGL案例為0執行。不得把Build成功或靜態Runtime測試等同於畫面與FPS證據。

## 12. 藍圖對照

### v0.30已完成

- 累計約280個GLB：實際282。
- 星光村正式建築與生活Props。
- 農場設施、農具、作物多階段及動物／加工設備。
- Village／Farm Texture、KTX2、Atlas及Shader Runtime。
- v0.29.1遺留的真實LOD、專屬武器動畫契約、npm弱點及分包卸載。

### 未完成，不能提前宣稱

- 真實Android／平板／桌機FPS、GPU Memory及溫度驗收。
- 16組Atlas全部實體化；目前正式輸出3組。
- 10種種子各自獨立作物輪廓。
- 視覺美術人工接受測試與截圖證據。

## 13. 下一階段

v0.31應進入Characters & Companions：玩家正式模型、10名居民專屬外觀、成人／兒童共用Rig、髮型／服裝／職業附件、8隻夥伴正式骨架、住所、表情與生活動畫。進場前不得改動本版Canonical路徑、Save Schema或分包服務契約。
