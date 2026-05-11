import test from 'node:test';
import assert from 'node:assert/strict';

import {createMobileAdsController} from '../src/mobileAds.js';

function makeAdMobRecorder(){
  const calls=[];
  return{
    calls,
    adMob:{
      initialize:(options)=>{
        calls.push({method:'initialize',options});
        return Promise.resolve();
      },
      prepareInterstitial:(options)=>{
        calls.push({method:'prepareInterstitial',options});
        return Promise.resolve();
      },
      showInterstitial:()=>{
        calls.push({method:'showInterstitial'});
        return Promise.resolve();
      }
    }
  };
}

test('mobile ads uses Android production interstitial for store builds', async ()=>{
  const {adMob,calls}=makeAdMobRecorder();
  const controller=createMobileAdsController({
    adMob,
    isNativeAndroidApp:()=>true,
    useTestAdUnits:false
  });
  await controller.showStartGameInterstitial();
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(calls,[
    {method:'initialize',options:undefined},
    {
      method:'prepareInterstitial',
      options:{
        adId:'ca-app-pub-7970370189900466/3672876062',
        isTesting:false
      }
    },
    {method:'showInterstitial'},
    {
      method:'prepareInterstitial',
      options:{
        adId:'ca-app-pub-7970370189900466/3672876062',
        isTesting:false
      }
    }
  ]);
});

test('mobile ads keeps iOS production interstitial id separate', async ()=>{
  const {adMob,calls}=makeAdMobRecorder();
  const controller=createMobileAdsController({
    adMob,
    isNativeIosApp:()=>true,
    useTestAdUnits:false
  });
  await controller.prepareStartGameInterstitial();
  assert.deepEqual(calls,[
    {method:'initialize',options:undefined},
    {
      method:'prepareInterstitial',
      options:{
        adId:'ca-app-pub-7970370189900466/1046712725',
        isTesting:false
      }
    }
  ]);
});

test('mobile ads stays disabled outside native platforms', async ()=>{
  const {adMob,calls}=makeAdMobRecorder();
  const controller=createMobileAdsController({adMob});
  assert.equal(await controller.showStartGameInterstitial(),false);
  assert.deepEqual(calls,[]);
});
