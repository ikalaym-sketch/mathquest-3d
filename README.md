# MathQuest 3D v0.35.0

兒童向 3D 數學冒險 RPG。目前採單機瀏覽器存檔，使用 React、React Three Fiber、Rapier、Zustand 與 Vite。

## 執行

```bash
npm ci
npm run dev
npm run build
npm run preview
```

GitHub Pages 部署前，請確認 `vite.config.js` 的 `base` 與儲存庫名稱一致。

## v0.35.0 Canonical 800 Freeze

- `public/models` 已精確達到 **800 個 Canonical GLB**；`dist/models` 的 800 個檔案只是建置副本，不重複計數。原始 134 個資產維持保留 24／重製 82／替換 28，淨新增 666。
- v0.33 完成森林、八區結構／環境與生物擴充，523 → 649；v0.34 完成 60 個室內 Kit、36 個試煉塔模組與 100 層決定性組合，649 → 745；v0.35 完成 35 個事件／生態資產與 20 個傳送門／機關／戰鬥 VFX，745 → 800。
- 最終十二類配置為：角色 80、夥伴 32、裝備 140、村莊 80、農場 80、森林 45、區域 120、生物 72、室內 60、試煉塔 36、事件 35、效果 20。
- Runtime 使用 16 組 Atlas、73 組 KTX2＋PNG 通道、29 個 Material Profile 與 14 個 Shader Profile；465 個 LOD 資產平均 LOD1 52.9%、LOD2 20.2%。
- Meshopt 1.1.1 已對 96 個 v0.34 資產、5,286 個 Accessor 完成無損 round-trip 稽核，候選壓縮比 0.615；在 v0.36 實機相容性完成前，不強制寫入 `EXT_meshopt_compression`。
- 完整基礎與歷史回歸、production build、11 項 HTTP 試跑，以及桌機／平板／手機 viewport × 八區的 24 項無頭 WebGL 驗證皆通過。
- v0.35 起凍結資產數量。Android 手機、Android 平板與桌機 GPU 的 FPS、記憶體、溫度及長時間遊玩驗收屬 v0.36，本版不宣稱已完成。

## 基本操作

- 移動：WASD／方向鍵／行動版搖桿
- 跳躍：Space／JUMP
- 攻擊：F、J、Enter／ATK
- 翻滾：Shift／ROLL
- 鏡頭：滑鼠右鍵拖曳、滾輪縮放、R 重置；行動版右半部拖曳

## v0.32.0 Equipment & Combat

- Canonical GLB 由 383 精確擴充至 **523**；本版新增 140，距離 800 目標尚需 277。`dist/models` 是 523 份建置副本，不重複計數。
- 140 個新增資產固定為：20 武器本體、20 攻擊載體、20 命中特效、40 核心護甲、20 足部／飾品、20 副手；全部由同一 Recipe／Exporter／Optimizer 生產並登錄。
- 20 件武器正式映射至 12 種 Base Combat Archetype；Hit Profile、Projectile、VFX、Audio、Cooldown 與三段 Combo 動畫共用同一契約，玩家 GLB 實有 81 個 Clip，其中 68 個為戰鬥契約 Clip。
- 遠程攻擊不再於按鍵瞬間造成傷害：投射物 GLB 抵達後才結算；近戰依扇形、直線或衝擊幾何限制目標，命中同步播放對應 Impact GLB 與音色族。
- 八個正式裝備欄都能掛載 Canonical GLB；雙持武器鏡像掛入副手 Socket，雙手武器鎖定副手，新增足部、飾品與副手可由村莊市場輪替取得。
- 新增 Equipment Metal／Cloth Atlas，Runtime 現為 8 組、34 個 KTX2＋PNG 通道；523 個 GLB 共 531 個 Material，新增 140 檔皆為每檔 1 Material，完整 Runtime 驗證零錯誤、零警告。
- 滿八欄裝備加當前武器 Delivery／Impact 的駐留上限為 10 個 GLB，換裝後舊 Bundle 會依引用計數釋放；村莊完整細節居民同步調整為最近 2 名，使全場景估算仍為 68/70；Save Schema 維持 6。
- `equipment:combat:test`、`test:foundation`、全套歷史回歸與 production build 均為發布閘門。桌機、Android 手機與 Android 平板的實機 WebGL 效能仍保留到 v0.36 Physical Acceptance。

