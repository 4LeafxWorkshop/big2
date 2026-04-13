import test from 'node:test';
import assert from 'node:assert/strict';

import {createRoomExpiryHelpers} from '../src/roomExpiry.js';

function createHelpers(){
  return createRoomExpiryHelpers({
    DEFAULT_TURN_TIMEOUT_MS:20000,
    ROOM_IDLE_KILL_MS:120000,
    ROOM_RESULT_IDLE_MS:120000,
    ROOM_TIMEOUT_GRACE_MS:2000
  });
}

test('room expiry helpers compute lobby and result expiry timestamps', ()=>{
  const h=createHelpers();
  assert.equal(h.getRoomWaitingExpiresAt({status:'lobby',updatedAt:1000}),121000);
  assert.equal(h.getRoomResultExpiresAt({status:'finished',updatedAt:1000}),121000);
  assert.equal(h.getRoomLifecycleExpiresAt({status:'starting',createdAt:2000}),122000);
});

test('room expiry helpers compute countdown text for lobby and active rooms', ()=>{
  const h=createHelpers();
  const originalNow=Date.now;
  Date.now=()=>5000;
  try{
    assert.equal(h.roomCountdownText({status:'lobby',expiresAt:15000}),'0:10');
    assert.equal(h.roomCountdownText({status:'playing',game:{turnStartedAt:0,gameOver:false}}),'-');
    assert.equal(h.roomCountdownText({status:'playing',game:{turnStartedAt:0,gameOver:true}}),'-');
  }finally{
    Date.now=originalNow;
  }
});

test('room expiry helpers use turn timeout for active games', ()=>{
  const h=createHelpers();
  const originalNow=Date.now;
  Date.now=()=>4000;
  try{
    assert.equal(
      h.roomCountdownText({status:'playing',settings:{turnTimeout:10000},game:{turnStartedAt:1000,gameOver:false}}),
      '0:07'
    );
    assert.equal(h.getRoomTurnTimeout({settings:{turnTimeout:15000}}),15000);
    assert.equal(h.getRoomTurnTimeoutWithGrace({settings:{turnTimeout:15000}}),17000);
  }finally{
    Date.now=originalNow;
  }
});

test('room expiry helpers report expired state consistently', ()=>{
  const h=createHelpers();
  assert.equal(h.roomLifecycleExpired({status:'lobby',expiresAt:10},11),true);
  assert.equal(h.roomResultExpired({status:'finished',resultExpiresAt:10},11),true);
});
