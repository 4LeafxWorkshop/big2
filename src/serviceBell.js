const SERVICE_BELL_FOODS=[
  {id:'lemontea',file:'lemontea.png',voice:'lemontea_voice.mp3',width:100},
  {id:'pineapplebun',file:'pineapplebun.png',voice:'pineapplebun_voice.mp3',width:160},
  {id:'eggtart',file:'eggtart.png',voice:'eggtart_voice.mp3',width:120},
  {id:'milktea',file:'milktea.png',voice:'milktea_voice.mp3',width:180}
];

const SERVICE_BELL_SLOTS=['tl','tr','ml','mr'];

function pickRandom(list,random){
  if(!Array.isArray(list)||!list.length)return null;
  const idx=Math.floor(Math.max(0,Math.min(0.999999,Number(random?.())||0))*list.length);
  return list[idx]??list[0]??null;
}

function clearTimer(win,id){
  if(id===null||id===undefined)return;
  try{win?.clearTimeout?.(id);}catch{}
}

export function createServiceBellController(deps={}){
  const documentRef=deps.documentRef??(()=>document);
  const windowRef=deps.windowRef??(()=>window);
  const withBase=deps.withBase??((path)=>String(path??''));
  const unlockAudio=deps.unlockAudio??(()=>{});
  const getSoundEnabled=deps.getSoundEnabled??(()=>true);
  const createAudio=deps.createAudio??((src)=>new Audio(src));
  const random=deps.random??(()=>Math.random());
  const getDoc=()=>documentRef();
  const getWin=()=>windowRef();
  const raf=deps.requestAnimationFrame??((cb)=>getWin()?.requestAnimationFrame?.(cb)??getWin()?.setTimeout?.(cb,0)??setTimeout(cb,0));

  let host=null;
  let layer=null;
  let heroImg=null;
  let active=false;
  let bellHideTimer=0;
  const activeFoods=new Map();
  const occupiedSlots=new Set();

  const playAudio=(src,volume=1)=>{
    const win=getWin();
    try{
      if(!getSoundEnabled())return null;
      unlockAudio();
      const audio=createAudio(withBase(src));
      if(!audio)return null;
      if('preload' in audio)audio.preload='auto';
      if('playsInline' in audio)audio.playsInline=true;
      if(typeof audio.volume==='number')audio.volume=Math.max(0,Math.min(1,Number(volume)||1));
      if(typeof audio.currentTime==='number')audio.currentTime=0;
      const promise=audio.play?.();
      if(promise?.catch)promise.catch(()=>{});
      return audio;
    }catch{
      return null;
    }
  };

  const clearItem=(id)=>{
    const entry=activeFoods.get(id);
    if(!entry)return;
    const win=getWin();
    clearTimer(win,entry.voiceTimer);
    clearTimer(win,entry.exitTimer);
    clearTimer(win,entry.removeTimer);
    if(typeof HTMLElement!=='undefined'&&entry.el instanceof HTMLElement)entry.el.remove();
    else entry.el?.remove?.();
    occupiedSlots.delete(entry.slot);
    activeFoods.delete(id);
  };

  const clearAll=()=>{
    for(const id of [...activeFoods.keys()])clearItem(id);
  };

  const removeHost=()=>{
    clearAll();
    clearTimer(getWin(),bellHideTimer);
    bellHideTimer=0;
    heroImg=null;
    layer=null;
    host?.remove();
    host=null;
  };

  const ensureHost=()=>{
    const doc=getDoc();
    if(!doc?.body)return null;
    const targetParent=doc.querySelector?.('.table')??doc.body;
    if(host&&host.isConnected!==false){
      if(host.parentElement!==targetParent)targetParent.appendChild(host);
      layer=host.querySelector('.service-bell-food-layer')??layer;
      heroImg=host.querySelector('.service-bell-hero')??heroImg;
      return host;
    }
    host=doc.getElementById('service-bell-layer');
    if(host&&host.isConnected!==false){
      if(host.parentElement!==targetParent)targetParent.appendChild(host);
      layer=host.querySelector('.service-bell-food-layer');
      heroImg=host.querySelector('.service-bell-hero');
      return host;
    }
    host=doc.createElement('div');
    host.id='service-bell-layer';
    host.className='service-bell-layer';
    host.setAttribute('aria-hidden','true');
    host.innerHTML=`<div class="service-bell-hero-wrap"><img class="service-bell-hero" src="${withBase('foods/bell.png')}" alt="" aria-hidden="true"/></div><div class="service-bell-food-layer" aria-hidden="true"></div>`;
    targetParent.appendChild(host);
    layer=host.querySelector('.service-bell-food-layer');
    heroImg=host.querySelector('.service-bell-hero');
    return host;
  };

  const finishExit=(id)=>{
    const entry=activeFoods.get(id);
    if(!entry)return;
    clearTimer(getWin(),entry.removeTimer);
    entry.removeTimer=getWin()?.setTimeout?.(()=>{
      clearItem(id);
    },520)??0;
  };

  const startExit=(id)=>{
    const entry=activeFoods.get(id);
    if(!entry)return;
    if(typeof HTMLElement!=='undefined'&&!((entry.el instanceof HTMLElement)))return;
    if(entry.exiting)return;
    entry.exiting=true;
    entry.el.classList.add('is-exiting');
    entry.exitTimer=getWin()?.setTimeout?.(()=>finishExit(id),520)??0;
  };

  const spawnFood=()=>{
    if(!active)return false;
    const doc=getDoc();
    if(!doc?.body||!layer)return false;
    const availableFoods=SERVICE_BELL_FOODS.filter((item)=>!activeFoods.has(item.id));
    const availableSlots=SERVICE_BELL_SLOTS.filter((slot)=>!occupiedSlots.has(slot));
    if(!availableFoods.length||!availableSlots.length)return false;
    const item=pickRandom(availableFoods,random);
    const slot=pickRandom(availableSlots,random);
    if(!item||!slot)return false;
    const el=doc.createElement('img');
    el.className=`service-bell-food service-bell-food-${item.id} service-bell-slot-${slot} service-bell-dir-${slot.endsWith('l')?'left':'right'} is-entering`;
    el.setAttribute('aria-hidden','true');
    el.alt='';
    el.src=withBase(`foods/${item.file}`);
    el.style.setProperty('--food-w',`${item.width}px`);
    el.dataset.foodId=item.id;
    el.dataset.slot=slot;
    el.dataset.dir=slot.endsWith('l')?'left':'right';
    occupiedSlots.add(slot);
    activeFoods.set(item.id,{
      id:item.id,
      slot,
      el,
      exitTimer:0,
      removeTimer:0,
      voiceTimer:0,
      exiting:false
    });
    layer.appendChild(el);
    raf(()=>{
      if(!el.isConnected)return;
      el.classList.remove('is-entering');
    });
    const win=getWin();
    const voiceTimer=win?.setTimeout?.(()=>{
      playAudio(`audio/foods/${item.voice}`,0.95);
    },200)??0;
    const exitTimer=win?.setTimeout?.(()=>{
      startExit(item.id);
    },2000)??0;
    const entry=activeFoods.get(item.id);
    if(entry){
      entry.voiceTimer=voiceTimer;
      entry.exitTimer=exitTimer;
    }
    return true;
  };

  const sync=(params={})=>{
    active=Boolean(params.active);
    if(!active){
      removeHost();
      return;
    }
    const shell=ensureHost();
    if(!shell)return;
    shell.dataset.orientation=params.portraitMode?'portrait':'landscape';
  };

  const trigger=()=>{
    if(!active)return false;
    const shell=ensureHost();
    if(!shell)return false;
    clearTimer(getWin(),bellHideTimer);
    bellHideTimer=0;
    shell.classList.remove('is-ready');
    void shell.offsetWidth;
    shell.classList.add('is-ready');
    bellHideTimer=getWin()?.setTimeout?.(()=>{
      if(host?.isConnected!==false)host.classList.remove('is-ready');
      bellHideTimer=0;
    },1050)??0;
    playAudio('audio/foods/bell.mp3',0.85);
    const spawned=spawnFood();
    return spawned;
  };

  return{
    sync,
    trigger,
    clearAll,
    removeHost
  };
}
