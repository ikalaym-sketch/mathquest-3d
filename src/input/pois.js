// v0.5.0 地標(POI)註冊表：供小地圖顯示
// type: 'altar' | 'portal' | 'npc' | 'chest' | 'shop'
const pois = new Set();

// 註冊地標。api = { id, type, getPos:()=>({x,z}), label, alive?:()=>bool }
export function registerPOI(api) {
  pois.add(api);
  return () => pois.delete(api);
}

export function getPOIs() {
  const out = [];
  pois.forEach((p) => {
    if (!p.alive || p.alive()) out.push(p);
  });
  return out;
}

// POI 顏色（小地圖用）
export const POI_COLOR = {
  altar: '#c0a0ff',
  portal: '#5adfff',
  npc: '#e8c37a',
  chest: '#ffd24a',
  shop: '#7ac74f',
};
