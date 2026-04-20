import test from 'node:test';
import assert from 'node:assert/strict';

import {isRoomPresenceOnlyUpdate} from '../src/roomPresence.js';

test('isRoomPresenceOnlyUpdate treats emote seat changes as game updates', ()=>{
  const prev={
    status:'playing',
    gameVersion:1,
    code:'ABCD',
    hostId:'uid:1',
    hostName:'Alice',
    isPrivate:false,
    maxPlayers:4,
    roundCount:1,
    game:{emote:{id:'cheers',ts:10,by:'seat:1',seat:1}},
    emote:{id:'wave',ts:11,by:'seat:1',seat:1},
    players:[{uid:'uid:1',name:'Alice',gender:'female',picture:'',isHost:true,seat:0}]
  };
  const next={
    ...prev,
    game:{emote:{id:'cheers',ts:10,by:'seat:1',seat:2}},
    emote:{id:'wave',ts:11,by:'seat:1',seat:2}
  };
  assert.equal(isRoomPresenceOnlyUpdate(prev,next),false);
});

test('isRoomPresenceOnlyUpdate still accepts identical presence-only snapshots', ()=>{
  const prev={
    status:'playing',
    gameVersion:1,
    code:'ABCD',
    hostId:'uid:1',
    hostName:'Alice',
    isPrivate:false,
    maxPlayers:4,
    roundCount:1,
    game:{emote:{id:'cheers',ts:10,by:'seat:1',seat:1}},
    emote:{id:'wave',ts:11,by:'seat:1',seat:1},
    players:[{uid:'uid:1',name:'Alice',gender:'female',picture:'',isHost:true,seat:0}]
  };
  const next={
    ...prev,
    game:{emote:{id:'cheers',ts:10,by:'seat:1',seat:1}},
    emote:{id:'wave',ts:11,by:'seat:1',seat:1}
  };
  assert.equal(isRoomPresenceOnlyUpdate(prev,next),true);
});
