export function validateVillageLayout(layout) {
  const errors=[]; const warnings=[];
  const required=['plaza','market','workshop','residential','learning','portal','trial','farmGate'];
  required.forEach((id)=>{ if(!layout?.zones?.[id]) errors.push(`Missing zone: ${id}`); });
  if(!layout?.roads?.length) errors.push('Village roads are missing.');
  if((layout?.buildings?.length||0)<8) errors.push('Village building count is below quality baseline.');
  if(!layout?.spawn) errors.push('Village spawn is missing.');
  if((layout?.landmarks?.length||0)<6) errors.push('Village landmark count is below quality baseline.');
  const ids=new Set();
  [...Object.values(layout?.zones||{}),...(layout?.buildings||[])].forEach((item)=>{
    if(!item?.id) return;
    if(ids.has(item.id)) errors.push(`Duplicate id: ${item.id}`);
    ids.add(item.id);
  });
  (layout?.buildings||[]).forEach((a,i)=>{
    (layout.buildings||[]).slice(i+1).forEach((b)=>{
      const d=Math.hypot(a.position[0]-b.position[0],a.position[2]-b.position[2]);
      if(d<5.5) warnings.push(`Buildings may overlap: ${a.id}/${b.id}`);
    });
  });
  return {ok:errors.length===0,errors,warnings};
}
