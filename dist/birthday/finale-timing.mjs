export function finalePhase(seconds,reduced=false,voyage=false){
 const fireworksEnd=reduced?.8:9;
 const gather=reduced?1.1:voyage?12:9;
 const done=reduced?1.4:voyage?29:26;
 const phase=seconds<fireworksEnd?'fireworks':seconds<gather?'transition':seconds<done?'gathering':'complete';
 return {phase,progress:Math.max(0,Math.min(1,(seconds-gather)/(done-gather))),voyageProgress:voyage?Math.max(0,Math.min(1,(seconds-fireworksEnd)/(gather-fireworksEnd))):0};
}
