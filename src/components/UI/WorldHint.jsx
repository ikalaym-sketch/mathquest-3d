import { useStore } from '../../store/useStore.js';

export default function WorldHint() {
  const hint = useStore((s) => s.worldHint);
  const subtitles = useStore((s) => s.uiPreferences.subtitles);
  if (!hint || !subtitles) return null;

  return (
    <div role="status" aria-live="polite" className="fixed left-1/2 bottom-40 z-40 -translate-x-1/2 pointer-events-none">
      <div className="rounded-2xl border border-amber-200/60 bg-amber-600/85 px-4 py-2 text-sm font-semibold text-white shadow-2xl backdrop-blur-sm">
        {hint}
      </div>
    </div>
  );
}
