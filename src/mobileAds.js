import {AdMob} from '@capacitor-community/admob';

const TEST_ANDROID_INTERSTITIAL_AD_UNIT_ID='ca-app-pub-3940256099942544/1033173712';
const TEST_IOS_INTERSTITIAL_AD_UNIT_ID='ca-app-pub-3940256099942544/4411468910';
const ANDROID_INTERSTITIAL_AD_UNIT_ID='ca-app-pub-7970370189900466/3672876062';
const IOS_INTERSTITIAL_AD_UNIT_ID='ca-app-pub-7970370189900466/1046712725';

export function createMobileAdsController({
  isNativeAndroidApp=()=>false,
  isNativeIosApp=()=>false,
  useTestAdUnits=true
}={}){
  let initializePromise=null;
  let interstitialLoadPromise=null;

  function isNativeAdMobPlatform(){
    return isNativeAndroidApp()||isNativeIosApp();
  }

  function currentInterstitialAdUnitId(){
    if(useTestAdUnits){
      return isNativeIosApp()?TEST_IOS_INTERSTITIAL_AD_UNIT_ID:TEST_ANDROID_INTERSTITIAL_AD_UNIT_ID;
    }
    return isNativeIosApp()?IOS_INTERSTITIAL_AD_UNIT_ID:ANDROID_INTERSTITIAL_AD_UNIT_ID;
  }

  async function initialize(){
    if(!isNativeAdMobPlatform())return false;
    initializePromise??=AdMob.initialize()
      .then(()=>true)
      .catch((err)=>{
        initializePromise=null;
        throw err;
      });
    return initializePromise;
  }

  async function prepareStartGameInterstitial(){
    if(!isNativeAdMobPlatform())return false;
    await initialize();
    if(interstitialLoadPromise)return interstitialLoadPromise;
    interstitialLoadPromise=AdMob.prepareInterstitial({
      adId:currentInterstitialAdUnitId(),
      isTesting:useTestAdUnits
    }).then(()=>true).catch((err)=>{
      interstitialLoadPromise=null;
      throw err;
    }).finally(()=>{
      interstitialLoadPromise=null;
    });
    return interstitialLoadPromise;
  }

  async function showStartGameInterstitial(){
    if(!isNativeAdMobPlatform())return false;
    await initialize();
    await prepareStartGameInterstitial();
    await AdMob.showInterstitial();
    void prepareStartGameInterstitial();
    return true;
  }

  return{
    initialize,
    prepareStartGameInterstitial,
    showStartGameInterstitial
  };
}
