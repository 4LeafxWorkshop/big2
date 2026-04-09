import test from 'node:test';
import assert from 'node:assert/strict';

import {buildCalloutRenderState, buildGameAuxRenderState, buildOpponentSeatsHtml, buildSelfRenderState} from '../src/gameRenderPrep.js';

test('buildSelfRenderState assembles self avatar and callout state', ()=>{
  const result=buildSelfRenderState({
    self:{name:'Player',gender:'female',count:1,seat:0},
    selfScoreValue:5120,
    state:{home:{gender:'male',google:{signedIn:true}}},
    t:(key)=>key,
    esc:(value)=>String(value),
    hostSeat:0,
    roundWinsBySeat:{0:2},
    v:{selfSeat:0,currentSeat:0,gameOver:false},
    AVATAR_BASE_SRC:{female:'/female.png',male:'/male.png'},
    authPictureUrl:()=>'/self.png',
    selfAvatarDataUri:()=>'/self.png',
    avatarGenderClass:(value)=>`gender-${value}`,
    playerColorByViewClass:()=>'#123456',
    roundWinsChipHtml:(value)=>`<span class="wins">${value}</span>`,
    seatCalloutHtml:()=>'<span id="callout"></span>',
    seatEmoteHtml:()=>'<span id="emote"></span>'
  });
  assert.equal(result.selfScore,5120);
  assert.equal(result.selfName,'Player');
  assert.match(result.selfAvatar,/player-avatar-google/);
  assert.match(result.selfAvatar,/lobby-seat-host-badge/);
  assert.match(result.selfAvatar,/avatar-status-badge warning danger/);
  assert.match(result.selfCalloutHtml,/id="callout"/);
  assert.match(result.selfCalloutHtml,/id="emote"/);
});

test('buildGameAuxRenderState assembles log and hand render data', ()=>{
  const result=buildGameAuxRenderState({
    state:{
      showLogSheet:true,
      language:'zh-HK',
      recommendHint:'recPass',
      recommendation:{action:'play'},
      emote:{open:true},
      selected:new Set(['c1'])
    },
    v:{
      history:['h1'],
      selfSeat:0,
      systemLog:['s1'],
      hand:[{id:'c1'},{id:'c2'}]
    },
    t:(key)=>key,
    esc:(value)=>String(value),
    withBase:(path)=>`/base/${path}`,
    historyHtml:()=>'<div id="history"></div>',
    isPortraitMode:()=>true,
    EMOTE_STICKERS:[{id:'smile',file:'smile.png'}],
    renderHandCard:(card,selected,extraClass,index)=>`<button data-id="${card.id}" data-selected="${selected?'1':'0'}" data-extra="${extraClass}" data-index="${index}"></button>`,
    cardId:(card)=>card.id,
    showMust3Highlight:true,
    isLowestSingle:(card)=>card.id==='c2'
  });
  assert.equal(result.portraitMode,true);
  assert.equal(result.logSheetOpen,true);
  assert.equal(result.closeLabel,'關閉');
  assert.equal(result.isRecPass,true);
  assert.equal(result.isRecEmpty,false);
  assert.equal(result.showRecommendHint,false);
  assert.equal(result.isRecPlay,true);
  assert.match(result.gameHistoryHtml,/id="history"/);
  assert.match(result.emotePanel,/data-emote-id="smile"/);
  assert.match(result.handHtml,/data-id="c1"/);
  assert.match(result.handHtml,/data-selected="1"/);
  assert.match(result.handHtml,/data-extra="must3-highlight"/);
});

