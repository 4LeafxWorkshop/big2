import test from 'node:test';
import assert from 'node:assert/strict';

import {botAvatarUrl, createAvatarProfileHelpers} from '../src/avatarProfile.js';

function createHelpers({
  googlePicture='',
  signedIn=false,
  pictureLoaded=true
}={}){
  return createAvatarProfileHelpers({
    withBase:(value)=>`/base/${value}`,
    hashNameSeed:()=>12345,
    pick:(arr)=>arr[0],
    getGooglePicture:()=>googlePicture,
    isGoogleSignedIn:()=>signedIn,
    isGooglePictureLoaded:()=>pictureLoaded
  });
}

test('authPictureUrlFrom normalizes protocol-relative urls', ()=>{
  const helpers=createHelpers();
  assert.equal(helpers.authPictureUrlFrom('//example.com/avatar.png'),'https://example.com/avatar.png');
});

test('authPictureUrlFrom preserves data urls', ()=>{
  const helpers=createHelpers();
  assert.equal(helpers.authPictureUrlFrom('data:image/png;base64,abc'),'data:image/png;base64,abc');
});

test('selfAvatarDataUri prefers signed-in google picture', ()=>{
  const helpers=createHelpers({googlePicture:'avatars.example.com/self.png',signedIn:true});
  assert.equal(helpers.selfAvatarDataUri('Player','#7aaed8','female'),'https://avatars.example.com/self.png');
});

test('selfAvatarDataUri falls back to gender avatar until google picture is loaded', ()=>{
  const helpers=createHelpers({googlePicture:'avatars.example.com/self.png',signedIn:true,pictureLoaded:false});
  assert.equal(helpers.selfAvatarDataUri('Player','#7aaed8','female'),'/base/avatar-female.png');
});

test('selfAvatarDataUri falls back to base avatar by gender', ()=>{
  const helpers=createHelpers();
  assert.equal(helpers.selfAvatarDataUri('Player','#7aaed8','female'),'/base/avatar-female.png');
  assert.equal(helpers.selfAvatarDataUri('Player','#7aaed8','male'),'/base/avatar-male.png');
});

test('avatarGenderClass maps female and defaults male', ()=>{
  const helpers=createHelpers();
  assert.equal(helpers.avatarGenderClass('female'),'avatar-female');
  assert.equal(helpers.avatarGenderClass('anything'),'avatar-male');
});

test('avatarDataUri uses bot override image when available', ()=>{
  const helpers=createHelpers();
  assert.equal(helpers.avatarDataUri('志明','#7aaed8','male',true),'/base/avatars/avatar-bot-志明.png?v=20260423');
});

test('botAvatarUrl returns cache-busted bot asset path', ()=>{
  assert.equal(botAvatarUrl('志明',(value)=>`/base/${value}`),'/base/avatars/avatar-bot-志明.png?v=20260423');
});

test('avatarDataUri builds dicebear url for non-bot avatars', ()=>{
  const helpers=createHelpers();
  const avatarUrl=helpers.avatarDataUri('Player','#7aaed8','female',false);
  assert.match(avatarUrl,/^https:\/\/api\.dicebear\.com\/9\.x\/avataaars\/svg\?/);
  assert.match(avatarUrl,/seed=female-Player/);
  assert.match(avatarUrl,/backgroundColor=transparent/);
});
