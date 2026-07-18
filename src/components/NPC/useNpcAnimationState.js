import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { resolveResidentAnimation } from '../../services/CharacterCompanionVisualService.js';

export function useNpcAnimationState(npcId, schedule, isMoving) {
  const activeDialogueNpcId = useStore((state) => state.activeDialogue?.npcId || null);
  const npcEmote = useStore((state) => state.npcEmote);
  const [, refreshExpiry] = useState(0);
  const relevantEmote = npcEmote && (npcEmote.npcId == null || npcEmote.npcId === npcId) ? npcEmote : null;

  useEffect(() => {
    if (!relevantEmote?.until) return undefined;
    const remaining = Math.max(0, relevantEmote.until - Date.now());
    const timer = window.setTimeout(() => refreshExpiry((value) => value + 1), remaining + 20);
    return () => window.clearTimeout(timer);
  }, [relevantEmote]);

  const activeEmote = relevantEmote?.until > Date.now() ? relevantEmote.animation : null;
  return resolveResidentAnimation({
    isMoving,
    scheduleState: schedule?.state,
    timeSegment: schedule?.segment,
    isTalking: activeDialogueNpcId === npcId,
    emote: activeEmote,
  });
}
