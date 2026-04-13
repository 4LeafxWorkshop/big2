import test from 'node:test';
import assert from 'node:assert/strict';

import {renderOpponentAvatarHtml, renderOpponentAvatarImgHtml, renderOpponentIdentityHtml, renderOpponentLabel, renderOpponentLabelNameHtml, renderOpponentMottoHtml, renderOpponentSeatWrapperHtml, renderOpponentStatusBadgesHtml} from '../src/opponentLabel.js';

test('renderOpponentMottoHtml renders optional motto callout', ()=>{
  const html=renderOpponentMottoHtml({
    pColor:'#123456',
    mottoText:'Stay cool',
    mottoClass:'hk-power-motto motto-en',
    hintText:'Hint',
    mottoTilt:'2deg',
    mottoTailDir:'north',
    esc:(value)=>String(value)
  });
  const empty=renderOpponentMottoHtml({
    pColor:'#123456',
    mottoText:'',
    mottoClass:'hk-power-motto',
    hintText:'',
    mottoTilt:'0deg',
    mottoTailDir:'north',
    esc:(value)=>String(value)
  });
  assert.match(html,/seat-motto-callout/);
  assert.match(html,/Hint/);
  assert.equal(empty,'');
});

test('renderOpponentAvatarHtml assembles the avatar block', ()=>{
  const html=renderOpponentAvatarHtml({
    pColor:'#123456',
    avatarSrc:'/avatar.png',
    playerAvatarClass:'avatar-female',
    playerName:'Luna',
    botNameAttr:' data-bot-name="Luna"',
    hostBadgeHtml:'<span id="host"></span>',
    badgeHtml:'<span id="badge"></span>',
    mottoText:'Stay cool',
    mottoClass:'hk-power-motto motto-en',
    hintText:'',
    mottoTilt:'2deg',
    mottoTailDir:'north',
    esc:(value)=>String(value)
  });
  assert.match(html,/player-avatar-wrap-opponent/);
  assert.match(html,/id="host"/);
  assert.match(html,/seat-motto-callout/);
});

test('renderOpponentAvatarImgHtml assembles the avatar image', ()=>{
  const html=renderOpponentAvatarImgHtml({
    pColor:'#123456',
    avatarSrc:'/avatar.png',
    playerAvatarClass:'avatar-female',
    playerName:'Luna',
    botNameAttr:' data-bot-name="Luna"',
    esc:(value)=>String(value)
  });
  assert.match(html,/player-avatar-opponent/);
  assert.match(html,/src="\/avatar\.png"/);
  assert.match(html,/data-bot-name="Luna"/);
});

test('renderOpponentStatusBadgesHtml concatenates badges', ()=>{
  const html=renderOpponentStatusBadgesHtml({
    hostBadgeHtml:'<span id="host"></span>',
    badgeHtml:'<span id="badge"></span>'
  });
  assert.match(html,/id="host"/);
  assert.match(html,/id="badge"/);
});

test('renderOpponentIdentityHtml assembles the identity block', ()=>{
  const html=renderOpponentIdentityHtml({
    playerName:'Luna',
    playerScore:5198,
    roundWinsHtml:'<span id="wins"></span>',
    namecardBtn:'<button id="namecard"></button>',
    esc:(value)=>String(value)
  });
  assert.match(html,/seat-identity/);
  assert.match(html,/seat-name-text/);
  assert.match(html,/id="wins"/);
  assert.match(html,/id="namecard"/);
});

test('renderOpponentLabel assembles the opponent avatar block', ()=>{
  const html=renderOpponentLabel({
    pColor:'#123456',
    avatarSrc:'/avatar.png',
    playerAvatarClass:'avatar-female',
    playerName:'Luna',
    botNameAttr:' data-bot-name="Luna"',
    hostBadgeHtml:'<span id="host"></span>',
    badgeHtml:'<span id="badge"></span>',
    playerScore:5198,
    roundWinsHtml:'<span id="wins"></span>',
    namecardBtn:'<button id="namecard"></button>',
    mottoText:'Stay cool',
    mottoClass:'hk-power-motto motto-en',
    hintText:'',
    mottoTilt:'2deg',
    mottoTailDir:'north',
    calloutHtml:'<div id="callout"></div>',
    emoteHtml:'<div id="emote"></div>',
    peekActive:true,
    opponentAttr:' data-opponent-name="Luna"',
    esc:(value)=>String(value)
  });
  assert.match(html,/seat-name-fixed motto-peek/);
  assert.match(html,/data-opponent-name="Luna"/);
  assert.match(html,/seat-identity/);
  assert.match(html,/seat-motto-callout/);
  assert.match(html,/id="callout"/);
  assert.match(html,/id="emote"/);
});

test('renderOpponentSeatWrapperHtml assembles the outer wrapper', ()=>{
  const html=renderOpponentSeatWrapperHtml({
    peekActive:true,
    opponentAttr:' data-opponent-name="Luna"',
    labelName:'<div id="label"></div>',
    calloutHtml:'<div id="callout"></div>',
    emoteHtml:'<div id="emote"></div>'
  });
  assert.match(html,/seat-name-fixed motto-peek/);
  assert.match(html,/data-opponent-name="Luna"/);
  assert.match(html,/id="label"/);
  assert.match(html,/id="callout"/);
  assert.match(html,/id="emote"/);
});

test('renderOpponentLabelNameHtml assembles the name block', ()=>{
  const html=renderOpponentLabelNameHtml({
    avatarHtml:'<span id="avatar"></span>',
    identityHtml:'<span id="identity"></span>'
  });
  assert.match(html,/class="name"/);
  assert.match(html,/id="avatar"/);
  assert.match(html,/id="identity"/);
});
