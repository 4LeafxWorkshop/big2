function createDragPopupController(){
  let dragPopupTimer=null;
  let dragPopupActive=false;
  const popupEl=()=>document.getElementById('drag-popup');
  const positionDragPopup=(x,y)=>{
    const el=popupEl();
    if(!el)return;
    const offset=18;
    el.style.left=`${Math.round(x+offset)}px`;
    el.style.top=`${Math.round(y+offset)}px`;
  };
  const hideDragPopup=()=>{
    const el=popupEl();
    if(dragPopupTimer){clearTimeout(dragPopupTimer);dragPopupTimer=null;}
    el?.classList.remove('show');
    dragPopupActive=false;
  };
  const showDragPopup=(autoHideMs=0)=>{
    const el=popupEl();
    if(!el)return;
    if(dragPopupTimer){clearTimeout(dragPopupTimer);dragPopupTimer=null;}
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    dragPopupActive=true;
    if(autoHideMs>0){
      dragPopupTimer=window.setTimeout(()=>{dragPopupTimer=null;popupEl()?.classList.remove('show');},autoHideMs);
    }
  };
  const isActive=()=>dragPopupActive;
  return{positionDragPopup,hideDragPopup,showDragPopup,isActive};
}

function bindResultActionButton(buttonId,guardKey,handler,guardAction,beforeAction=()=>{}){
  const button=document.getElementById(buttonId);
  button?.addEventListener('pointerdown',(e)=>{
    if(!guardAction(guardKey))return;
    beforeAction();
    e.preventDefault();
    e.stopPropagation();
    void handler();
  },true);
  button?.addEventListener('click',()=>{
    if(!guardAction(guardKey))return;
    beforeAction();
    void handler();
  });
}

function bindControlRowLabels({app,t,isPortraitMode,autoSortMode='number'}){
  const controlRow=app.querySelector('.action-zone .control-row');
  if(!controlRow)return;
  const suggestAnchor=controlRow.querySelector('.recommend-anchor');
  const playBtn=controlRow.querySelector('#play-btn');
  const passBtn=controlRow.querySelector('#pass-btn');
  const sortBtn=controlRow.querySelector('#auto-sort-btn');
  const emoteBtn=controlRow.querySelector('#emote-toggle');
  const bellBtn=controlRow.querySelector('#bell-toggle');
  const order=[suggestAnchor,playBtn,passBtn,sortBtn,emoteBtn,bellBtn].filter(Boolean);
  order.forEach((node)=>controlRow.appendChild(node));
  const suggestBtn=controlRow.querySelector('#suggest-btn');
  if(suggestBtn){
    const label=suggestBtn.querySelector('span:not([aria-hidden])');
    if(!label){
      const text=document.createElement('span');
      text.textContent=t('suggest');
      suggestBtn.appendChild(text);
    }else{
      label.textContent=t('suggest');
    }
    suggestBtn.setAttribute('aria-label',t('suggest'));
    suggestBtn.setAttribute('title',t('suggest'));
  }
  if(emoteBtn){
    const label=emoteBtn.querySelector('span:not([aria-hidden])');
    if(label)label.remove();
    emoteBtn.setAttribute('aria-label',t('emoteTooltip'));
    emoteBtn.setAttribute('data-tooltip',t('emoteTooltip'));
    emoteBtn.removeAttribute('title');
  }
  if(bellBtn){
    bellBtn.setAttribute('aria-label',t('serviceBellTooltip'));
    bellBtn.setAttribute('data-tooltip',t('serviceBellTooltip'));
    bellBtn.removeAttribute('title');
  }
  if(sortBtn){
    const sortLabel=autoSortMode==='suit'?t('sortBySuitTooltip'):t('sortByNumberTooltip');
    sortBtn.setAttribute('aria-label',sortLabel);
    sortBtn.setAttribute('data-tooltip',sortLabel);
    sortBtn.removeAttribute('title');
  }
  if(isPortraitMode()){
    const portraitOrder=[suggestAnchor,playBtn,passBtn,sortBtn,emoteBtn,bellBtn].filter(Boolean);
    portraitOrder.forEach((node)=>controlRow.appendChild(node));
  }
}

