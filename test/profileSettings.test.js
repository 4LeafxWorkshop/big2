import test from 'node:test';
import assert from 'node:assert/strict';

import {createProfileSettingsHelpers} from '../src/profileSettings.js';

function createHelpers(stateOverrides={}){
  const state={
    language:'zh-HK',
    home:{aiDifficulty:'normal',backColor:'red',gender:'male',avatarChoice:'male'},
    room:{selfSeat:0},
    solo:{totals:[5100,5000,4900,4800]},
    ...stateOverrides
  };
  let soundEnabled=true;
  let calloutDisplayEnabled=false;
  let emoteDisplayEnabled=true;
  let calloutStylePack='classic';
  let calloutVoiceMode='auto';
  const helpers=createProfileSettingsHelpers({
    getState:()=>state,
    languageOptions:[{value:'zh-HK'},{value:'en'}],
    backOptions:[{value:'red'},{value:'blue'}],
    getSoundEnabled:()=>soundEnabled,
    setSoundEnabled:(value)=>{soundEnabled=value;},
    getCalloutDisplayEnabled:()=>calloutDisplayEnabled,
    setCalloutDisplayEnabled:(value)=>{calloutDisplayEnabled=value;},
    getEmoteDisplayEnabled:()=>emoteDisplayEnabled,
    setEmoteDisplayEnabled:(value)=>{emoteDisplayEnabled=value;},
    normalizeCalloutStylePack:(value)=>value||'classic',
    getCalloutStylePack:()=>calloutStylePack,
    setCalloutStylePack:(value)=>{calloutStylePack=value;},
    setCalloutVoiceMode:(value)=>{calloutVoiceMode=value;},
    currentLeaderboardIdentity:()=>({id:'self'}),
    ensureLeaderboardEntry:(_store,identity)=>identity.id==='self'?{totalScore:6200}:null,
    loadLeaderboardStore:()=>({players:{}}),
    botLeaderboardIdentity:(name,gender)=>({id:`bot:${name}:${gender}`}),
    currentRoomPlayerId:()=>'uid:self'
  });
  return{
    state,
    helpers,
    getFlags:()=>({soundEnabled,calloutDisplayEnabled,emoteDisplayEnabled,calloutStylePack,calloutVoiceMode})
  };
}

test('collectMainSettings reflects current state and toggles', ()=>{
  const {helpers}=createHelpers();
  const settings=helpers.collectMainSettings();
  assert.equal(settings.language,'zh-HK');
  assert.equal(settings.backColor,'red');
  assert.equal(settings.soundEnabled,true);
});

test('applyMainSettings updates state and mutable flags', ()=>{
  const {state,helpers,getFlags}=createHelpers();
  helpers.applyMainSettings({
    language:'en',
    aiDifficulty:'hard',
    backColor:'blue',
    soundEnabled:false,
    calloutDisplayEnabled:true,
    emoteDisplayEnabled:false,
    calloutStylePack:'minimal',
    gender:'female',
    avatarChoice:'google'
  });
  assert.equal(state.language,'en');
  assert.equal(state.home.aiDifficulty,'hard');
  assert.equal(state.home.backColor,'blue');
  assert.equal(state.home.gender,'female');
  assert.equal(state.home.avatarChoice,'google');
  assert.deepEqual(getFlags(),{
    soundEnabled:false,
    calloutDisplayEnabled:true,
    emoteDisplayEnabled:false,
    calloutStylePack:'minimal',
    calloutVoiceMode:'off'
  });
});

test('roomSeatStartingScore uses human score for self seat and clamps others', ()=>{
  const {helpers}=createHelpers();
  assert.equal(helpers.roomSeatStartingScore({isHuman:true,uid:'uid:self'},0,5000),6200);
  assert.equal(helpers.roomSeatStartingScore({isHuman:true,uid:'uid:other'},1,'bad'),5000);
});
