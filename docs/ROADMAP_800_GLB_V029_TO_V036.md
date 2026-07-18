# MathQuest 3D｜800 Canonical GLB綜合藍圖

## v0.29｜Art Governance Foundation｜134 GLB

完成：

- 單一Canonical Registry。
- GitHub Pages BASE URL Resolver。
- 統一GLB Loader與實例級Telemetry。
- 8個裝備欄、6個外觀欄、裝備Instance及Save Schema 6。
- 森林現有GLB主路徑化。
- 14種Shader Profile。
- 程序Texture及SVG Source生成器。
- 800 GLB分配、預算、LOD、Material、Atlas契約。

不在此版冒充完成：800 GLB批量生成、正式UV/KTX2、所有裝備3D穿戴、實機FPS。

## v0.30｜Village & Farm Hero Art｜282 GLB

新增／重製：

- 星光村11棟正式建築與6套骨架。
- 商店、工坊、住宅、學習區生活Props。
- 農舍、穀倉、風車、水塔。
- 農具、作物多Stage、動物設施、加工設備、出貨區。
- 村莊／農場Atlas、地表Texture、草浪、水面與泥地Shader。

驗收：近景主要建築不再以Box為主要外觀；農場升級具可見差異。

## v0.31｜Characters, Residents & Companions｜383 GLB

- 玩家正式模型。
- 成人、長者、兒童體型。
- 10名居民專屬臉、髮、服裝、職業附件。
- 8隻夥伴物種骨架、住所、技能物件、服飾。
- 表情、對話、生活、關係、節慶動畫。
- 完整身體部位遮罩與裝備掛載。

驗收：主要居民可由輪廓辨識；8隻夥伴不可共用相同步態節奏。

## v0.32｜Equipment & Combat Art｜523 GLB

- 精確新增140個裝備與戰鬥GLB：20武器本體、20攻擊載體、20命中特效、60護甲部位、20副手。
- 20件武器映射至12種Base Combat Archetype及68個玩家戰鬥Clip。
- 八欄裝備、雙持鏡像、副手鎖定、防具與飾品實際顯示。
- Hit Profile、Projectile、VFX、Audio與Cooldown由同一戰鬥契約執行。
- Equipment Metal／Cloth Atlas與KTX2／PNG Fallback投入Runtime。

驗收：武器外觀、動畫、命中區與數值類型一致；遠程傷害在投射物抵達後結算。

## v0.33｜Regions, Forest & Creatures｜649 GLB

- 森林45個目標完成。
- 八區結構與環境共120個目標完成。
- 生物與怪物72個目標完成。
- 24一般怪、8精英、8Boss完成輪廓重製，Boss不得只換色。
- 每區至少三種獨有動態環境效果。
- Decal、Terrain Blend、Instancing與區域Texture Profile。

## v0.34｜Interior & Trial Tower｜745 GLB

- 60個室內Modular GLB。
- 36個塔樓模組。
- 32個室內可按用途辨識。
- 十種塔樓主題組合100層。
- KTX2/BasisU及Meshopt開始正式導入。

## v0.35｜Festival, Relationship & Ecology｜800 GLB

- 35個節慶、關係事件及生態GLB。
- 20個傳送門、機關、技能、VFX Mesh。
- 四季活動舞台、攤位、群眾Socket、夜間燈光。
- 3D關係事件與家庭共同事件。

## v0.36｜Optimization & Physical Acceptance｜維持800 GLB

- 不再以增加數量為目標。
- Atlas、KTX2、Meshopt、Material合併。
- LOD實際減面、Instancing、Occlusion及距離裁切。
- 低／中／高畫質。
- Android、平板、桌機真實FPS、Draw Call、Triangles、Texture Memory證據。
- 修正依賴漏洞與歷史Runtime證據鏈。

## 場景載入上限

| 裝置 | 同時載入GLB資源 |
|---|---:|
| 手機中畫質 | 40–70 |
| 平板 | 60–100 |
| 桌機高畫質 | 100–160 |

800個是專案資產庫總量，不是單一場景同時載入量。
