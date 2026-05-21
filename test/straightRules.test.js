import test from 'node:test';
import assert from 'node:assert/strict';

import {straightMeta} from '../src/straightRules.js';

test('straightMeta accepts the full straight ladder and ranks the top three correctly', ()=>{
  const valid=[
    [0,1,2,3,4],
    [1,2,3,4,5],
    [2,3,4,5,6],
    [3,4,5,6,7],
    [4,5,6,7,8],
    [5,6,7,8,9],
    [6,7,8,9,10],
    [8,9,10,11,12],
    [9,10,11,12,0],
    [10,11,12,0,1],
    [7,8,9,10,11],
    [12,0,1,2,3],
    [11,12,0,1,2]
  ];
  valid.forEach((ranks)=>{
    const meta=straightMeta(ranks);
    assert.ok(meta,`expected straightMeta to accept ${ranks.join(',')}`);
    assert.equal(meta.seq.length,5);
  });
  assert.equal(straightMeta([0,1,2,3,4])?.power,0);
  assert.equal(straightMeta([7,8,9,10,11])?.power,10);
  assert.equal(straightMeta([12,0,1,2,3])?.power,11);
  assert.equal(straightMeta([11,12,0,1,2])?.power,12);
});
