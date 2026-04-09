import test from 'node:test';
import assert from 'node:assert/strict';

import {createOpponentProfileHelpers} from '../src/opponentProfile.js';

function createHelpers(language='en'){
  return createOpponentProfileHelpers({
    esc:(value)=>String(value??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    getLanguage:()=>language
  });
}

test('profileParagraphsHtml renders escaped paragraph markup', ()=>{
  const helpers=createHelpers();
  assert.equal(helpers.profileParagraphsHtml(['Hello','<b>World</b>']),'<p>Hello</p><p>&lt;b&gt;World&lt;/b&gt;</p>');
});

test('profileFieldValue prefers current language and translates motto', ()=>{
  const helpers=createHelpers('fr');
  const profile={
    motto:{en:'Slow is smooth.'}
  };
  assert.equal(helpers.profileFieldValue(profile,'motto','-'),'Lent, c’est fluide.');
});

test('profileFieldValue translates profile lines for supported languages', ()=>{
  const helpers=createHelpers('ja');
  const profile={
    profile:{
      en:'Slow grower, then unstoppable bloom. Most dangerous in the last few hands—you realize too late.'
    }
  };
  assert.equal(
    helpers.profileFieldValue(profile,'profile','-'),
    '遅咲きだが止まらない。終盤が最も危険で、気づいた時には遅い。'
  );
});

test('profileFieldValue falls back when no translation exists', ()=>{
  const helpers=createHelpers('es');
  const profile={
    hobbies:{en:['Chess','Coffee']}
  };
  assert.deepEqual(helpers.profileFieldValue(profile,'hobbies',[]),['Chess','Coffee']);
});
