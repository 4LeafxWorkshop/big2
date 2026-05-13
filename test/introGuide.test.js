import test from 'node:test';
import assert from 'node:assert/strict';

import {createIntroGuideHelpers} from '../src/introGuide.js';

test('createIntroGuideHelpers exposes intro text and panel html', ()=>{
  const helpers=createIntroGuideHelpers({
    getLanguage:()=>'en',
    renderIntroPanel:({intro, introHandSamples})=>`<div data-title="${intro.panelTitle}" data-samples="${introHandSamples.length}"></div>`,
    colorizeSuitText:(value)=>String(value),
    esc:(value)=>String(value),
    withBase:(path)=>`/base/${path}`,
    t:(key)=>key,
    renderStaticCard:({rank,suit})=>`${rank}:${suit}`,
    ranks:['3','4','5','6','7','8','9','10','J','Q','K','A','2'],
    suits:[{symbol:'♦️'},{symbol:'♣️'},{symbol:'♥️'},{symbol:'♠️'}],
    isGestureHelpEnabled:()=>true
  });

  const intro=helpers.introText();
  assert.equal(intro.btnShow,'Guide');
  assert.equal(helpers.introHandSamples().length,8);
  assert.match(helpers.introPanelHtml(),/data-title="Guide"/);
  assert.match(helpers.introPanelHtml(),/data-samples="8"/);
});
