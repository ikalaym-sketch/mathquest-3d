# v0.29 Runtime QA狀態

## 已證明

- Vite正式Build可完成。
- 134個Canonical GLB檔案可由Node解析並符合硬性Header／節點／動畫契約。
- Registry路徑唯一且不含根目錄硬編。
- 裝備Schema、舊存檔Migration及同款裝備多Instance測試通過。
- 程序PNG與SVG Source可重新生成且格式有效。
- Shader Library 14個Profile具合法Vertex／Fragment入口。

## 未證明

- Android、平板、桌機實際操作、FPS、GPU Memory與發熱。
- 生成Shader在所有WebGL驅動的編譯結果。
- 134個GLB在每個場景均實際被渲染，而不是進入Fallback。
- KTX2、Meshopt及Atlas正式Runtime效果。
- 完整裝備在所有體型上的穿模狀況。

因此本版可稱為「工程治理與Build驗證完成」，不可稱為「美術實機封版」。
