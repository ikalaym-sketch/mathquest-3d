import { getItemIcon, getRarityTheme } from '../../utils/equipmentPresentation.js';

export default function ItemIcon({ item, size = 'md', equipped = false, emptyIcon = '＋' }) {
  const theme = getRarityTheme(item?.rarity);
  const dimensions = size === 'lg' ? 'w-20 h-20 text-4xl' : size === 'sm' ? 'w-11 h-11 text-xl' : 'w-14 h-14 text-2xl';
  return (
    <div
      className={`${dimensions} relative shrink-0 rounded-2xl border-2 flex items-center justify-center shadow-inner`}
      style={{
        borderColor: item ? theme.border : 'rgba(255,255,255,.18)',
        background: item ? `linear-gradient(145deg, ${theme.bg}, #101a2e)` : 'rgba(255,255,255,.04)',
      }}
      aria-label={item?.nameZh || item?.name || '空的裝備欄位'}
    >
      <span aria-hidden="true">{item ? getItemIcon(item) : emptyIcon}</span>
      {equipped && (
        <span className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white text-[11px] flex items-center justify-center text-white">✓</span>
      )}
    </div>
  );
}