function bindCardInteractions({
  app,
  v,
  state,
  dragEnabled,
  isMobilePointer,
  unlockAudio,
  playSound,
  render,
  reorderCurrent,
  dragPopupController,
  mobileTapState
}){
  const {positionDragPopup,hideDragPopup,showDragPopup,isActive}=dragPopupController;
  app.querySelectorAll('[data-card-id]').forEach((n)=>{
    const id=n.getAttribute('data-card-id');
    let pointerTapActive=false;
    let pointerTapId=-1;
    let pointerStartX=0;
    let pointerStartY=0;
    let touchTapActive=false;
    let touchStartX=0;
    let touchStartY=0;
    const triggerSwipeDiscard=()=>{
      unlockAudio();
      if(!v.canControl||!id)return;
      if(!state.selected.size)state.selected.add(id);
      playSound('select');
      mobileTapState.lastTapAt=Date.now();
      document.getElementById('play-btn')?.click();
    };
    const toggleSelect=()=>{
      unlockAudio();
      if(!v.canControl||!id)return;
      if(state.drag.moved){state.drag.moved=false;return;}
      if(state.selected.has(id))state.selected.delete(id);else state.selected.add(id);
      playSound('select');
      render();
    };
    n.addEventListener('mouseenter',()=>{if(!dragEnabled||!id)return;playSound('select');});
    n.addEventListener('dragstart',(e)=>{
      if(!dragEnabled||!id)return;
      state.drag.id=id;
      state.drag.moved=false;
      positionDragPopup(e.clientX,e.clientY);
      showDragPopup();
      e.dataTransfer?.setData('text/plain',id);
    });
    n.addEventListener('dragover',(e)=>{
      if(!dragEnabled)return;
      e.preventDefault();
      if(isActive())positionDragPopup(e.clientX,e.clientY);
    });
    n.addEventListener('drop',(e)=>{if(!dragEnabled||!id)return;e.preventDefault();hideDragPopup();const fromId=state.drag.id||e.dataTransfer?.getData('text/plain');if(!fromId||fromId===id)return;reorderCurrent(v,fromId,id);state.drag.moved=true;render();});
    n.addEventListener('dragend',()=>{hideDragPopup();setTimeout(()=>{state.drag.id=null;},0);});
    if(isMobilePointer()){
      n.addEventListener('contextmenu',(e)=>{
        e.preventDefault();
        e.stopPropagation();
      });
    }
    if(isMobilePointer()){
      if(window.PointerEvent){
        n.addEventListener('pointerdown',(e)=>{
          if(e.pointerType==='mouse')return;
          hideDragPopup();
          pointerTapActive=true;
          pointerTapId=e.pointerId;
          pointerStartX=e.clientX;
          pointerStartY=e.clientY;
        });
        n.addEventListener('pointerup',(e)=>{
          if(e.pointerType==='mouse')return;
          if(!pointerTapActive||e.pointerId!==pointerTapId)return;
          pointerTapActive=false;
          const dx=e.clientX-pointerStartX;
          const dy=pointerStartY-e.clientY;
          const moved=Math.hypot(dx,dy);
          if(dy>56&&Math.abs(dx)<Math.max(28,dy*0.5)){
            e.preventDefault();
            triggerSwipeDiscard();
            return;
          }
          if(moved>12)return;
          e.preventDefault();
          mobileTapState.lastTapAt=Date.now();
          toggleSelect();
        });
        n.addEventListener('pointercancel',()=>{pointerTapActive=false;hideDragPopup();});
      }else{
        n.addEventListener('touchstart',(e)=>{
          hideDragPopup();
          const touch=e.changedTouches?.[0];
          if(!touch)return;
          touchTapActive=true;
          touchStartX=touch.clientX;
          touchStartY=touch.clientY;
        },{passive:true});
        n.addEventListener('touchend',(e)=>{
          if(!touchTapActive)return;
          touchTapActive=false;
          const touch=e.changedTouches?.[0];
          if(!touch)return;
          const dx=touch.clientX-touchStartX;
          const dy=touchStartY-touch.clientY;
          const moved=Math.hypot(dx,dy);
          if(dy>56&&Math.abs(dx)<Math.max(28,dy*0.5)){
            e.preventDefault();
            triggerSwipeDiscard();
            return;
          }
          if(moved>12)return;
          e.preventDefault();
          mobileTapState.lastTapAt=Date.now();
          toggleSelect();
        },{passive:false});
        n.addEventListener('touchcancel',()=>{touchTapActive=false;hideDragPopup();},{passive:true});
      }
    }
    n.addEventListener('click',(e)=>{
      if(isMobilePointer()&&Date.now()-mobileTapState.lastTapAt<500){
        e.preventDefault();
        return;
      }
      toggleSelect();
    });
  });

  document.addEventListener('dragover',(e)=>{
    if(!dragEnabled||!isActive())return;
    positionDragPopup(e.clientX,e.clientY);
  },{passive:true});
}

