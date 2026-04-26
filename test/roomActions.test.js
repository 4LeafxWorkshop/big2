import test from 'node:test';
import assert from 'node:assert/strict';

import {createRoomActionsController} from '../src/roomActions.js';

function createController(overrides={}){
  const calls={errors:[],renderCount:0};
  const deps={
    ROOM_RESULT_IDLE_MS:120000,
    addRoomSystemLog(){},
    authPictureUrl(){return '';},
    baseRoomPlayerId(){return 'uid:1';},
    chooseNextRoomFirebaseInstanceId:async()=> 'instance-1',
    cloneRoomGame(game){return game;},
    collectMainSettings(){return {};},
    connectToRoom(){},
    currentHumanScoreValue(){return 5000;},
    ensureSingleRoomMembership:async()=>({ok:true}),
    findRoomByCode:async()=>null,
    gateGuestRoomAccess:async()=>({ok:true}),
    gateUserRoomAccess:async()=>({ok:true}),
    generateRoomCode:()=> 'ABCDE1',
    getFirebaseDbForInstanceId:async()=>null,
    getState:()=>({room:{id:'',joinOpen:false},home:{name:'Player',gender:'male'}}),
    initFirebaseIfReady:()=>false,
    isRoomPlayerActive:()=>true,
    isRoomPlayerHuman:()=>true,
    nextRoomIdleExpiry:(now)=>now+120000,
    normalizeRoomTotals:(totals)=>Array.isArray(totals)?totals:[5000,5000,5000,5000],
    render(){calls.renderCount+=1;},
    roomPlayerIds:(players)=>players.map((p)=>String(p.uid)),
    roomTotalsWithSeatScore:(totals)=>totals,
    signedInForPlay:()=>false,
    subscribeRoom(){},
    syncRoomDirectory:async()=>true,
    t:(key)=>key,
    updateActiveRoomPointer(){},
    writeRoomDirectory:async()=>true,
    ...overrides,
    setRoomError(value){calls.errors.push(value);}
  };
  return{calls,controller:createRoomActionsController(deps)};
}

test('createRoom reports when firebase is unavailable', async()=>{
  const {calls,controller}=createController();
  await controller.createRoom();
  assert.equal(calls.errors[0],'roomCreateFail');
});

test('joinRoomByCode reports when firebase is unavailable', async()=>{
  const {calls,controller}=createController();
  await controller.joinRoomByCode('room1');
  assert.equal(calls.errors[0],'roomJoinFail');
});

test('joinRoomByCode clears a claimed pointer if the room write fails', async()=>{
  const pointerUpdates=[];
  const roomDb={
    runTransaction:async()=>{
      throw new Error('room full');
    }
  };
  const {calls,controller}=createController({
    signedInForPlay:()=>true,
    initFirebaseIfReady:()=>true,
    findRoomByCode:async()=>({
      id:'room-1',
      instanceId:'instance-1',
      data:()=>({
        status:'lobby',
        players:[],
        maxPlayers:4
      }),
      ref:{firestore:roomDb}
    }),
    getFirebaseDbForInstanceId:async()=>roomDb,
    gateUserRoomAccess:async()=>({ok:true,claimed:true}),
    gateGuestRoomAccess:async()=>({ok:true}),
    updateActiveRoomPointer:async(value)=>{pointerUpdates.push(value);}
  });
  await controller.joinRoomByCode('room1');
  assert.deepEqual(pointerUpdates,['']);
  assert.equal(calls.errors.at(-1),'roomFull');
});
