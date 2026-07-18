# Canonical Texture Pipeline

- `generated/`：程序碼直接產生的 PNG 與 Manifest。
- `source-svg/`：程式產生的 SVG 規律圖樣來源；正式 Runtime 不直接大量解析 SVG。
- 現階段 PNG 用於管線與視覺基礎驗證。
- 正式發行目標格式為 KTX2/BasisU；v0.29 尚未宣稱已完成 KTX2，原因是 BasisU 工具鏈仍需加入並完成 Android／平板相容性驗證。
- 使用者不需要手動匯入圖片、Texture 或 SVG。
