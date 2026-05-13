import test from 'node:test';
import assert from 'node:assert/strict';

import {renderConfigMarkup, renderHomeActionRowHtml, renderHomeMarkup, renderHomeMoreSettingsCardHtml, renderHomeProfileCardHtml, renderHomeSettingsCardHtml, renderHomeTopActionsHtml, renderOpponentCard, renderOpponentsMarkup} from '../src/homeView.js';

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
    gestureHelpEnabled:false,
    vibrateEnabled:true,
    cardBackRight:'<div id="back-right"></div>',
    soloBtnHtml:'<button id="solo-start">solo</button>',
    roomButtonsHtml:'<button id="room-create">room</button>',
    mainPageLegalMiniHtml:'<div id="legal"></div>',
    roomLobbyHtml:'<div id="room-lobby"></div>',
    roomJoinModal:'<div id="room-join"></div>',
    introPanelHtml:'<div id="intro-panel"></div>',
    leaderboardModalHtml:'<div id="lb-panel"></div>',
    scoreGuideModalHtml:'<div id="score-guide"></div>',
    buildVersionLabel:'v0.0.0 test',
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
  assert.match(html,/more-settings-icon-down/);
  assert.match(html,/id="home-more-settings-panel"/);
  assert.match(html,/id="callout-display-slider"/);
  assert.match(html,/id="emote-display-slider"/);
  assert.match(html,/id="vibrate-slider"/);
  assert.match(html,/id="sound-slider"/);
  assert.match(html,/home-form-more/);
  assert.match(html,/id="home-more-settings-toggle"/);
  assert.doesNotMatch(html,/home-more-settings-open/);
  assert.match(html,/id="back-right"/);
  assert.match(html,/id="intro-panel"/);
  assert.match(html,/id="score-guide"/);
  assert.match(html,/class="home-build-version">v0\.0\.0 test<\/div>/);
  assert.doesNotMatch(html,/id="lb-panel"/);
});

test('renderHomeMarkup marks the home layout open when more settings is enabled', ()=>{
  const html=render({moreSettingsOpen:true});
  assert.match(html,/home-more-settings-open/);
  assert.match(html,/id="home-more-settings-toggle"/);
  assert.match(html,/more-settings-icon-up/);
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

test('renderHomeTopActionsHtml renders the home header buttons', ()=>{
  const html=renderHomeTopActionsHtml({
    intro:{btnShow:'Guide'},
    allowOpponents:true,
    renderLangMenu:()=>'<div id="lang"></div>',
    esc:(value)=>String(value),
    t:(key)=>key
  });
  assert.match(html,/home-intro-toggle/);
  assert.match(html,/home-opponents-toggle/);
  assert.match(html,/id="lang"/);
});

test('renderHomeProfileCardHtml renders the avatar and player fields', ()=>{
  const html=renderHomeProfileCardHtml({
    homeAvatarSrc:'/avatar.png',
    esc:(value)=>String(value),
    state:{home:{name:'Player',avatarChoice:'female'}},
    t:(key)=>key,
    aiFieldLeft:'<div id="ai-left"></div>',
    cardBackLeft:'<div id="back-left"></div>'
  });
  assert.match(html,/home-profile-card/);
  assert.match(html,/id="home-avatar-img"/);
  assert.match(html,/id="name-input"/);
  assert.match(html,/id="gender-combo"/);
});

test('renderHomeSettingsCardHtml renders settings and toggles', ()=>{
  const html=renderHomeSettingsCardHtml({
    t:(key)=>key,
    aiFieldRight:'<div id="ai-right"></div>',
    soundEnabled:true,
    calloutDisplayEnabled:false,
    emoteDisplayEnabled:true,
    gestureHelpEnabled:false,
    vibrateEnabled:true,
    cardBackRight:'<div id="back-right"></div>',
    moreSettingsOpen:false
  });
  assert.match(html,/id="sound-slider"/);
  assert.match(html,/id="home-more-settings-toggle"/);
  assert.match(html,/aria-expanded="false"/);
  assert.match(html,/id="back-right"/);
  assert.match(html,/more-settings-icon-down/);
});

test('renderHomeMoreSettingsCardHtml renders the more settings controls', ()=>{
  const html=renderHomeMoreSettingsCardHtml({
    t:(key)=>key,
    calloutDisplayEnabled:false,
    emoteDisplayEnabled:true,
    gestureHelpEnabled:false,
    vibrateEnabled:true,
    moreSettingsOpen:true
  });
  assert.match(html,/id="home-more-settings-panel"/);
  assert.match(html,/id="home-more-settings-toggle"/);
  assert.match(html,/aria-expanded="true"/);
  assert.match(html,/more-settings-icon-up/);
  assert.match(html,/id="gesture-help-slider"/);
  assert.match(html,/id="callout-display-slider"/);
  assert.match(html,/id="emote-display-slider"/);
  assert.match(html,/id="vibrate-slider"/);
});

test('renderHomeActionRowHtml renders the start buttons row', ()=>{
  const html=renderHomeActionRowHtml({
    soloBtnHtml:'<button id="solo-start">solo</button>',
    roomButtonsHtml:'<button id="room-create">room</button>'
  });
  assert.match(html,/home-start-row/);
  assert.match(html,/id="solo-start"/);
  assert.match(html,/id="room-create"/);
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
