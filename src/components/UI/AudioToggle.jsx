// v0.8.0 音訊開關（右上小按鈕：音樂 / 音效 靜音）
import { useState } from 'react';
import { audioState, applyVolumes, unlockAudio } from '../../audio/AudioEngine.js';
import { start } from '../../audio/music.js';
import { SFX } from '../../audio/sfx.js';
import { useStore } from '../../store/useStore.js';

export default function AudioToggle() {
  const isPaused = useStore((s) => s.isPaused);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const toggleMusic = () => {
    unlockAudio();
    start();
    audioState.musicMuted = !audioState.musicMuted;
    applyVolumes();
    rerender();
  };
  const toggleSfx = () => {
    unlockAudio();
    audioState.sfxMuted = !audioState.sfxMuted;
    applyVolumes();
    if (!audioState.sfxMuted) SFX.click();
    rerender();
  };

  if (isPaused) return null;

  return (
    <div className="mq-audio-toggle fixed z-30 flex gap-2">
      <button
        onClick={toggleMusic}
        title="Toggle music"
        className={`w-9 h-9 rounded-full border text-sm flex items-center justify-center
          ${audioState.musicMuted ? 'bg-black/40 text-white/40 border-white/20' : 'bg-hyrule-bronze/70 text-white border-hyrule-gold/50'}`}
      >
        {audioState.musicMuted ? '🎵̶' : '🎵'}
      </button>
      <button
        onClick={toggleSfx}
        title="Toggle sound effects"
        className={`w-9 h-9 rounded-full border text-sm flex items-center justify-center
          ${audioState.sfxMuted ? 'bg-black/40 text-white/40 border-white/20' : 'bg-hyrule-bronze/70 text-white border-hyrule-gold/50'}`}
      >
        {audioState.sfxMuted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}
