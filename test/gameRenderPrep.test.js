import test from 'node:test';
import assert from 'node:assert/strict';

import {buildCalloutRenderState} from '../src/gameRenderPrep.js';

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
