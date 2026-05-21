export function renderGameTopbar(params){
  const {
    renderLangMenu,
    introButtonLabel,
    coachMarksButtonHtml='',
    roomMode=false,
    t,
    esc,
    withBase
  }=params;
  const homeButtonHtml=roomMode
    ?`<button id="home-btn" class="secondary" aria-label="${esc(t('roomLeave'))}">${esc(t('roomLeave'))}</button>`
    :`<button id="home-btn" class="secondary">${t('home')}</button>`;
  return`<header class="topbar"><div class="game-title-wrap"><span class="game-logo-block"><img class="title-logo title-logo-game" src="${withBase('title-lockup-game.png')}" alt="鋤大D TRADITIONAL BIG TWO"/></span></div><div class="topbar-right"><div class="control-row">${renderLangMenu('game-lang-menu')}<button id="game-intro-toggle" class="secondary">${esc(introButtonLabel)}</button>${coachMarksButtonHtml}<button id="score-guide-toggle" class="secondary">${t('scoreGuide')}</button><button id="game-lb-toggle" class="secondary">${t('lb')}</button>${homeButtonHtml}<button id="restart-btn" class="primary">${t('restart')}</button></div></div></header>`;
}

export function renderGameSideZone(params){
  const {
    portraitMode,
    logToggleStateText,
    logStatusHtml,
    historyHtml,
    t,
    esc
  }=params;
  const mobilePortraitMode=Boolean(portraitMode&&typeof window!=='undefined'&&(
    window.matchMedia?.('(max-width: 860px)')?.matches
    ??window.innerWidth<=860
  ));
  if(mobilePortraitMode)return'';
  const statusLine=logStatusHtml?`<div class="log-status log-status-inline"><span class="log-status-separator" aria-hidden="true">|</span><span class="log-status-copy"><span class="game-log-fab-status">${logStatusHtml}</span></span></div>`:'';
  return`<aside class="side-zone"><section class="side-card log-side-card"><h3 class="log-toggle-title title-with-icon" aria-label="${esc(logToggleStateText)}"><span class="title-icon title-icon-log" aria-hidden="true"></span><span class="log-toggle-text">${t('log')}</span>${statusLine}</h3><div class="history-list">${historyHtml}</div></section></aside>`;
}

export function renderGameLogSheet(params){
  const {
    logSheetOpen,
    closeLabel,
    historyHtml,
    t
  }=params;
  if(!logSheetOpen)return'';
  return`<div class="log-sheet" id="log-sheet"><button class="log-sheet-backdrop" id="log-sheet-backdrop" aria-label="${t('close')}"></button><section class="log-sheet-panel side-card log-side-card"><header class="log-sheet-head"><h3 class="log-toggle-title title-with-icon"><span class="title-icon title-icon-log" aria-hidden="true"></span><span class="log-toggle-text">${t('log')}</span></h3><button id="log-sheet-close" class="secondary">${closeLabel}</button></header><div class="history-list">${historyHtml}</div></section></div>`;
}

export function renderGameExitConfirmHtml({action='home',anchor=null,t,esc}){
  const continueLabel=action==='restart'?t('restart'):t('home');
  const left=Math.round(Number(anchor?.left)||0);
  const top=Math.round(Number(anchor?.top)||0);
  const styleParts=[
    Number.isFinite(left)?`left:${left}px`:'',
    Number.isFinite(top)?`top:${top}px`:''
  ].filter(Boolean).join(';');
  return `<div class="game-confirm-screen" id="game-exit-confirm-screen"><button class="game-confirm-backdrop" id="game-exit-confirm-backdrop" aria-label="${esc(t('close'))}"></button><section class="game-confirm-card game-confirm-popover"${styleParts?` style="${styleParts}"`:''}><h3 class="title-with-icon"><span class="title-icon title-icon-exit" aria-hidden="true"></span><span>${esc(t('gameExitConfirmTitle'))}</span></h3><p class="game-confirm-copy">${esc(t('gameExitConfirmPrompt'))}</p><div class="control-row game-confirm-actions"><button id="game-exit-confirm-cancel" class="secondary">${t('close')}</button><button id="game-exit-confirm-continue" class="primary">${esc(continueLabel)}</button></div></section></div>`;
}

