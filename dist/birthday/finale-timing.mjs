export function finalePhase(seconds,reduced=false){
 const gather=reduced?1:12,done=reduced?1.3:17;
 return {phase:seconds<gather?'fireworks':seconds<done?'gathering':'complete',progress:Math.max(0,Math.min(1,(seconds-gather)/(done-gather)))};
}
