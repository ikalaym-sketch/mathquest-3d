import { useEffect, useMemo, useRef, useState } from 'react';
import { Sky, Sparkles } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore.js';
import { TIME_SCALE, WEATHER_TYPES, formatGameTime, getTimeSegment } from '../../systems/timeWeatherConfig.js';
import { updateWorldTime } from '../../input/worldTime.js';
import { playerPos } from '../../input/playerPos.js';
import { getIndoorZone } from '../../data/indoorZones.js';
import SkyWeatherLayer from './SkyWeatherLayer.jsx';

const DAY_SECONDS = 144;
const SKY_COLORS = {
  dawn: '#efcad8', morning: '#bfe8ff', noon: '#8ed6ff', afternoon: '#9edcff',
  sunset: '#f4aa76', evening: '#7d86c8', night: '#293a68', lateNight: '#203059',
};

export default function WorldEnvironment({ sceneId = 'village' }) {
  const directional = useRef();
  const hemisphere = useRef();
  const totalMinutesRef = useRef(480);
  const publishAt = useRef(0);
  const isPaused = useStore((s) => s.isPaused);
  const renderQuality = useStore((s) => s.renderQuality || 'high');
  const timeSpeed = useStore((s) => s.timeSpeed || 'normal');
  const weatherId = useStore((s) => s.weatherType || 'sunny');
  const persistedClock = useStore((s) => s.worldClock);
  const activeRegionInterior = useStore((s) => s.activeRegionInterior);
  const publishWorldClock = useStore((s) => s.publishWorldClock);
  const advanceWeatherCycle = useStore((s) => s.advanceWeatherCycle);
  const weather = WEATHER_TYPES[weatherId] || WEATHER_TYPES.sunny;
  const { scene } = useThree();
  const [sunPosition, setSunPosition] = useState([12, 20, 8]);
  const [segment, setSegment] = useState(persistedClock?.segment || 'morning');
  const [indoorZoneId, setIndoorZoneId] = useState(null);

  const rainCount = useMemo(() => ({ low: 90, medium: 150, high: 240, ultra: 360 }[renderQuality] || 220), [renderQuality]);

  useEffect(() => {
    const persistedMinutes = Number.isFinite(persistedClock?.totalMinutes)
      ? persistedClock.totalMinutes
      : persistedClock?.minutes || 480;
    // 允許睡眠、QA 或存檔恢復主動跳時；一般逐幀發布不會造成可見倒退。
    if (Math.abs(persistedMinutes - totalMinutesRef.current) > 1) totalMinutesRef.current = persistedMinutes;
  }, [persistedClock?.totalMinutes, persistedClock?.minutes]);

  useEffect(() => {
    scene.background = new THREE.Color(SKY_COLORS[persistedClock?.segment] || SKY_COLORS.morning);
    return () => { scene.background = null; };
  }, [scene]);

  useFrame(({ clock }, delta) => {
    if (!isPaused) {
      const scale = TIME_SCALE[timeSpeed] || TIME_SCALE.normal;
      totalMinutesRef.current += delta * (1440 / DAY_SECONDS) * (scale / 10);
    }

    const totalMinutes = Math.max(0, totalMinutesRef.current);
    const minutes = totalMinutes % 1440;
    const nextSegment = getTimeSegment(minutes);
    const dayPhase = minutes / 1440;
    const solar = (dayPhase - 0.25) * Math.PI * 2;
    const sunHeight = Math.sin(solar);
    const daylight = THREE.MathUtils.clamp((sunHeight + 0.18) / 1.18, 0.12, 1);
    const sunX = Math.cos(solar) * 28;
    const sunY = 8 + Math.max(-0.15, sunHeight) * 30;
    const sunZ = Math.sin(solar) * 24;
    const skyColor = new THREE.Color(SKY_COLORS[nextSegment]);
    scene.background?.lerp(skyColor, Math.min(1, delta * 1.5));

    if (directional.current) {
      directional.current.position.set(sunX, sunY, sunZ);
      directional.current.intensity = (0.38 + daylight * 1.55) * weather.light;
      directional.current.color.set(nextSegment === 'sunset' ? '#ffd0a0' : ['night', 'lateNight'].includes(nextSegment) ? '#b9c7ff' : '#fff2cd');
    }
    if (hemisphere.current) hemisphere.current.intensity = (0.38 + daylight * 0.5) * weather.light;

    updateWorldTime(minutes / 1440);
    if (clock.elapsedTime - publishAt.current > 0.5) {
      publishAt.current = clock.elapsedTime;
      const indoorZone = activeRegionInterior
        ? { id: `region-interior:${activeRegionInterior.structureId}` }
        : getIndoorZone(sceneId, playerPos.x, playerPos.z);
      const dayIndex = Math.floor(totalMinutes / 1440) + 1;
      setSunPosition([sunX, sunY, sunZ]);
      setSegment(nextSegment);
      setIndoorZoneId(indoorZone?.id || null);
      publishWorldClock({
        totalMinutes,
        minutes: Math.floor(minutes),
        dayIndex,
        timeText: formatGameTime(minutes),
        segment: nextSegment,
        weather: weather.id,
        weatherLabel: weather.label,
        weatherIcon: weather.icon,
        sceneId,
        indoorZoneId: indoorZone?.id || null,
      });
      advanceWeatherCycle(totalMinutes);
    }
  });

  const isNight = ['night', 'lateNight', 'evening'].includes(segment);
  const moonPosition = [-sunPosition[0], Math.max(14, 38 - sunPosition[1] * 0.25), -sunPosition[2]];
  const showRain = weather.rain > 0 && !indoorZoneId;
  return (
    <>
      <SkyWeatherLayer cloudAmount={weather.cloud} weatherId={weatherId} isNight={isNight} moonPosition={moonPosition} quality={renderQuality} />
      <Sky sunPosition={sunPosition} turbidity={5 + weather.cloud * 4} rayleigh={1.4 + weather.cloud} mieCoefficient={0.005 + weather.cloud * 0.008} mieDirectionalG={0.76} />
      <fog attach="fog" args={[weatherId === 'mist' ? '#d7e9df' : '#d8eee4', 42 - weather.fog * 18, 112 - weather.fog * 30]} />
      <hemisphereLight ref={hemisphere} intensity={0.75} color="#dff5ff" groundColor="#6f9754" />
      <directionalLight ref={directional} castShadow position={sunPosition} intensity={1.8} color="#fff1c7" shadow-mapSize-width={renderQuality === 'ultra' ? 4096 : 2048} shadow-mapSize-height={renderQuality === 'ultra' ? 4096 : 2048} shadow-camera-left={-54} shadow-camera-right={54} shadow-camera-top={54} shadow-camera-bottom={-54} />
      {showRain && <Sparkles count={Math.round(rainCount * weather.rain)} scale={[72, 28, 72]} size={1.2} speed={3.4} opacity={0.55} color="#a7c7ef" position={[playerPos.x, 11, playerPos.z]} />}
      {isNight && <Sparkles count={renderQuality === 'low' ? 35 : 80} scale={[92, 32, 92]} size={2.1} speed={0.12} opacity={0.72} color="#fff4bd" position={[0, 17, 0]} />}
    </>
  );
}
