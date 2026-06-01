import test from 'node:test';
import assert from 'node:assert/strict';

import {resolveRoomLaunchState} from '../src/roomLaunchState.js';

test('resolveRoomLaunchState blocks start while score is restoring', ()=>{
  const result=resolveRoomLaunchState({
    state:{
      home:{google:{signedIn:true,hydrating:true}},
      room:{pendingStart:false}
    },
    roomData:{
      status:'lobby',
      players:[
        {uid:'uid:a'},
        {uid:'guest:b'}
      ]
    }
  });
  assert.equal(result.profileRestorePending,true);
  assert.equal(result.roomCanStart,true);
  assert.equal(result.startDisabled,true);
  assert.equal(result.startSubtitleKey,'restoringScore');
  assert.equal(result.startHintKey,'restoringScore');
});

test('resolveRoomLaunchState exposes ready and starting states consistently', ()=>{
  const ready=resolveRoomLaunchState({
    state:{
      home:{google:{signedIn:true,hydrating:false}},
      room:{pendingStart:false}
    },
    roomData:{
      status:'lobby',
      players:[
        {uid:'uid:a'},
        {uid:'guest:b'}
      ]
    }
  });
  assert.equal(ready.startDisabled,false);
  assert.equal(ready.startSubtitleKey,'startReadySubtitle');
  assert.equal(ready.lobbyHintKey,'roomWaitingHost');

  const starting=resolveRoomLaunchState({
    state:{
      home:{google:{signedIn:true,hydrating:false}},
      room:{pendingStart:false}
    },
    roomData:{
      status:'starting',
      players:[
        {uid:'uid:a'},
        {uid:'guest:b'}
      ]
    }
  });
  assert.equal(starting.roomStarting,true);
  assert.equal(starting.startDisabled,true);
  assert.equal(starting.startSubtitleKey,'startingGame');
  assert.equal(starting.startHintKey,'roomStarting');
  assert.equal(starting.lobbyHintKey,'roomStarting');
});

test('resolveRoomLaunchState shows a pending prompt while room start is syncing', ()=>{
  const pending=resolveRoomLaunchState({
    state:{
      home:{google:{signedIn:true,hydrating:false}},
      room:{pendingStart:true}
    },
    roomData:{
      status:'lobby',
      players:[
        {uid:'uid:a'},
        {uid:'guest:b'}
      ]
    }
  });
  assert.equal(pending.roomStartPending,true);
  assert.equal(pending.startDisabled,true);
  assert.equal(pending.startSubtitleKey,'startingGame');
  assert.equal(pending.startHintKey,'');
});
