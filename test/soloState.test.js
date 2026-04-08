import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_SOLO_ROUND_WINS,
  DEFAULT_SOLO_TOTALS,
  getNextSoloRoundWins,
  getNextSoloTotals,
  resetSoloSessionCarryoverState
} from '../src/soloState.js';

test('fresh solo start resets totals to defaults when resetTotals is true', ()=>{
  const totals=getNextSoloTotals([4800,5100,5200,4900],{resetTotals:true});
  assert.deepEqual(totals,DEFAULT_SOLO_TOTALS);
});

test('solo continue preserves totals and round wins', ()=>{
  const totals=getNextSoloTotals([4800,5100,5200,4900],{resetTotals:false});
  const roundWins=getNextSoloRoundWins([2,1,0,3],{resetTotals:false,resetRoundWins:false});
  assert.deepEqual(totals,[4800,5100,5200,4900]);
  assert.deepEqual(roundWins,[2,1,0,3]);
});

test('solo restart resets totals and round wins', ()=>{
  const totals=getNextSoloTotals([4800,5100,5200,4900],{resetTotals:true});
  const roundWins=getNextSoloRoundWins([2,1,0,3],{resetTotals:true,resetRoundWins:true});
  assert.deepEqual(totals,DEFAULT_SOLO_TOTALS);
  assert.deepEqual(roundWins,DEFAULT_SOLO_ROUND_WINS);
});

test('solo reset game can reset round wins even when totals are preserved separately', ()=>{
  const roundWins=getNextSoloRoundWins([2,1,0,3],{resetTotals:false,resetRoundWins:true});
  assert.deepEqual(roundWins,DEFAULT_SOLO_ROUND_WINS);
});

test('home carry-over reset clears totals and round wins without dropping other solo fields', ()=>{
  const next=resetSoloSessionCarryoverState({
    players:[{name:'Player'}],
    botProfiles:[{name:'Bot',gender:'male'}],
    totals:[4800,5100,5200,4900],
    roundWins:[2,1,0,3],
    currentSeat:2
  });
  assert.deepEqual(next.totals,DEFAULT_SOLO_TOTALS);
  assert.deepEqual(next.roundWins,DEFAULT_SOLO_ROUND_WINS);
  assert.deepEqual(next.players,[{name:'Player'}]);
  assert.equal(next.currentSeat,2);
});

test('invalid solo carry-over data falls back to defaults', ()=>{
  assert.deepEqual(getNextSoloTotals(['bad'],{resetTotals:false}),DEFAULT_SOLO_TOTALS);
  assert.deepEqual(getNextSoloRoundWins(null,{resetTotals:false,resetRoundWins:false}),DEFAULT_SOLO_ROUND_WINS);
});
