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
    roomErrorHtml:'<div id="room-error"></div>',
    t:(key)=>{
      if(key==='secondsShort')return' sec';
      if(key==='roomCodeExample')return'ROOM42';
      if(key==='roomEnterCode')return'Enter Room Code';
      if(key==='roomOr')return'or';
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
  assert.match(html,/Enter Room Code/);
  assert.match(html,/room-join-divider/);
  assert.ok(html.indexOf('room-join-divider') < html.indexOf('room-create-card'));
  assert.match(html,/ABCD/);
  assert.match(html,/title="Seat 2"/);
  assert.match(html,/roomActiveRefresh/);
  assert.match(html,/roomActiveHidden: 2/);
  assert.match(html,/room-error/);
});

test('renderRoomJoinOverlay keeps the active rooms block visible while loading', ()=>{
  const html=renderRoomJoinOverlay({
    visible:true,
    activeRooms:[],
    activeRoomsLoading:true,
    hiddenCount:0,
    roomErrorHtml:'',
    t:(key)=>{
      if(key==='roomCodeExample')return'ROOM42';
      return key;
    },
    esc:(value)=>String(value),
    isRoomPlayerHuman:()=>true,
    authPictureUrlFrom:(value)=>`pic:${value}`,
    avatarDataUri:(name)=>`avatar:${name}`
  });
  assert.match(html,/room-create-card/);
  assert.match(html,/room-active-block/);
  assert.match(html,/room-active-grid/);
  assert.match(html,/room-active-empty/);
  assert.match(html,/roomActiveEmpty/);
  assert.doesNotMatch(html,/>\.\.\.</);
});
