import test from 'node:test';
import assert from 'node:assert/strict';

import {renderRoomActiveCardHtml, renderRoomCreateCardHtml, renderRoomSeatMiniHtml} from '../src/roomLobbyCard.js';

test('renderRoomCreateCardHtml renders the create button', ()=>{
  const html=renderRoomCreateCardHtml({
    t:(key)=>key
  });
  assert.match(html,/room-create-card/);
  assert.match(html,/roomCreate/);
});

test('renderRoomSeatMiniHtml renders empty and filled seats', ()=>{
  const empty=renderRoomSeatMiniHtml({
    entry:null,
    idx:1,
    t:(key)=>key,
    esc:(value)=>String(value),
    isRoomPlayerHuman:()=>true,
    authPictureUrlFrom:(value)=>`pic:${value}`,
    avatarDataUri:(name)=>`avatar:${name}`
  });
  const filled=renderRoomSeatMiniHtml({
    entry:{name:'Alice',gender:'female',picture:''},
    idx:0,
    t:(key)=>{
      if(key==='seatLabel')return'Seat {{n}}';
      return key;
    },
    esc:(value)=>String(value),
    isRoomPlayerHuman:()=>true,
    authPictureUrlFrom:(value)=>`pic:${value}`,
    avatarDataUri:(name)=>`avatar:${name}`
  });
  assert.match(empty,/room-seat-mini vacant/);
  assert.match(filled,/room-seat-mini filled/);
  assert.match(filled,/Alice/);
});

test('renderRoomSeatMiniHtml ignores stale bot pictures', ()=>{
  const html=renderRoomSeatMiniHtml({
    entry:{name:'Bot 1',gender:'male',picture:'https://example.com/old.png',uid:'bot:1'},
    idx:0,
    t:(key)=>{
      if(key==='seatLabel')return'Seat {{n}}';
      return key;
    },
    esc:(value)=>String(value),
    isRoomPlayerHuman:()=>false,
    authPictureUrlFrom:(value)=>`pic:${value}`,
    avatarDataUri:(name,_color,_gender,isBot)=>`avatar:${name}:${isBot}`
  });
  assert.match(html,/avatar:Bot 1:true/);
  assert.doesNotMatch(html,/old\.png/);
});

test('renderRoomActiveCardHtml renders private and public room cards', ()=>{
  const html=renderRoomActiveCardHtml({
    room:{
      code:'ABCD',
      isPrivate:false,
      roster:[{name:'Alice',gender:'female',picture:''}],
      status:'lobby',
      roundCount:2,
      displayPlayers:1,
      maxPlayers:4
    },
    t:(key)=>{
      if(key==='roomStatusPlaying')return'Playing';
      if(key==='roomRound')return'Round';
      if(key==='roomJoin')return'Join';
      if(key==='roomSeatOpen')return'Open';
      if(key==='seatLabel')return'Seat {{n}}';
      return key;
    },
    esc:(value)=>String(value),
    isRoomPlayerHuman:()=>true,
    authPictureUrlFrom:(value)=>`pic:${value}`,
    avatarDataUri:(name)=>`avatar:${name}`
  });
  assert.match(html,/room-active-card/);
  assert.match(html,/ABCD/);
  assert.match(html,/Join/);
  assert.match(html,/room-card-join-inline/);
});
