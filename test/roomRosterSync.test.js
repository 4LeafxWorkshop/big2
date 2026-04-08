import test from 'node:test';
import assert from 'node:assert/strict';

import {createRoomRosterSyncController} from '../src/roomRosterSync.js';

function createController(overrides={}){
  const deps={
    ROOM_PRUNE_PLAYING_MS:30000,
    botProfileForSeat(seat){
      return{name:`Bot ${seat+1}`,gender:seat===1?'female':'male'};
    },
    cloneRoomGame(game){
      return structuredClone(game);
    },
    isRoomPlayerActive(entry,status,now){
      const lastSeen=Number(entry?.lastSeen)||0;
      return status!=='playing' || now-lastSeen<=30000;
    }
  };
  return createRoomRosterSyncController({...deps,...overrides});
}

test('isBotRoomEntry detects explicit bot players and bot uid prefixes', ()=>{
  const controller=createController();
  assert.equal(controller.isBotRoomEntry({isHuman:false,uid:'uid:1'}),true);
  assert.equal(controller.isBotRoomEntry({uid:'bot:1:Bot'}),true);
  assert.equal(controller.isBotRoomEntry({uid:'ai:1:Bot'}),true);
  assert.equal(controller.isBotRoomEntry({uid:'uid:1',isHuman:true}),false);
});

test('syncRoomGameRoster updates a seat from stale bot game data to active human roster data', ()=>{
  const controller=createController();
  const updated=controller.syncRoomGameRoster({
    status:'lobby',
    players:[
      {uid:'uid:1',name:'Alice',gender:'female',picture:'pic-a',seat:0,isHuman:true,lastSeen:1000}
    ],
    game:{
      players:[
        {uid:'bot:0:Bot 1',name:'Bot 1',gender:'male',picture:'',isHuman:false,seat:0},
        {uid:'bot:1:Bot 2',name:'Bot 2',gender:'female',picture:'',isHuman:false,seat:1}
      ]
    }
  });
  assert.ok(updated);
  assert.equal(updated.players[0].isHuman,true);
  assert.equal(updated.players[0].uid,'uid:1');
  assert.equal(updated.players[0].name,'Alice');
  assert.equal(updated.players[0].picture,'pic-a');
});

test('syncRoomGameRoster replaces stale inactive playing-seat humans with bots', ()=>{
  const now=Date.now();
  const controller=createController({
    isRoomPlayerActive(entry,status,currentNow){
      assert.equal(status,'playing');
      return currentNow-Number(entry.lastSeen||0)<=30000;
    }
  });
  const updated=controller.syncRoomGameRoster({
    status:'playing',
    players:[
      {uid:'uid:1',name:'Alice',gender:'female',picture:'pic-a',seat:0,isHuman:true,lastSeen:now-40000}
    ],
    game:{
      turnStartedAt:now-40000,
      players:[
        {uid:'uid:1',name:'Alice',gender:'female',picture:'pic-a',isHuman:true,seat:0},
        {uid:'uid:2',name:'Bob',gender:'male',picture:'pic-b',isHuman:true,seat:1}
      ]
    }
  });
  assert.ok(updated);
  assert.equal(updated.players[0].isHuman,false);
  assert.equal(updated.players[0].uid,'bot:0:Bot 1');
  assert.equal(updated.players[1].isHuman,false);
  assert.equal(updated.players[1].uid,'bot:1:Bot 2');
});
