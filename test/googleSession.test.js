import test from 'node:test';
import assert from 'node:assert/strict';

import {createGoogleSessionHelpers} from '../src/googleSession.js';

function createState(){
  return{
    home:{
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
        profileMissing:false
      },
      showLeaderboard:false
    }
  };
}

function createStorage(seed=''){
  const data=new Map();
  if(seed)data.set('google-session',seed);
  return{
    data,
    getItem:(key)=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>{data.set(key,String(value));},
    removeItem:(key)=>{data.delete(key);}
  };
}

test('loadGoogleSession restores cached browser email and profile', ()=>{
  const state=createState();
  const storage=createStorage(JSON.stringify({email:'user@example.com'}));
  let restoredEmail='';
  const helpers=createGoogleSessionHelpers({
    getState:()=>state,
    getStorage:()=>storage,
    sessionKey:'google-session',
    applyCachedGoogleProfileFromStore:(email)=>{restoredEmail=email;return true;},
    initFirebaseIfReady:()=>false,
    hydrateProfileFromCloudByIdentity:async()=>false,
    currentLeaderboardIdentity:()=>({id:'user@example.com'}),
    refreshLeaderboard:()=>{},
    render:()=>{}
  });
  assert.equal(helpers.loadGoogleSession(),true);
  assert.equal(restoredEmail,'user@example.com');
  assert.equal(state.home.google.signedIn,true);
  assert.equal(state.home.google.email,'user@example.com');
});

test('saveGoogleSession and clearGoogleSession update storage', ()=>{
  const state=createState();
  const storage=createStorage();
  const helpers=createGoogleSessionHelpers({
    getState:()=>state,
    getStorage:()=>storage,
    sessionKey:'google-session',
    applyCachedGoogleProfileFromStore:()=>false,
    initFirebaseIfReady:()=>false,
    hydrateProfileFromCloudByIdentity:async()=>false,
    currentLeaderboardIdentity:()=>({id:''}),
    refreshLeaderboard:()=>{},
    render:()=>{}
  });
  state.home.google.email='user@example.com';
  helpers.saveGoogleSession();
  assert.equal(storage.getItem('google-session'),JSON.stringify({email:'user@example.com'}));
  helpers.clearGoogleSession();
  assert.equal(storage.getItem('google-session'),null);
});
