export function renderGameTopbar(params){
  const {
    renderLangMenu,
    introButtonLabel,
    coachMarksButtonHtml='',
    roomExitHint='',
    t,
    esc,
    withBase
  }=params;
  const roomExitHintHtml=roomExitHint?`<div class="room-action-note hint">${esc(roomExitHint)}</div>`:'';
  return`<header class="topbar"><div class="game-title-wrap"><span class="game-logo-block"><img class="title-logo title-logo-game" src="${withBase('title-lockup-game.png')}" alt="鋤大D TRADITIONAL BIG TWO"/></span></div><div class="topbar-right"><div class="control-row">${renderLangMenu('game-lang-menu')}<button id="game-intro-toggle" class="secondary">${esc(introButtonLabel)}</button>${coachMarksButtonHtml}<button id="score-guide-toggle" class="secondary">${t('scoreGuide')}</button><button id="game-lb-toggle" class="secondary">${t('lb')}</button><button id="home-btn" class="secondary">${t('home')}</button><button id="restart-btn" class="primary">${t('restart')}</button></div>${roomExitHintHtml}</div></header>`;
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
  if(portraitMode)return'';
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

export function renderGameSelfTagHtml(params){
  const {
    selfAvatar,
    selfName,
    selfScore,
    selfRoundWinsHtml,
    selfCalloutHtml,
    esc
  }=params;
  return`<div class="seat-name-fixed player-tag"><div class="name">${selfAvatar}<span class="seat-identity"><span class="seat-name-text">${esc(selfName)}</span><span class="seat-subline"><span>${selfScore}</span>${selfRoundWinsHtml}</span></span></div>${selfCalloutHtml}</div>`;
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
    emotePanel,
    handHtml,
    discardSwipeHintHtml=''
  }=params;
  const suggestGlowClass=showRecommendHint?(isRecPlay?' recommend-glow-play':' recommend-glow'):'';
  const playGlowClass=isRecPlay?' recommend-glow-play':'';
  const passGlowClass=isRecPass?' recommend-glow':'';
  return`<div class="control-row"><button id="play-btn" class="primary game-cta-btn${playGlowClass}" ${canPlay?'':'disabled'}><span aria-hidden="true">▶</span><span>${t('play')}</span></button><button id="pass-btn" class="danger game-cta-btn${passGlowClass}" ${canPass?'':'disabled'}><svg class="pass-icon" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg><span>${t('pass')}</span></button><span class="recommend-anchor"><button id="suggest-btn" class="secondary game-cta-btn${suggestGlowClass}" ${canSuggest?'':'disabled'}><span aria-hidden="true">💡</span><span>${t('suggest')}</span></button>${showRecommendHint?`<span class="recommend-layer"><span class="hint recommend-hint ${isRecEmpty?'rec-empty':''}"><span class="recommend-bulb" aria-hidden="true">💡</span><span>${esc(recommendHint)}</span></span></span>`:''}</span><button id="emote-toggle" class="secondary game-cta-btn emote-toggle" type="button" aria-label="${t('emoteTooltip')}" data-tooltip="${t('emoteTooltip')}"><span aria-hidden="true">😆</span><span>${t('emote')}</span></button><button id="bell-toggle" class="secondary game-cta-btn game-icon-btn bell-toggle" type="button" aria-label="${t('serviceBellTooltip')}" data-tooltip="${t('serviceBellTooltip')}"><span aria-hidden="true">🛎️</span></button><button id="auto-sort-btn" class="secondary game-cta-btn auto-sort-btn" ${canAutoSort?'':'disabled'} aria-label="${t('sortTooltip')}" data-tooltip="${t('sortTooltip')}"><svg class="sort-icon" aria-hidden="true" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.430.636-.980 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.6 9.6 0 0 0 7.556 8a9.6 9.6 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.6 10.6 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.6 9.6 0 0 0 6.444 8a9.6 9.6 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5"/><path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.120.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192"/></svg></button></div>${emotePanel}${discardSwipeHintHtml?`<div class="hand-hint">${discardSwipeHintHtml}</div>`:''}<div class="hand">${handHtml}</div><div class="drag-popup" id="drag-popup">${t('drag')}</div>`;
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
    emotePanel,
    handHtml,
    discardSwipeHintHtml=''
  }=params;
  const selfCalloutActive=Boolean(selfCalloutHtml);
  return`<section class="action-zone${selfCalloutActive?' seat-callout-active':''}"><div class="action-strip ${canControl&&!gameOver?'active':''}${selfCalloutActive?' seat-callout-active':''}" style="--player-color:${playerColor};">${renderGameSelfTagHtml({selfAvatar,selfName,selfScore,selfRoundWinsHtml,selfCalloutHtml,esc})}${renderGameControlRowHtml({isRecPlay,canPlay,isRecPass,canPass,canSuggest,showRecommendHint,isRecEmpty,recommendHint,t,esc,canAutoSort,emotePanel,handHtml,discardSwipeHintHtml})}</div></section>`;
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
    coachMarksLabel='',
    showWinCelebrate,
    t
  }=params;
  const coachMarksHtml=coachMarksButtonHtml;
  return`<section class="table">${roomTopMetaTable}${seatHtml}${coachMarksHtml}<div class="table-center-stack">${mobileNamesHtml}${mobileDiscardHtml}${centerMovesHtml}${centerLastMovesHtml}</div>${turnCompassHtml??''}${inventoryDecorHtml}${showWinCelebrate?`<div class="win-celebrate"><div class="confetti-layer"></div><div class="win-banner">${t('congrats')}</div></div>`:''}</section>`;
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
    coachMarksHtml
  }=params;
  return`<section class="game-shell ${gameOver?'game-over':''} ${showLog?'log-open':''}"><div class="main-zone">${gameTopbarHtml}${gameTableHtml}${gameActionZoneHtml}${selfTableEmoteHtml}${congratsOverlayHtml}${revealHtml}</div>${sideZoneHtml}<div class="game-foreground-layer" aria-hidden="true"></div>${resultScreenHtml}${opponentProfileModalHtml}${scoreGuideModalHtml}${introPanelHtml}${leaderboardModalHtml}${coachMarksHtml}</section>`;
}
