import test from 'node:test';
import assert from 'node:assert/strict';

import {renderCenterLastMoves, renderGameActionZone, renderGameControlRowHtml, renderGameExitConfirmHtml, renderGameLogSheet, renderGameSelfTagHtml, renderGameShell, renderGameSideZone, renderGameTable, renderGameTopbar, renderOpponentLabel, renderOpponentSeat, renderOpponentSeats, renderOpponentStationFlow, renderSeatLastAction} from '../src/gameView.js';

test('renderGameTopbar includes the game controls', ()=>{
  const html=renderGameTopbar({
    renderLangMenu:()=>'<div id="lang"></div>',
    introButtonLabel:'Guide',
    roomMode:true,
    t:(key)=>key,
    esc:(value)=>String(value),
    withBase:(path)=>`/base/${path}`
  });
  assert.match(html,/title-lockup-game\.png/);
  assert.match(html,/id="game-intro-toggle"/);
  assert.match(html,/id="restart-btn"/);
  assert.match(html,/id="home-btn" class="secondary" aria-label="roomLeave"/);
  assert.match(html,/roomLeave/);
  assert.doesNotMatch(html,/data-tooltip="Going home or restarting will leave the room\."/);
});

test('renderGameSideZone renders outside mobile portrait mode', ()=>{
  const html=renderGameSideZone({
    portraitMode:true,
    logToggleStateText:'Log',
    historyHtml:'<div></div>',
    t:(key)=>key,
    esc:(value)=>String(value)
  });
  assert.match(html,/side-zone/);
  assert.match(html,/log-side-card/);
});

test('renderGameSideZone hides in mobile portrait mode', ()=>{
  const originalWindow=globalThis.window;
  globalThis.window={innerWidth:390,matchMedia:()=>({matches:true})};
  try{
    assert.equal(renderGameSideZone({
      portraitMode:true,
      logToggleStateText:'Log',
      historyHtml:'<div></div>',
      t:(key)=>key,
      esc:(value)=>String(value)
    }),'');
  }finally{
    if(originalWindow===undefined)delete globalThis.window;
    else globalThis.window=originalWindow;
  }
});

test('renderGameLogSheet renders history when open', ()=>{
  const html=renderGameLogSheet({
    logSheetOpen:true,
    closeLabel:'Close',
    historyHtml:'<div id="history"></div>',
    t:(key)=>key
  });
  assert.match(html,/id="log-sheet"/);
  assert.match(html,/id="history"/);
});

test('renderGameActionZone renders controls, hand, and drag popup', ()=>{
  const html=renderGameActionZone({
    canControl:true,
    gameOver:false,
    playerColor:'#123456',
    selfAvatar:'<img id="avatar"/>',
    selfName:'Player',
    selfScore:'5000',
    selfRoundWinsHtml:'<span id="wins"></span>',
    selfCalloutHtml:'<span id="callout"></span>',
    isRecPlay:true,
    canPlay:true,
    isRecPass:false,
    canPass:true,
    canSuggest:true,
    showRecommendHint:true,
    isRecEmpty:false,
    recommendHint:'Hint',
    t:(key)=>key,
    esc:(value)=>String(value),
    canAutoSort:true,
    emotePanel:'<div id="emote-panel"></div>',
    handHtml:'<button class="card"></button>'
  });
  assert.match(html,/id="play-btn"/);
  assert.match(html,/id="play-btn" class="primary game-cta-btn recommend-glow-play"/);
  assert.match(html,/id="suggest-btn"/);
  assert.match(html,/recommend-glow-play/);
  assert.match(html,/id="bell-toggle"/);
  assert.match(html,/ui-icon-bell/);
  assert.match(html,/aria-label="serviceBellTooltip"/);
  assert.match(html,/action-zone seat-callout-active/);
  assert.match(html,/action-strip active seat-callout-active/);
  assert.match(html,/id="auto-sort-btn"/);
  assert.match(html,/id="drag-popup"/);
});

test('renderGameSelfTagHtml renders the self tag block', ()=>{
  const html=renderGameSelfTagHtml({
    selfAvatar:'<img id="avatar"/>',
    selfName:'Player',
    selfScore:'5000',
    selfRoundWinsHtml:'<span id="wins"></span>',
    selfCalloutHtml:'<span id="callout"></span>',
    esc:(value)=>String(value)
  });
  assert.match(html,/player-tag/);
  assert.match(html,/id="avatar"/);
  assert.match(html,/id="wins"/);
  assert.match(html,/id="callout"/);
});

