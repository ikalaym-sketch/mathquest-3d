# v0.30｜Destructive QA

## 1. KTX2低階裝置轉碼失敗

- 觸發：GPU格式支援不足、Basis Transcoder初始化錯誤或記憶體不足。
- 結果：回退PNG後Texture Memory可能急升；極端情況仍可能黑材質。
- 防禦：KTX2優先、PNG Fallback、Shader關閉Fallback、引用計數。
- 尚缺：真實Android GPU及長時間溫度證據。

## 2. 程序Atlas美術語意錯配

- 觸發：Hash Tile與物件用途不一致。
- 結果：技術驗證全過，但木材、金屬、作物或招牌外觀不合理。
- 防禦：Recipe需定義Material Profile與用途，不允許Runtime隨機選材質。
- 尚缺：逐物件視覺接受清單。

## 3. 種子輪廓辨識不足

- 觸發：10種種子映射至6個Crop Family。
- 結果：功能正常，但馬鈴薯、蘿蔔、瓜果等可能共用近似輪廓。
- 防禦：階段、seedId及存檔仍獨立，不會造成資料混用。
- 後續：增加獨立Geometry Recipe，禁止只換顏色。

## 4. 分包引用未正常釋放

- 觸發：快速往返兩區、React Strict Mode重掛載、Atlas非同步完成時元件已卸載。
- 結果：GLB或Texture引用殘留，長時間遊玩記憶體上升。
- 防禦：Bundle集合差異、引用計數、取消旗標及延遲清除。
- 尚缺：真實瀏覽器GPU Memory時間序列。

## 5. CDP畫面驗收被環境政策阻擋

- 實際結果：Vite與Chromium成功啟動，但`127.0.0.1`及容器IP均顯示組織URL Blocklist。
- 24個計畫案例：0執行。
- 判定：本版只有程式、資產、Build及Node Runtime證據，沒有桌機／平板／手機畫面證據。
