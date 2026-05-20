import test from 'node:test';
import assert from 'node:assert/strict';

import {buildOpponentNamecardHtml} from '../src/opponentNamecard.js';

test('buildOpponentNamecardHtml renders bot and human profile icons', ()=>{
  const html=buildOpponentNamecardHtml({
    isBot:true,
    opponentName:'Bot A',
    t:(key)=>key,
    esc:(value)=>String(value)
  });
  const human=buildOpponentNamecardHtml({
    isHuman:true,
    opponentName:'Player A',
    t:(key)=>key,
    esc:(value)=>String(value)
  });
  assert.match(html,/seat-namecard/);
  assert.match(html,/data-opponent-name="Bot A"/);
  assert.match(html,/data-opponent-profile-kind="profile"/);
  assert.match(html,/aria-label="profile"/);
  assert.match(html,/seat-namecard-emoji/);
  assert.match(html,/🪪/);
  assert.match(human,/seat-starcard/);
  assert.match(human,/data-opponent-name="Player A"/);
  assert.match(human,/data-opponent-profile-kind="chart"/);
  assert.match(human,/aria-label="starChart"/);
  assert.match(human,/<svg viewBox="0 0 28 20"[^>]*aria-hidden="true"/);
});