function bindLogFab({
  state
}){
  const logFab=document.getElementById('game-log-fab');
  if(!logFab)return;
  let dragActive=false;
  let moved=false;
  let startX=0;
  let startY=0;
  let originX=0;
  let originY=0;
  const clamp=(val,min,max)=>Math.max(min,Math.min(max,val));
  const setFabPos=(x,y)=>{
    const maxX=Math.max(0,window.innerWidth-logFab.offsetWidth);
    const maxY=Math.max(0,window.innerHeight-logFab.offsetHeight);
    const nx=clamp(x,8,maxX-8);
    const ny=clamp(y,8,maxY-8);
    state.logFab.x=nx;
    state.logFab.y=ny;
    state.logFab.vw=window.innerWidth||0;
    state.logFab.vh=window.innerHeight||0;
    logFab.style.left=`${nx}px`;
    logFab.style.top=`${ny}px`;
    logFab.style.right='auto';
    logFab.style.bottom='auto';
  };
  const startDrag=(clientX,clientY)=>{
    dragActive=true;
    moved=false;
    startX=clientX;
    startY=clientY;
    const rect=logFab.getBoundingClientRect();
    originX=rect.left;
    originY=rect.top;
  };
  const moveDrag=(clientX,clientY)=>{
    if(!dragActive)return;
    const dx=clientX-startX;
    const dy=clientY-startY;
    if(!moved&&Math.hypot(dx,dy)>6){
      moved=true;
      logFab.setAttribute('data-ignore-click','1');
    }
    if(moved)setFabPos(originX+dx,originY+dy);
  };
  const endDrag=()=>{
    dragActive=false;
  };
  logFab.addEventListener('pointerdown',(ev)=>{
    if(ev.pointerType==='mouse')return;
    startDrag(ev.clientX,ev.clientY);
  },{passive:true});
  logFab.addEventListener('pointermove',(ev)=>{
    if(ev.pointerType==='mouse')return;
    moveDrag(ev.clientX,ev.clientY);
  },{passive:true});
  logFab.addEventListener('pointerup',endDrag,{passive:true});
  logFab.addEventListener('pointercancel',endDrag,{passive:true});
  if(window.PointerEvent)return;
  logFab.addEventListener('touchstart',(ev)=>{
    const touch=ev.changedTouches?.[0];
    if(!touch)return;
    startDrag(touch.clientX,touch.clientY);
  },{passive:true});
  logFab.addEventListener('touchmove',(ev)=>{
    const touch=ev.changedTouches?.[0];
    if(!touch)return;
    moveDrag(touch.clientX,touch.clientY);
  },{passive:true});
  logFab.addEventListener('touchend',endDrag,{passive:true});
  logFab.addEventListener('touchcancel',endDrag,{passive:true});
}

