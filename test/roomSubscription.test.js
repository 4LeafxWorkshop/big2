import test from 'node:test';
import assert from 'node:assert/strict';

import {createRoomSubscriptionController} from '../src/roomSubscription.js';

function createController(overrides={}){
  const defaultState={room:{id:'',playerId:'',error:'',pendingStart:false},home:{mode:'solo'}};
  const deps={
    FIRESTORE_ROOMS_COLLECTION:'big2Rooms',
    FIRESTORE_USERS_COLLECTION:'big2Users',
    LOCAL_ROOM_KEY:'big2.currentRoomId',
    ROOM_HOST_TAKEOVER_MS:45000,
    ROOM_STALE_MS:30000,
    abandonRoomLocally(){},
    applyRoomGameSnapshot(){},
    baseRoomPlayerId(){return 'guest:1';},
    clearRoomStartPending(){},
    currentAuthUserUid(){return '';},
    currentRoomDb(){return null;},
    deleteRoomDirectory:async()=>{},
    findRoomDirectoryByCode:async()=>null,
    getFirebaseDb(){return null;},
    getFirebaseDbForInstanceId:async()=>null,
    getState(){return defaultState;},
    isRoomPlayerActive(){return true;},
    isRoomPresenceOnlyUpdate(){return false;},
    matchGuestPlayerId(){return '';},
    maybeRunRoomAi(){},
    primaryFirebaseInstanceId(){return 'seed-services';},
    readRoomDirectory:async()=>null,
    render(){},
    roomLifecycleExpired(){return false;},
    roomPlayerIds(players){return players.map((p)=>String(p.uid));},
    roomResultExpired(){return false;},
    roomSelfSeat(){return -1;},
    selectRoomHostCandidate(){return null;},
    setRoomError(){},
    setRoomResultExpiryReached(){},
    startRoomPresencePing(){},
    syncRoomGameRoster(){return null;},
    syncRoomSelfScoreIfNeeded(){},
    t(key){return key;}
  };
  return createRoomSubscriptionController({...deps,...overrides});
}

test('resolveRoomHostInfo falls back to the first player when host is missing', ()=>{
  const controller=createController();
  const info=controller.resolveRoomHostInfo({
    hostId:'uid:missing',
    hostName:'',
    players:[
      {uid:'uid:1',name:'Alice'},
      {uid:'uid:2',name:'Bob'}
    ]
  });
  assert.deepEqual(info,{hostId:'uid:1',hostName:'Alice'});
});

test('resolveRoomHostInfo fills in missing host name from the roster', ()=>{
  const controller=createController();
  const info=controller.resolveRoomHostInfo({
    hostId:'uid:2',
    hostName:'',
    players:[
      {uid:'uid:1',name:'Alice'},
      {uid:'uid:2',name:'Bob'}
    ]
  });
  assert.deepEqual(info,{hostId:'uid:2',hostName:'Bob'});
});

test('resolveRoomDocByDirectory returns a legacy primary-room result when no directory exists', async()=>{
  const primarySnap={
    exists:true,
    id:'room-123',
    ref:{id:'room-123'},
    data(){return{code:'ABCD'};}
  };
  const firebaseDb={
    collection(name){
      assert.equal(name,'big2Rooms');
      return{
        doc(id){
          assert.equal(id,'room-123');
          return{
            get:async()=>primarySnap
          };
        }
      };
    }
  };
  const controller=createController({
    FIRESTORE_ROOMS_COLLECTION:'big2Rooms',
    getFirebaseDb(){return firebaseDb;}
  });
  const resolved=await controller.resolveRoomDocByDirectory('room-123','');
  assert.equal(resolved?.roomId,'room-123');
  assert.equal(resolved?.instanceId,'seed-services');
  assert.equal(resolved?.legacy,true);
  assert.equal(resolved?.db,firebaseDb);
  assert.equal(resolved?.doc,primarySnap);
});

test('resolveRoomDocByDirectory removes a stale directory entry when the shard room is missing', async()=>{
  const deleted=[];
  const directoryDoc={
    id:'dir-1',
    data(){return{roomId:'room-404',firebaseInstanceId:'shard-a'};}
  };
  const shardDb={
    collection(name){
      assert.equal(name,'big2Rooms');
      return{
        doc(id){
          assert.equal(id,'room-404');
          return{
            get:async()=>({exists:false})
          };
        }
      };
    }
  };
  const controller=createController({
    readRoomDirectory:async(id)=>{
      assert.equal(id,'dir-1');
      return directoryDoc;
    },
    getFirebaseDbForInstanceId:async(instanceId)=>{
      assert.equal(instanceId,'shard-a');
      return shardDb;
    },
    deleteRoomDirectory:async(id)=>{deleted.push(id);}
  });
  const resolved=await controller.resolveRoomDocByDirectory('dir-1','');
  assert.equal(resolved,null);
  assert.deepEqual(deleted,['dir-1']);
});

test('resolveRoomDocByDirectory returns null when no firebase db is available', async()=>{
  const controller=createController({
    getFirebaseDb(){return null;}
  });
  const resolved=await controller.resolveRoomDocByDirectory('room-1','');
  assert.equal(resolved,null);
});
