import test from 'node:test';
import assert from 'node:assert/strict';

import {getScoreGuideText} from '../src/scoreGuideData.js';

test('getScoreGuideText returns localized score guide copy', ()=>{
  const en=getScoreGuideText('en');
  const zh=getScoreGuideText('zh-HK');
  assert.equal(en.close,'Close');
  assert.equal(zh.close,'關閉');
  assert.equal(en.tableRows.length,3);
  assert.equal(zh.chaoTableRows[0][2],'雙炒');
});