export function renderGameSelfTagHtml(params){
  const {
    selfAvatar,
    selfName,
    selfScore,
    selfRoundWinsHtml,
    selfStarcardHtml='',
    selfTopTwoWarningHtml='',
    selfCalloutHtml,
    esc
  }=params;
  const selfBadgeLineHtml=(selfStarcardHtml||selfTopTwoWarningHtml)
    ?`<span class="seat-badge-line">${selfStarcardHtml?`<span class="seat-starcard-slot">${selfStarcardHtml}</span>`:''}${selfTopTwoWarningHtml}</span>`
    :'';
  return`<div class="seat-name-fixed player-tag"><div class="name">${selfAvatar}<span class="seat-identity"><span class="seat-name-text">${esc(selfName)}</span><span class="seat-subline"><span>${selfScore}</span>${selfRoundWinsHtml}</span>${selfBadgeLineHtml}</span></div>${selfCalloutHtml}</div>`;
}

export function renderGameControlRowHtml(params){
  const {
    isRecPlay,
    isRecPass,
    canPlay,
    canPass,
    canSuggest,
    showRecommendHint,
    isRecEmpty,
    recommendHint,
    t,
    esc,
    canAutoSort,
    autoSortMode='number',
    emotePanel,
    handHtml,
    discardSwipeHintHtml=''
  }=params;
  const suggestGlowClass=showRecommendHint?(isRecPlay?' recommend-glow-play':' recommend-glow'):'';
  const playGlowClass=isRecPlay?' recommend-glow-play':'';
  const passGlowClass=isRecPass?' recommend-glow':'';
  const sortLabel=autoSortMode==='suit'?t('sortBySuitTooltip'):t('sortByNumberTooltip');
  const recommendIcon='<svg class="ui-icon ui-icon-recommend" width="20" height="20" viewBox="0 0 24 24"><g transform="translate(0 1.2)"><path d="M12 2.7c-4 0-7.2 3.2-7.2 7.1 0 2.2.9 3.8 2.6 5.4 1 1 1.6 2.1 1.8 3.3h5.6c.2-1.2.8-2.3 1.8-3.3 1.7-1.6 2.6-3.2 2.6-5.4 0-3.9-3.2-7.1-7.2-7.1Z" fill="#ffd421" stroke="#2a0d2d" stroke-width="1.85" stroke-linejoin="round"/><path d="M12 5.1c3 .1 5.3 2.5 5.4 5.7" fill="none" stroke="#2a0d2d" stroke-width="1.35" stroke-linecap="round"/><rect x="8.3" y="18" width="7.4" height="2.5" rx=".85" fill="#f5f1e8" stroke="#2a0d2d" stroke-width="1.55"/><path d="M9.8 22h4.4" fill="none" stroke="#2a0d2d" stroke-width="1.8" stroke-linecap="round"/></g></svg>';
  return`<div class="control-row"><button id="play-btn" class="primary game-cta-btn${playGlowClass}" ${canPlay?'':'disabled'}><span aria-hidden="true">▶</span><span>${t('play')}</span></button><button id="pass-btn" class="danger game-cta-btn${passGlowClass}" ${canPass?'':'disabled'}><svg class="pass-icon" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg><span>${t('pass')}</span></button><span class="recommend-anchor"><button id="suggest-btn" class="secondary game-cta-btn${suggestGlowClass}" ${canSuggest?'':'disabled'}><span aria-hidden="true">${recommendIcon}</span><span>${t('suggest')}</span></button>${showRecommendHint?`<span class="recommend-layer"><span class="hint recommend-hint ${isRecEmpty?'rec-empty':''}"><span class="recommend-bulb" aria-hidden="true">💡</span><span>${esc(recommendHint)}</span></span></span>`:''}</span><button id="emote-toggle" class="secondary game-cta-btn emote-toggle" type="button" aria-label="${t('emoteTooltip')}" data-tooltip="${t('emoteTooltip')}"><span aria-hidden="true"><svg class="ui-icon ui-icon-emote" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#ffd84d" stroke="#111827" stroke-width="1.6"/><circle cx="9" cy="10" r="1.15" fill="#111827"/><circle cx="15" cy="10" r="1.15" fill="#111827"/><path d="M8.3 14.4c1.1 1.4 2.5 2.1 3.7 2.1s2.6-.7 3.7-2.1" fill="none" stroke="#111827" stroke-width="1.9" stroke-linecap="round"/><circle cx="7.4" cy="13.1" r="0.9" fill="#ff8ba7"/><circle cx="16.6" cy="13.1" r="0.9" fill="#ff8ba7"/></svg></span><span>${t('emote')}</span></button><button id="bell-toggle" class="secondary game-cta-btn game-icon-btn bell-toggle" type="button" aria-label="${t('serviceBellTooltip')}" data-tooltip="${t('serviceBellTooltip')}"><span aria-hidden="true"><svg class="ui-icon ui-icon-bell" width="21" height="21" viewBox="0 0 24 24"><g transform="translate(0 .1) scale(1.08)"><rect x="10.3" y="4.8" width="3.4" height="1.4" rx=".5" fill="#c8973b"/><path d="M6 16h12l-.7-1c-.4-.5-.6-1.1-.6-1.7 0-2.8-1.8-5-4.7-5s-4.7 2.2-4.7 5c0 .6-.2 1.2-.6 1.7l-.7 1Z" fill="#f3d28a"/><rect x="6" y="17" width="12" height="1.8" rx=".7" fill="#d7a85a"/></g></svg></span></button><button id="auto-sort-btn" class="secondary game-cta-btn auto-sort-btn" ${canAutoSort?'':'disabled'} aria-label="${esc(sortLabel)}" data-tooltip="${esc(sortLabel)}"><svg class="sort-icon" aria-hidden="true" viewBox="0 0 16 16"><path d="M3 4h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 8h5.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 12h3.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M11.5 3.5v8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M9.7 9.8l1.8 1.8 1.8-1.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>${emotePanel}${discardSwipeHintHtml?`<div class="hand-hint">${discardSwipeHintHtml}</div>`:''}<div class="hand">${handHtml}</div><div class="drag-popup" id="drag-popup">${t('drag')}</div>`;
}

