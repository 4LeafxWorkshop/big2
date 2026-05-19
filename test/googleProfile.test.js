import test from 'node:test';
import assert from 'node:assert/strict';

import {createGoogleProfileHelpers} from '../src/googleProfile.js';

function createState(){
  return{
    screen:'home',
    score:5000,
    home:{
      name:'玩家',
      gender:'male',
      google:{
        signedIn:false,
        provider:'',
        name:'',
        email:'',
        uid:'',
        sub:'',
        token:'',
        picture:'',
        pictureLoaded:false,
        gender:'',
        profileMissing:true
      }
    },
    solo:{
      players:[],
      gameOver:false,
      totals:[5000,5000,5000,5000]
    }
  };
}

function createHelpers(state=createState(),store={players:{}}){
  const preloadCalls=[];
  const appliedSettings=[];
  const helpers=createGoogleProfileHelpers({
    getState:()=>state,
    loadLeaderboardStore:()=>store,
    scoreFromStoredTotal:(value)=>Math.max(0,Math.trunc(Number(value)||0)),
    applyMainSettings:(settings)=>{appliedSettings.push(settings);},
    preloadGooglePicture:()=>{preloadCalls.push(true);}
  });
  return{state,helpers,preloadCalls,appliedSettings};
}

test('cached browser profile restores profile fields without score', ()=>{
  const {state,helpers,preloadCalls}=createHelpers(undefined,{
    players:{
      'user@example.com':{
        id:'user@example.com',
        name:'Alice',
        email:'user@example.com',
        gender:'female',
        picture:'https://example.com/avatar.png',
        totalScore:6789
      }
    }
  });
  const ok=helpers.applyCachedGoogleProfileFromStore('user@example.com');
  assert.equal(ok,true);
  assert.equal(state.home.name,'Alice');
  assert.equal(state.home.gender,'female');
  assert.equal(state.home.google.gender,'female');
  assert.equal(state.score,5000);
  assert.equal(state.solo.totals[0],5000);
  assert.equal(state.home.google.picture,'https://example.com/avatar.png');
  assert.equal(state.home.google.profileMissing,false);
  assert.equal(preloadCalls.length,1);
});

test('browser merge keeps existing values when overrides are partial', ()=>{
  const {state,helpers}=createHelpers();
  state.home.name='Cached';
  state.home.gender='female';
  state.home.google.picture='https://example.com/pic.png';
  state.home.google.email='cached@example.com';
  helpers.mergeBrowserGoogleProfile({signedIn:true,provider:'google'});
  assert.equal(state.home.google.signedIn,true);
  assert.equal(state.home.google.provider,'google');
  assert.equal(state.home.google.name,'Cached');
  assert.equal(state.home.google.gender,'female');
  assert.equal(state.home.google.picture,'https://example.com/pic.png');
  assert.equal(state.home.google.email,'cached@example.com');
});

test('restored profile does not reset score during a live game', ()=>{
  const state=createState();
  state.screen='game';
  state.score=4321;
  state.solo.players=[{uid:'uid:1'}];
  const {helpers}=createHelpers(state);
  helpers.applyRestoredGoogleProfile({
    name:'Bob',
    gender:'male',
    totalScore:9999,
    updateScore:true
  });
  assert.equal(state.score,4321);
  assert.equal(state.home.name,'Bob');
  assert.equal(state.home.gender,'male');
});
