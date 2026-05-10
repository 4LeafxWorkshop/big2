const SERVICE_BELL_FOODS=[
  {id:'lemontea',file:'lemontea.png',voice:'lemontea_voice.mp3',width:100,height:184},
  {id:'lemoncokeginger',file:'lemoncokeginger.png',voice:'lemoncokeginger_voice.mp3',width:138,height:129},
  {id:'pineapplebun',file:'pineapplebun.png',voice:'pineapplebun_voice.mp3',width:160,height:109},
  {id:'eggtart',file:'eggtart.png',voice:'eggtart_voice.mp3',width:120,height:78},
  {id:'milktea',file:'milktea.png',voice:'milktea_voice.mp3',width:180,height:140},
  {id:'cocktailbun',file:'cocktailbun.png',voice:'cocktailbun_voice.mp3',width:176,height:102},
  {id:'icedmilktea',file:'icedmilktea.png',voice:'icedmilktea_voice.mp3',width:100,height:174},
  {id:'sausagebun',file:'sausagebun.png',voice:'sausagebun_voice.mp3',width:172,height:115},
  {id:'redbeanice',file:'redbeanice.png',voice:'redbeanice_voice.mp3',width:96,height:197},
  {id:'frenchtoast',file:'frenchtoast.png',voice:'frenchtoast_voice.mp3',width:186,height:118}
];

const SERVICE_BELL_SLOTS=['tl','tr','ml','mr'];
const SERVICE_BELL_LAYER_Z=2147483300;
const SERVICE_BELL_FOOD_LAYER_Z=2147483300;
const SERVICE_BELL_SLOT_POINTS={
  portrait:{
    tl:{x:'16%',y:'15%'},
    tr:{x:'84%',y:'15%'},
    ml:{x:'14%',y:'72%'},
    mr:{x:'86%',y:'72%'}
  },
  landscape:{
    // Spread the lanes wider in landscape so the slide uses the full felt.
    tl:{x:'8%',y:'20%'},
    tr:{x:'92%',y:'20%'},
    ml:{x:'10%',y:'72%'},
    mr:{x:'90%',y:'72%'}
  }
};

function pickRandom(list,random){
  if(!Array.isArray(list)||!list.length)return null;
  const idx=Math.floor(Math.max(0,Math.min(0.999999,Number(random?.())||0))*list.length);
  return list[idx]??list[0]??null;
}

function clearTimer(win,id){
  if(id===null||id===undefined)return;
  try{win?.clearTimeout?.(id);}catch{}
}

function afterNextPaint(win,fn){
  if(!win?.requestAnimationFrame){
    return win?.setTimeout?.(fn,0)??0;
  }
  return win.requestAnimationFrame(()=>win.requestAnimationFrame(fn));
}

