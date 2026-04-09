import test from 'node:test';
import assert from 'node:assert/strict';

import {renderRoomJoinOverlay, renderRoomLobbyOverlay} from '../src/roomView.js';

test('renderRoomLobbyOverlay returns empty string when hidden', ()=>{
  assert.equal(renderRoomLobbyOverlay({
    visible:false,
    roomTitle:'Room',
    roomCode:'ABCD',
    roomLobbyCountdown:'10s',
    roomPrivacyRow:'',
    roomSeats:'',
    roomErrorHtml:'',
    roomStartControl:'',
    roomPendingHint:'',
    roomStarting:false,
    t:(key)=>key,
    esc:(value)=>String(value)
  }),'');
});

test('renderRoomLobbyOverlay renders code and controls', ()=>{
  const html=renderRoomLobbyOverlay({
    visible:true,
    roomTitle:'Table',
    roomCode:'ABCD',
    roomLobbyCountdown:'10s',
    roomPrivacyRow:'<div id="privacy"></div>',
    roomSeats:'<div id="seats"></div>',
    roomErrorHtml:'<div id="err"></div>',
    roomStartControl:'<button id="room-start"></button>',
    roomPendingHint:'<span id="pending"></span>',
    roomStarting:false,
    t:(key)=>key,
    esc:(value)=>String(value)
  });
  assert.match(html,/ABCD/);
  assert.match(html,/id="room-copy"/);
  assert.match(html,/id="room-start"/);
});

test('renderRoomJoinOverlay renders active rooms and join controls', ()=>{
  const html=renderRoomJoinOverlay({
    visible:true,
    activeRooms:[{
      code:'ABCD',
      isPrivate:false,
      roster:[{name:'Alice',gender:'female',picture:''},{gender:'male',picture:''}],
      status:'lobby',
      displayPlayers:2,
      maxPlayers:4
    }],
    activeRoomsLoading:false,
    hiddenCount:2,
    joinOpenCountdown:8,
    roomErrorHtml:'<div id="room-error"></div>',
    t:(key)=>{
      if(key==='secondsShort')return' sec';
      if(key==='roomCodeExample')return'ROOM42';
      if(key==='seatLabel')return'Seat {{n}}';
      return key;
    },
    esc:(value)=>String(value),
    isRoomPlayerHuman:()=>true,
    authPictureUrlFrom:(value)=>`pic:${value}`,
    avatarDataUri:(name)=>`avatar:${name}`
  });
  assert.match(html,/id="room-code-input"/);
  assert.match(html,/placeholder="ROOM42"/);
  assert.match(html,/ABCD/);
  assert.match(html,/title="Seat 2"/);
  assert.match(html,/room-active-refresh-countdown/);
  assert.match(html,/roomActiveRefresh/);
  assert.match(html,/8 sec/);
  assert.match(html,/roomActiveHidden: 2/);
  assert.match(html,/room-error/);
});
