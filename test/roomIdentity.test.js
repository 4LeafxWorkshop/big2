import test from 'node:test';
import assert from 'node:assert/strict';

import {createRoomIdentityHelpers} from '../src/roomIdentity.js';

function createHelpers(stateOverrides={},authUid=''){
  const state={sessionId:'',room:{playerId:'',...stateOverrides.room},...stateOverrides};
  return{
    state,
    helpers:createRoomIdentityHelpers({
      getState:()=>state,
      getFirebaseAuth:()=>authUid?{currentUser:{uid:authUid}}:{currentUser:null}
    })
  };
}

test('baseRoomPlayerId prefers firebase auth uid', ()=>{
  const {helpers}=createHelpers({},'abc123');
  assert.equal(helpers.baseRoomPlayerId(),'uid:abc123');
});

test('baseRoomPlayerId falls back to stable guest id', ()=>{
  const {helpers,state}=createHelpers();
  const first=helpers.baseRoomPlayerId();
  const second=helpers.baseRoomPlayerId();
  assert.equal(first,second);
  assert.match(first,/^guest:/);
  assert.equal(state.sessionId,first);
});

test('currentRoomPlayerId prefers pinned room player id', ()=>{
  const {helpers}=createHelpers({room:{playerId:'uid:pinned'}});
  assert.equal(helpers.currentRoomPlayerId(),'uid:pinned');
});

test('currentAuthUserUid trims firebase uid', ()=>{
  const {helpers}=createHelpers({},'  abc123  ');
  assert.equal(helpers.currentAuthUserUid(),'abc123');
});
