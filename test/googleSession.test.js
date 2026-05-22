import test from 'node:test';
import assert from 'node:assert/strict';

import {createGoogleSessionHelpers} from '../src/googleSession.js';

function createState(){
  return{
    score:5000,
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
    },
    solo:{
      totals:[5000,5000,5000,5000]
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

function encodeJwtPayload(payload){
  return `x.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.y`;
}

test('loadGoogleSession restores cached browser email and profile', ()=>{
  const state=createState();
  const storage=createStorage(JSON.stringify({email:'user@example.com',provider:'apple'}));
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
  assert.equal(state.home.google.provider,'apple');
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
  assert.equal(storage.getItem('google-session'),JSON.stringify({email:'user@example.com',provider:'google'}));
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
  assert.equal(state.home.google.uid,'firebase-uid-1');
  assert.equal(state.home.google.sub,'google-sub-1');
  assert.equal(state.home.google.picture,'https://example.com/pic.png');
  assert.equal(storage.getItem('google-session'),JSON.stringify({email:'native@example.com',provider:'google'}));
  assert.deepEqual(syncIdentity,{id:'native@example.com'});
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
  assert.equal(state.home.google.uid,'firebase-uid-2');
  assert.equal(state.home.google.sub,'google-sub-2');
  assert.equal(storage.getItem('google-session'),JSON.stringify({email:'native2@example.com',provider:'google'}));
});

test('handleNativeGoogleUser accepts object-shaped imageUrl payloads', async()=>{
  const state=createState();
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
    getStorage:()=>createStorage(),
    sessionKey:'google-session',
    getFirebaseAuth:()=>({
      signInWithCredential:async()=>({
        user:{uid:'firebase-uid-3'}
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
    id:'google-sub-3',
    email:'native3@example.com',
    name:'Native User 3',
    imageUrl:{url:'https://example.com/pic3.png'},
    authentication:{idToken:'native-token-3'}
  });
  assert.equal(state.home.google.uid,'firebase-uid-3');
  assert.equal(state.home.google.sub,'google-sub-3');
  assert.equal(state.home.google.picture,'https://example.com/pic3.png');
});

test('handleNativeGoogleUser falls back to token picture and syncs profile on not_found hydrate', async()=>{
  const state=createState();
  let syncCalls=0;
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
    getStorage:()=>createStorage(),
    sessionKey:'google-session',
    getFirebaseAuth:()=>({
      currentUser:{photoURL:''},
      signInWithCredential:async()=>({
        user:{uid:'firebase-uid-4',photoURL:''}
      })
    }),
    mergeBrowserGoogleProfile:(overrides)=>{state.home.google={...state.home.google,...overrides};},
    applyCachedGoogleProfileFromStore:()=>false,
    preloadGooglePicture:()=>{},
    initFirebaseIfReady:()=>true,
    hydrateProfileFromCloudByIdentity:async()=>({status:'not_found'}),
    currentLeaderboardIdentity:()=>({id:state.home.google.email}),
    syncLeaderboardProfile:async()=>{syncCalls+=1;},
    loadActiveRoomPointer:()=>{},
    refreshLeaderboard:()=>{},
    render:()=>{}
  });
  await helpers.handleNativeGoogleUser({
    id:'google-sub-4',
    email:'native4@example.com',
    name:'Native User 4',
    imageUrl:'',
    authentication:{
      idToken:encodeJwtPayload({
        email:'native4@example.com',
        sub:'google-sub-4',
        picture:'https://example.com/pic4.png'
      })
    }
  });
  assert.equal(state.home.google.uid,'firebase-uid-4');
  assert.equal(state.home.google.sub,'google-sub-4');
  assert.equal(state.home.google.picture,'https://example.com/pic4.png');
  assert.equal(syncCalls,1);
});

test('handleFirebaseOAuthUser stores apple provider and session state', async()=>{
  const state=createState();
  const storage=createStorage();
  let syncIdentity=null;
  const helpers=createGoogleSessionHelpers({
    getState:()=>state,
    getWindow:()=>({}),
    getStorage:()=>storage,
    sessionKey:'google-session',
    getFirebaseAuth:()=>({
      signInWithCredential:async()=>({
        user:{uid:'firebase-uid-apple'}
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
  await helpers.handleFirebaseOAuthUser({
    provider:'apple',
    user:{uid:'apple-sub-1',email:'apple@example.com',displayName:'Apple User',photoURL:''}
  });
  assert.equal(state.home.google.signedIn,true);
  assert.equal(state.home.google.provider,'apple');
  assert.equal(state.home.google.email,'apple@example.com');
  assert.equal(state.home.google.uid,'apple-sub-1');
  assert.equal(storage.getItem('google-session'),JSON.stringify({email:'apple@example.com',provider:'apple'}));
  assert.deepEqual(syncIdentity,{id:'apple@example.com'});
});
