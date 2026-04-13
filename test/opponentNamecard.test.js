import test from 'node:test';
import assert from 'node:assert/strict';

import {buildOpponentNamecardHtml} from '../src/opponentNamecard.js';

test('buildOpponentNamecardHtml renders bot namecard only for bots', ()=>{
  const html=buildOpponentNamecardHtml({
    isBot:true,
    opponentName:'Bot A',
    t:(key)=>key,
    esc:(value)=>String(value)
  });
  const empty=buildOpponentNamecardHtml({
    isBot:false,
    opponentName:'Bot A',
    t:(key)=>key,
    esc:(value)=>String(value)
  });
  assert.match(html,/seat-namecard/);
  assert.match(html,/data-opponent-name="Bot A"/);
  assert.match(html,/aria-label="profile"/);
  assert.equal(empty,'');
});
