// 八區核心機制面板總機。
// 面板只負責讀取 Canonical 挑戰、處理完成狀態與防連點；八種玩法各自維護獨立元件。
import { useRef, useState } from 'react';
import Panel from '../UI/Panel.jsx';
import { useStore } from '../../store/useStore.js';
import { getRegionGameplayProfile } from '../../data/regionGameplayProfiles.js';
import { getRegionMechanicChallenge } from '../../data/regionMechanicChallenges.js';
import WindAngleChallenge from './WindAngleChallenge.jsx';
import SnowTemperatureChallenge from './SnowTemperatureChallenge.jsx';
import FarmArrayChallenge from './FarmArrayChallenge.jsx';
import StarPatternChallenge from './StarPatternChallenge.jsx';
import CrystalSymmetryChallenge from './CrystalSymmetryChallenge.jsx';
import CanyonMeasurementChallenge from './CanyonMeasurementChallenge.jsx';
import MushroomRhythmChallenge from './MushroomRhythmChallenge.jsx';
import ClockworkSequenceChallenge from './ClockworkSequenceChallenge.jsx';

const CHALLENGE_COMPONENTS = {
  wind: WindAngleChallenge,
  snow: SnowTemperatureChallenge,
  farm: FarmArrayChallenge,
  star: StarPatternChallenge,
  crystal: CrystalSymmetryChallenge,
  canyon: CanyonMeasurementChallenge,
  mushroom: MushroomRhythmChallenge,
  clockwork: ClockworkSequenceChallenge,
};

export default function RegionMechanicChallengePanel() {
  const panelData = useStore((state) => state.panelData);
  const completeMechanic = useStore((state) => state.completeRegionMechanic);
  const closePanel = useStore((state) => state.closePanel);
  const [resolved, setResolved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('');
  const lockRef = useRef(false);
  const profile = getRegionGameplayProfile(panelData?.regionId);
  const mechanicNode = profile?.mechanic?.nodes.find((item) => item.id === panelData?.nodeId) || null;
  const challenge = getRegionMechanicChallenge(panelData?.nodeId);
  const ChallengeComponent = challenge ? CHALLENGE_COMPONENTS[challenge.type] : null;

  if (!profile || !mechanicNode || !challenge || !ChallengeComponent) {
    return <Panel title="區域核心機制"><p className="rounded-xl bg-red-500/15 p-3 text-sm font-bold text-red-100">核心機制資料不完整，未寫入任何進度。</p></Panel>;
  }

  const finish = () => {
    if (lockRef.current) return;
    lockRef.current = true;
    const result = completeMechanic(profile.regionId, mechanicNode.id);
    if (!result.ok) {
      lockRef.current = false;
      if (result.reason === 'order') setMessage(`請先完成：${result.previousLabel}`);
      else setMessage('進度狀態不一致，未寫入完成紀錄。');
      return;
    }
    setResolved(true);
    setMessage(`${mechanicNode.label}完成，已取得區域素材。`);
  };

  const wrong = () => {
    if (lockRef.current) return;
    setAttempts((current) => current + 1);
    setMessage(attempts >= 1 ? '再觀察題目中的目標、圖形或順序，慢慢操作即可。' : '還差一點，系統沒有扣除道具，可以直接再試一次。');
  };

  return (
    <Panel title={`${mechanicNode.icon} ${profile.mechanic.title}`} wide>
      <div className="mb-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
        <div className="text-xs font-black text-white/55">{mechanicNode.label} · 第 {mechanicNode.order}/3 節點</div>
        <p className="mt-1 text-sm font-bold leading-6 text-white/80">{profile.mechanic.description}</p>
      </div>

      <ChallengeComponent key={mechanicNode.id} challenge={challenge} disabled={resolved} onSuccess={finish} onWrong={wrong} />

      {message && <div className={`mt-4 rounded-2xl border px-4 py-3 text-center text-sm font-black ${resolved ? 'border-emerald-300/40 bg-emerald-500/15 text-emerald-100' : 'border-amber-300/30 bg-amber-500/10 text-amber-100'}`}>{message}</div>}
      {resolved && <button onClick={closePanel} className="mt-4 w-full rounded-2xl border-b-4 border-emerald-800 bg-emerald-600 px-4 py-3 text-sm font-black text-white active:translate-y-1 active:border-b-0">完成並返回場景</button>}
    </Panel>
  );
}