export function renderGameActionZone(params){
  const {
    canControl,
    gameOver,
    playerColor,
    selfAvatar,
    selfName,
    selfScore,
    selfRoundWinsHtml,
    selfStarcardHtml,
    selfTopTwoWarningHtml,
    selfCalloutHtml,
    isRecPlay,
    canPlay,
    isRecPass,
    canPass,
    canSuggest,
    showRecommendHint,
    isRecEmpty,
    recommendHint,
    t,
    esc,
    canAutoSort,
    autoSortMode='number',
    emotePanel,
    handHtml,
    discardSwipeHintHtml=''
  }=params;
  const selfCalloutActive=Boolean(selfCalloutHtml);
  return`<section class="action-zone${selfCalloutActive?' seat-callout-active':''}"><div class="action-strip ${canControl&&!gameOver?'active':''}${selfCalloutActive?' seat-callout-active':''}" style="--player-color:${playerColor};">${renderGameSelfTagHtml({selfAvatar,selfName,selfScore,selfRoundWinsHtml,selfStarcardHtml,selfTopTwoWarningHtml,selfCalloutHtml,esc})}${renderGameControlRowHtml({isRecPlay,canPlay,isRecPass,canPass,canSuggest,showRecommendHint,isRecEmpty,recommendHint,t,esc,canAutoSort,autoSortMode,emotePanel,handHtml,discardSwipeHintHtml})}</div></section>`;
}

export function renderGameTable(params){
  const {
    roomTopMetaTable,
    seatHtml,
    mobileNamesHtml,
    mobileDiscardHtml,
    centerMovesHtml,
    centerLastMovesHtml,
    turnCompassHtml,
    inventoryDecorHtml='',
    coachMarksButtonHtml='',
    showWinCelebrate,
    t
  }=params;
  const coachMarksHtml=coachMarksButtonHtml;
  return`<section class="table">${roomTopMetaTable}${seatHtml}${coachMarksHtml}<div class="table-center-stack">${mobileNamesHtml}${mobileDiscardHtml}${centerMovesHtml}</div><div class="table-south-play-layer">${centerLastMovesHtml}</div>${turnCompassHtml??''}${inventoryDecorHtml}${showWinCelebrate?`<div class="win-celebrate"><div class="confetti-layer"></div><div class="win-banner">${t('congrats')}</div></div>`:''}</section>`;
}

