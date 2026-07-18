// v0.29 鐵匠工坊：升級與附魔皆作用於唯一 equipment instance。
import { useState } from 'react';
import Panel from './Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { resolveEquippedEntry } from '../../services/EquipmentInstanceService.js';
import { SLOT_META, getDisplayName } from '../../utils/equipmentPresentation.js';
import { rarityColor } from '../../utils/inventory.js';

const UPGRADE_GOLD = 300;
const BOSS_MATERIAL = 'mat_ancient_gear';
const UPGRADE_SLOTS = ['mainHand', 'offHand', 'head', 'body', 'hands', 'legs', 'feet', 'accessory'];

export default function BlacksmithPanel() {
  const equipped = useStore((state) => state.equipped);
  const equipmentInstances = useStore((state) => state.equipmentInstances);
  const upgradeEquipment = useStore((state) => state.upgradeEquipment);
  const inventory = useStore((state) => state.inventory);
  const [message, setMessage] = useState(null);
  const entries = UPGRADE_SLOTS
    .map((slot) => ({ slot, ...resolveEquippedEntry(equipped, slot, equipmentInstances) }))
    .filter((entry) => entry.item && entry.instance);
  const materialCount = (inventory.materials || []).filter((itemId) => itemId === BOSS_MATERIAL).length;

  const onUpgrade = (entry) => {
    const result = upgradeEquipment(entry.instance.instanceId, UPGRADE_GOLD, BOSS_MATERIAL);
    if (result.ok) setMessage(`${getDisplayName(entry.item, entry.instance)} 已升級至 Lv5。`);
    else if (result.reason === 'gold') setMessage('金幣不足。');
    else if (result.reason === 'max-level') setMessage('這件裝備已達 Lv5。');
    else if (result.reason === 'missing-equipment') setMessage('裝備實例不存在，請重新開啟工坊。');
    else setMessage('需要 1 個古代齒輪。');
  };

  return (
    <Panel title="鐵匠工坊">
      <div className="rounded-2xl border-2 border-white bg-[#fff3df] p-3 text-[#5a493b] shadow">
        <p className="text-xs font-bold">每件裝備獨立升級；同款裝備不會再共用 Lv5 狀態。</p>
        <p className="mt-1 text-[11px] font-bold text-[#806b59]">費用：{UPGRADE_GOLD}G＋1 個古代齒輪（目前 {materialCount}）</p>
      </div>

      {message && <p className="my-3 rounded-xl bg-[#fff0ae] p-2 text-center text-sm font-black text-[#7b581d]">{message}</p>}

      {entries.length === 0 ? <p className="py-8 text-center text-sm font-bold text-slate-500">請先穿戴裝備，再進行升級。</p> : (
        <div className="mt-3 space-y-2">
          {entries.map((entry) => {
            const isLv5 = entry.instance.level >= 5;
            return (
              <div key={entry.instance.instanceId} className="rounded-xl border-2 border-white bg-white/80 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: rarityColor(entry.item.rarity) }} />
                    <div className="min-w-0"><div className="truncate text-sm font-black text-[#51463e]">{getDisplayName(entry.item, entry.instance)}</div><div className="text-[10px] font-bold text-slate-400">{SLOT_META[entry.slot]?.label} · {entry.instance.instanceId}</div></div>
                  </div>
                  {isLv5 ? <span className="shrink-0 text-xs font-black text-emerald-700">✓ Lv5</span> : <button type="button" onClick={() => onUpgrade(entry)} className="ml-2 shrink-0 rounded-lg border-b-4 border-[#80552d] bg-[#c88642] px-3 py-2 text-xs font-black text-white active:translate-y-1 active:border-b-0">升級</button>}
                </div>
                <p className={`mt-2 text-[11px] font-bold ${isLv5 ? 'text-[#9b661d]' : 'text-slate-500'}`}>Lv5 效果：{entry.item.lv5_effect || '提升基礎能力與外觀效果。'}</p>
              </div>
            );
          })}
        </div>
      )}
      <EnchantSection />
    </Panel>
  );
}

function EnchantSection() {
  const equippedWeaponRef = useStore((state) => state.equipped.mainHand);
  const equipmentInstances = useStore((state) => state.equipmentInstances);
  const enchantWeapon = useStore((state) => state.enchantWeapon);
  const [message, setMessage] = useState(null);
  const entry = resolveEquippedEntry({ mainHand: equippedWeaponRef }, 'mainHand', equipmentInstances);
  const affixes = entry.instance?.affixes || [];

  const onEnchant = () => {
    const result = enchantWeapon(equippedWeaponRef);
    if (result.ok) setMessage('附魔完成，能力已寫入這件武器實例。');
    else if (result.reason === 'gold') setMessage('金幣不足，需要 200G。');
    else setMessage('請先裝備武器。');
  };

  return (
    <div className="mt-5 border-t-2 border-white/70 pt-4">
      <div className="mb-1 flex items-center justify-between"><h3 className="text-sm font-black text-[#6d4b83]">武器附魔</h3><span className="text-[11px] font-bold text-slate-500">重新抽選 · 200G</span></div>
      <p className="mb-2 text-xs font-bold text-slate-500">附魔只影響目前主手武器；另一把同款武器不會被改動。</p>
      {message && <p className="mb-2 rounded-xl bg-[#f2e4ff] p-2 text-center text-sm font-black text-[#6d4b83]">{message}</p>}
      {entry.item && entry.instance ? (
        <div className="rounded-xl border-2 border-white bg-white/80 p-3 shadow-sm">
          <div className="flex items-center justify-between"><span className="truncate text-sm font-black text-[#51463e]">{getDisplayName(entry.item, entry.instance)}</span><button type="button" onClick={onEnchant} className="ml-2 shrink-0 rounded-lg bg-[#8d62aa] px-3 py-2 text-xs font-black text-white">重新附魔</button></div>
          {affixes.length ? <div className="mt-2 flex flex-wrap gap-1">{affixes.map((affix, index) => <span key={`${affix.type}_${index}`} className="rounded-full border border-[#c7a5db] bg-[#f0e3f8] px-2 py-1 text-[10px] font-bold text-[#66417d]">+{formatAffix(affix)} {affix.label}</span>)}</div> : <p className="mt-2 text-[11px] font-bold text-slate-400">尚未附加能力。</p>}
        </div>
      ) : <p className="text-sm font-bold text-slate-500">請先裝備武器再進行附魔。</p>}
    </div>
  );
}

function formatAffix(affix) {
  return ['atk', 'crit', 'lifesteal', 'speed'].includes(affix.type) ? `${Math.round(affix.value * 100)}%` : Number(affix.value).toFixed(1);
}
