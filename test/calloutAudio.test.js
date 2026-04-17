import test from 'node:test';
import assert from 'node:assert/strict';

import {createCalloutAudioController} from '../src/calloutAudio.js';

test('must3 recorded callout prefers the exact zh-HK clip', async()=>{
  const sources=[];
  const controller=createCalloutAudioController({
    getState:()=>({language:'zh-HK',screen:'game',home:{mode:'solo'}}),
    getSound:()=>({enabled:true,ctx:{}}),
    getCalloutVoiceMode:()=> 'recorded',
    getCalloutGateUntilPlay:()=>false,
    getCalloutStylePack:()=> 'energetic',
    normalizeCalloutStylePack:(value)=>String(value??'energetic'),
    withBase:(path)=>`/base/${path}`,
    isIOSDevice:()=>false,
    unlockAudio:()=>{},
    playTone:()=>{},
    maybeRunSoloAi:()=>{},
    isPassCalloutText:()=>false,
    isLastCalloutText:()=>false,
    isCanonicalRecordedCalloutText:()=>false,
    deriveWinnerVariantClipKey:()=> '',
    deriveZhHkVariantClipKey:()=> '',
    deriveEnVariantClipKey:()=> '',
    deriveZhHkComposedClipKeys:()=>[],
    KIND:{'zh-HK':{}},
    createAudio:(src)=>({
      src,
      preload:'',
      playsInline:false,
      volume:1,
      currentTime:0,
      pause(){},
      play(){sources.push(src);return Promise.resolve();}
    })
  });

  controller.speakCallout('階磚♦️3出先。','female',{force:true,clipKey:'line-must3'});
  await new Promise((resolve)=>setTimeout(resolve,0));

  assert.equal(sources[0],'/base/audio/callout/zh-HK/line-must3-female.mp3');
  assert.equal(sources.length,1);
});
