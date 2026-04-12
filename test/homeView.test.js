import test from 'node:test';
import assert from 'node:assert/strict';

import {renderConfigMarkup, renderHomeMarkup, renderOpponentCard, renderOpponentsMarkup} from '../src/homeView.js';

function render(overrides={}){
  return renderHomeMarkup({
    intro:{btnShow:'Guide'},
    allowOpponents:true,
    renderLangMenu:()=>'<div id="lang-menu"></div>',
    withBase:(path)=>`/base/${path}`,
    homeAvatarSrc:'/avatar.png',
    esc:(value)=>String(value),
    state:{
      home:{name:'Player',avatarChoice:'male',showIntro:true,showLeaderboard:false},
      showScoreGuide:true
    },
    t:(key)=>key,
    aiFieldLeft:'<div id="ai-left"></div>',
    cardBackLeft:'<div id="back-left"></div>',
    aiFieldRight:'<div id="ai-right"></div>',
    soundEnabled:true,
    calloutDisplayEnabled:false,
    emoteDisplayEnabled:true,
    cardBackRight:'<div id="back-right"></div>',
    soloBtnHtml:'<button id="solo-start">solo</button>',
    roomButtonsHtml:'<button id="room-create">room</button>',
    mainPageLegalMiniHtml:'<div id="legal"></div>',
    roomLobbyHtml:'<div id="room-lobby"></div>',
    roomJoinModal:'<div id="room-join"></div>',
    introPanelHtml:'<div id="intro-panel"></div>',
    leaderboardModalHtml:'<div id="lb-panel"></div>',
    scoreGuideModalHtml:'<div id="score-guide"></div>',
    ...overrides
  });
}

test('renderHomeMarkup includes the main home controls and optional overlays', ()=>{
  const html=render();
  assert.match(html,/id="home-intro-toggle"/);
  assert.match(html,/id="home-lb-toggle"/);
  assert.match(html,/id="solo-start"/);
  assert.match(html,/id="room-create"/);
  assert.match(html,/id="home-more-settings-toggle"/);
  assert.match(html,/id="home-more-settings-panel"/);
  assert.match(html,/id="callout-display-slider"/);
  assert.match(html,/id="emote-display-slider"/);
  assert.match(html,/id="sound-slider"/);
  assert.match(html,/id="intro-panel"/);
  assert.match(html,/id="score-guide"/);
  assert.doesNotMatch(html,/id="lb-panel"/);
});

test('renderHomeMarkup omits opponent button when not allowed', ()=>{
  const html=render({
    allowOpponents:false,
    state:{
      home:{name:'Player',avatarChoice:'female',showIntro:false,showLeaderboard:true},
      showScoreGuide:false
    }
  });
  assert.doesNotMatch(html,/home-opponents-toggle/);
  assert.match(html,/id="lb-panel"/);
});

test('renderConfigMarkup includes config controls and back carousel', ()=>{
  const html=renderConfigMarkup({
    diffIndex:2,
    renderLangMenu:()=>'<div id="config-lang"></div>',
    state:{home:{aiDifficulty:'hard'}},
    t:(key)=>key,
    soundEnabled:true,
    calloutDisplayEnabled:false,
    emoteDisplayEnabled:true,
    renderBackCarousel:(id)=>`<div id="${id}"></div>`
  });

  assert.match(html,/id="config-back"/);
  assert.match(html,/id="config-difficulty-slider"/);
  assert.match(html,/id="config-back-combo"/);
  assert.match(html,/id="config-sound-slider"/);
  assert.match(html,/id="config-callout-display-slider"/);
  assert.match(html,/id="config-emote-display-slider"/);
});

test('renderOpponentCard includes avatar, profile labels, and motto', ()=>{
  const html=renderOpponentCard({
    link:'/avatar.png',
    name:'Luna',
    genderClass:'gender-female',
    genderLabel:'Female',
    zodiacLabel:'Zodiac',
    zodiacMark:'♍',
    zodiacText:'Virgo',
    dobLabel:'DOB',
    dob:'1999-09-09',
    hobbiesLabel:'Hobbies',
    hobbyText:'Music, Travel',
    mottoText:'Stay cool.',
    profileLabel:'Profile',
    profileHtml:'<p>Bio</p>',
    esc:(value)=>String(value)
  });
  assert.match(html,/class="opponent-card"/);
  assert.match(html,/\/avatar\.png/);
  assert.match(html,/Stay cool\./);
  assert.match(html,/<p>Bio<\/p>/);
});

test('renderOpponentsMarkup includes back control and card grid', ()=>{
  const html=renderOpponentsMarkup({
    heading:'Opponents',
    homeLabel:'Home',
    renderLangMenu:()=>'<div id="lang-menu"></div>',
    cardsHtml:'<article class="opponent-card"></article>'
  });
  assert.match(html,/id="opponents-back"/);
  assert.match(html,/class="opponent-grid"/);
  assert.match(html,/id="lang-menu"/);
});