export function renderSeatLastAction(action,{
  t,
  renderStaticCard,
  fanNoise,
  cardId,
  sizeMultiplier=1
}){
  if(!action)return'';
  if(action.type==='pass')return`<div class="seat-played seat-played-pass"><span class="seat-pass-label"><span class="seat-pass-icon" aria-hidden="true"></span><span class="seat-pass-text">${t('pass')}</span></span></div>`;
  const ts=Number(action.ts)||0;
  const list=action.cards??[];
  const isPair=list.length===2;
  const isFan=list.length===3||list.length===5;
  const isFive=list.length===5;
  const scale=Math.max(0.1,Number(sizeMultiplier)||1);
  const sizeStyle=`width:calc(var(--discard-card-w, calc(var(--card-w) * var(--hand-card-scale) * var(--card-scale))) * ${scale}) !important;height:calc(var(--discard-card-h, calc(var(--card-h) * var(--hand-card-scale) * var(--card-scale))) * ${scale}) !important;`;
  const cards=list.map((card,index)=>{
    if(isFan){
      const mid=(list.length-1)/2;
      const offset=index-mid;
      const rot=offset*8;
      const lift=Math.abs(offset)*3.2;
      return renderStaticCard(card,true,'discard-card',`${sizeStyle}transform:rotate(${rot.toFixed(2)}deg) translateY(${lift.toFixed(2)}px);`);
    }
    const rot=((fanNoise(`${action.seat}|${ts}|${cardId(card)}`,index,'played')*2)-1)*8.84;
    return renderStaticCard(card,true,'discard-card',`${sizeStyle}transform:rotate(${rot.toFixed(2)}deg);`);
  }).join('');
  return`<div class="seat-played${isPair?' seat-played-pair':''}${isFan?' seat-played-fan':''}${isFive?' seat-played-five':''}">${cards}</div>`;
}

export function renderCenterLastMoves(lastActions,selfSeat,{
  seatCls,
  renderSeatLastAction,
  tablePlayScale=1
}){
  const slots=['north','west','east','south'];
  return slots.map((cls)=>{
    if(cls!=='south')return'';
    const seat=(selfSeat+seatCls.indexOf(cls))%4;
    const action=lastActions.get(seat);
    if(!action)return'';
    return`<div class="center-last center-last-${cls}">${renderSeatLastAction(action,tablePlayScale)}</div>`;
  }).join('');
}

export function renderOpponentSeat(params){
  const {
    cls,
    active,
    seatAttrs,
    shellStyle,
    outerLabelHtml,
    sectionStyle,
    calloutActive=false,
    sideStationFlowHtml,
    openPlayHtml=''
  }=params;
  return`<div class="seat ${cls} ${active?'active':''}${calloutActive?' seat-callout-active':''}"${seatAttrs} style="${shellStyle}">${outerLabelHtml}<div class="seat-pack seat-section${calloutActive?' seat-callout-active':''}" style="${sectionStyle}">${sideStationFlowHtml}${openPlayHtml}</div></div>`;
}

export {renderOpponentLabel} from './opponentLabel.js';

export function renderOpponentStationFlow(params){
  const {
    useFlowOpponentStation,
    isSideSeat,
    innerLabelHtml,
    fan,
    fanClassName,
    fanAnchorStyle,
    closedPileCount=1,
    closedCountHtml,
    opponentOpenPlayHtml,
    calloutActive=false
  }=params;
  const pileCount=Math.min(5,Math.max(1,Number(closedPileCount)||1));
  const closedPileHtml=`<div class="closed-card-pile" style="--closed-pile-count:${pileCount};"><div class="opponent-fan ${fanClassName}" style="${fanAnchorStyle}">${fan}</div>${closedCountHtml}</div>`;
  if(useFlowOpponentStation&&isSideSeat){
    return`<div class="side-station-stack${calloutActive?' seat-callout-active':''}"><div class="side-station-core${calloutActive?' seat-callout-active':''}">${innerLabelHtml}<div class="opponent-fan-wrap">${closedPileHtml}</div></div>${opponentOpenPlayHtml}</div>`;
  }
  return`${innerLabelHtml}<div class="opponent-fan-wrap">${closedPileHtml}</div>${opponentOpenPlayHtml}`;
}

export function renderOpponentSeats(seats){
  return seats.join('');
}

export function renderGameShell(params){
  const {
    gameOver,
    showLog,
    gameTopbarHtml,
    gameTableHtml,
    gameActionZoneHtml,
    selfTableEmoteHtml,
    congratsOverlayHtml,
    revealHtml,
    sideZoneHtml,
    resultScreenHtml,
    opponentProfileModalHtml,
    scoreGuideModalHtml,
    introPanelHtml,
    leaderboardModalHtml,
    coachMarksHtml,
    gameExitConfirmHtml=''
  }=params;
  return`<section class="game-shell ${gameOver?'game-over':''} ${showLog?'log-open':''}"><div class="main-zone">${gameTopbarHtml}${gameTableHtml}${gameActionZoneHtml}${selfTableEmoteHtml}${congratsOverlayHtml}${revealHtml}</div>${sideZoneHtml}<div class="game-foreground-layer" aria-hidden="true"></div>${resultScreenHtml}${opponentProfileModalHtml}${scoreGuideModalHtml}${introPanelHtml}${leaderboardModalHtml}${coachMarksHtml}${gameExitConfirmHtml}</section>`;
}
