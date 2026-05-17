import test from 'node:test';
import assert from 'node:assert/strict';

import {buildCalloutRenderState, buildOpponentSeatsHtml, buildResultScreenHtml, buildSelfRenderState} from '../src/gameRenderPrep.js';
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

test('buildSelfRenderState shows the play-big warning whenever the next player has one card', ()=>{
  const result=buildSelfRenderState({
    self:{seat:0,name:'Alice',gender:'female',count:5},
    selfScoreValue:4998,
    state:{home:{gender:'female',google:{signedIn:false}}},
    t:(key)=>key,
    esc:(value)=>String(value),
    hostSeat:null,
    roundWinsBySeat:{0:0},
    v:{selfSeat:0,currentSeat:0,gameOver:false,participants:[{seat:0,count:5},{seat:1,count:1},{seat:2,count:4},{seat:3,count:3}]},
    AVATAR_BASE_SRC:{female:'female.png',male:'male.png'},
    authPictureUrl:()=>null,
    selfAvatarDataUri:(name)=>`avatar:${name}`,
    avatarGenderClass:()=>'avatar-female',
    playerColorByViewClass:()=>'#123456',
    roundWinsChipHtml:()=>'<span class="seat-round-wins">0</span>',
    seatCalloutHtml:()=>'<span class="self-callout"></span>',
    seatEmoteHtml:()=>''
  });

  assert.match(result.selfCalloutHtml,/seat-top-two-warning/);
  assert.match(result.selfCalloutHtml,/playBigWarning/);

  const offTurn=buildSelfRenderState({
    self:{seat:0,name:'Alice',gender:'female',count:5},
    selfScoreValue:4998,
    state:{home:{gender:'female',google:{signedIn:false}}},
    t:(key)=>key,
    esc:(value)=>String(value),
    hostSeat:null,
    roundWinsBySeat:{0:0},
    v:{selfSeat:0,currentSeat:1,gameOver:false,participants:[{seat:0,count:5},{seat:1,count:1},{seat:2,count:4},{seat:3,count:3}]},
    AVATAR_BASE_SRC:{female:'female.png',male:'male.png'},
    authPictureUrl:()=>null,
    selfAvatarDataUri:(name)=>`avatar:${name}`,
    avatarGenderClass:()=>'avatar-female',
    playerColorByViewClass:()=>'#123456',
    roundWinsChipHtml:()=>'<span class="seat-round-wins">0</span>',
    seatCalloutHtml:()=>'<span class="self-callout"></span>',
    seatEmoteHtml:()=>''
  });

  assert.match(offTurn.selfCalloutHtml,/seat-top-two-warning/);
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

test('buildResultScreenHtml displays transferred last-card deductions instead of original per-player deductions', ()=>{
  const html=buildResultScreenHtml({
    v:{
      mode:'solo',
      gameOver:true,
      selfSeat:1,
      status:'',
      statusMeta:null,
      history:[{action:'play',seat:1,cards:[{rank:2,suit:1}]}],
      revealedHands:[
        [{rank:9,suit:0}],
        [],
        [{rank:3,suit:2},{rank:4,suit:2}],
        [{rank:5,suit:3},{rank:6,suit:3},{rank:7,suit:3}]
      ],
      roundSummary:{
        winnerSeat:1,
        deductions:[6,0,0,0],
        winnerGain:6,
        details:[
          {remain:1,base:1,multiplier:1,deduction:1,anyTwo:false,twoPenalty:false,chaoMultiplier:1,chaoKey:''},
          {remain:0,base:0,multiplier:1,deduction:0,anyTwo:false,twoPenalty:false,chaoMultiplier:1,chaoKey:''},
          {remain:2,base:2,multiplier:1,deduction:2,anyTwo:false,twoPenalty:false,chaoMultiplier:1,chaoKey:''},
          {remain:3,base:3,multiplier:1,deduction:3,anyTwo:false,twoPenalty:false,chaoMultiplier:1,chaoKey:''}
        ],
        lastCardBreach:{seat:0,threatenedSeat:1}
      }
    },
    arr:[
      {seat:0,cls:'south',name:'Alice',gender:'female',count:1,score:4994,isBot:false,picture:''},
      {seat:1,cls:'east',name:'Bob',gender:'male',count:0,score:5006,isBot:false,picture:''},
      {seat:2,cls:'north',name:'Cara',gender:'female',count:2,score:5000,isBot:false,picture:''},
      {seat:3,cls:'west',name:'Dan',gender:'male',count:3,score:5000,isBot:false,picture:''}
    ],
    state:{home:{mode:'solo'},room:{data:null,lastResultPlayers:null}},
    t:(key)=>key,
    esc:(value)=>String(value),
    roomIsHost:()=>false,
    roomResultExpired:()=>false,
    roomCountdownText:()=>'-',
    uiStatus:()=> '',
    playerColorByViewClass:()=>'#123456',
    calcPenaltyDetail:(hand)=>({remain:hand.length,base:hand.length,multiplier:1,deduction:hand.length,anyTwo:false,twoPenalty:false,chaoMultiplier:1,chaoKey:''}),
    renderStaticCard:()=>'<span class="card"></span>',
    authPictureUrl:()=>'',
    authPictureUrlFrom:()=>null,
    avatarDataUri:()=>'avatar'
  });

  assert.match(html,/Alice[\s\S]*resultDelta: -6[\s\S]*scoreDeduct 6/);
  assert.match(html,/Cara[\s\S]*resultDelta: 0[\s\S]*scoreDeduct 0/);
  assert.match(html,/Dan[\s\S]*resultDelta: 0[\s\S]*scoreDeduct 0/);
});
