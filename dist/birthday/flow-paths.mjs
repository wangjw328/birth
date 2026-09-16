// Parametric paths keep moving particles inside a recognizable silhouette.
export function sampleFlow(out, offset, shape, seed, index, time, edge=false){
 const [a,b,c]=seed;
 const theta=a*Math.PI*2+time*(shape==='heart'?.23:shape==='saturn'&&index%3===0?.38:.16)*( .7+b*.6);
 let x,y,z;
 if(shape==='heart'){
  const latitude=(c-.5)*Math.PI;
  const volume=edge?.98:Math.cbrt(b);
  const r=volume*Math.cos(latitude);
  x=1.6*Math.sin(theta)**3*r;
  y=(13*Math.cos(theta)-5*Math.cos(2*theta)-2*Math.cos(3*theta)-Math.cos(4*theta))*volume/10+.15;
  z=1.2*Math.sin(latitude)*volume*Math.max(.15,Math.abs(Math.sin(theta)));
 }else if(shape==='saturn'&&(index%3===0||edge)){
  const r=1.7+b*.8;x=r*Math.cos(theta);y=r*Math.sin(theta)*.32;z=r*Math.sin(theta)*.65;
 }else{
  const phi=Math.acos(2*b-1),r=shape==='saturn'?1.13:1.5*(.85+c*.15);
  x=r*Math.sin(phi)*Math.cos(theta);y=r*Math.cos(phi);z=r*Math.sin(phi)*Math.sin(theta);
 }
 out[offset]=x;out[offset+1]=y;out[offset+2]=z;
}
