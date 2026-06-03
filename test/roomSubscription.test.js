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
    syncRoomLobbySeatPanel(){return true;},
    syncRoomGameRoster(){return null;},
    syncRoomSelfScoreIfNeeded(){},
    t(key){return key;}
  };
  return createRoomSubscriptionController({...deps,...overrides});
}

function createSnapshotHarness(overrides={}){
  const state={room:{id:'',playerId:'',error:'',pendingStart:false,joinOpen:false},home:{mode:'solo'}};
  const calls={
    abandon:[],
    errors:[],
    renders:0,
    syncLobby:0,
    startPing:0,
    syncSelf:0,
    applySnapshots:0,
    updates:[],
    deleteDirs:[],
    maybeRunAi:0
  };
  let snapshotCb=null;
  const roomDb={
    collection(name){
      assert.equal(name,'big2Rooms');
      return{
        doc(id){
          assert.equal(id,'room-1');
          return{
            update(payload){
              calls.updates.push(payload);
              return Promise.resolve();
            },
            onSnapshot(cb){
              snapshotCb=cb;
              return ()=>{};
            }
          };
        }
      };
    }
  };
  const controller=createRoomSubscriptionController({
    FIRESTORE_ROOMS_COLLECTION:'big2Rooms',
    FIRESTORE_USERS_COLLECTION:'big2Users',
    LOCAL_ROOM_KEY:'big2.currentRoomId',
    ROOM_HOST_TAKEOVER_MS:45000,
    ROOM_STALE_MS:30000,
    abandonRoomLocally(msg='',openLobby=true){
      calls.abandon.push({msg,openLobby});
      state.room.error=msg;
      state.room.joinOpen=openLobby;
    },
    applyRoomGameSnapshot(data){
      calls.applySnapshots+=1;
      calls.lastSnapshot=data;
    },
    baseRoomPlayerId(){return 'guest:1';},
    clearRoomStartPending(){},
    currentAuthUserUid(){return '';},
    currentRoomDb(){return roomDb;},
    deleteRoomDirectory:async(id)=>{calls.deleteDirs.push(id);},
    findRoomDirectoryByCode:async()=>null,
    getFirebaseDb(){return roomDb;},
    getFirebaseDbForInstanceId:async()=>roomDb,
    getState(){return state;},
    isRoomPlayerActive(){return true;},
    isRoomPresenceOnlyUpdate(){return false;},
    matchGuestPlayerId(){return '';},
    maybeRunRoomAi(){calls.maybeRunAi+=1;},
    primaryFirebaseInstanceId(){return 'seed-services';},
    readRoomDirectory:async()=>null,
    render(){calls.renders+=1;},
    roomLifecycleExpired(){return false;},
    roomPlayerIds(players){return players.map((p)=>String(p.uid));},
    roomResultExpired(){return false;},
    roomSelfSeat(){return 0;},
    selectRoomHostCandidate(){return null;},
    setRoomError(value){calls.errors.push(value); state.room.error=value;},
    setRoomResultExpiryReached(){},
    startRoomPresencePing(){calls.startPing+=1;},
    syncRoomLobbySeatPanel(){calls.syncLobby+=1; return true;},
    syncRoomGameRoster(){return null;},
    syncRoomSelfScoreIfNeeded(){calls.syncSelf+=1;},
    t(key){return key;},
    ...overrides
  });
  return{state,calls,controller,triggerSnapshot:(snap)=>{assert.ok(snapshotCb,'snapshot callback not registered');snapshotCb(snap);},roomDb};
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

test('resolveRoomDocByDirectory returns null when a stale room code no longer resolves', async()=>{
  const firebaseDb={
    collection(name){
      assert.equal(name,'big2Rooms');
      return{
        where(field,op,value){
          assert.equal(field,'code');
          assert.equal(op,'==');
          assert.equal(value,'ABCD');
          return{
            limit(count){
              assert.equal(count,1);
              return{
                get:async()=>({docs:[]})
              };
            }
          };
        }
      };
    }
  };
  const controller=createController({
    getFirebaseDb(){return firebaseDb;}
  });
  const resolved=await controller.resolveRoomDocByDirectory('','abcd');
  assert.equal(resolved,null);
});

test('subscribeRoom clears reconnect error on a fresh snapshot and renders the first lobby state', ()=>{
  const {state,calls,controller,triggerSnapshot}=createSnapshotHarness();
  state.room.error='roomReconnecting';
  controller.subscribeRoom('room-1','ABCD','seed-services');
  triggerSnapshot({
    exists:true,
    data(){
      return{
        code:'ABCD',
        status:'lobby',
        updatedAt:Date.now(),
        players:[{uid:'guest:1',name:'Player',seat:0,lastSeen:Date.now()}]
      };
    }
  });
  assert.equal(state.room.error,'');
  assert.equal(state.room.id,'room-1');
  assert.equal(calls.startPing,1);
  assert.equal(calls.syncSelf,1);
  assert.equal(calls.syncLobby,0);
  assert.equal(calls.renders,1);
  assert.deepEqual(calls.errors,['']);
  assert.ok(calls.updates.length>=1);
  assert.deepEqual(calls.updates[0].playerIds,['guest:1']);
  assert.equal(typeof calls.updates[0].updatedAt,'number');
});

test('subscribeRoom skips lobby repaints when only presence fields change', ()=>{
  const {calls,controller,triggerSnapshot}=createSnapshotHarness();
  controller.subscribeRoom('room-1','ABCD','seed-services');
  const base=Date.now();
  triggerSnapshot({
    exists:true,
    data(){
      return{
        code:'ABCD',
        status:'lobby',
        updatedAt:base,
        players:[{uid:'guest:1',name:'Player',gender:'male',picture:'',seat:0,isHost:true,lastSeen:base}]
      };
    }
  });
  const rendersAfterFirst=calls.renders;
  triggerSnapshot({
    exists:true,
    data(){
      return{
        code:'ABCD',
        status:'lobby',
        updatedAt:base+1000,
        players:[{uid:'guest:1',name:'Player',gender:'male',picture:'',seat:0,isHost:true,lastSeen:base+1000}]
      };
    }
  });
  assert.equal(calls.renders,rendersAfterFirst);
});

test('subscribeRoom skips the starting repaint when the local host already marked pending start', ()=>{
  const {state,calls,controller,triggerSnapshot}=createSnapshotHarness();
  state.room.pendingStart=true;
  controller.subscribeRoom('room-1','ABCD','seed-services');
  const now=Date.now();
  triggerSnapshot({
    exists:true,
    data(){
      return{
        code:'ABCD',
        status:'starting',
        updatedAt:now,
        players:[{uid:'guest:1',name:'Player',gender:'male',picture:'',seat:0,isHost:true,lastSeen:now}]
      };
    }
  });
  assert.equal(calls.renders,0);
  assert.equal(state.room.error,'');
});

test('subscribeRoom updates the lobby seat panel in place when another player joins', ()=>{
  const {state,calls,controller,triggerSnapshot}=createSnapshotHarness();
  const now=Date.now();
  state.room.data={
    code:'ABCD',
    status:'lobby',
    updatedAt:now-1000,
    playerIds:['guest:1'],
    players:[
      {uid:'guest:1',name:'Player',gender:'male',picture:'',seat:0,isHost:true,lastSeen:now-1000}
    ]
  };
  controller.subscribeRoom('room-1','ABCD','seed-services');
  triggerSnapshot({
    exists:true,
    data(){
      return{
        code:'ABCD',
        status:'lobby',
        updatedAt:now,
        playerIds:['guest:1','guest:2'],
        players:[
          {uid:'guest:1',name:'Player',gender:'male',picture:'',seat:0,isHost:true,lastSeen:now},
          {uid:'guest:2',name:'Other',gender:'female',picture:'',seat:1,isHost:false,lastSeen:now}
        ]
      };
    }
  });
  assert.equal(calls.syncLobby,1);
  assert.equal(calls.renders,0);
});

test('subscribeRoom abandons locally when the room snapshot disappears', ()=>{
  const {calls,controller,triggerSnapshot}=createSnapshotHarness();
  controller.subscribeRoom('room-1','ABCD','seed-services');
  triggerSnapshot({exists:false});
  assert.deepEqual(calls.abandon,[{msg:'roomDisconnected',openLobby:true}]);
});
