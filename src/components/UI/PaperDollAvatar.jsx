// v0.29 紙娃娃預覽：使用 equipment instance 解析八個穿戴欄，不再顯示舊 pet 裝備欄。
import { ARMOR_SET_META } from '../../data/index.js';
import { resolveEquippedEntry } from '../../services/EquipmentInstanceService.js';
import { getItemIcon } from '../../utils/equipmentPresentation.js';

function armorColor(item, fallback) {
  const set = item ? ARMOR_SET_META.find((entry) => entry.key === item.setKey) : null;
  return set?.color || item?.color || fallback;
}

export default function PaperDollAvatar({ equipped, equipmentInstances }) {
  const head = resolveEquippedEntry(equipped, 'head', equipmentInstances).item;
  const body = resolveEquippedEntry(equipped, 'body', equipmentInstances).item;
  const hands = resolveEquippedEntry(equipped, 'hands', equipmentInstances).item;
  const legs = resolveEquippedEntry(equipped, 'legs', equipmentInstances).item;
  const feet = resolveEquippedEntry(equipped, 'feet', equipmentInstances).item;
  const mainHand = resolveEquippedEntry(equipped, 'mainHand', equipmentInstances).item;
  const offHand = resolveEquippedEntry(equipped, 'offHand', equipmentInstances).item;
  const accessory = resolveEquippedEntry(equipped, 'accessory', equipmentInstances).item;
  const bodyColor = armorColor(body, '#3478d4');
  const legColor = armorColor(legs, '#304269');
  const gloveColor = armorColor(hands, '#8b5e3c');
  const feetColor = armorColor(feet, '#5c351f');

  return (
    <div className="relative h-[230px] w-full min-w-[230px] overflow-hidden rounded-[28px] border border-sky-200/25 bg-gradient-to-b from-sky-300/30 via-sky-100/10 to-emerald-300/10 shadow-inner sm:h-[330px]">
      <div className="absolute inset-x-8 bottom-5 h-7 rounded-[50%] bg-black/25 blur-sm" />
      <div className="absolute left-1/2 top-6 -translate-x-1/2">
        <div className="relative h-72 w-36 origin-top scale-[0.7] sm:scale-100">
          {head && <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 text-4xl drop-shadow-lg">{getItemIcon(head)}</div>}
          <div className="absolute left-1/2 top-8 z-10 h-20 w-20 -translate-x-1/2 rounded-[45%] border-[5px] border-[#6c3d20] bg-[#f0c7a0] shadow-lg"><div className="absolute left-4 top-8 h-2 w-2 rounded-full bg-[#222]" /><div className="absolute right-4 top-8 h-2 w-2 rounded-full bg-[#222]" /><div className="absolute left-1/2 top-12 h-2 w-7 -translate-x-1/2 rounded-b-full border-b-2 border-[#9f5544]" /></div>
          <div className="absolute left-1/2 top-[96px] h-24 w-24 -translate-x-1/2 rounded-[38%] border-4 border-white/25 shadow-xl" style={{ background: bodyColor }}><div className="absolute left-1/2 top-5 -translate-x-1/2 text-3xl">{accessory ? getItemIcon(accessory) : '⭐'}</div></div>
          <div className="absolute left-1 top-[105px] h-24 w-7 rotate-[7deg] rounded-full border-4 border-white/20" style={{ background: gloveColor }} />
          <div className="absolute right-1 top-[105px] h-24 w-7 -rotate-[7deg] rounded-full border-4 border-white/20" style={{ background: gloveColor }} />
          <div className="absolute left-[34px] top-[180px] h-24 w-8 rounded-b-2xl border-4 border-white/15" style={{ background: legColor }} />
          <div className="absolute right-[34px] top-[180px] h-24 w-8 rounded-b-2xl border-4 border-white/15" style={{ background: legColor }} />
          <div className="absolute left-[27px] top-[256px] h-8 w-12 rounded-xl shadow-lg" style={{ background: feetColor }} />
          <div className="absolute right-[27px] top-[256px] h-8 w-12 rounded-xl shadow-lg" style={{ background: feetColor }} />
          {mainHand && <div className="absolute -right-6 top-[145px] rotate-[-22deg] text-5xl drop-shadow-xl">{getItemIcon(mainHand)}</div>}
          {offHand && <div className="absolute -left-8 top-[145px] rotate-[18deg] text-4xl drop-shadow-xl">{getItemIcon(offHand)}</div>}
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 rounded-full border border-white/20 bg-black/35 px-4 py-1 text-xs text-white/85 sm:block">裝備欄與 3D 掛載共用同一份狀態</div>
    </div>
  );
}
