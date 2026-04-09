import test from 'node:test';
import assert from 'node:assert/strict';

import {createCardUiHelpers} from '../src/cardUi.js';

function createHelpers(overrides={}){
  return createCardUiHelpers({
    RANKS:['3','4','5','6','7','8','9','10','J','Q','K','A','2'],
    SUITS:[
      {symbol:'♦️',red:true},
      {symbol:'♣️',red:false},
      {symbol:'♥️',red:true},
      {symbol:'♠️',red:false}
    ],
    withBase:(path)=>`/base/${path}`,
    isMobilePointer:()=>false,
    cardId:(card)=>`${card.rank}-${card.suit}`,
    backAssetFile:(color)=>`back-${color}.png`,
    getBackColor:()=>'red',
    ...overrides
  });
}

test('renderHandCard preserves card id, z-index, and draggable state', ()=>{
  const helpers=createHelpers();
  const html=helpers.renderHandCard({rank:8,suit:3},true,'must3-highlight',4);
  assert.match(html,/data-card-id="8-3"/);
  assert.match(html,/style="z-index:4;"/);
  assert.match(html,/draggable="true"/);
  assert.match(html,/must3-highlight/);
});

test('renderBackCards uses the configured back color asset', ()=>{
  const helpers=createHelpers({
    getBackColor:()=>'blue',
    backAssetFile:(color)=>`theme-${color}.png`,
    getCardBackAlt:()=>'Card Back'
  });
  const html=helpers.renderBackCards(2,'seed');
  assert.match(html,/theme-blue\.png/);
  assert.match(html,/alt="Card Back"/);
  assert.match(html,/--n:2;/);
});

test('calloutJitterStyle is stable for the same input', ()=>{
  const helpers=createHelpers();
  const a=helpers.calloutJitterStyle('north','pass|1');
  const b=helpers.calloutJitterStyle('north','pass|1');
  assert.equal(a,b);
});