test('renderGameControlRowHtml renders the action controls and hand', ()=>{
  const html=renderGameControlRowHtml({
    isRecPlay:true,
    canPlay:true,
    isRecPass:false,
    canPass:true,
    canSuggest:true,
    showRecommendHint:true,
    isRecEmpty:false,
    recommendHint:'Hint',
    t:(key)=>key,
    esc:(value)=>String(value),
    canAutoSort:true,
    emotePanel:'<div id="emote-panel"></div>',
    handHtml:'<button class="card"></button>'
  });
  assert.match(html,/id="play-btn"/);
  assert.match(html,/id="play-btn" class="primary game-cta-btn recommend-glow-play"/);
  assert.match(html,/id="suggest-btn"/);
  assert.match(html,/recommend-glow-play/);
  assert.match(html,/id="bell-toggle"/);
  assert.match(html,/ui-icon-bell/);
  assert.match(html,/aria-label="serviceBellTooltip"/);
  assert.match(html,/id="auto-sort-btn"/);
  assert.match(html,/aria-label="sortByNumberTooltip"/);
  assert.match(html,/data-tooltip="sortByNumberTooltip"/);
  assert.match(html,/id="drag-popup"/);
  assert.match(html,/id="emote-panel"/);
});

test('renderGameControlRowHtml shows suit sort tooltip in suit mode', ()=>{
  const html=renderGameControlRowHtml({
    isRecPlay:false,
    canPlay:true,
    isRecPass:false,
    canPass:true,
    canSuggest:true,
    showRecommendHint:false,
    isRecEmpty:false,
    recommendHint:'Hint',
    t:(key)=>key,
    esc:(value)=>String(value),
    canAutoSort:true,
    autoSortMode:'suit',
    emotePanel:'<div id="emote-panel"></div>',
    handHtml:'<button class="card"></button>'
  });
  assert.match(html,/aria-label="sortBySuitTooltip"/);
  assert.match(html,/data-tooltip="sortBySuitTooltip"/);
});

test('renderGameControlRowHtml adds pass glow when pass is recommended', ()=>{
  const html=renderGameControlRowHtml({
    isRecPlay:false,
    canPlay:true,
    isRecPass:true,
    canPass:true,
    canSuggest:true,
    showRecommendHint:false,
    isRecEmpty:false,
    recommendHint:'Hint',
    t:(key)=>key,
    esc:(value)=>String(value),
    canAutoSort:true,
    emotePanel:'<div id="emote-panel"></div>',
    handHtml:'<button class="card"></button>'
  });
  assert.match(html,/id="pass-btn" class="danger game-cta-btn recommend-glow"/);
  assert.doesNotMatch(html,/recommend-glow-play/);
});

test('renderGameTable renders center stack and win celebration', ()=>{
  const html=renderGameTable({
    roomTopMetaTable:'<div id="meta"></div>',
    seatHtml:'<div id="seats"></div>',
    mobileNamesHtml:'<div id="mobile-names"></div>',
    mobileDiscardHtml:'<div id="mobile-discard"></div>',
    centerMovesHtml:'<div id="center-moves"></div>',
    centerLastMovesHtml:'<div id="center-last"></div>',
    showWinCelebrate:true,
    t:(key)=>key
  });
  assert.match(html,/id="meta"/);
  assert.match(html,/table-center-stack/);
  assert.match(html,/id="center-last"/);
  assert.match(html,/win-celebrate/);
});

test('renderOpponentSeat and renderOpponentSeats wrap seat markup', ()=>{
  const seat=renderOpponentSeat({
    cls:'west',
    active:true,
    seatAttrs:' data-seat-emote-active="1"',
    shellStyle:'--player-color:#123;',
    outerLabelHtml:'<div id="label"></div>',
    sectionStyle:'display:grid;',
    sideStationFlowHtml:'<div id="flow"></div>',
    openPlayHtml:'<div id="open"></div>'
  });
  const html=renderOpponentSeats([seat]);
  assert.match(html,/class="seat west active"/);
  assert.match(html,/data-seat-emote-active="1"/);
  assert.match(html,/id="flow"/);
  assert.match(html,/id="open"/);
});

test('renderOpponentLabel includes badge, callout, and optional motto', ()=>{
  const html=renderOpponentLabel({
    pColor:'#123456',
    avatarSrc:'/avatar.png',
    playerAvatarClass:'avatar-female',
    playerName:'Luna',
    botNameAttr:' data-bot-name="Luna"',
    hostBadgeHtml:'<span id="host"></span>',
    badgeHtml:'<span id="badge"></span>',
    playerScore:5198,
    roundWinsHtml:'<span id="wins"></span>',
    namecardBtn:'<button id="namecard"></button>',
    mottoText:'Stay cool',
    mottoClass:'hk-power-motto motto-en',
    hintText:'',
    mottoTilt:'2deg',
    calloutHtml:'<div id="callout"></div>',
    emoteHtml:'<div id="emote"></div>',
    peekActive:true,
    opponentAttr:' data-opponent-name="Luna"',
    esc:(value)=>String(value)
  });
  assert.match(html,/seat-name-fixed motto-peek/);
  assert.match(html,/data-opponent-name="Luna"/);
  assert.match(html,/id="namecard"/);
  assert.match(html,/seat-motto-callout/);
  assert.match(html,/id="callout"/);
});