function bindLogSheetSwipe({
  state,
  render,
  isMobilePointer,
  swipeState
}){
  if(swipeState.bound)return;
  const shouldHandle=(target)=>{
    if(!(target instanceof Element))return false;
    if(!target.closest('.table'))return false;
    if(target.closest('.log-sheet,.topbar,.action-zone,.hand,.game-cta-btn,.side-zone,.log-side-card'))return false;
    return true;
  };
  document.body.addEventListener('touchstart',(ev)=>{
    if(state.screen!=='game')return;
    if(!isMobilePointer())return;
    if(state.showLogSheet)return;
    const portrait=window.matchMedia?.('(orientation: portrait)')?.matches ?? (window.innerHeight>window.innerWidth);
    if(!portrait)return;
    const touch=ev.changedTouches?.[0];
    if(!touch||!shouldHandle(ev.target))return;
    swipeState.active=true;
    swipeState.startX=touch.clientX;
    swipeState.startY=touch.clientY;
    swipeState.startAt=Date.now();
  },{passive:true});
  document.body.addEventListener('touchend',(ev)=>{
    if(!swipeState.active)return;
    swipeState.active=false;
    if(state.screen!=='game'||state.showLogSheet)return;
    const touch=ev.changedTouches?.[0];
    if(!touch)return;
    const dt=Date.now()-swipeState.startAt;
    if(dt>700)return;
    const dx=touch.clientX-swipeState.startX;
    const dy=swipeState.startY-touch.clientY;
    const absDx=Math.abs(dx);
    const absDy=Math.abs(dy);
    if(dy>90&&absDx<Math.max(28,dy*0.5)){
      const logBtn=document.getElementById('log-toggle');
      if(logBtn&&!logBtn.hasAttribute('disabled')){
        logBtn.click();
      }else{
        state.logTouched=true;
        state.showLogSheet=true;
        render();
      }
      return;
    }
    if(dy<-90&&absDx<Math.max(28,absDy*0.5)){
      const foodBtn=document.getElementById('bell-toggle');
      if(foodBtn&&!foodBtn.hasAttribute('disabled')){
        foodBtn.click();
      }
      return;
    }
    if(dx>90&&absDy<Math.max(28,absDx*0.5)){
      const suggestBtn=document.getElementById('suggest-btn');
      if(suggestBtn&&!suggestBtn.hasAttribute('disabled')){
        suggestBtn.click();
      }
      return;
    }
    if(dx<-90&&absDy<Math.max(28,absDx*0.5)){
      if(state.home.mode==='room')return;
      const emoteBtn=document.getElementById('emote-toggle');
      if(emoteBtn&&!emoteBtn.hasAttribute('disabled')){
        emoteBtn.click();
      }
      return;
    }
  },{passive:true});
  document.body.addEventListener('touchcancel',()=>{swipeState.active=false;},{passive:true});
  swipeState.bound=true;
}

function bindOpponentProfileInteractions({
  app,
  state,
  render,
  tapState
}){
  document.getElementById('opponent-profile-close')?.addEventListener('click',()=>{state.opponentProfileName='';render();});
  document.getElementById('opponent-profile-backdrop')?.addEventListener('click',()=>{state.opponentProfileName='';render();});

  const openNamecardProfile=(btn,ev)=>{
    if(ev){
      ev.preventDefault();
      ev.stopPropagation();
    }
    const now=Date.now();
    if(now-tapState.lastNamecardTapAt<350)return;
    tapState.lastNamecardTapAt=now;
    const name=btn.getAttribute('data-opponent-name')||btn.closest?.('[data-opponent-name]')?.getAttribute('data-opponent-name');
    if(!name)return;
    state.mottoPeekName='';
    state.opponentProfileName=name;
    render();
  };
  app.querySelectorAll('.seat-namecard').forEach((btn)=>{
    btn.addEventListener('click',(ev)=>openNamecardProfile(btn,ev));
    btn.addEventListener('touchstart',(ev)=>openNamecardProfile(btn,ev),{passive:false});
  });

  app.querySelectorAll('[data-opponent-name]').forEach((el)=>{
    const name=el.getAttribute('data-opponent-name');
    if(!name)return;
    el.addEventListener('click',(ev)=>{
      ev.preventDefault();
      ev.stopPropagation();
      const directProfile=Boolean(ev.target?.closest?.('.seat-namecard'));
      const canPeekMotto=Boolean(el.querySelector('.seat-motto-callout'));
      if(!directProfile&&canPeekMotto){
        if(state.mottoPeekName!==name){
          state.mottoPeekName=name;
          render();
          return;
        }
        state.mottoPeekName='';
        render();
        return;
      }
      state.opponentProfileName=name;
      render();
    });
  });
  app.querySelectorAll('.seat-motto-callout').forEach((el)=>{
    el.addEventListener('click',(ev)=>{
      const host=el.closest?.('[data-opponent-name]');
      const name=host?.getAttribute('data-opponent-name');
      if(!name)return;
      ev.preventDefault();
      ev.stopPropagation();
      state.mottoPeekName='';
      state.opponentProfileName=name;
      render();
    });
  });
}

