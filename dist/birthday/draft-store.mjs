const DATABASE='starwish-birthday-drafts';
const STORE='drafts';
const KEY='current';

function openDatabase(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DATABASE,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}

async function transact(mode,action){
 const db=await openDatabase();
 try{return await new Promise((resolve,reject)=>{
  const transaction=db.transaction(STORE,mode);
  const request=action(transaction.objectStore(STORE));
  transaction.oncomplete=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
  transaction.onerror=()=>reject(transaction.error);
  transaction.onabort=()=>reject(transaction.error||new Error('草稿存储中断'));
 });}finally{db.close();}
}

export async function snapshotMemories(memories){
 return Promise.all(memories.map(async item=>{
  const saved={...item};
  if(item.src?.startsWith('blob:')){
   const response=await fetch(item.src);
   if(!response.ok)throw new Error('无法读取当前上传的素材');
   saved.blob=await response.blob();
   saved.src='';
  }
  return saved;
 }));
}

export async function saveDraft({scene,config,memories}){
 const snapshot={schema:1,savedAt:Date.now(),scene,config:{...config,includedMemories:{...config.includedMemories}},memories:await snapshotMemories(memories)};
 await transact('readwrite',store=>store.put(snapshot,KEY));
 return snapshot;
}

export async function loadDraft(){return transact('readonly',store=>store.get(KEY));}
