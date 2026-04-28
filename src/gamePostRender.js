export function runGamePostRender(params){
  const {
    app,
    state,
    t,
    esc,
    v,
    arr,
    portraitMode,
    logFabStatusHtml='',
    logSheetOpen,
    logSheetHtml,
    bindGameEvents,
    positionRoomTopMeta,
    bindRoomTopMetaLayout,
    observeDiscardSize,
    syncConfettiCanvases,
    syncLandscapeGameHandSizing,
    syncDiscardSizeFromHand,
    syncHandStackMode,
    retargetCalloutTails,
    maybeRunRoomAi
  }=params;
  const appEl=app;
  if(appEl){
    const isMobilePortrait=portraitMode&&document.body.dataset.isMobile==='1';
    const isIOSMobilePortrait=isMobilePortrait&&document.body.dataset.ios==='1';
    const logFabHost=isIOSMobilePortrait
      ?document.body
      :(portraitMode?(appEl.querySelector('.action-strip')||appEl):appEl);
    let logFab=document.getElementById('game-log-fab');
    if(!logFab){
      const btn=document.createElement('button');
      btn.id='game-log-fab';
      btn.type='button';
      btn.className='game-log-fab';
      btn.setAttribute('aria-label',t('log'));
      btn.innerHTML=isIOSMobilePortrait
        ?`<span class="title-icon title-icon-log" aria-hidden="true"></span><span class="game-log-fab-copy"><span class="game-log-fab-text">${t('log')}</span></span>`
        :`<span class="title-icon title-icon-log" aria-hidden="true"></span><span class="game-log-fab-copy"><span class="game-log-fab-text">${t('log')}</span>${logFabStatusHtml?`<span class="game-log-fab-divider" aria-hidden="true"></span><span class="game-log-fab-status">${logFabStatusHtml}</span>`:''}</span>`;
      btn.setAttribute('data-ignore-click','0');
      logFabHost.appendChild(btn);
      logFab=btn;
    }else if(logFab.parentElement!==logFabHost){
      logFabHost.appendChild(logFab);
    }
    const statusNode=logFab.querySelector('.game-log-fab-status');
    if(isIOSMobilePortrait){
      statusNode?.remove();
      logFab.querySelector('.game-log-fab-divider')?.remove();
    }else if(logFabStatusHtml){
      if(statusNode)statusNode.innerHTML=logFabStatusHtml;
      else logFab.querySelector('.game-log-fab-copy')?.insertAdjacentHTML('beforeend',`<span class="game-log-fab-divider" aria-hidden="true"></span><span class="game-log-fab-status">${logFabStatusHtml}</span>`);
    }else{
      statusNode?.remove();
      logFab.querySelector('.game-log-fab-divider')?.remove();
    }
    const existingSheet=appEl.querySelector('#log-sheet');
    if(existingSheet)existingSheet.remove();
    if(logSheetOpen){
      appEl.insertAdjacentHTML('beforeend',logSheetHtml);
    }
    if(logFab instanceof HTMLElement){
      if(portraitMode){
        logFab.style.removeProperty('left');
        logFab.style.removeProperty('top');
        logFab.style.removeProperty('right');
        logFab.style.removeProperty('bottom');
      }else{
        let x=state.logFab?.x;
        let y=state.logFab?.y;
        const pad=8;
        const viewW=Math.max(0,window.innerWidth||0);
        const viewH=Math.max(0,window.innerHeight||0);
        const lastW=Number(state.logFab?.vw||0);
        const lastH=Number(state.logFab?.vh||0);
        if(Number.isFinite(x)&&Number.isFinite(y)&&lastW>0&&lastH>0&&(lastW!==viewW||lastH!==viewH)){
          x=(x/lastW)*viewW;
          y=(y/lastH)*viewH;
        }
        const fabW=Math.max(0,logFab.offsetWidth||0);
        const fabH=Math.max(0,logFab.offsetHeight||0);
        const maxX=Math.max(0,viewW-fabW-pad);
        const maxY=Math.max(0,viewH-fabH-pad);
        if(Number.isFinite(x)&&Number.isFinite(y)){
          const nx=Math.max(pad,Math.min(x,maxX));
          const ny=Math.max(pad,Math.min(y,maxY));
          state.logFab.x=nx;
          state.logFab.y=ny;
          state.logFab.vw=viewW;
          state.logFab.vh=viewH;
          logFab.style.left=`${nx}px`;
          logFab.style.top=`${ny}px`;
          logFab.style.right='auto';
          logFab.style.bottom='auto';
        }else{
          logFab.style.removeProperty('left');
          logFab.style.removeProperty('top');
          logFab.style.removeProperty('right');
          logFab.style.removeProperty('bottom');
        }
      }
    }
    const southTag=appEl.querySelector('.action-strip .player-tag');
    const tableHost=appEl.querySelector('.table');
    if(isMobilePortrait&&southTag instanceof HTMLElement&&tableHost instanceof HTMLElement&&southTag.parentElement!==tableHost){
      tableHost.appendChild(southTag);
    }
  }
  positionRoomTopMeta();
  bindRoomTopMetaLayout();
  observeDiscardSize();
  document.body.setAttribute('data-web-too-small','0');
  document.body.removeAttribute('data-web-too-small-msg');
  document.getElementById('web-too-small-overlay')?.remove();
  document.getElementById('tap-debug')?.remove();
  if(document.body.dataset.tapDebugBound){
    delete document.body.dataset.tapDebugBound;
  }
  document.getElementById('self-avatar-img')?.addEventListener('error',(e)=>{
    const img=e?.target;
    if(!(img instanceof HTMLImageElement))return;
    const fallback=String(img.dataset.fallback??'').trim();
    if(!fallback||img.src===fallback)return;
    img.src=fallback;
    img.classList.remove('player-avatar-google');
  },{once:true});
  syncConfettiCanvases();
  bindGameEvents(v,arr);
  requestAnimationFrame(()=>{
    positionRoomTopMeta();
    syncLandscapeGameHandSizing();
    syncDiscardSizeFromHand();
    syncHandStackMode();
    retargetCalloutTails();
    setTimeout(()=>{
      positionRoomTopMeta();
      retargetCalloutTails();
    },80);
  });
  if(v.mode==='room'&&!v.gameOver){
    maybeRunRoomAi();
  }
}
