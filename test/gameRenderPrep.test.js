import test from 'node:test';
import assert from 'node:assert/strict';

import {buildCalloutRenderState, buildOpponentSeatsHtml} from '../src/gameRenderPrep.js';
import {renderOpponentSeat, renderOpponentStationFlow} from '../src/gameView.js';

test('buildCalloutRenderState keeps opponent emote callouts visible with matching seat callouts', ()=>{
  const result=buildCalloutRenderState({
    v:{
      mode:'solo',
      gameOver:false,
      selfSeat:0,
      currentSeat:1,
      history:[],
      participants:[]
    },
    state:{
      emote:{
        active:{id:'cheers',ts:1,seat:1}
      },
      language:'zh-HK'
    },
    t:(key)=>key,
    esc:(value)=>String(value),
    withBase:(path)=>`/base/${path}`,
    EMOTE_STICKERS:[{id:'cheers',file:'emote-cheers.png'}],
    currentPlayTypeCall:()=>({seat:1,text:'Go'}),
    currentPassCall:()=>null,
    currentMust3Call:()=>null,
    currentLastCardSeat:()=>null,
    playTypeCallState:{startedAt:0,nonce:'',text:'',seat:1},
    passCallState:{startedAt:0,nonce:'',text:'',seat:0},
    must3CallState:{startedAt:0,nonce:'',text:'',seat:0},
    lastCardCallState:{startedAt:0,nonce:'',text:'',seat:0},
    calloutDisplayEnabled:true,
    emoteDisplayEnabled:true,
    calloutJitterStyle:()=>''
  });

  assert.match(result.seatCalloutHtml(1,'north','#123456',false),/callout-with-emote/);
  assert.equal(result.seatEmoteHtml(1,'north','#123456',false),'');
  assert.equal(result.seatEmoteHtml(0,'north','#123456',true),'');
});

test('buildCalloutRenderState keeps standalone opponent emotes visible', ()=>{
  const result=buildCalloutRenderState({
    v:{
      mode:'solo',
      gameOver:false,
      selfSeat:0,
      currentSeat:2,
      history:[],
      participants:[]
    },
    state:{
      emote:{
        active:{id:'cheers',ts:1,seat:2}
      },
      language:'zh-HK'
    },
    t:(key)=>key,
    esc:(value)=>String(value),
    withBase:(path)=>`/base/${path}`,
    EMOTE_STICKERS:[{id:'cheers',file:'emote-cheers.png'}],
    currentPlayTypeCall:()=>null,
    currentPassCall:()=>null,
    currentMust3Call:()=>null,
    currentLastCardSeat:()=>null,
    playTypeCallState:{startedAt:0,nonce:'',text:'',seat:1},
    passCallState:{startedAt:0,nonce:'',text:'',seat:0},
    must3CallState:{startedAt:0,nonce:'',text:'',seat:0},
    lastCardCallState:{startedAt:0,nonce:'',text:'',seat:0},
    calloutDisplayEnabled:true,
    emoteDisplayEnabled:true,
    calloutJitterStyle:()=>''
  });

  assert.match(result.seatEmoteHtml(2,'north','#123456',false),/emote-callout/);
  assert.equal(result.seatCalloutHtml(2,'north','#123456',false),'');
});

test('buildCalloutRenderState keeps room opponent emotes visible even when local emote display is off', ()=>{
  const result=buildCalloutRenderState({
    v:{
      mode:'room',
      gameOver:false,
      selfSeat:0,
      currentSeat:2,
      history:[],
      participants:[]
    },
    state:{
      emote:{
        active:{id:'cheers',ts:1,seat:2}
      },
      language:'zh-HK'
    },
    t:(key)=>key,
    esc:(value)=>String(value),
    withBase:(path)=>`/base/${path}`,
    EMOTE_STICKERS:[{id:'cheers',file:'emote-cheers.png'}],
    currentPlayTypeCall:()=>null,
    currentPassCall:()=>null,
    currentMust3Call:()=>null,
    currentLastCardSeat:()=>null,
    playTypeCallState:{startedAt:0,nonce:'',text:'',seat:1},
    passCallState:{startedAt:0,nonce:'',text:'',seat:0},
    must3CallState:{startedAt:0,nonce:'',text:'',seat:0},
    lastCardCallState:{startedAt:0,nonce:'',text:'',seat:0},
    calloutDisplayEnabled:true,
    emoteDisplayEnabled:false,
    calloutJitterStyle:()=>''
  });

  assert.match(result.seatEmoteHtml(2,'north','#123456',false),/emote-callout/);
});

test('buildOpponentSeatsHtml keeps station identity separate from card layers', ()=>{
  const html=buildOpponentSeatsHtml({
    arr:[
      {viewIndex:1,seat:1,cls:'north',name:'North',rawName:'North',count:3,score:1000,gender:'male',isBot:false,picture:''},
      {viewIndex:2,seat:2,cls:'west',name:'West',rawName:'West',count:4,score:1000,gender:'male',isBot:false,picture:''}
    ],
    v:{mode:'solo',gameOver:false,selfSeat:0,currentSeat:1,history:[],revealedHands:{}},
    t:(key)=>key,
    esc:(value)=>String(value),
    state:{
      language:'zh-HK',
      emote:{active:null},
      serviceBell:{foodCallout:null},
      solo:{players:[]},
      room:{data:null}
    },
    hostSeat:null,
    emoteSeat:null,
    lastActions:new Map(),
    roundWinsBySeat:{},
    TABLE_PLAY_SCALE:1,
    renderOpponentSeats:(seats)=>seats.join(''),
    renderOpponentSeat,
    renderOpponentLabel:({playerName})=>`<div class="seat-name-fixed" data-opponent-name="${playerName}"></div>`,
    renderOpponentStationFlow,
    renderStaticCard:()=>'<div class="card"></div>',
    renderBackCards:(count)=>`<div class="cards">${count}</div>`,
    withBase:(path)=>`/base/${path}`,
    playerColorByViewClass:()=>'#123456',
    authPictureUrlFrom:()=>null,
    avatarDataUri:()=>null,
    profileFieldValue:()=>'',
    OPPONENT_PROFILE_BY_NAME:{},
    hashTextSeed:()=>0,
    roundWinsChipHtml:()=>'<span></span>',
    seatCalloutHtml:()=>'',
    seatEmoteHtml:()=>'',
    seatFoodCalloutHtml:()=>'<div class="emote-callout food-callout food-callout-seat"></div>',
    avatarGenderClass:()=>'avatar-male',
    opponentFanStyleByName:()=>'' ,
    seatLastActionHtml:()=>'<div class="seat-played"></div>',
    isMobilePointer:()=>false
  });

  assert.match(html,/z-index:11000 !important/);
  assert.match(html,/side-station-stack/);
  assert.ok(html.indexOf('data-opponent-name="North"')<html.indexOf('opponent-fan-wrap'));
  assert.ok(html.indexOf('opponent-fan-wrap')<html.indexOf('seat-open-play'));
});
