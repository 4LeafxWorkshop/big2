import test from 'node:test';
import assert from 'node:assert/strict';

import {createCalloutStateController} from '../src/calloutState.js';

function makeController(overrides={}){
  const spoken=[];
  const scheduled=[];
  const cleared=[];
  const sounds=[];
  const vibrations=[];
  const locked=[];
  const stateRefs={
    playTypeCallState:{key:'',seat:0,text:'',until:0,startedAt:0,nonce:'',historyLen:0},
    passCallState:{key:'',seat:0,text:'',until:0,startedAt:0,nonce:'',historyLen:0},
    lastCardCallState:{key:'',seat:0,text:'',until:0,startedAt:0,nonce:'',historyLen:0},
    must3CallState:{key:'',seat:0,text:'',until:0,startedAt:0,nonce:''},
    lastCardAnnouncedSeats:new Set(),
    lastCardProcessedHistoryLenRef:{
      value:0,
      get(){return this.value;},
      set(value){this.value=value;}
    }
  };
  const controller=createCalloutStateController({
    getSoloPlayers:overrides.getSoloPlayers??(()=>[{gender:'male'},{gender:'female'}]),
    stateRefs,
    cardId:(card)=>card.id,
    evaluatePlay:overrides.evaluatePlay??((cards)=>({valid:true,count:cards.length,kind:cards.length===5?'flush':'single',power:[cards.length]})),
    fiveKindPower:{straight:0,flush:1,fullhouse:2,fourofkind:3,straightflush:4},
    buildResponseCalloutText:overrides.buildResponseCalloutText??((kind,subtype,key,meta)=>`${kind}:${subtype}:${key}:${meta?.playVariantIndex ?? ''}`),
    newCalloutNonce:()=> 'nonce',
    scheduleCalloutExpiry:(until)=>{scheduled.push(until);},
    lockTurnProgress:(ms)=>{locked.push(ms);},
    clearCalloutStates:(kind)=>{cleared.push(kind);},
    playSound:(id)=>{sounds.push(id);},
    triggerVibration:(pattern)=>{vibrations.push(pattern);},
    speakCallout:(text,gender,meta)=>{spoken.push({text,gender,meta});},
    t:(key)=>key
  });
  return{controller,stateRefs,spoken,scheduled,cleared,sounds,locked,vibrations};
}

test('callout state controller creates pass callout and reuses it until expiry', ()=>{
  const {controller,stateRefs,spoken,scheduled,cleared,locked}=makeController();
  const view={gameOver:false,history:[{action:'pass',seat:1}],participants:[{seat:1,count:3,gender:'female'}]};
  const first=controller.currentPassCall(view);
  const second=controller.currentPassCall(view);
  assert.deepEqual(first,{seat:1,text:'pass::pass-1-1:'});
  assert.deepEqual(second,first);
  assert.equal(stateRefs.passCallState.historyLen,1);
  assert.equal(spoken.length,1);
  assert.equal(spoken[0].gender,'female');
  assert.equal(scheduled.length,1);
  assert.deepEqual(cleared,['pass']);
  assert.deepEqual(locked,[850]);
});

test('callout state controller creates play callout with derived variant', ()=>{
  const {controller,spoken,cleared,locked}=makeController({
    evaluatePlay:(cards)=>{
      if(cards.length===5&&cards[0].id.startsWith('a'))return{valid:true,count:5,kind:'flush',power:[1,2,3,4,5]};
      if(cards.length===5&&cards[0].id.startsWith('b'))return{valid:true,count:5,kind:'flush',power:[1,2,3,4,9]};
      return{valid:false};
    }
  });
  const view={
    gameOver:false,
    history:[
      {action:'play',seat:0,cards:[{id:'a1'},{id:'a2'},{id:'a3'},{id:'a4'},{id:'a5'}],kind:'flush'},
      {action:'pass',seat:1},
      {action:'play',seat:2,cards:[{id:'b1'},{id:'b2'},{id:'b3'},{id:'b4'},{id:'b5'}],kind:'flush'}
    ],
    participants:[{seat:2,count:4,gender:'male'}]
  };
  const result=controller.currentPlayTypeCall(view);
  assert.deepEqual(result,{seat:2,text:'play:flush:2-flush-b1,b2,b3,b4,b5:4'});
  assert.equal(spoken.length,1);
  assert.deepEqual(cleared,['play']);
  assert.deepEqual(locked,[900]);
});

test('callout state controller detects and resets last-card announcements', ()=>{
  const {controller,stateRefs,sounds}=makeController({
    buildResponseCalloutText:(kind)=>kind==='last'?'last-card':''
  });
  const firstView={
    gameOver:false,
    isFirstTrick:false,
    history:[{action:'play',seat:1,cards:[{id:'c1'}]}],
    participants:[{seat:1,count:1,gender:'female'}]
  };
  assert.equal(controller.currentLastCardSeat(firstView),1);
  assert.equal(sounds[0],'last');
  assert.equal(stateRefs.lastCardAnnouncedSeats.has(1),true);
  const resetView={gameOver:false,isFirstTrick:true,history:[],participants:[]};
  assert.equal(controller.currentLastCardSeat(resetView),null);
  assert.equal(stateRefs.lastCardAnnouncedSeats.size,0);
  assert.equal(stateRefs.lastCardProcessedHistoryLenRef.get(),0);
});
