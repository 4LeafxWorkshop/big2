import test from 'node:test';
import assert from 'node:assert/strict';

import {createRoomTimeoutController} from '../src/roomTimeouts.js';

function createController(overrides={}){
  const logs=[];
  const deps={
    ROOM_TIMEOUT_STRIKES_MAX:2,
    addRoomSystemLog(game,text){
      logs.push(text);
      if(game){
        if(!Array.isArray(game.systemLog))game.systemLog=[];
        game.systemLog.push({text});
      }
    },
    botProfileForSeat(seat){
      return{name:`Bot ${seat+1}`,gender:seat===1?'female':'male'};
    },
    cloneRoomGame(game){
      return structuredClone(game);
    },
    t(key){
      return key;
    }
  };
  return{
    logs,
    controller:createRoomTimeoutController({...deps,...overrides})
  };
}

test('applyTimeoutStrikeToRoomState increments strike count before replacement threshold', ()=>{
  const {controller}=createController();
  const result=controller.applyTimeoutStrikeToRoomState(
    [{uid:'uid:1',name:'Alice',seat:0,timeoutStrikes:0}],
    {players:[{uid:'uid:1',name:'Alice',gender:'female',isHuman:true}]},
    0,
    123
  );
  assert.equal(result.changed,true);
  assert.equal(result.kicked,false);
  assert.equal(result.strikes,1);
  assert.equal(result.players[0].timeoutStrikes,1);
});

test('applyTimeoutStrikeToRoomState replaces player with bot at max strikes', ()=>{
  const {controller,logs}=createController();
  const result=controller.applyTimeoutStrikeToRoomState(
    [{uid:'uid:1',name:'Alice',seat:0,timeoutStrikes:1,isHuman:true}],
    {players:[{uid:'uid:1',name:'Alice',gender:'female',picture:'x',isHuman:true}]},
    0,
    123
  );
  assert.equal(result.changed,true);
  assert.equal(result.kicked,true);
  assert.equal(result.strikes,2);
  assert.equal(result.playerName,'Alice');
  assert.equal(result.players[0].uid,'bot:0:Bot 1');
  assert.equal(result.players[0].isHuman,false);
  assert.equal(result.players[0].timeoutStrikes,0);
  assert.equal(result.game.players[0].uid,'bot:0:Bot 1');
  assert.equal(result.game.players[0].isHuman,false);
  assert.deepEqual(logs,['Alice roomKickedTimeout']);
});

test('resetTimeoutStrikeForSeat clears accumulated timeout strikes', ()=>{
  const {controller}=createController();
  const result=controller.resetTimeoutStrikeForSeat(
    [{uid:'uid:1',name:'Alice',seat:0,timeoutStrikes:2}],
    0
  );
  assert.equal(result.changed,true);
  assert.equal(result.players[0].timeoutStrikes,0);
});
