import test from 'node:test';
import assert from 'node:assert/strict';

import {createRoomLifecycleController} from '../src/roomLifecycle.js';

function createBaseState(){
  return{
    screen:'game',
    selected:new Set(['C3']),
    recommendation:{cards:['C3']},
    opponentProfileName:'Bot',
    home:{mode:'room'},
    room:{
      id:'room-1',
      code:'ABCD',
      firebaseInstanceId:'seed-services',
      data:{status:'lobby'},
      joinOpen:false,
      error:'old error',
      started:true,
      unsub:null,
      selfSeat:2,
      recordedGameKey:'g1',
      pendingStart:true,
      playerId:'uid:123'
    }
  };
}

function createDeps(state,overrides={}){
  const calls={
    clearedPending:0,
    render:0,
    recommendHints:[],
    roomResultExpiry:[],
    activeRoomPointers:[],
    presenceTimerValues:[]
  };
  const deps={
    FIRESTORE_ROOMS_COLLECTION:'big2Rooms',
    addRoomSystemLog(){},
    botProfileForSeat(){return{name:'Bot',gender:'male'};},
    clearRoomStartPending(){calls.clearedPending+=1;},
    cloneRoomGame(game){return structuredClone(game);},
    currentRoomDb(){return null;},
    currentRoomPlayerId(){return 'uid:123';},
    deleteRoomDirectory:async()=>{},
    getRoomPresenceTimer(){return null;},
    getState(){return state;},
    loadActiveRooms:async()=>{},
    render(){calls.render+=1;},
    roomLeaveLogText:(name)=>`${name} left`,
    roomPlayerIds(players){return players.map((p)=>String(p.uid));},
    setRecommendHint(value){calls.recommendHints.push(value);},
    setRoomPresenceTimer(value){calls.presenceTimerValues.push(value);},
    setRoomResultExpiryReached(value){calls.roomResultExpiry.push(value);},
    updateActiveRoomPointer:async(roomId)=>{calls.activeRoomPointers.push(roomId);}
  };
  return{
    calls,
    controller:createRoomLifecycleController({...deps,...overrides})
  };
}

function createPlayingRoomDb(docData,updates){
  return{
    collection(name){
      assert.equal(name,'big2Rooms');
      return{
        doc(id){
          assert.equal(id,'room-1');
          return {id};
        }
      };
    },
    async runTransaction(fn){
      const tx={
        async get(){
          return{
            exists:true,
            data(){return structuredClone(docData);}
          };
        },
        update(ref,payload){
          updates.push({ref,payload});
        }
      };
      await fn(tx);
    }
  };
}

test('resetRoomState clears local room session and restores solo home mode', ()=>{
  const state=createBaseState();
  let unsubCalled=0;
  let clearedTimer=0;
  const presenceTimerValues=[];
  state.room.unsub=()=>{unsubCalled+=1;};
  const deps=createDeps(state,{
    getRoomPresenceTimer(){return 42;},
    setRoomPresenceTimer(value){
      presenceTimerValues.push(value);
    }
  });
  const originalClearInterval=global.clearInterval;
  global.clearInterval=(value)=>{clearedTimer=value;};
  try{
    deps.controller.resetRoomState();
  }finally{
    global.clearInterval=originalClearInterval;
  }
  assert.equal(unsubCalled,1);
  assert.equal(clearedTimer,42);
  assert.equal(state.home.mode,'solo');
  assert.equal(state.room.id,'');
  assert.equal(state.room.playerId,'');
  assert.equal(state.room.joinOpen,false);
  assert.deepEqual(presenceTimerValues,[null]);
  assert.deepEqual(deps.calls.roomResultExpiry,[false]);
  assert.deepEqual(deps.calls.activeRoomPointers,['']);
  assert.equal(deps.calls.clearedPending,1);
});

test('abandonRoomLocally clears ephemeral game state and opens lobby when requested', ()=>{
  const state=createBaseState();
  const deps=createDeps(state);
  deps.controller.abandonRoomLocally('stale room',true);
  assert.equal(state.screen,'home');
  assert.equal(state.home.mode,'solo');
  assert.equal(state.selected.size,0);
  assert.equal(state.recommendation,null);
  assert.equal(state.opponentProfileName,'');
  assert.equal(state.room.id,'');
  assert.equal(state.room.playerId,'');
  assert.equal(state.room.joinOpen,true);
  assert.equal(state.room.error,'stale room');
  assert.deepEqual(deps.calls.recommendHints,['']);
  assert.equal(deps.calls.render,1);
});

test('leaveRoom with lobby return clears local state and opens the lobby immediately', async()=>{
  const state=createBaseState();
  const deps=createDeps(state,{
    currentRoomDb(){return null;}
  });
  await deps.controller.leaveRoom(true);
  assert.equal(state.screen,'home');
  assert.equal(state.home.mode,'solo');
  assert.equal(state.selected.size,0);
  assert.equal(state.recommendation,null);
  assert.equal(state.opponentProfileName,'');
  assert.equal(state.room.id,'');
  assert.equal(state.room.playerId,'');
  assert.equal(state.room.joinOpen,true);
  assert.equal(state.room.error,'');
  assert.deepEqual(deps.calls.recommendHints,['']);
  assert.equal(deps.calls.render,1);
});

test('leaveRoom in a playing room transfers the host when others remain', async()=>{
  const state=createBaseState();
  state.room.data={
    status:'playing',
    hostId:'uid:123',
    hostName:'Host',
    players:[
      {uid:'uid:123',name:'Host',gender:'male',seat:0,lastSeen:0},
      {uid:'guest:456',name:'Guest',gender:'female',seat:1,lastSeen:0}
    ],
    game:{
      players:[
        {uid:'uid:123',name:'Host',gender:'male',seat:0,isHuman:true,hand:[{id:'c1'}]},
        {uid:'guest:456',name:'Guest',gender:'female',seat:1,isHuman:true,hand:[{id:'c2'}]}
      ]
    }
  };
  const updates=[];
  const deps=createDeps(state,{
    currentRoomDb(){return createPlayingRoomDb(state.room.data,updates);},
    currentRoomPlayerId(){return 'uid:123';},
    botProfileForSeat(){return{name:'Bot Seat',gender:'male'};}
  });
  await deps.controller.leaveRoom(false);
  assert.equal(updates.length,1);
  assert.equal(updates[0].payload.hostId,'guest:456');
  assert.equal(updates[0].payload.hostName,'Guest');
  assert.equal(updates[0].payload.players.length,1);
  assert.equal(updates[0].payload.players[0].uid,'guest:456');
  assert.equal(updates[0].payload.game.players[0].isHuman,false);
  assert.match(updates[0].payload.game.players[0].uid,/^bot:0:/);
});