test('renderOpponentStationFlow switches side stack markup based on seat mode', ()=>{
  const sideHtml=renderOpponentStationFlow({
    useFlowOpponentStation:true,
    isSideSeat:true,
    innerLabelHtml:'<div id="label"></div>',
    fan:'<div id="fan"></div>',
    fanClassName:'fan-west',
    fanAnchorStyle:'justify-self:center;',
    closedPileCount:5,
    closedCountHtml:'<span id="count"></span>'
  });
  const northHtml=renderOpponentStationFlow({
    useFlowOpponentStation:true,
    isSideSeat:false,
    innerLabelHtml:'<div id="label"></div>',
    fan:'<div id="fan"></div>',
    fanClassName:'fan-north',
    fanAnchorStyle:'',
    closedCountHtml:''
  });
  assert.match(sideHtml,/side-station-stack/);
  assert.match(sideHtml,/side-station-core/);
  assert.match(sideHtml,/closed-card-pile/);
  assert.match(sideHtml,/--closed-pile-count:5/);
  assert.ok(sideHtml.indexOf('side-station-core')<sideHtml.indexOf('opponent-fan-wrap'));
  assert.match(sideHtml,/side-station-core"><div id="label"><\/div><div class="opponent-fan-wrap"/);
  assert.match(sideHtml,/closed-card-pile" style="--closed-pile-count:5;"><div class="opponent-fan fan-west" style="justify-self:center;"><div id="fan"><\/div><\/div><span id="count"><\/span><\/div>/);
  assert.match(sideHtml,/id="count"/);
  assert.match(sideHtml,/fan-west/);
  assert.doesNotMatch(northHtml,/side-station-stack/);
  assert.match(northHtml,/fan-north/);
});

test('renderGameShell assembles the main sections and overlays', ()=>{
  const html=renderGameShell({
    gameOver:false,
    showLog:true,
    gameTopbarHtml:'<header id="topbar"></header>',
    gameTableHtml:'<section id="table"></section>',
    gameActionZoneHtml:'<section id="action"></section>',
    selfTableEmoteHtml:'<div id="self-emote"></div>',
    congratsOverlayHtml:'<div id="congrats"></div>',
    revealHtml:'<div id="reveal"></div>',
    sideZoneHtml:'<aside id="side"></aside>',
    resultScreenHtml:'',
    opponentProfileModalHtml:'<div id="profile"></div>',
    scoreGuideModalHtml:'<div id="score-guide"></div>',
    introPanelHtml:'<div id="intro"></div>',
    leaderboardModalHtml:'<div id="lb"></div>',
    gameExitConfirmHtml:'<div id="exit-confirm"></div>'
  });
  assert.match(html,/class="game-shell {2}log-open"/);
  assert.match(html,/id="topbar"/);
  assert.match(html,/id="side"/);
  assert.match(html,/class="game-foreground-layer"/);
  assert.match(html,/id="lb"/);
  assert.match(html,/id="exit-confirm"/);
});

test('renderGameExitConfirmHtml renders the in-game confirmation panel', ()=>{
  const html=renderGameExitConfirmHtml({
    action:'restart',
    anchor:{left:123,top:45},
    t:(key)=>{
      const map={
        gameExitConfirmTitle:'Leave the game?',
        gameExitConfirmPrompt:'The current game records will be cleared. Continue?',
        close:'Close',
        restart:'Restart'
      };
      return map[key]??key;
    },
    esc:(value)=>String(value)
  });
  assert.match(html,/game-confirm-screen/);
  assert.match(html,/game-confirm-popover/);
  assert.match(html,/style="left:123px;top:45px"/);
  assert.match(html,/Leave the game\?/);
  assert.match(html,/The current game records will be cleared/);
  assert.match(html,/game-exit-confirm-continue/);
  assert.match(html,/Restart/);
});

test('renderSeatLastAction renders pass and fanned card layouts', ()=>{
  const passHtml=renderSeatLastAction({type:'pass'},{
    t:(key)=>key,
    renderStaticCard:()=> '',
    fanNoise:()=> 0.5,
    cardId:(card)=>card.id
  });
  const fanHtml=renderSeatLastAction({type:'play',seat:1,ts:5,cards:[{id:'a'},{id:'b'},{id:'c'}]},{
    t:(key)=>key,
    renderStaticCard:(card,faceUp,cls,style)=>`<span data-style="${style}">${card.id}</span>`,
    fanNoise:()=> 0.5,
    cardId:(card)=>card.id,
    sizeMultiplier:1
  });
  assert.match(passHtml,/seat-played-pass/);
  assert.match(passHtml,/seat-pass-text/);
  assert.match(fanHtml,/seat-played-fan/);
  assert.match(fanHtml,/translateY/);
});

test('renderCenterLastMoves renders only the south center slot', ()=>{
  const html=renderCenterLastMoves(new Map([[0,{type:'pass'}]]),0,{
    seatCls:['south','west','north','east'],
    renderSeatLastAction:(action,size)=>`<div data-size="${size}">${action.type}</div>`,
    tablePlayScale:1
  });
  assert.match(html,/center-last-south/);
  assert.match(html,/data-size="1"/);
  assert.match(html,/>pass</);
});
