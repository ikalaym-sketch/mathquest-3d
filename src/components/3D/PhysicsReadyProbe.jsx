import { useEffect } from 'react';
import { useRapier } from '@react-three/rapier';
import { setStep } from '../../input/loadProgress.js';
export default function PhysicsReadyProbe(){ const {world}=useRapier(); useEffect(()=>{if(world)setStep('physics',1);},[world]); return null; }
