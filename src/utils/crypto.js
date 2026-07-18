// 存檔混淆工具：Base64 + 簡單 Salt
// 【安全定位】此為「防呆」而非「防弊」：僅阻止玩家隨手改 LocalStorage，
// 前端無伺服器權威，理論上仍可被破解，切勿存放敏感資料。
const SALT = 'MQ3D_2026';

// 支援 UTF-8 的 Base64 編碼（處理中文/emoji 不會壞）
function utf8ToB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

// 加密：原文 → 加 Salt 前綴 → Base64
export function encrypt(plain) {
  try {
    return utf8ToB64(SALT + plain);
  } catch (e) {
    // 編碼失敗時退回原文，避免存檔流程中斷
    console.warn('[crypto] encrypt failed, storing raw', e);
    return plain;
  }
}

// 解密：Base64 → 去除 Salt 前綴 → 原文
export function decrypt(cipher) {
  try {
    const decoded = b64ToUtf8(cipher);
    // 驗證 Salt 前綴，防止讀到被亂改的資料
    if (decoded.startsWith(SALT)) {
      return decoded.slice(SALT.length);
    }
    // Salt 不符：可能是舊格式或遭竄改，回傳 null 讓 store 用預設值
    return null;
  } catch (e) {
    console.warn('[crypto] decrypt failed, ignoring corrupt save', e);
    return null;
  }
}