## v0.31.0 Characters & Companions

- Canonical GLB 由 282 擴充至 **383**；本版新增 77 個角色資產與 24 個夥伴資產，角色類別達 80、夥伴類別達 32，距離 800 目標尚需 417。
- 建立 5 種共用 `MathQuestHumanoidV1` 體型與 12 組生活動畫；10 位具名居民各自映射臉、髮、服裝、職業附件，並依移動、工作、談話、送禮、慶祝、坐下與睡眠狀態實際播放 Clip。
- 玩家角色新增 12 種髮型、8 種表情、8 種服裝與 4 件可選配件；舊存檔會安全補入預設服裝，不提升 Save Schema。
- 8 隻守護夥伴各有住所、技能與穿戴模組，保留各自不同的 Walk 週期；戰鬥觸發夥伴能力時會實際掛載技能模組。
- 村莊採最近 4 名居民的完整模組細節配額；含玩家與同行夥伴的估算同時載入峰值為 68 個 GLB，低於行動裝置 70 個上限。
- Runtime Atlas 擴充為 6 組、26 組 KTX2＋PNG 通道；383 個 GLB 經統一 Optimizer 後共 391 個 Material，完整 Runtime 驗證零錯誤、零警告。
- 新增 `characters:companions:test` 永久閘門，驗證 101 個實體 GLB、共用骨架、Socket、動畫、Runtime 可達性、存檔相容與手機配額。
- 桌機、Android 手機與 Android 平板的實機 WebGL 效能仍保留到 v0.36 Physical Acceptance，不在本版宣稱完成。

## v0.30.1-A Runtime Truth Closure

- 修復 `AnimatedProductionModel` 漏匯入 `useThree`，避免正式動畫 GLB 在元件渲染時拋出 `ReferenceError` 並落入程序模型 Fallback。
- 美術治理測試新增 Runtime Hook 來源契約，會掃描 `useThree`、`useFrame`、`createPortal`、`useGLTF` 與 `useAnimations` 的呼叫及指定套件匯入。
- `npm run build` 與部署流程會先執行治理閘門；Vite 即使容許未宣告識別字進入 Bundle，也不能再把同類錯誤帶入正式產物。
- 本次不新增或重製 GLB，Canonical 資產數維持 282；WebGL 桌機／平板／手機實機驗收仍保留為後續必要關卡。





## v0.30.0 Village & Farm Hero Art

- Canonical GLB 由 134 擴充至 **282**：星光村 80、農場 80；本版新增 148，距離最終 800 尚需 518。
- 星光村 11 棟正式建築、5 個核心地標及六個生活分區已接入場景；核心包加鄰近分區同時最多 26 個資產。
- 農場正式接入農舍、穀倉、設施、24 個作物階段與 8 件農具 GLB；核心包加鄰近分區同時最多 30 個資產。
- 通用 Model 已依 Canonical Registry 的 LOD Profile切換 LOD0／LOD1／LOD2；188個具LOD資產平均 LOD1 53.2%、LOD2 20.1%。
- 玩家模型新增 12 種基礎戰鬥 Archetype 的 68 個正式動畫契約Clip；GLB實際共75個Clip。
- 建立3組Runtime Atlas、13組KTX2＋PNG Fallback通道，並完成Basis Universal載入與引用釋放。
- 282個GLB經統一Optimizer後共285個Material，平均約1.01個Material／GLB；Runtime驗證零錯誤、零警告。
- Vite升級至8.1.4、React Plugin升級至6.0.3；npm audit為0項弱點。
- 容器Chromium仍受組織URL政策封鎖，因此桌機／平板／手機24個WebGL畫面案例未能執行；不得視為實機驗收完成。
- 詳細證據見 `docs/V030_VILLAGE_FARM_EXPANSION_REPORT.md`、`docs/V030_ASSET_LEDGER.md` 與 `docs/FINAL_VERIFICATION_V030.json`。

## v0.29.1 Contract Closure

