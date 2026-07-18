// 瀏覽器語音輔助控制器：朗讀世界提示與 NPC 對話。
// 使用裝置內建 SpeechSynthesis，不依賴網路服務；不支援時靜默略過，不影響主流程。
import { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore.js';

export default function VoiceGuidanceController() {
  const enabled = useStore((state) => state.uiPreferences.voiceGuidance);
  const hint = useStore((state) => state.worldHint);
  const dialogue = useStore((state) => state.activeDialogue);
  const lastSpokenRef = useRef('');

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
    const dialogueText = dialogue ? `${dialogue.name}。${(dialogue.lines || []).join('。')}` : '';
    const text = dialogueText || hint || '';
    if (!text || text === lastSpokenRef.current) return undefined;

    lastSpokenRef.current = text;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [enabled, hint, dialogue]);

  useEffect(() => {
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [enabled]);

  return null;
}
