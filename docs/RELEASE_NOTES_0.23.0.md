# MathQuest 3D v0.23.0｜Terrain & Traversal Foundation

本版本以 v0.22.0 為唯一基準，重建八個正式區域的地形、道路、橋梁與角色通行基礎。沒有新增另一套版本化區域資料；Runtime、AI 與驗證器均讀取既有 Canonical `regionProductionLayouts.js`。

## 地形與碰撞

- 移除八區共用的全圖單一可行走 Collider。
- 依水域、裂縫與子區高度產生分區地表及高地平台 Collider。
- 水域改為視覺表面加 Sensor，不再存在可站立的隱藏水底平面。
- 峽谷裂縫使用獨立 Void／崖壁呈現，不再套用水面材質。
- 蘑菇濕地螢光亭已移出水域 footprint。

## 道路與橋梁

- 48 條 Canonical 道路改由安全路徑解析，形成 142 段具高度與坡度的 Runtime Road Run。
- 道路會避開水域與裂縫；必須跨越時只允許經過橋面。
- 橋梁依目標水域短軸校正方向與長度，延伸至兩岸並建立接近坡道。
- 實測最大道路坡度為 13.32°，低於 18°限制。

## 玩家與敵人通行

- 玩家 grounded 改為採樣目前地形高度，不再依場景出生高度判定。
- 玩家保存最後安全位置；踏入尚未支援游泳的水域或掉入裂縫時，回復至最近安全地面。
- 一般怪物、精英及 Boss 共用 `projectTraversalStep`，避免直接穿越水域或裂縫。
- 80 個區域遭遇出生點均通過可行走表面驗證。

## 模組化結構

- `TraversalSurfaceService.js`：唯一通行幾何與路徑服務。
- `RegionTraversalLayer.jsx`：地形、道路、水域、裂縫與橋梁 Runtime。
- `TerrainTraversalValidationService.js`：結構 footprint、橋梁、道路、坡度與出生點驗證。
- 幾何結果加入區域級快取，避免每幀重建道路與橋梁資料。

## 驗證界線

本版完成八個非森林正式區域的地形與通行基礎，不宣稱完成游泳、水下相機、急流、冰面破裂、濕地減速、危險液體傷害、正式 NavMesh 或最終委製地形 GLB。這些列入 v0.24 及後續資產階段。
