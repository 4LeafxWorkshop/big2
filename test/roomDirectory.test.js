import test from 'node:test';
import assert from 'node:assert/strict';

import {buildRoomDirectoryDoc, roomDirectoryDocToActiveRoom} from '../src/roomDirectory.js';

test('buildRoomDirectoryDoc mirrors lobby summary fields', ()=>{
  const doc=buildRoomDirectoryDoc({
    roomId:'room-1',
    firebaseInstanceId:'seed-services',
    roomData:{
      code:'abcd12',
      createdAt:1000,
      updatedAt:2000,
      hostId:'uid:1',
      hostName:'Alice',
      status:'lobby',
      isPrivate:true,
      maxPlayers:4,
      roundCount:3,
      players:[
        {uid:'uid:1',name:'Alice',gender:'female',picture:'pic:1',seat:0,lastSeen:1800},
        {uid:'guest:2',name:'Bob',gender:'male',picture:'',seat:1,lastSeen:1700}
      ]
    }
  });
  assert.deepEqual(doc,{
    roomId:'room-1',
    code:'ABCD12',
    createdAt:1000,
    hostId:'uid:1',
    hostName:'Alice',
    firebaseInstanceId:'seed-services',
    status:'lobby',
    updatedAt:2000,
    isPrivate:true,
    maxPlayers:4,
    playerCount:2,
    roundCount:3,
    roster:[
      {seat:0,name:'Alice',gender:'female',picture:'pic:1',uid:'uid:1',lastSeen:1800,isBot:false},
      {seat:1,name:'Bob',gender:'male',picture:'',uid:'guest:2',lastSeen:1700,isBot:false}
    ]
  });
});

test('buildRoomDirectoryDoc uses game roster outside the lobby', ()=>{
  const doc=buildRoomDirectoryDoc({
    roomId:'room-2',
    firebaseInstanceId:'fourleafbig2',
    roomData:{
      code:'ROOM22',
      createdAt:1000,
      updatedAt:3000,
      hostId:'uid:1',
      hostName:'Alice',
      status:'playing',
      isPrivate:false,
      maxPlayers:4,
      roundCount:1,
      players:[
        {uid:'uid:1',name:'Alice',gender:'female',picture:'',seat:0,lastSeen:2500}
      ],
      game:{
        players:[
          {uid:'uid:1',name:'Alice',gender:'female',picture:'',seat:0,isHuman:true},
          {uid:'bot:1',name:'Bot 2',gender:'male',picture:'',seat:1,isHuman:false}
        ]
      }
    }
  });
  assert.equal(doc?.roster.length,2);
  assert.equal(doc?.roster[1].isBot,true);
  assert.equal(doc?.roster[1].name,'Bot 2');
});

test('roomDirectoryDocToActiveRoom converts mirrored directory docs to active room rows', ()=>{
  const row=roomDirectoryDocToActiveRoom({
    roomId:'room-1',
    code:'ABCD12',
    createdAt:1000,
    hostId:'uid:1',
    hostName:'Alice',
    firebaseInstanceId:'seed-services',
    status:'starting',
    updatedAt:2000,
    isPrivate:false,
    maxPlayers:4,
    playerCount:2,
    roundCount:0,
    roster:[
      {seat:1,name:'Bob',gender:'male',picture:'',uid:'guest:2',lastSeen:1700,isBot:false},
      {seat:0,name:'Alice',gender:'female',picture:'pic:1',uid:'uid:1',lastSeen:1800,isBot:false}
    ]
  });
  assert.deepEqual(row,{
    id:'room-1',
    code:'ABCD12',
    hostName:'Alice',
    hostId:'uid:1',
    isPrivate:false,
    status:'starting',
    roundCount:0,
    players:2,
    displayPlayers:2,
    maxPlayers:4,
    roster:[
      {seat:0,name:'Alice',gender:'female',picture:'pic:1',uid:'uid:1',lastSeen:1800,isBot:false},
      {seat:1,name:'Bob',gender:'male',picture:'',uid:'guest:2',lastSeen:1700,isBot:false}
    ],
    firebaseInstanceId:'seed-services',
    updatedAt:2000,
    createdAt:1000
  });
});
