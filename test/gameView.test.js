import test from 'node:test';
import assert from 'node:assert/strict';

import {renderGameActionZone, renderGameLogSheet, renderGameShell, renderGameSideZone, renderGameTable, renderGameTopbar, renderOpponentLabel, renderOpponentSeat, renderOpponentSeats, renderOpponentStationFlow} from '../src/gameView.js';

test('renderGameTopbar includes the game controls', ()=>{
  const html=renderGameTopbar({
    renderLangMenu:()=>'<div id="lang"></div>',
    introButtonLabel:'Guide',
    t:(key)=>key,
    esc:(value)=>String(value),
    withBase:(path)=>`/base/${path}`
  });
  assert.match(html,/title-lockup-game\.png/);
  assert.match(html,/id="game-intro-toggle"/);
  assert.match(html,/id="restart-btn"/);
});

test('renderGameSideZone hides in portrait mode', ()=>{
  assert.equal(renderGameSideZone({
    portraitMode:true,
    logToggleStateText:'Log',
    historyHtml:'<div></div>',
    t:(key)=>key,
    esc:(value)=>String(value)
  }),'');
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
  assert.match(html,/id="suggest-btn"/);
  assert.match(html,/id="auto-sort-btn"/);
  assert.match(html,/id="drag-popup"/);
  assert.match(html,/recommend-glow-play/);
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
    sideStationFlowHtml:'<div id="flow"></div>'
  });
  const html=renderOpponentSeats([seat]);
  assert.match(html,/class="seat west active"/);
  assert.match(html,/data-seat-emote-active="1"/);
  assert.match(html,/id="flow"/);
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
    closedCountHtml:'<span id="count"></span>',
    opponentOpenPlayHtml:'<div id="open"></div>'
  });
  const northHtml=renderOpponentStationFlow({
    useFlowOpponentStation:true,
    isSideSeat:false,
    innerLabelHtml:'<div id="label"></div>',
    fan:'<div id="fan"></div>',
    fanClassName:'fan-north',
    fanAnchorStyle:'',
    closedCountHtml:'',
    opponentOpenPlayHtml:''
  });
  assert.match(sideHtml,/side-station-stack/);
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
    leaderboardModalHtml:'<div id="lb"></div>'
  });
  assert.match(html,/class="game-shell {2}log-open"/);
  assert.match(html,/id="topbar"/);
  assert.match(html,/id="side"/);
  assert.match(html,/id="lb"/);
});
