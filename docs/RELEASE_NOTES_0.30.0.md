# MathQuest 3D v0.30.0｜Village & Farm Hero Art

## 新增

- 148個Canonical GLB，總數提升至282。
- 星光村80個、農場80個正式資產配置。
- 11棟村莊建築、六個生活分區及分包載入。
- 24個作物階段、8件正式農具、動物／加工／田區／出貨設備。
- 3組Runtime Atlas、13組KTX2＋PNG Fallback。
- 68個武器動畫契約Clip，玩家GLB實際75個Clip。

## 修正

- 通用Model依Registry執行真實LOD切換。
- 既有環境測試移除134個GLB硬編數量，改讀Canonical Registry。
- 農具改掛正式GLB，不再只用程序式方塊。
- Town Hall名稱與模型語意對齊。
- Art Pipeline Toon材質改為GLTFExporter完整支援的MeshStandardMaterial＋flatShading。
- Vite 8函式型分包設定與0項npm弱點。

## 限制

- 容器Chromium受組織URL Blocklist，24個WebGL畫面案例未執行。
- 尚無Android／平板／桌機實機FPS、GPU Memory與溫度證據。
- 16組Atlas治理Profile目前有3組完成Runtime KTX2。
- 10種種子目前映射至6種作物輪廓。