- 鎖定 134 個既有 Canonical GLB 的逐筆處置：保留 24、重製 82、完整替換 28；800 個目標包含現有資產，淨新增 666。
- 正式模型元件改為 assetId-only；Registry 只保存 canonicalPath，GitHub Pages 路徑由 AssetPathService 統一解析。
- 裝備 8 欄、外觀 6 欄、15 個玩家 Socket、唯一 equipment instanceId 與 Save Schema 6 遷移契約完成。
- 20 件武器外觀映射至 12 種 Base Combat Archetype；Player、AnimationStateService 與 CharacterActorRig 已接線，缺少專屬 Clip 時安全回退 Generic Attack。
- 建立正式模組化 Art Pipeline、Bundle 引用計數、Runtime Material／Shader 套用與 Vertex Color Material Consolidator。
- 134 個 GLB 的純色 Material 由 573 降至 137；保留動畫、骨架、Socket、Collider與節點契約。
- 16 組 Atlas、14 種 Shader及14個Material Runtime Profile已鎖定；KTX2、真實LOD減面、專屬武器動畫與實機效能驗收仍屬後續版本。
- 詳細結果見 `docs/CONTRACT_CLOSURE_REPORT.md` 與 `docs/ASSET_DISPOSITION.md`。


## v0.29.0 Art Governance Foundation

- 134 個 Canonical GLB 已集中到唯一 Registry；角色、夥伴、怪物、Boss、農場、森林及八區環境均以 `assetId` 尋址。
- GitHub Pages 路徑由 `AssetPathService` 統一處理，場景與資料不再硬編 `/models/...`。
- 裝備改為 8 個正式戰鬥欄、6 個外觀欄及唯一 `instanceId`；同款裝備可保存不同等級、詞綴與品質。
- Save Schema 升級為 6，舊 `weapon`、`pet`、裝備等級與詞綴可轉換。
- 森林既有 GLB 改為主模型，程序幾何只作載入失敗備援。
- 建立 800 GLB 最終分配、LOD、Material、Atlas 與裝置場景預算。
- 建立不需手動外部素材的程序 Texture、SVG Source 與 14 種 GLSL Shader 基礎管線。
- 本版 GLB 數量仍為 134；800 GLB 批量生產、KTX2、Meshopt及實機效能驗收尚未宣稱完成。

## v0.28.0 Village Bonds & Guardian Companions

- 10 名具名村民具有百分制好感、禮物偏好、每週／天氣日程、每人至少 30 條條件式對話與 3 段關係事件。
- 農場出貨會提升市場等級並改變商店貨架；每週 4 項委託、四季村莊活動正式接入。
- 舊 Pet 裝備 Runtime 停止；新遊戲由狸貓、兔子、狐狸三選一，舊存檔安全映射。
- 8 隻守護夥伴均具獨立取得條件、生活／探索／學習／戰鬥能力、好感、等級與每日互動。
- 新增 8 個守護夥伴 GLB；全工程 GLB 增至 134 個。每個夥伴具 Collider、4 個 Socket 與 8 組動畫。
- 非同行夥伴會回到農舍休息區；同行夥伴具地面跟隨、游泳與互動動畫。
- 新增村民手冊、夥伴名冊、初始三選一及村莊委託／活動 UI。
- 工程 GLB 不是最終委製美術；實機 WebGL 仍受管理瀏覽器政策阻擋。

## v0.27.0 Life Simulation Core Truth

- 10 種道具、20 把武器 Lv5 與 10 套四件防具均改用正式 Effect ID／Runtime Handler。
- 裝備強制檢查持有權與欄位；完整四件同套裝才啟動，MP、反擊、吸血、狀態及特殊傷害正式生效。
- 新農地必須先鋤地；農具、體力、四季、適種規則與 Lv5 溫室已接入。
- 農產品改為保留品質、數量、單價、時間與來源的正式實例；舊存檔作物 ID 可無損遷移。
- 動物加入餵食、撫摸、梳毛、好感、健康、心情與品質產出。
- 加工機統一使用世界分鐘；農莊升級改為金幣＋材料＋一個遊戲日施工。
- 原 v0.27 實機／封版藍圖因使用者優先順序調整而順延，並非已完成。

## v0.24～v0.26 Water, Assets, Life & Interiors

