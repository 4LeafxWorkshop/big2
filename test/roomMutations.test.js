import test from 'node:test';
import assert from 'node:assert/strict';

import {createRoomMutationsController} from '../src/roomMutations.js';

function createRoomDb(docData,updates){
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

function createState(overrides={}){
  return{
    score:5400,
    home:{name:'Player',gender:'male'},
    room:{
      id:'room-1',
      data:{
        status:'lobby',
        hostId:'uid:123',
        hostName:'Host',
        players:[
          {uid:'uid:123',name:'Player',gender:'male',seat:0,lastSeen:0},
          {uid:'uid:999',name:'Other',gender:'female',seat:1,lastSeen:0}
        ],
        totals:[5000,5000,5000,5000]
      }
    },
    ...overrides
  };
}

function createController(state,updates,overrides={}){
  const calls={roomErrors:[],soloStatuses:[]};
  const deps={
    FIRESTORE_ROOMS_COLLECTION:'big2Rooms',
    ROOM_RESULT_IDLE_MS:60000,
    authPictureUrl(){return '';},
    buildRoomGameState(){return {players:[]};},
    bumpRoomPlayerLastSeen(players){return{players,changed:false};},
    clampScoreValue(value){return Math.max(0,Math.trunc(Number(value)||0));},
    clearRoomStartPending(){},
    currentRoomDb(){return createRoomDb(state.room.data,updates);},
    currentRoomPlayerId(){return 'uid:123';},
    getState(){return state;},
    nextRoomIdleExpiry(now){return now+60000;},
    normalizeRoomTotals(totals){return Array.isArray(totals)&&totals.length===4?totals.map((v)=>Number(v)||0):[5000,5000,5000,5000];},
    roomPlayerIds(players){return players.map((p)=>String(p.uid));},
    roomResultExpired(){return false;},
    roomSeatForPlayer(roomData,uid){return (roomData.players||[]).find((p)=>String(p.uid)===String(uid))?.seat ?? -1;},
    roomTotalsWithSeatScore(totals,seat,score){const next=[...totals];next[seat]=score;return next;},
    sanitizeRoomPlayerEntry(entry){return {...entry};},
    setRoomError(value){calls.roomErrors.push(value);},
    setSoloStatus(value){calls.soloStatuses.push(value);},
    t(key){return key;}
  };
  return{
    calls,
    controller:createRoomMutationsController({...deps,...overrides})
  };
}

test('setRoomPrivacy updates privacy for the host while room is not playing', async()=>{
  const state=createState();
  const updates=[];
  const {controller}=createController(state,updates);
  await controller.setRoomPrivacy(true);
  assert.equal(updates.length,1);
  assert.equal(updates[0].payload.isPrivate,true);
  assert.equal(typeof updates[0].payload.updatedAt,'number');
});

test('syncRoomSelfScoreIfNeeded writes new totals when local score differs from room totals', async()=>{
  const state=createState();
  const updates=[];
  const {controller}=createController(state,updates);
  await controller.syncRoomSelfScoreIfNeeded();
  assert.equal(updates.length,1);
  assert.deepEqual(updates[0].payload.totals,[5400,5000,5000,5000]);
  assert.equal(typeof updates[0].payload.updatedAt,'number');
});

test('resetRoomExpiryTo60s refreshes finished-room expiry and result expiry together', async()=>{
  const state=createState({
    room:{
      id:'room-1',
      data:{
        status:'finished',
        hostId:'uid:123',
        hostName:'Host',
        players:[{uid:'uid:123',name:'Player',gender:'male',seat:0,lastSeen:0}],
        totals:[5000,5000,5000,5000]
      }
    }
  });
  const updates=[];
  const {controller}=createController(state,updates,{
    nextRoomIdleExpiry(now){return now+60000;}
  });
  await controller.resetRoomExpiryTo60s();
  assert.equal(updates.length,1);
  assert.equal(typeof updates[0].payload.updatedAt,'number');
  assert.equal(updates[0].payload.expiresAt,updates[0].payload.updatedAt+60000);
  assert.equal(updates[0].payload.resultExpiresAt,updates[0].payload.updatedAt+60000);
});