test('buildOpponentSeatsHtml assembles opponent seat markup with host and emote state', ()=>{
  const html=buildOpponentSeatsHtml({
    arr:[
      {viewIndex:0,seat:0,name:'Self',rawName:'Self',cls:'south',count:5},
      {viewIndex:1,seat:1,name:'Bot A',rawName:'Bot A',cls:'west',count:1,isBot:true,gender:'male',score:4980,picture:''}
    ],
    v:{currentSeat:1,gameOver:false,revealedHands:null},
    t:(key)=>key,
    esc:(value)=>String(value),
    state:{language:'en',mottoPeekName:'Bot A'},
    hostSeat:1,
    emoteSeat:1,
    lastActions:new Map([[1,{cards:[{id:'c1'}]}]]),
    roundWinsBySeat:{1:3},
    TABLE_PLAY_SCALE:0.8,
    renderOpponentSeats:(seats)=>seats.join(''),
    renderOpponentSeat:({cls,seatAttrs,outerLabelHtml,sideStationFlowHtml})=>`<section class="${cls}"${seatAttrs}>${outerLabelHtml}${sideStationFlowHtml}</section>`,
    renderOpponentLabel:({hostBadgeHtml,namecardBtn,calloutHtml,emoteHtml,mottoText,peekActive})=>`<div class="label ${peekActive?'peek':''}">${hostBadgeHtml}${namecardBtn}${mottoText}${calloutHtml}${emoteHtml}</div>`,
    renderOpponentStationFlow:({innerLabelHtml,fan,fanClassName,closedCountHtml,opponentOpenPlayHtml})=>`<div class="${fanClassName}">${innerLabelHtml}${fan}${closedCountHtml}${opponentOpenPlayHtml}</div>`,
    renderStaticCard:(card)=>`<span>${card.id}</span>`,
    renderBackCards:(count,key)=>`<div data-count="${count}" data-key="${key}"></div>`,
    playerColorByViewClass:()=>'#123456',
    authPictureUrlFrom:(value)=>`pic:${value}`,
    avatarDataUri:(name)=>`avatar:${name}`,
    profileFieldValue:()=> 'Stay cool',
    OPPONENT_PROFILE_BY_NAME:{'Bot A':{motto:{en:'Stay cool'}}},
    hashTextSeed:()=>7,
    roundWinsChipHtml:(value)=>`<span class="wins">${value}</span>`,
    seatCalloutHtml:()=>'<span class="callout"></span>',
    seatEmoteHtml:()=>'<span class="emote"></span>',
    avatarGenderClass:(value)=>`gender-${value}`,
    opponentFanStyleByName:(name)=>`fan-${name}`,
    seatLastActionHtml:()=>'<span class="last-action"></span>',
    isMobilePointer:()=>true
  });
  assert.match(html,/lobby-seat-host-badge/);
  assert.match(html,/seat-namecard/);
  assert.match(html,/data-seat-emote-active="1"/);
  assert.match(html,/data-count="1"/);
  assert.match(html,/last-action/);
  assert.match(html,/label peek/);
});

test('buildCalloutRenderState prioritizes must3 and suppresses separate emote bubble when merged', ()=>{
  const state={
    emote:{active:{id:'smile',by:'seat:1',ts:10}},
    solo:{players:[]},
    room:{data:null}
  };
  const result=buildCalloutRenderState({
    v:{mode:'solo',selfSeat:0},
    state,
    t:(key)=>key,
    esc:(value)=>String(value),
    withBase:(path)=>`/base/${path}`,
    EMOTE_STICKERS:[{id:'smile',file:'smile.png'}],
    currentPlayTypeCall:()=>({seat:1,text:'Straight'}),
    currentPassCall:()=>null,
    currentMust3Call:()=>({seat:1,text:'Must 3'}),
    currentLastCardSeat:()=>null,
    playTypeCallState:{startedAt:100,nonce:1},
    passCallState:{startedAt:0,nonce:0},
    must3CallState:{startedAt:200,nonce:2},
    lastCardCallState:{startedAt:0,nonce:0,text:''},
    calloutDisplayEnabled:true,
    emoteDisplayEnabled:true,
    calloutJitterStyle:()=> '--jitter:0;'
  });
  const calloutHtml=result.seatCalloutHtml(1,'west','#123',false);
  assert.match(calloutHtml,/Must 3/);
  assert.match(calloutHtml,/callout-with-emote/);
  assert.equal(result.seatEmoteHtml(1,'west','#123',false),'');
  assert.equal(state.emote.active.suppressCallout,true);
});

test('buildCalloutRenderState resolves room emote seat and builds self table emote', ()=>{
  const result=buildCalloutRenderState({
    v:{mode:'room',selfSeat:2},
    state:{
      emote:{active:{id:'rude',by:'uid:host',ts:44}},
      solo:{players:[{uid:'uid:self'},{uid:'uid:other'}]},
      room:{data:{players:[{uid:'uid:host',seat:2}]}}
    },
    t:(key)=>key,
    esc:(value)=>String(value),
    withBase:(path)=>`/base/${path}`,
    EMOTE_STICKERS:[{id:'rude',file:'rude.png'}],
    currentPlayTypeCall:()=>null,
    currentPassCall:()=>null,
    currentMust3Call:()=>null,
    currentLastCardSeat:()=>null,
    playTypeCallState:{startedAt:0,nonce:0},
    passCallState:{startedAt:0,nonce:0},
    must3CallState:{startedAt:0,nonce:0},
    lastCardCallState:{startedAt:0,nonce:0,text:''},
    calloutDisplayEnabled:true,
    emoteDisplayEnabled:true,
    calloutJitterStyle:()=> '--jitter:0;'
  });
  assert.equal(result.emoteSeat,2);
  assert.match(result.selfTableEmoteHtml,/self-table-emote emote-rude/);
  assert.match(result.selfTableEmoteHtml,/\/base\/emotes\/rude\.png/);
});