function bindHomeAndResultActions({
  state,
  closeLangMenu,
  clearAiTimer,
  leaveRoom,
  resetSoloSessionCarryover,
  setRecommendHint,
  render,
  resetRoomExpiryTo60s,
  waitMs,
  triggerClickBanner,
  startSoloGame,
  armPopunderForGesture=()=>{},
  schedulePopunderAfterRender,
  roomResultExpired,
  t,
  roomIsHost,
  restartRoomGame,
  setSoloStatus,
  guardAction
}){
  const openGameExitConfirm=(action,buttonEl)=>{
    const rect=buttonEl?.getBoundingClientRect?.();
    const popoverWidth=236;
    const popoverHeight=96;
    const pad=8;
    const centerX=rect?Math.round(rect.left+rect.width/2):pad+popoverWidth/2;
    const underTop=rect?Math.round(rect.bottom+8):pad;
    const overTop=rect?Math.round(rect.top-popoverHeight-8):pad;
    const fitsBelow=!rect||underTop+popoverHeight<=window.innerHeight-pad;
    const top=Math.max(pad,Math.min(fitsBelow?underTop:overTop,window.innerHeight-popoverHeight-pad));
    const left=Math.max(pad+popoverWidth/2,Math.min(centerX,window.innerWidth-pad-popoverWidth/2));
    state.gameExitConfirm={action,anchor:{left,top,width:popoverWidth,height:popoverHeight}};
    render();
  };
  const closeGameExitConfirm=()=>{
    state.gameExitConfirm=null;
    render();
  };
  const confirmGameExit=async()=>{
    const action=String(state.gameExitConfirm||'home');
    state.gameExitConfirm=null;
    closeLangMenu();
    if(action==='restart'){
      clearAiTimer();
      triggerClickBanner(document.getElementById('restart-btn'));
      await waitMs(120);
      state.opponentProfileName='';
      state.recommendation=null;
      setRecommendHint('');
      if(state.home.mode==='room'&&state.room.id){
        await leaveRoom();
      }
      await startSoloGame({preserveOpponents:false,resetTotals:true,resetRoundWins:true});
      schedulePopunderAfterRender(1200);
      return;
    }
    clearAiTimer();
    state.opponentProfileName='';
    if(state.home.mode==='room'&&state.room.id){
      await leaveRoom();
      return;
    }
    resetSoloSessionCarryover();
    state.screen='home';
    state.selected.clear();
    state.recommendation=null;
    setRecommendHint('');
    render();
  };
  document.getElementById('home-btn')?.addEventListener('click',()=>{
    openGameExitConfirm('home',document.getElementById('home-btn'));
  });
  document.getElementById('result-home')?.addEventListener('click',()=>{
    openGameExitConfirm('home',document.getElementById('result-home'));
  });
  document.getElementById('congrats-home')?.addEventListener('click',()=>{clearAiTimer();state.opponentProfileName='';if(state.home.mode==='room'&&state.room.id){void leaveRoom();return;}resetSoloSessionCarryover();state.screen='home';state.selected.clear();state.recommendation=null;setRecommendHint('');render();});
  document.querySelectorAll('[data-room-expiry-reset]').forEach((btn)=>btn.addEventListener('click',async()=>{
    await resetRoomExpiryTo60s();
  }));

  document.getElementById('restart-btn')?.addEventListener('click',()=>{
    openGameExitConfirm('restart',document.getElementById('restart-btn'));
  });

  document.getElementById('game-exit-confirm-cancel')?.addEventListener('click',closeGameExitConfirm);
  document.getElementById('game-exit-confirm-backdrop')?.addEventListener('click',closeGameExitConfirm);
  document.getElementById('game-exit-confirm-continue')?.addEventListener('click',()=>{
    void confirmGameExit();
  });

  const handleResultAgain=async()=>{
    triggerClickBanner(document.getElementById('result-again'));
    await waitMs(120);
    state.opponentProfileName='';
    state.recommendation=null;
    setRecommendHint('');
    if(state.home.mode==='room'){
      if(roomResultExpired(state.room.data)){
        setSoloStatus(t('roomHostSneakAway'));
        render();
        return;
      }
      if(roomIsHost()){
        await restartRoomGame();
      }else{
        setSoloStatus(t('roomWaitingHost'));
        render();
      }
      return;
    }
    await startSoloGame();
    schedulePopunderAfterRender(350);
  };
  bindResultActionButton('result-again','result-again',handleResultAgain,guardAction,armPopunderForGesture);

  const handleCongratsAgain=async()=>{
    triggerClickBanner(document.getElementById('congrats-again'));
    await waitMs(120);
    state.opponentProfileName='';
    state.recommendation=null;
    setRecommendHint('');
    if(state.home.mode==='room'){
      if(roomResultExpired(state.room.data)){
        setSoloStatus(t('roomHostSneakAway'));
        render();
        return;
      }
      if(roomIsHost()){
        await restartRoomGame();
      }else{
        setSoloStatus(t('roomWaitingHost'));
        render();
      }
      return;
    }
    await startSoloGame();
    schedulePopunderAfterRender(350);
  };
  bindResultActionButton('congrats-again','congrats-again',handleCongratsAgain,guardAction,armPopunderForGesture);
}

