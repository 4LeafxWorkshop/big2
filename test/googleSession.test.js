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

test('loadGoogleSession restores auth photo url when cached profile has no picture', ()=>{
  const state=createState();
  const storage=createStorage(JSON.stringify({email:'user@example.com'}));
  const preloadCalls=[];
  const helpers=createGoogleSessionHelpers({
    getState:()=>state,
    getStorage:()=>storage,
    sessionKey:'google-session',
    getFirebaseAuth:()=>({currentUser:{photoURL:'https://example.com/avatar.png'}}),
    mergeBrowserGoogleProfile:(overrides)=>{state.home.google={...state.home.google,...overrides};},
    applyCachedGoogleProfileFromStore:()=>false,
    preloadGooglePicture:()=>{preloadCalls.push(true);},
    initFirebaseIfReady:()=>false,
    hydrateProfileFromCloudByIdentity:async()=>false,
    currentLeaderboardIdentity:()=>({id:'user@example.com'}),
    refreshLeaderboard:()=>{},
    render:()=>{}
  });
  assert.equal(helpers.loadGoogleSession(),true);
  assert.equal(state.home.google.picture,'https://example.com/avatar.png');
  assert.equal(state.home.google.pictureLoaded,false);
  assert.equal(preloadCalls.length,1);
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

test('handleNativeGoogleUser signs into firebase and stores native profile', async()=>{
  const state=createState();
  const storage=createStorage();
  let syncIdentity=null;
  const helpers=createGoogleSessionHelpers({
    getState:()=>state,
    getWindow:()=>({
      firebase:{
        auth:{
          GoogleAuthProvider:{
            credential:(token)=>({token})
          }
        }
      }
    }),
    getStorage:()=>storage,
    sessionKey:'google-session',
    getFirebaseAuth:()=>({
      signInWithCredential:async()=>({
        user:{uid:'firebase-uid-1'}
      })
    }),
    mergeBrowserGoogleProfile:(overrides)=>{state.home.google={...state.home.google,...overrides};},
    applyCachedGoogleProfileFromStore:()=>false,
    preloadGooglePicture:()=>{},
    initFirebaseIfReady:()=>true,
    hydrateProfileFromCloudByIdentity:async()=>({status:'not_found'}),
    currentLeaderboardIdentity:()=>({id:state.home.google.email}),
    syncLeaderboardProfile:async(identity)=>{syncIdentity=identity;},
    loadActiveRoomPointer:()=>{},
    refreshLeaderboard:()=>{},
    render:()=>{}
  });
  await helpers.handleNativeGoogleUser({
    id:'google-sub-1',
    email:'native@example.com',
    name:'Native User',
    imageUrl:'https://example.com/pic.png',
    authentication:{idToken:'native-token'}
  });
  assert.equal(state.home.google.signedIn,true);
  assert.equal(state.home.google.email,'native@example.com');
  assert.equal(state.home.google.uid,'google-sub-1');
  assert.equal(state.home.google.sub,'google-sub-1');
  assert.equal(state.home.google.picture,'https://example.com/pic.png');
  assert.equal(storage.getItem('google-session'),JSON.stringify({email:'native@example.com'}));
  assert.equal(syncIdentity,null);
});

test('handleNativeGoogleUser accepts top-level native idToken fallback', async()=>{
  const state=createState();
  const storage=createStorage();
  const helpers=createGoogleSessionHelpers({
    getState:()=>state,
    getWindow:()=>( {
      firebase:{
        auth:{
          GoogleAuthProvider:{
            credential:(token)=>({token})
          }
        }
      }
    }),
    getStorage:()=>storage,
    sessionKey:'google-session',
    getFirebaseAuth:()=>( {
      signInWithCredential:async()=>( {
        user:{uid:'firebase-uid-2'}
      })
    }),
    mergeBrowserGoogleProfile:(overrides)=>{state.home.google={...state.home.google,...overrides};},
    applyCachedGoogleProfileFromStore:()=>false,
    preloadGooglePicture:()=>{},
    initFirebaseIfReady:()=>true,
    hydrateProfileFromCloudByIdentity:async()=>({status:'not_found'}),
    currentLeaderboardIdentity:()=>({id:state.home.google.email}),
    syncLeaderboardProfile:async()=>{},
    loadActiveRoomPointer:()=>{},
    refreshLeaderboard:()=>{},
    render:()=>{}
  });
  await helpers.handleNativeGoogleUser({
    id:'google-sub-2',
    idToken:'native-token-top-level',
    email:'native2@example.com',
    name:'Native User 2',
    imageUrl:'https://example.com/pic2.png'
  });
  assert.equal(state.home.google.signedIn,true);
  assert.equal(state.home.google.email,'native2@example.com');
  assert.equal(state.home.google.uid,'google-sub-2');
  assert.equal(state.home.google.sub,'google-sub-2');
  assert.equal(storage.getItem('google-session'),JSON.stringify({email:'native2@example.com'}));
});