- 13 個水域／裂縫依 Canonical Profile 分流為涉水、游泳、冰面、濕地、危險液體與虛空救援。
- 玩家具氧氣、上浮、上岸、急流推力、冰面慣性／穩定度及兒童安全復原；水下 HUD 與環境提示同步接入。
- 新增 40 個區域環境 GLB，全部具有 LOD0／LOD1／LOD2、Collider 與 Story Socket；全工程 GLB 增至 126 個。
- 八區新增 24 名生活 NPC、16 組環境動物與 16 個故事物件，依時段、天氣與安全道路執行工作／返家／避雨行為。
- 32 個主要結構均可進入獨立室內 Pocket，共 384 件家具與 96 個互動點，離場會回到安全地面。
- 區域音樂、日夜燈光、雨天狀態及室內環境已接入 Runtime。
- 新增資產、NPC 路線、室內出口、水域狀態與全工程 GLB Header 的強制驗證。

## v0.23.0 Terrain & Traversal Foundation

- 八個正式區域移除全圖單一可行走 Collider，改為分區地表與高地平台。
- 48 條道路以安全路徑解析為具高度的 Road Run，避開水域與裂縫；跨越時必須通過橋面。
- 水域改為視覺面與 Sensor；峽谷裂縫使用獨立 Void／崖壁，不再有可行走隱藏底板。
- 玩家、一般怪物、精英與 Boss 共用地形採樣與通行限制；玩家具有最後安全位置復原。
- v0.24～v0.26 已在此地形基礎上補齊水域行為、環境資產、生活 NPC 與可進入室內。

## v0.18.0 Production Runtime Content

- 八個非森林區域已接入 24 種一般怪物、8 名精英與 8 名區域 Boss。
- 新增 59 個 Canonical GLB：3 角色、15 結構、1 橋梁、40 遭遇角色。
- 玩家與 NPC 使用 Skinned GLB、正式 Socket 與七組角色動畫 Clip。
- 結構與橋梁改由 GLB 呈現，Collider 仍由場景配置控制，程序化模型只作失敗備援。
- 新增 GLB 直接解析驗證、Runtime Telemetry 與三 Viewport × 八區 CDP 驗收工具。
- 目前資產屬可替換的低多邊形生產資產，不是最終委製美術；容器 Chromium 因管理政策封鎖所有 URL，實際 WebGL 畫面仍標示 BLOCKED。

## v0.13.0 第三階段｜森林遺跡垂直切片

- 森林遺跡重建為低語樹林、瀑布小徑、古代石門與苔蘚神殿四個可探索子區。
- 場景配置包含 5 條探索道路、6 個大型地標、怪物群落、事件節點、採集與三個數學機關。
- 新增 15 個森林主題 GLB 基礎資產及程序化低多邊形場景套件，加入拱門、樹林、橋梁、瀑布、神殿、花圃、蕨類、蘑菇與生活休憩物件。
- 採目前子區加鄰接子區的 Residency 管理；接近區域時預載模型，離開後釋放不再需要的模型快取。
- 怪物改為森林生態群落，支援畫質對應同屏上限、定時重生、擊倒進度及區域怪物數量 HUD。
- 加入葉芽史萊姆、枝木哥布林、花冠咬咬草與森之守護鹿的森林專屬定義及模型。
- 新增數列、圖形規律、路徑判斷與森林加法四類情境數學；解題結果直接推進區域封印。
- Boss 條件為完成三個數學機關並擊倒 5 名森林守衛；本階段已接入條件、封印進度與生成邏輯。
- 新增森林配置驗證器，檢查四子區、探索回路、地標、怪物群落、數學機關、唯一 ID、安全出生點及 Boss 條件。
- 實際驗證怪物數量 9 → 擊倒後 8 → 重生後恢復 9，前端錯誤為 0。

## v0.12.0 第二階段｜農場與住宅

