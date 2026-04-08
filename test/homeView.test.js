import test from 'node:test';
import assert from 'node:assert/strict';

import {renderHomeMarkup} from '../src/homeView.js';

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