export function createServiceBellController(deps={}){
  const documentRef=deps.documentRef??(()=>document);
  const windowRef=deps.windowRef??(()=>window);
  const withBase=deps.withBase??((path)=>String(path??''));
  const unlockAudio=deps.unlockAudio??(()=>{});
  const getSoundEnabled=deps.getSoundEnabled??(()=>true);
  const createAudio=deps.createAudio??((src)=>new Audio(src));
  const getFoodCalloutSeat=deps.getFoodCalloutSeat??(()=>null);
  const setFoodCallout=deps.setFoodCallout??(()=>{});
  const clearFoodCallout=deps.clearFoodCallout??(()=>{});
  const onFoodSpawn=deps.onFoodSpawn??(()=>{});
  const random=deps.random??(()=>Math.random());
  const getDoc=()=>documentRef();
  const getWin=()=>windowRef();
  const getPlacementParent=()=>{
    const doc=getDoc();
    if(!doc?.body)return null;
    return doc.querySelector?.('.table')??doc.body;
  };
  const getFoodPlacementParent=()=>{
    const doc=getDoc();
    if(!doc?.body)return null;
    return getPlacementParent()??doc.body;
  };
  const applyPlacement=(el,parent,zIndex='')=>{
    if(!el||!parent)return;
    el.style.position=parent===getDoc().body?'fixed':'absolute';
    el.style.inset='0';
    el.style.zIndex=zIndex?String(zIndex):'';
  };
  const placeFoodHost=(host,parent)=>{
    if(!host||!parent)return;
    if(parent===getDoc().body){
      if(host.parentElement!==parent)parent.appendChild(host);
      return;
    }
    const firstChild=parent.children?.[0]??null;
    if(host.parentElement!==parent||firstChild!==host){
      parent.insertBefore?.(host,firstChild)||parent.appendChild(host);
    }
  };

  let heroHost=null;
  let foodHost=null;
  let heroImg=null;
  let active=false;
  let orientation='landscape';
  let bellHideTimer=0;
  let bellPressTimer=0;
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
    clearTimer(win,entry.enterTimer);
    if(typeof HTMLElement!=='undefined'&&entry.el instanceof HTMLElement)entry.el.remove();
    else entry.el?.remove?.();
    occupiedSlots.delete(entry.slot);
    activeFoods.delete(id);
    if(activeFoods.size===0){
      if(heroHost?.isConnected!==false){
        heroHost.classList.remove('is-ready');
        heroHost.classList.remove('is-pressed');
      }
      clearTimer(getWin(),bellHideTimer);
      bellHideTimer=0;
    }
  };

  const clearAll=()=>{
    for(const id of [...activeFoods.keys()])clearItem(id);
  };

  const removeHost=()=>{
    clearAll();
    clearTimer(getWin(),bellHideTimer);
    bellHideTimer=0;
    clearTimer(getWin(),bellPressTimer);
    bellPressTimer=0;
    clearFoodCallout();
    heroImg=null;
    heroHost?.remove();
    foodHost?.remove();
    heroHost=null;
    foodHost=null;
  };

  const ensureHeroHost=()=>{
    const doc=getDoc();
    if(!doc?.body)return null;
    const targetParent=getPlacementParent()??doc.body;
    if(heroHost){
      if(heroHost.parentElement!==targetParent)targetParent.appendChild(heroHost);
      heroImg=heroHost.querySelector('.service-bell-hero')??heroImg;
      applyPlacement(heroHost,targetParent,SERVICE_BELL_LAYER_Z);
      return heroHost;
    }
    heroHost=doc.getElementById('service-bell-layer');
    if(heroHost&&heroHost.isConnected!==false){
      if(heroHost.parentElement!==targetParent)targetParent.appendChild(heroHost);
      heroImg=heroHost.querySelector('.service-bell-hero');
      applyPlacement(heroHost,targetParent,SERVICE_BELL_LAYER_Z);
      return heroHost;
    }
    heroHost=doc.createElement('div');
    heroHost.id='service-bell-layer';
    heroHost.className='service-bell-layer';
    heroHost.setAttribute('aria-hidden','true');
    heroHost.innerHTML=`<div class="service-bell-hero-wrap"><img class="service-bell-hero" src="${withBase('foods/bell.png')}" alt="" aria-hidden="true"/></div>`;
    targetParent.appendChild(heroHost);
    applyPlacement(heroHost,targetParent,SERVICE_BELL_LAYER_Z);
    heroImg=heroHost.querySelector('.service-bell-hero');
    return heroHost;
  };

  const ensureFoodHost=()=>{
    const doc=getDoc();
    if(!doc?.body)return null;
    const targetParent=getFoodPlacementParent()??doc.body;
    if(foodHost){
      placeFoodHost(foodHost,targetParent);
      applyPlacement(foodHost,targetParent,SERVICE_BELL_FOOD_LAYER_Z);
      return foodHost;
    }
    foodHost=doc.getElementById('service-bell-food-layer');
    if(foodHost&&foodHost.isConnected!==false){
      placeFoodHost(foodHost,targetParent);
      applyPlacement(foodHost,targetParent,SERVICE_BELL_FOOD_LAYER_Z);
      return foodHost;
    }
    foodHost=doc.createElement('div');
    foodHost.id='service-bell-food-layer';
    foodHost.className='service-bell-food-layer';
    foodHost.setAttribute('aria-hidden','true');
    placeFoodHost(foodHost,targetParent);
    applyPlacement(foodHost,targetParent,SERVICE_BELL_FOOD_LAYER_Z);
    return foodHost;
  };

  const startExit=(id)=>{
    const entry=activeFoods.get(id);
    if(!entry)return;
    if(typeof HTMLElement!=='undefined'&&!((entry.el instanceof HTMLElement)))return;
    if(entry.exiting)return;
    entry.exiting=true;
    entry.el.classList.add('is-exiting');
    clearTimer(getWin(),entry.exitTimer);
    clearTimer(getWin(),entry.removeTimer);
    entry.removeTimer=getWin()?.setTimeout?.(()=>{
      clearItem(id);
    },520)??0;
  };

  const spawnFood=()=>{
    if(!active)return false;
    const doc=getDoc();
    const foodLayer=ensureFoodHost();
    if(!doc?.body||!foodLayer)return false;
    const availableFoods=SERVICE_BELL_FOODS.filter((item)=>!activeFoods.has(item.id));
    const availableSlots=SERVICE_BELL_SLOTS.filter((slot)=>!occupiedSlots.has(slot));
    if(!availableFoods.length||!availableSlots.length)return false;
    const item=pickRandom(availableFoods,random);
    const slot=pickRandom(availableSlots,random);
    if(!item||!slot)return false;
    const side=slot.endsWith('l')?'left':'right';
    const slotPoint=SERVICE_BELL_SLOT_POINTS[orientation]?.[slot]??SERVICE_BELL_SLOT_POINTS.landscape[slot];
    const el=doc.createElement('img');
    el.className=`service-bell-food service-bell-food-${item.id} service-bell-slot-${slot} service-bell-dir-${side} is-entering`;
    el.setAttribute('aria-hidden','true');
    el.alt='';
    el.src=withBase(`foods/${item.file}`);
    el.style.setProperty('--food-w',`${item.width}px`);
    el.width=item.width;
    el.height=item.height;
    el.style.setProperty('--offscreen-x',side==='left'?'-300px':'300px');
    if(slotPoint){
      el.style.setProperty('--slot-x',slotPoint.x);
      el.style.setProperty('--slot-y',slotPoint.y);
    }
    el.dataset.foodId=item.id;
    el.dataset.slot=slot;
    el.dataset.dir=side;
    occupiedSlots.add(slot);
    activeFoods.set(item.id,{
      id:item.id,
      slot,
      el,
      enterTimer:0,
      exitTimer:0,
      removeTimer:0,
      voiceTimer:0,
      exiting:false
    });
    foodLayer.appendChild(el);
    const entry=activeFoods.get(item.id);
    entry.enterTimer=afterNextPaint(getWin(),()=>{
      const current=activeFoods.get(item.id);
      if(current!==entry||!el.isConnected)return;
      el.classList.remove('is-entering');
      occupiedSlots.add(slot);
    });
    const win=getWin();
    const voiceTimer=win?.setTimeout?.(()=>{
      playAudio(`audio/foods/${item.voice}`,0.95);
    },200)??0;
    const foodCalloutSeat=getFoodCalloutSeat(item,slot);
    if(Number.isInteger(foodCalloutSeat)){
      setFoodCallout({
        seat:foodCalloutSeat,
        foodId:item.id,
        file:item.file,
        width:Math.max(40,Math.round((Number(item.width)||0)*0.45)),
        ts:Date.now()
      });
    }
    try{onFoodSpawn(item,slot);}catch{}
    const exitTimer=win?.setTimeout?.(()=>{
      startExit(item.id);
    },2000)??0;
    if(entry){
      entry.voiceTimer=voiceTimer;
      entry.exitTimer=exitTimer;
    }
    return true;
  };

  const sync=(params={})=>{
    active=Boolean(params.active);
    orientation=params.portraitMode?'portrait':'landscape';
    if(!active){
      removeHost();
      return;
    }
    const shell=ensureHeroHost();
    const foodLayer=ensureFoodHost();
    if(!shell)return;
    shell.dataset.orientation=params.portraitMode?'portrait':'landscape';
    if(foodLayer)foodLayer.dataset.orientation=params.portraitMode?'portrait':'landscape';
    const targetParent=getPlacementParent()??getDoc()?.body;
    if(targetParent&&shell.parentElement!==targetParent){
      targetParent.appendChild(shell);
      applyPlacement(shell,targetParent,SERVICE_BELL_LAYER_Z);
    }
    const foodParent=getFoodPlacementParent()??getDoc()?.body;
    if(foodLayer&&foodLayer.parentElement!==foodParent){
      placeFoodHost(foodLayer,foodParent);
      applyPlacement(foodLayer,foodParent);
    }else if(foodLayer&&foodParent&&foodParent!==getDoc()?.body&&foodParent.children?.[0]!==foodLayer){
      placeFoodHost(foodLayer,foodParent);
    }
  };

  const trigger=()=>{
    if(!active)return false;
    const shell=ensureHeroHost();
    if(!shell)return false;
    clearTimer(getWin(),bellHideTimer);
    bellHideTimer=0;
    clearTimer(getWin(),bellPressTimer);
    bellPressTimer=0;
    shell.classList.add('is-ready');
    shell.classList.remove('is-pressed');
    shell.classList.add('is-pressed');
    bellPressTimer=getWin()?.setTimeout?.(()=>{
      if(heroHost===shell)heroHost.classList.remove('is-pressed');
      bellPressTimer=0;
    },120)??0;
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