function bindActionControls({
  app,
  v,
  state,
  canAutoSort,
  autoSortState,
  autoArrangeCurrent,
  render,
  setRecommendHint,
  t,
  playSound,
  shouldRecommendPass,
  suggestPlay,
  cardId,
  setRoomError,
  openEmotePicker,
  triggerEmoteSticker,
  unlockAudio,
  closeLangMenu,
  runPass,
  runPlay
}){
  document.getElementById('auto-sort-btn')?.addEventListener('click',()=>{
    if(!canAutoSort)return;
    const mode=autoSortState.mode;
    autoArrangeCurrent(v,mode);
    autoSortState.mode=mode==='number'?'suit':'number';
    render();
  });
  document.getElementById('suggest-btn')?.addEventListener('click',()=>{
    if(!v.canControl)return;
    if(state.recommendation){
      if(state.recommendation.action==='pass'){
        setRecommendHint('');
        setRecommendHint(t('recPass'));
        playSound('select');
        render();
        return;
      }
      state.recommendation=null;
      state.selected.clear();
      setRecommendHint('');
      render();
      return;
    }
    if(shouldRecommendPass(v.hand,v.lastPlay,v.isFirstTrick,v.canPass,state.solo)){
      state.recommendation={action:'pass',cardIds:[]};
      state.selected.clear();
      setRecommendHint(t('recPass'));
      playSound('select');
      render();
      return;
    }
    const rec=suggestPlay(v.hand,v.lastPlay,v.isFirstTrick,state.solo);
    if(!rec){
      setRecommendHint(t('noSuggest'));
      render();
      return;
    }
    const ids=rec.cards.map(cardId);
    state.recommendation={action:'play',cardIds:ids};
    state.selected=new Set(ids);
    playSound('select');
    render();
  },()=>{
    setRoomError(t('roomReconnecting'));
    render();
  });
  document.getElementById('emote-toggle')?.addEventListener('click',()=>{
    if(v.gameOver)return;
    openEmotePicker(!state.emote.open);
  });
  document.getElementById('bell-toggle')?.addEventListener('click',()=>{
    if(v.gameOver)return;
    globalThis.serviceBellTrigger?.();
  });
  app.querySelectorAll('[data-emote-id]').forEach((el)=>{
    const id=el.getAttribute('data-emote-id');
    if(!id)return;
    el.addEventListener('click',()=>{
      if(v.gameOver)return;
      triggerEmoteSticker(id);
    });
  });
  document.getElementById('pass-btn')?.addEventListener('click',()=>{unlockAudio();runPass();});
  document.getElementById('play-btn')?.addEventListener('click',()=>{closeLangMenu();unlockAudio();const cards=v.hand.filter((c)=>state.selected.has(cardId(c)));void runPlay(cards);});
}

