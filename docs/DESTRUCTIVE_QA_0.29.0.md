# v0.29｜Destructive QA

## 破綻一：舊存檔含不完整或重複裝備資料

風險：同一`itemId`同時存在於inventory、equipped、equipmentLevels與weaponAffixes，數量可能不一致。

防禦：Migration依庫存數量建立獨立Instance，穿戴欄解析第一個相符Instance；無法識別的Definition不得寫入正式Loadout。

殘餘風險：歷史存檔若已被舊版本去重，遺失的重複副本無法憑空復原。

## 破綻二：800個GLB存在但Runtime仍走程序Fallback

風險：檔案數增加但畫面無提升。

防禦：場景只傳assetId；Registry、Path Resolver及Loader統一；森林主物件已改GLB優先。

殘餘風險：必須在後續實機Telemetry逐場景確認實際Mesh來源，Node測試不能證明畫面已載入。

## 破綻三：Shader在桌機正常但低階Android黑屏或過熱

風險：透明Overdraw、Noise迭代、浮點精度與GPU驅動差異。

防禦：Low／Medium／High／Off四級Profile，Shader不得散落於元件。

殘餘風險：v0.29尚未有實機GPU證據，所有Shader只屬程式與Build層基礎。

## 破綻四：Shared Material被單一角色修改

風險：更換一名角色顏色，所有共享該Material的角色同步變色。

防禦：Material Profile標記`instanceSafe`，非安全Profile必須Clone。

## 破綻五：GLB擴充到800但Material數同步膨脹

風險：Draw Call先於Triangles失控。

防禦：各Tier設Material上限；正式資產生產前先完成Atlas與Shared Material契約。

## 破綻六：KTX2工具鏈未經Android驗證就替換PNG

風險：壓縮格式不支援或Decoder失敗造成全黑材質。

防禦：v0.29明確保留PNG基礎，不虛構KTX2完成；正式切換必須有Fallback與實機證據。