- 建立正式低多邊形 GLB 資產管線，農舍、穀倉、風車、水塔、農夫、牛、羊、雞、果樹、乾草、信箱均由模型 Manifest 管理。
- 農場改為配置驅動的八區場景：住宅庭院、作物田、動物牧場、果樹園、加工工坊、池塘紅橋、風車高地與出貨廣場。
- 新增 Farm Layout Validator，檢查必要分區、道路、建築、動物、果樹、唯一 ID、模型重疊與出生安全半徑。
- 場景使用 React.lazy 分段載入；農場模型由 LoadingManager 顯示真實物件進度，離場後釋放場景資產引用。
- Loading 畫面同步顯示目前物件、進度、失敗數與農場情境數學教學，不使用固定秒數假完成。
- 加入田地面積、收成產量、市集金錢與動物餵食四類情境數學題。
- 農場等級改由單一 farmLevel 控制，升級前需先完成田地面積挑戰；同一場景依等級解鎖田地與設施。
- 新增住宅庭院佈置介面，可購買及放置花箱、野餐桌、獎盃架與燈籠拱門。

## v0.11.0 第一階段重新開發內容

- 主村莊改為配置驅動的正式垂直切片：8 個分區、7 條道路、11 棟建築及 10 名功能／生活居民。
- 新增星光廣場、噴泉、星光樹、池塘紅橋、商業街、工坊區、住宅花園、學習館、傳送林、農場門與試煉大道。
- 場景加入道路燈、花圃、樹林、灌木、野餐區、曬衣庭院、雞舍、推車及訓練角，降低無意義空地。
- 新增場景配置檢查，驗證分區、道路、建築 ID、出生點與建築重疊。
- Loading 改為 Manifest、字型、WebGL、Physics、場景配置與第一幀的真實進度，不再固定 8 秒假完成。
- Loading 畫面加入與星光村資產相符的數學教學卡。
- 新增 Low／Medium／High／Ultra 畫質設定，控制 DPR、陰影、植被、粒子與動態光源。
- HUD、主任務及主選單重新排版，桌機／平板／手機採不同密度。
- 新增五格快捷道具欄，支援 1–5 鍵與觸控使用；背包可指派快捷格。

## v0.10.0 第三階段內容

- 裝備頁改為單頁紙娃娃介面：角色、六個裝備槽、物品庫與比較資訊同時呈現。
- 加入武器、防具與小精靈圖示，以及近戰、遠程、魔法、防具和小精靈分類。
- 已裝備物品使用綠色勾選，空槽、卸下狀態與裝備前後能力差異清楚顯示。
- 武器切換會同步更新角色手持外觀、攻擊、距離、攻速與總能力。
- 防具防禦正式接入怪物傷害計算，不再只是畫面數字。
- 小精靈加入 3D 跟隨模型、治療、速度、攻擊輔助與探索感應。
- 手機版任務追蹤改成單一摘要，可展開查看，避免遮擋角色與操作按鈕。
- 主選單改為單一收合入口，降低常駐 HUD 重疊。
- 裝備頁手機排序改為角色與物品優先，詳細能力後置。

## v0.9.0 第二階段內容

- 九宮格世界總覽：9 個大區，每區含 4 個探索子區。
- 區域資料包含地標、怪物池、素材池與隨機事件池。
- 大型區域場景、不同尺寸地標、道路、高低平台與邊界地形。
- 正式傳送點取代開發用場景導覽按鈕。
- 區域怪物定時重生，並限制同時生成數量。
- 怪物依近戰、遠程、坦克與特殊類型呈現不同輪廓。
- 試煉之塔 100 層資料骨架；目前已接通樓層戰鬥、清怪開門、每 10 層獎勵與離塔續接流程。
- 試煉塔入口保護、封閉邊界及精簡戰鬥 HUD。
- 自由鏡頭、鏡頭方向移動、跳躍、場景出生點與跌落回復。

## 現階段限制

- 800 個資產是完整 Canonical 生產配置，不代表每個資產都已通過逐件人工美術審稿，也不代表可同時載入；Runtime 仍須遵守場景分包與行動裝置 70 GLB 駐留預算。
- 本次 24 項 WebGL 測試使用無頭瀏覽器的 viewport 模擬，證明場景可載入且沒有瀏覽器錯誤，但不能替代 Android 手機、Android 平板與桌機 GPU 的實機效能數據。
- v0.36 開始前禁止增加或替換造成資產數變動的 GLB；該版只應進行 KTX2／Meshopt 實機相容性、Draw Call、Triangle、Texture Memory、FPS、場景切換峰值與長時間記憶體驗收。