export function createGameEventsBinder({
  state,
  app,
  bindLangMenu,
  closeLangMenu,
  clearAiTimer,
  refreshLeaderboard,
  render,
  handleGameTopbarClick,
  leaveRoom,
  resetSoloSessionCarryover,
  setRecommendHint,
  resetRoomExpiryTo60s,
  waitMs,
  guardAction,
  armPopunderForGesture,
  schedulePopunderAfterRender,
  startSoloGame,
  roomResultExpired,
  t,
  roomIsHost,
  restartRoomGame,
  isPortraitMode,
  openEmotePicker,
  triggerEmoteSticker,
  unlockAudio,
  playSound,
  roomSubmitPass,
  soloPass,
  maybeRunSoloAi,
  evaluatePlay,
  has3d,
  canBeat,
  roomSubmitPlay,
  setRoomError,
  setSoloStatus,
  soloApplyPlay,
  shouldRecommendPass,
  suggestPlay,
  cardId,
  reorderCurrent,
  isMobilePointer,
  autoArrangeCurrent,
  dismissCoachMarks=()=>{}
}){
  let topbarDelegateBound=false;
  let opponentProfileDelegateBound=false;
  let logSheetSwipeBound=false;
  let logSwipeActive=false;
  let logSwipeStartX=0;
  let logSwipeStartY=0;
  let logSwipeStartAt=0;
  let lastNamecardTapAt=0;
  let mobileTapAt=0;
  let autoSortMode='number';

  return function bindGameEvents(v){
    const canReorder=!isMobilePointer()&&!v.gameOver&&v.hand.length>0;
    const canAutoSort=!v.gameOver&&v.hand.length>0;
    const dragEnabled=canReorder&&!isMobilePointer();
    const dragPopupController=createDragPopupController();
    const runPass=()=>{
      if(!v.canPass)return;
      state.recommendation=null;
      setRecommendHint('');
      if(v.mode==='room'){
        state.selected.clear();
        render();
        void roomSubmitPass();
      }else{
        soloPass(0);
        state.selected.clear();
        render();
        maybeRunSoloAi();
      }
    };
    const runPlay=async(cards)=>{
      if(!v.canControl)return;
      setRecommendHint('');
      if(!cards.length){
        if(v.mode==='solo'){setSoloStatus(t('pick'));render();}
        return;
      }
      state.recommendation=null;
      if(v.mode==='room'){
        const ev=evaluatePlay(cards);
        if(!ev.valid){
          setSoloStatus(ev.reason||t('illegal'));
          render();
          return;
        }
        if(v.isFirstTrick&&!has3d(cards)){
          setSoloStatus(t('must3'));
          render();
          return;
        }
        if(v.lastPlay&&!canBeat(ev,v.lastPlay.eval)){
          setSoloStatus(t('beat'));
          render();
          return;
        }
        const ok=await roomSubmitPlay(cards);
        if(ok){
          state.selected.clear();
          render();
        }
      }else{
        const ok=soloApplyPlay(0,cards);
        if(ok){
          state.selected.clear();
          render();
          maybeRunSoloAi();
        }else render();
      }
    };
    const triggerClickBanner=(el)=>{
      if(!(el instanceof HTMLElement))return;
      el.classList.remove('click-banner');
      void el.offsetWidth;
      el.classList.add('click-banner');
      setTimeout(()=>{el.classList.remove('click-banner');},520);
    };

    bindLangMenu(document.querySelector('.topbar-right'),{reloadGoogle:!state.home.google?.signedIn});
    document.getElementById('intro-close')?.addEventListener('click',()=>{state.home.showIntro=false;render();});
    document.getElementById('intro-backdrop')?.addEventListener('click',()=>{state.home.showIntro=false;render();});
    document.getElementById('lb-close')?.addEventListener('click',()=>{state.home.showLeaderboard=false;render();});
    document.getElementById('lb-backdrop')?.addEventListener('click',()=>{state.home.showLeaderboard=false;render();});
    document.getElementById('lb-sort')?.addEventListener('change',(e)=>{state.home.leaderboard.sort=e.target.value;refreshLeaderboard();render();});
    document.getElementById('lb-period')?.addEventListener('change',(e)=>{state.home.leaderboard.period=e.target.value;refreshLeaderboard();render();});
    if(!topbarDelegateBound){
      document.body.addEventListener('click',handleGameTopbarClick,true);
      topbarDelegateBound=true;
    }
    if(!opponentProfileDelegateBound){
      document.body.addEventListener('click',(e)=>{
        const btn=e.target.closest?.('#opponent-profile-close,#opponent-profile-backdrop');
        if(!btn)return;
        e.preventDefault();
        state.opponentProfileName='';
        render();
      });
      opponentProfileDelegateBound=true;
    }
    document.getElementById('log-sheet-close')?.addEventListener('click',()=>{state.showLogSheet=false;render();});
    document.getElementById('log-sheet-backdrop')?.addEventListener('click',()=>{state.showLogSheet=false;render();});
    bindLogFab({state});
    bindLogSheetSwipe({
      state,
      render,
      isMobilePointer,
      swipeState:{
        get bound(){return logSheetSwipeBound;},
        set bound(value){logSheetSwipeBound=value;},
        get active(){return logSwipeActive;},
        set active(value){logSwipeActive=value;},
        get startX(){return logSwipeStartX;},
        set startX(value){logSwipeStartX=value;},
        get startY(){return logSwipeStartY;},
        set startY(value){logSwipeStartY=value;},
        get startAt(){return logSwipeStartAt;},
        set startAt(value){logSwipeStartAt=value;}
      }
    });
    document.getElementById('score-guide-close')?.addEventListener('click',()=>{state.showScoreGuide=false;render();});
    document.getElementById('score-guide-backdrop')?.addEventListener('click',()=>{state.showScoreGuide=false;render();});
    document.getElementById('coach-marks-toggle')?.addEventListener('click',()=>{
      window.__big2OpenCoachMarks?.();
    });
    document.getElementById('coach-marks-close')?.addEventListener('click',()=>{
      dismissCoachMarks();
      render();
    });
    document.getElementById('coach-marks-backdrop')?.addEventListener('click',()=>{
      dismissCoachMarks();
      render();
    });
    bindHomeAndResultActions({
      state,
      closeLangMenu,
      clearAiTimer,
      leaveRoom,
      resetSoloSessionCarryover,
      setRecommendHint,
      render,
      resetRoomExpiryTo60s,
      waitMs,
      triggerClickBanner,
      startSoloGame,
      armPopunderForGesture,
      schedulePopunderAfterRender,
      roomResultExpired,
      t,
      roomIsHost,
      restartRoomGame,
      setSoloStatus,
      guardAction
    });
    bindControlRowLabels({app,t,isPortraitMode,autoSortMode});
    bindActionControls({
      app,
      v,
      state,
      canAutoSort,
      autoSortState:{get mode(){return autoSortMode;},set mode(value){autoSortMode=value;}},
      autoArrangeCurrent,
      render,
      setRecommendHint,
      t,
      playSound,
      shouldRecommendPass,
      suggestPlay,
      cardId,
      setRoomError,
      openEmotePicker,
      triggerEmoteSticker,
      unlockAudio,
      closeLangMenu,
      runPass,
      runPlay
    });
    bindCardInteractions({
      app,
      v,
      state,
      dragEnabled,
      isMobilePointer,
      unlockAudio,
      playSound,
      render,
      reorderCurrent,
      dragPopupController,
      mobileTapState:{get lastTapAt(){return mobileTapAt;},set lastTapAt(value){mobileTapAt=value;}}
    });

    document.querySelectorAll('.locked-btn').forEach((wrap)=>{
      wrap.addEventListener('click',(ev)=>{
        ev.preventDefault();
        ev.stopPropagation();
        wrap.classList.add('show-tip');
        const timer=wrap.getAttribute('data-tip-timer');
        if(timer)window.clearTimeout(Number(timer));
        const tipTimer=window.setTimeout(()=>{wrap.classList.remove('show-tip');},1600);
        wrap.setAttribute('data-tip-timer',String(tipTimer));
      });
    });

    bindOpponentProfileInteractions({
      app,
      state,
      render,
      tapState:{
        get lastNamecardTapAt(){return lastNamecardTapAt;},
        set lastNamecardTapAt(value){lastNamecardTapAt=value;}
      }
    });

  };
}
