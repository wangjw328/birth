export const STARSEA_CONFIG={desktopParticles:12000,mobileParticles:5000,width:54,depth:38,thickness:.36,speed:.012,nodeRadius:.23,focusDistance:1.85,flightSeconds:1.05,backgroundStrength:.32};
export const STARSEA_PALETTES={
 silver:{name:'银白淡金',dust:'#dae4ef',accent:'#d3c09c',sphere:'#f9fbff',background:'#182631'},
 blue:{name:'极光冰蓝',dust:'#c5dce9',accent:'#a1c8d2',sphere:'#eefaff',background:'#142933'},
 rose:{name:'柔粉星尘',dust:'#e2cfdc',accent:'#d2b3c5',sphere:'#fff5fa',background:'#292332'},
 gold:{name:'香槟金',dust:'#dfd5bd',accent:'#ddc699',sphere:'#fff9ed',background:'#292820'}
};
export function canExploreStarsea({completed,scene,view,finaleComplete}){
 return completed&&scene==='rings'&&(view==='room'||(view==='ending'&&finaleComplete));
}
export function canExploreObservation({completed,scene,view,finaleComplete}){
 return completed&&['rings','aurora'].includes(scene)&&(view==='room'||(view==='ending'&&finaleComplete));
}
