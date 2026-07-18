import { useMemo, useRef, useState } from 'react';
import { Html, Instances, Instance, Sparkles } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import { playerPos } from '../../input/playerPos.js';
import { rotatePointToLocal } from '../../utils/placementGeometry.js';
import { createVillageInterior } from '../../data/interiorDefinitions.js';
import Model from '../3D/Model.jsx';

export function VillageGround(){
  const patches=useMemo(()=>Array.from({length:72},(_,i)=>({
    x:-42+(i%9)*10.5,z:-36+Math.floor(i/9)*10.2,
    c:['#89c968','#94d276','#7fbe60','#9bd47b'][i%4],
    r:(i%5)*.13,s:.92+(i%3)*.06,
  })),[]);
  return <group>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[48,.12,45]} position={[0,-.12,0]}/>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.04,0]} receiveShadow>
        <planeGeometry args={[96,90,12,12]}/><meshStandardMaterial color="#8bc969" roughness={1}/>
      </mesh>
    </RigidBody>
    {patches.map((p,i)=><mesh key={i} position={[p.x,.001,p.z]} rotation={[-Math.PI/2,0,p.r]} scale={p.s} receiveShadow>
      <circleGeometry args={[5.8,18]}/><meshStandardMaterial color={p.c} roughness={1} transparent opacity={.34}/>
    </mesh>)}
  </group>
}
export function RoadSegment({from,to,width=4}){const dx=to[0]-from[0],dz=to[2]-from[2],len=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);return <mesh position={[(from[0]+to[0])/2,.01,(from[2]+to[2])/2]} rotation={[-Math.PI/2,0,-angle]} receiveShadow><planeGeometry args={[width,len]}/><meshStandardMaterial color="#dfd09f" roughness={1}/></mesh>}
export function Plaza({position,radius}){return <group position={position}><mesh rotation={[-Math.PI/2,0,0]} position={[0,.02,0]} receiveShadow><circleGeometry args={[radius,48]}/><meshStandardMaterial color="#d8caa0" roughness={1}/></mesh>{Array.from({length:18}).map((_,i)=>{const a=i/18*Math.PI*2;return <mesh key={i} position={[Math.cos(a)*(radius-1),.04,Math.sin(a)*(radius-1)]} rotation={[-Math.PI/2,0,0]}><boxGeometry args={[1.1,.35,.06]}/><meshStandardMaterial color="#c2b386"/></mesh>})}</group>}
export function StorybookHouse({id,kind='home',position,rotation=[0,0,0],color,roof,sign,assetId=null}){
  const [inside,setInside]=useState(false);
  const lastCheck=useRef(0);
  useFrame((_,delta)=>{
    lastCheck.current+=delta;
    if(lastCheck.current<.12)return;
    lastCheck.current=0;
    const local=rotatePointToLocal({x:playerPos.x,z:playerPos.z},position,rotation[1]||0);
    const next=Math.abs(local.x)<2.62&&Math.abs(local.z)<2.25;
    setInside((current)=>current===next?current:next);
  });
  const wallDepth=.28,width=5.8,depth=5,wallHeight=3.8;
  return <group position={position} rotation={rotation}>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[width/2,.18,depth/2]} position={[0,.18,0]}/>
      <CuboidCollider args={[width/2,wallHeight/2,wallDepth/2]} position={[0,wallHeight/2,-depth/2]}/>
      <CuboidCollider args={[wallDepth/2,wallHeight/2,depth/2]} position={[-width/2,wallHeight/2,0]}/>
      <CuboidCollider args={[wallDepth/2,wallHeight/2,depth/2]} position={[width/2,wallHeight/2,0]}/>
      <CuboidCollider args={[1.7,wallHeight/2,wallDepth/2]} position={[-2.05,wallHeight/2,depth/2]}/>
      <CuboidCollider args={[1.7,wallHeight/2,wallDepth/2]} position={[2.05,wallHeight/2,depth/2]}/>
    </RigidBody>
    {assetId&&!inside?<Model assetId={assetId} instanceId={`village-building:${id}`} />:<FallbackHouseShell color={color} roof={roof} inside={inside}/>} 
    <InteriorSet building={{id,kind,position,rotation}} inside={inside}/>
    {inside&&<Html position={[0,3.1,0]} center distanceFactor={12}><div className="rounded-xl border border-white/70 bg-[#fff4d8]/90 px-3 py-1 text-[10px] font-black text-[#5d4231] shadow">室內 · {sign||'住宅'}</div></Html>}
    {sign&&!inside&&<Html position={[0,5.65,0]} center distanceFactor={12}><div className="rounded-xl border border-white/50 bg-[#4a3528]/85 px-3 py-1 text-xs font-black text-amber-100 whitespace-nowrap">{sign}</div></Html>}
  </group>
}
function FallbackHouseShell({color='#e8bd78',roof='#d86150',inside=false}){
  return <group visible={!inside}>
    <mesh position={[0,.18,0]} receiveShadow><boxGeometry args={[5.8,.36,5]}/><meshStandardMaterial color="#c9a778" roughness={.95}/></mesh>
    <Wall position={[0,1.9,-2.5]} scale={[5.8,3.8,.28]} color={color}/>
    <Wall position={[-2.9,1.9,0]} scale={[.28,3.8,5]} color={color}/>
    <Wall position={[2.9,1.9,0]} scale={[.28,3.8,5]} color={color}/>
    <group position={[0,4.15,0]}>
      <mesh rotation={[0,0,Math.PI/4]} castShadow><boxGeometry args={[4.7,.34,5.6]}/><meshStandardMaterial color={roof} roughness={.88}/></mesh>
      <mesh rotation={[0,0,-Math.PI/4]} castShadow><boxGeometry args={[4.7,.34,5.6]}/><meshStandardMaterial color={roof} roughness={.88}/></mesh>
    </group>
  </group>
}
function Wall({position,scale,color}){return <mesh position={position} castShadow receiveShadow><boxGeometry args={scale}/><meshStandardMaterial color={color} roughness={.92}/></mesh>}
function InteriorSet({building,inside}){
  const interior=useMemo(()=>createVillageInterior(building),[building.id,building.kind]);
  return <group position={[0,.35,0]}>
    {interior.furniture.map((item)=><InteriorFurniture key={item.id} item={item}/>)}
    <pointLight position={[0,2.7,0]} intensity={inside ? .95 : .28} distance={6.5} color="#ffd79a"/>
  </group>
}
function InteriorFurniture({item}){
  const [width,height,depth]=item.size;
  return <RigidBody type="fixed" colliders={false} position={item.position}>
    <CuboidCollider args={[width/2,height/2,depth/2]} position={[0,height/2,0]}/>
    <group>
      {item.type==='bed'?<>
        <mesh position={[0,.22,0]} castShadow><boxGeometry args={[width,.44,depth]}/><meshStandardMaterial color="#9b6b43"/></mesh>
        <mesh position={[0,.5,0]} castShadow><boxGeometry args={[width*.92,.24,depth*.92]}/><meshStandardMaterial color="#f0d2b4"/></mesh>
        <mesh position={[0,.7,-depth*.3]} castShadow><boxGeometry args={[width*.72,.18,depth*.24]}/><meshStandardMaterial color="#fff2d8"/></mesh>
      </>:item.type==='table'||item.type==='desk'||item.type==='workbench'?<>
        <mesh position={[0,height-.12,0]} castShadow><boxGeometry args={[width,.24,depth]}/><meshStandardMaterial color={item.color}/></mesh>
        {[[-width*.38,depth*.35],[width*.38,depth*.35],[-width*.38,-depth*.35],[width*.38,-depth*.35]].map(([x,z],index)=><mesh key={index} position={[x,height*.45,z]} castShadow><boxGeometry args={[.14,height*.9,.14]}/><meshStandardMaterial color="#6f4932"/></mesh>)}
      </>:<mesh position={[0,height/2,0]} castShadow receiveShadow><boxGeometry args={[width,height,depth]}/><meshStandardMaterial color={item.color} roughness={.9}/></mesh>}
    </group>
  </RigidBody>
}
export function StarTree({position,particleScale=1}){return <group position={position}><RigidBody type="fixed" colliders={false}><CuboidCollider args={[.75,2.1,.75]} position={[0,2.1,0]}/><mesh position={[0,2.2,0]} castShadow><cylinderGeometry args={[.65,1,4.4,10]}/><meshStandardMaterial color="#8e603b" roughness={1}/></mesh></RigidBody>{[[0,5,0,2.5],[-1.8,4.8,0,1.65],[1.8,4.9,.3,1.7],[0,5.4,-1.2,1.5]].map((v,i)=><mesh key={i} position={v.slice(0,3)} castShadow><sphereGeometry args={[v[3],16,12]}/><meshStandardMaterial color={i%2?'#78c76d':'#67b95f'} roughness={1}/></mesh>)}<Sparkles count={Math.round(45*particleScale)} scale={8} size={4} speed={.4} color="#ffe88b" position={[0,5,0]}/></group>}
export function Fountain({position}){return <group position={position}><RigidBody type="fixed" colliders={false}><CuboidCollider args={[2.8,.55,2.8]} position={[0,.55,0]}/><mesh position={[0,.45,0]} receiveShadow><cylinderGeometry args={[3.2,3.5,.9,32]}/><meshStandardMaterial color="#d8d0b4" roughness={.8}/></mesh></RigidBody><mesh position={[0,.88,0]}><cylinderGeometry args={[2.75,2.75,.18,32]}/><meshStandardMaterial color="#74cbe4" roughness={.25} metalness={.05}/></mesh><mesh position={[0,1.65,0]} castShadow><cylinderGeometry args={[.45,.7,1.7,12]}/><meshStandardMaterial color="#e8dfc7"/></mesh></group>}
export function PondAndBridge({pondPosition,bridgePosition,showBridge=true}){
  const radius=4.2;
  return <>
    <group position={pondPosition}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[radius,.35,radius]} position={[0,-.35,0]} sensor/>
      </RigidBody>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.06,0]} receiveShadow><circleGeometry args={[radius+1,40]}/><meshStandardMaterial color="#7fae63" roughness={1}/></mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,.015,0]} receiveShadow><circleGeometry args={[radius,48]}/><meshStandardMaterial color="#62bed8" roughness={.28} metalness={.04} transparent opacity={.9}/></mesh>
      {Array.from({length:24}).map((_,i)=>{const a=i/24*Math.PI*2;return <mesh key={i} position={[Math.cos(a)*(radius+.18),.18,Math.sin(a)*(radius+.18)]} rotation={[0,a,0]} castShadow><dodecahedronGeometry args={[.42+(i%3)*.08,0]}/><meshStandardMaterial color={i%2?'#aaa892':'#92977f'} roughness={1}/></mesh>})}
      {Array.from({length:16}).map((_,i)=>{const a=i/16*Math.PI*2;return <mesh key={`reed-${i}`} position={[Math.cos(a)*(radius+.72),.38,Math.sin(a)*(radius+.72)]} rotation={[0,a,0]}><coneGeometry args={[.12,.75,5]}/><meshStandardMaterial color="#4e9a58"/></mesh>})}
    </group>
    {showBridge&&<group position={bridgePosition}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1.35,.16,4.9]} position={[0,.42,0]}/>
      </RigidBody>
      {Array.from({length:11}).map((_,i)=><mesh key={i} position={[0,.38,-4.5+i*.9]} castShadow receiveShadow><boxGeometry args={[2.7,.28,.75]}/><meshStandardMaterial color={i%2?'#c26e3c':'#d17a42'} roughness={.92}/></mesh>)}
      {[-1.22,1.22].map(x=><group key={x}>
        {Array.from({length:6}).map((_,i)=><mesh key={i} position={[x,1.05,-4.2+i*1.68]} castShadow><boxGeometry args={[.18,1.35,.18]}/><meshStandardMaterial color="#be4938"/></mesh>)}
        <mesh position={[x,1.55,0]}><boxGeometry args={[.18,.16,9.4]}/><meshStandardMaterial color="#d85540"/></mesh>
      </group>)}
      <mesh position={[0,.12,-5.15]} receiveShadow><boxGeometry args={[3.4,.22,1.1]}/><meshStandardMaterial color="#c4ab7b"/></mesh>
      <mesh position={[0,.12,5.15]} receiveShadow><boxGeometry args={[3.4,.22,1.1]}/><meshStandardMaterial color="#c4ab7b"/></mesh>
    </group>}
  </>
}
export function MarketStalls({center}){return <group position={center}>{[[-3,-3,'#e25b53'],[3,-2,'#5f87d8'],[1,4,'#e4b64f']].map(([x,z,c],i)=><group key={i} position={[x,0,z]}><mesh position={[0,1.2,0]} castShadow><boxGeometry args={[3.2,1.6,2]}/><meshStandardMaterial color="#a96d3c"/></mesh><mesh position={[0,2.25,0]} rotation={[0,0,.1]} castShadow><boxGeometry args={[3.8,.18,2.6]}/><meshStandardMaterial color={c}/></mesh>{[-.8,0,.8].map((px,j)=><mesh key={j} position={[px,2.05,.6]}><sphereGeometry args={[.22,8,7]}/><meshStandardMaterial color={['#f16e62','#f0cf55','#72b967'][j]}/></mesh>)}</group>)}</group>}
export function WorkshopYard({center}){return <group position={center}><mesh position={[0,.45,0]} castShadow><cylinderGeometry args={[1.2,1.5,.9,10]}/><meshStandardMaterial color="#4d5361" metalness={.3} roughness={.6}/></mesh><mesh position={[0,1.25,0]} castShadow><boxGeometry args={[2.7,.35,1.1]}/><meshStandardMaterial color="#3e4652" metalness={.4}/></mesh>{[-3.2,3.2].map(x=><group key={x} position={[x,0,1]}><mesh position={[0,.75,0]}><boxGeometry args={[1.8,1.5,1.8]}/><meshStandardMaterial color="#9a683d"/></mesh><mesh position={[0,1.9,0]} rotation={[0,0,.3]}><cylinderGeometry args={[.22,.22,2.2,8]}/><meshStandardMaterial color="#6d4931"/></mesh></group>)}</group>}
export function GardenDetails({center}){return <group position={center}><FlowerPatch position={[-4,0,-1]} count={18}/><FlowerPatch position={[4,0,2]} count={18}/><mesh position={[0,.55,0]} castShadow><boxGeometry args={[3.2,1.1,1.2]}/><meshStandardMaterial color="#a87548"/></mesh></group>}
export function QuestBoard({position,onClick}){return <group position={position} onClick={onClick}><mesh position={[0,1.4,0]} castShadow><boxGeometry args={[2.8,2.1,.25]}/><meshStandardMaterial color="#9b6c40"/></mesh>{[-1,1].map(x=><mesh key={x} position={[x,.65,0]}><boxGeometry args={[.18,1.3,.18]}/><meshStandardMaterial color="#714a2e"/></mesh>)}</group>}
export function FlowerPatch({position,colors=['#ffafc5','#fff1a1','#fff'],count=20}){const items=useMemo(()=>Array.from({length:count},(_,i)=>({x:((i*37)%100)/100*5-2.5,z:((i*61)%100)/100*3-1.5,c:colors[i%colors.length],s:.8+(i%4)*.08})),[count,colors]);return <group position={position}>{items.map((v,i)=><group key={i} position={[v.x,0,v.z]} scale={v.s}><mesh position={[0,.25,0]}><cylinderGeometry args={[.025,.035,.5,5]}/><meshStandardMaterial color="#4b9a48"/></mesh><mesh position={[0,.52,0]}><sphereGeometry args={[.12,7,6]}/><meshStandardMaterial color={v.c}/></mesh></group>)}</group>}
export function GrassField({density=1}){const positions=useMemo(()=>{const a=[];for(let i=0;i<Math.round(260*density);i++){const angle=i*2.399963,r=9+((i*17)%3600)/100,x=Math.cos(angle)*r,z=Math.sin(angle)*r*.88;if(Math.abs(x)<5||Math.abs(z-2)<4)continue;a.push({x,z,s:.55+(i%5)*.08,r:(i%17)*.33})}return a},[density]);return <Instances limit={positions.length+1} range={positions.length}><coneGeometry args={[.12,.65,4]}/><meshStandardMaterial color="#3f9b45" roughness={1}/>{positions.map((v,i)=><Instance key={i} position={[v.x,.32,v.z]} scale={v.s} rotation={[0,v.r,0]}/>)}</Instances>}
export function TreeGrove({density=1}){const base=[[-37,-30],[-29,-34],[-19,-36],[18,-36],[29,-34],[38,-28],[-40,-12],[40,-10],[-41,11],[42,14],[-37,31],[37,33],[-28,35],[25,37],[-5,37],[8,-38],[-8,-34],[32,0],[-33,-2]];return <>{base.slice(0,Math.max(8,Math.round(base.length*Math.min(1,density)))).map(([x,z],i)=><group key={i} position={[x,0,z]} scale={.9+(i%4)*.12}><RigidBody type="fixed" colliders={false}><CuboidCollider args={[.6,1.7,.6]} position={[0,1.7,0]}/><mesh position={[0,1.65,0]} castShadow><cylinderGeometry args={[.35,.55,3.3,8]}/><meshStandardMaterial color="#815532"/></mesh></RigidBody><mesh position={[0,4.05,0]} castShadow><sphereGeometry args={[2.1,14,11]}/><meshStandardMaterial color={i%3===0?'#74bf62':'#65ad55'}/></mesh></group>)}</>}
export function Bench({position,rotation=[0,0,0]}){return <group position={position} rotation={rotation}><mesh position={[0,.65,0]} castShadow><boxGeometry args={[2.8,.25,.75]}/><meshStandardMaterial color="#9e6a3d"/></mesh><mesh position={[0,1.2,-.32]} rotation={[-.1,0,0]}><boxGeometry args={[2.8,1,.18]}/><meshStandardMaterial color="#9e6a3d"/></mesh></group>}
export function CratesAndBarrels({center}){return <group position={center}>{[[0,.5,0],[1.1,.5,.2],[.5,1.5,.1]].map((p,i)=><mesh key={i} position={p} castShadow><boxGeometry args={[.95,.95,.95]}/><meshStandardMaterial color="#9a6c40"/></mesh>)}<mesh position={[-1.15,.58,0]} castShadow><cylinderGeometry args={[.5,.5,1.15,12]}/><meshStandardMaterial color="#8c633d"/></mesh></group>}
