﻿﻿﻿﻿﻿﻿﻿import {createCalloutAudioController} from './calloutAudio.js';
import {createCalloutStateController} from './calloutState.js';
import {createCardUiHelpers} from './cardUi.js';
import {createAvatarProfileHelpers} from './avatarProfile.js';
import {createConfigEventsBinder} from './configEvents.js';
import {createGameEventsBinder} from './gameEvents.js';
import {
  createDiscardSizeObserver,
  createRoomTopMetaLayoutBinder,
  positionLandscapeSideStations as positionLandscapeSideStationsDom,
  positionRoomTopMeta as positionRoomTopMetaDom,
  retargetCalloutTails as retargetCalloutTailsDom,
  syncDiscardSizeFromHand as syncDiscardSizeFromHandDom,
  syncHandStackMode as syncHandStackModeDom,
  syncLandscapeGameHandSizing as syncLandscapeGameHandSizingDom
} from './gameLayout.js';
import {runGamePostRender} from './gamePostRender.js';
import {createHomeEventsBinder} from './homeEvents.js';
import {renderConfigMarkup, renderHomeMarkup, renderOpponentCard, renderOpponentsMarkup} from './homeView.js';
import {createLangMenuController} from './langMenu.js';
import {renderCenterLastMoves, renderGameActionZone, renderGameLogSheet, renderGameShell, renderGameSideZone, renderGameTable, renderGameTopbar, renderOpponentLabel, renderOpponentSeat, renderOpponentSeats, renderOpponentStationFlow, renderSeatLastAction} from './gameView.js';
import {buildCalloutRenderState, buildCongratsOverlayHtml, buildGameAuxRenderState, buildGameShellMarkup, buildOpponentSeatsHtml, buildResultScreenHtml, buildRoomMetaTableHtml, buildSelfRenderState} from './gameRenderPrep.js';
import {renderConfidentialStamp, renderIntroPanel, renderLeaderboardModal, renderLeaderboardPanel, renderOpponentProfileModal, renderScoreGuideModal} from './modalViews.js';
import {resolveAvatarSrc} from './avatarProfile.js';
import {BACK_OPTIONS, CALLOUT_RESPONSE_TEXT, KIND, LANGUAGE_NATIVE_LABEL, LANGUAGE_OPTIONS} from './localeData.js';
import {I18N} from './i18nData.js';
import {getScoreGuideText} from './scoreGuideData.js';
import {
  BOT_PROFILE_POOL,
  BOT_PROFILES,
  OPPONENT_PROFILE_BY_NAME,
  PROFILE_ZODIAC_TRANSLATIONS,
  translateProfileHobby,
  zodiacSymbol
} from './botProfileData.js';
import {createGoogleIdentityController} from './googleIdentity.js';
import {createGoogleProfileHelpers} from './googleProfile.js';
import {createGoogleSessionHelpers} from './googleSession.js';
import {createOpponentProfileHelpers, resolveOpponentProfileModalState, resolveRoomSeatProfile} from './opponentProfile.js';
import {createOpponentsEventsBinder} from './opponentsEvents.js';
import {createProfileSettingsHelpers} from './profileSettings.js';
import {renderRoomJoinOverlay, renderRoomLobbyOverlay} from './roomView.js';
import {createFooterMenuHelpers} from './footerMenu.js';
import {createIntroGuideHelpers} from './introGuide.js';
import {createRoomLifecycleController} from './roomLifecycle.js';
import {createRoomGameRuntimeController} from './roomGameRuntime.js';
import {createRoomExpiryHelpers} from './roomExpiry.js';
import {isRoomPresenceOnlyUpdate} from './roomPresence.js';
import {createServiceBellController} from './serviceBell.js';
import {createRoomIdentityHelpers} from './roomIdentity.js';
import {createRoomMutationsController} from './roomMutations.js';
import {createRoomActionsController} from './roomActions.js';
import {createRoomRosterSyncController} from './roomRosterSync.js';
import {createRoomSubscriptionController} from './roomSubscription.js';
import {createRoomTimeoutController} from './roomTimeouts.js';
import {getNextSoloRoundWins, getNextSoloTotals, resetSoloSessionCarryoverState} from './soloState.js';

const RANKS=['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
const SUITS=[
  {symbol:'♦️',red:true},
  {symbol:'♣️',red:false},
  {symbol:'♥️',red:true},
  {symbol:'♠️',red:false}
];
const DEFAULT_TURN_TIMEOUT_MS=20000;
const ROOM_OFFLINE_MS=15000;
const ROOM_PRUNE_LOBBY_MS=300000;
const ROOM_PRUNE_PLAYING_MS=30000;
const ROOM_STALE_MS=ROOM_PRUNE_PLAYING_MS;
const ROOM_TIMEOUT_GRACE_MS=2000;
const ROOM_RESULT_IDLE_MS=120000;
const ROOM_IDLE_KILL_MS=120000;
const ROOM_TIMEOUT_STRIKES_MAX=2;
const ROOM_HOST_TAKEOVER_MS=120000;
const ROOM_HOST_ACTIVE_MS=20000;
const EMOTE_DURATION_MS=2400;
const FOOD_EMOTE_PREFIX='food:';
const FOOD_CALLOUT_META={
  lemontea:{file:'lemontea.png',width:45},
  lemoncokeginger:{file:'lemoncokeginger.png',width:60},
  pineapplebun:{file:'pineapplebun.png',width:72},
  eggtart:{file:'eggtart.png',width:54},
  milktea:{file:'milktea.png',width:81},
  sausagebun:{file:'sausagebun.png',width:78},
  redbeanice:{file:'redbeanice.png',width:43},
  frenchtoast:{file:'frenchtoast.png',width:84}
};
const FIVE_KIND_POWER={straight:0,flush:1,fullhouse:2,fourofkind:3,straightflush:4};

function roomPruneMs(status=''){
  return status==='playing'?ROOM_PRUNE_PLAYING_MS:ROOM_PRUNE_LOBBY_MS;
}
function isRoomPlayerActive(entry,status,now){
  const lastSeen=Number(entry?.lastSeen)||0;
  if(!lastSeen)return status==='playing';
  return now-lastSeen<=roomPruneMs(status);
}
function isRoomPlayerHuman(entry){
  const uid=String(entry?.uid||'').trim();
  if(!uid)return false;
  if(uid.startsWith('bot:'))return false;
  if(uid.startsWith('uid:')||uid.startsWith('guest:'))return true;
  return false;
}
function selectRoomHostCandidate(players,now){
  const humans=players.filter((p)=>isRoomPlayerHuman(p));
  if(!humans.length)return null;
  const sorted=[...humans].sort((a,b)=>Number(b?.lastSeen||0)-Number(a?.lastSeen||0));
  const best=sorted[0];
  if(!best)return null;
  const lastSeen=Number(best.lastSeen||0);
  if(lastSeen&&now-lastSeen>ROOM_HOST_ACTIVE_MS)return null;
  return best;
}
function matchGuestPlayerId(roomData){
  if(String(firebaseAuth?.currentUser?.uid??'').trim())return '';
  const players=Array.isArray(roomData?.players)?roomData.players:[];
  if(!players.length)return '';
  const desiredName=String(state.home.name||'Player').slice(0,32);
  const desiredGender=state.home.gender==='female'?'female':'male';
  const desiredPic=String(authPictureUrl()||'').trim();
  const matchGender=(p)=>String(p?.gender||'male')==='female'?'female':'male';
  const matchPic=(p)=>{
    const pic=String(p?.picture||'').trim();
    if(!desiredPic)return true;
    if(!pic)return true;
    return pic===desiredPic;
  };
  const matches=players.filter((p)=>{
    if(!isRoomPlayerHuman(p))return false;
    if(!String(p.uid||'').startsWith('guest:'))return false;
    if(String(p.name||'')!==desiredName)return false;
    if(matchGender(p)!==desiredGender)return false;
    if(!matchPic(p))return false;
    return true;
  });
  if(matches.length===1)return String(matches[0].uid||'');
  const hostId=String(roomData?.hostId||'').trim();
  if(hostId){
    const host=players.find((p)=>String(p?.uid||'')===hostId);
    if(host&&String(host.name||'')===desiredName&&matchGender(host)===desiredGender){
      return hostId;
    }
  }
  return '';
}
function runPopunderAd(){
  if(APP_CHANNEL==='STORE')return;
  const url='https://omg10.com/4/10798765';
  const isIos=isIOSDevice();
  try{
    let win=armedPopunderWindow;
    if(win&&!win.closed){
      try{
        win.opener=null;
      }catch{}
      try{
        win.location.replace(url);
      }catch{
        win.location.href=url;
      }
    }else{
      win=window.open(url,'big2_ad_tab');
    }
    armedPopunderWindow=win&&!win.closed?win:null;
    if(!win){
      if(isIos)return;
      window.location.href=url;
      return;
    }
    try{win.blur();}catch{}
    try{window.focus();}catch{}
  }catch(err){
    console.warn('popunder ad failed',err);
  }finally{
    if(armedPopunderWindow?.closed)armedPopunderWindow=null;
  }
}
let armedPopunderWindow=null;
let googlePicturePreloadToken=0;
function preloadGooglePicture(){
  const pic=String(state.home.google?.picture??'').trim();
  state.home.google.pictureLoaded=false;
  if(!pic)return;
  const normalizedPic=authPictureUrlFrom(pic);
  if(!normalizedPic)return;
  const token=++googlePicturePreloadToken;
  try{
    const img=new Image();
    img.onload=()=>{
      if(token!==googlePicturePreloadToken)return;
      state.home.google.pictureLoaded=true;
      render();
    };
    img.onerror=()=>{
      if(token!==googlePicturePreloadToken)return;
      state.home.google.pictureLoaded=false;
      render();
    };
    img.src=normalizedPic;
  }catch{}
}
function armPopunderForGesture(){
  if(APP_CHANNEL==='STORE')return;
  if(!isIOSDevice())return;
  if(armedPopunderWindow&&!armedPopunderWindow.closed)return;
  try{
    armedPopunderWindow=window.open('about:blank','big2_ad_tab');
    try{armedPopunderWindow?.blur();}catch{}
    try{window.focus();}catch{}
  }catch{
    armedPopunderWindow=null;
  }
}
function schedulePopunderAfterRender(delayMs=250){
  if(APP_CHANNEL==='STORE')return;
  const delay=Math.max(0,Number(delayMs)||0);
  const invoke=()=>window.setTimeout(runPopunderAd,delay);
  window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{
    if('requestIdleCallback' in window){
      window.requestIdleCallback(invoke,{timeout:delay+250});
    }else{
      invoke();
    }
  }));
}
const actionGuard=new Map();
function guardAction(key,windowMs=800){
  const now=Date.now();
  const last=actionGuard.get(key)||0;
  if(now-last<windowMs)return false;
  actionGuard.set(key,now);
  return true;
}

const app=document.getElementById('app');
const state={language:'zh-HK',screen:'home',screenBeforeConfig:'home',showRules:false,showLog:false,showLogSheet:false,logTouched:false,showScoreGuide:false,opponentProfileName:'',mottoPeekName:'',selected:new Set(),drag:{id:null,moved:false},playAnimKey:'',autoPassKey:'',score:5000,suggestCost:0,recommendation:null,recommendHint:'',logFab:{x:null,y:null},home:{mode:'solo',name:'玩家',gender:'male',avatarChoice:'male',aiDifficulty:'normal',backColor:'red',theme:'ocean',showIntro:false,showLeaderboard:false,showMoreSettings:false,google:{signedIn:false,provider:'',name:'',email:'',uid:'',sub:'',token:'',picture:'',pictureLoaded:false,gender:'',profileMissing:false,hydrating:false},leaderboard:{rows:[],sort:'totalDelta',period:'all',limit:20},activeRooms:{rows:[],loading:false,loadedAt:0,error:''}},room:{id:'',code:'',firebaseInstanceId:'',data:null,joinOpen:false,error:'',started:false,unsub:null,selfSeat:-1,recordedGameKey:'',lastMoveKey:'',playerId:'',pendingStart:false,lastResultPlayers:null},sessionId:'',solo:{players:[],botNames:[],totals:[5000,5000,5000,5000],currentSeat:0,lastPlay:null,passStreak:0,isFirstTrick:true,gameOver:false,status:'',history:[],aiDifficulty:'normal',lastCardBreach:null},emote:{open:false,active:null},serviceBell:{foodCallout:null}};
const {
  EMOTE_STICKERS,
  cardImagePath,
  fanNoise,
  renderStaticCard,
  renderHandCard,
  renderBackCards,
  calloutJitterStyle
}=createCardUiHelpers({
  RANKS,
  SUITS,
  withBase:(...args)=>withBase(...args),
  isMobilePointer:(...args)=>isMobilePointer(...args),
  cardId:(...args)=>cardId(...args),
  backAssetFile:(...args)=>backAssetFile(...args),
  getBackColor:()=>state.home.backColor,
  getCardBackAlt:()=>t('cardBack')
});
const GOOGLE_SESSION_KEY='hkbig2.google.session.v1';
const ENV_PASSCODE='4Leaf';
const APP_ENV=String(import.meta.env?.ENV||'DEV').trim().toUpperCase();
const EFFECTIVE_ENV=['DEV','UAT','PROD'].includes(APP_ENV)?APP_ENV:'DEV';
const APP_CHANNEL=String(import.meta.env?.VITE_APP_CHANNEL||import.meta.env?.APP_CHANNEL||'web').trim().toUpperCase()==='STORE'
  ?'STORE'
  :'WEB';
const FIREBASE_CONFIG_ENCODED_BY_ENV={
  DEV:{
    apiKey:'dQUfADVNDTxMPFclSBNfcgZVKCp/JFE+MHN7Dg00VhQ1Iy1NdFJR',
    authDomain:'RykABUtHKRcXD1cpFk8AXT4AAwdHKQQRFhovCgw=',
    projectId:'RykABUtHKRcXD1cpFg==',
    storageBucket:'RykABUtHKRcXD1cpFk8AXT4AAwdHKRYVCUYtAgRIVTwV',
    messagingSenderId:'Bn9UVl8FflFQXwB8',
    appId:'BXZXUlcDdVRTUgV1UVFcQykHW1UGLV1SBAZ/UgBTV30GBQAALwRYUgU=',
    measurementId:'c2EnOF9+DyEnKwN1'
  },
  UAT:{
    apiKey:'dQUfADVNDTxMPFclSBNfcgZVKCp/JFE+MHN7Dg00VhQ1Iy1NdFJR',
    authDomain:'RykABUtHKRcXD1cpFk8AXT4AAwdHKQQRFhovCgw=',
    projectId:'RykABUtHKRcXD1cpFg==',
    storageBucket:'RykABUtHKRcXD1cpFk8AXT4AAwdHKRYVCUYtAgRIVTwV',
    messagingSenderId:'Bn9UVl8FflFQXwB8',
    appId:'BXZXUlcDdVRTUgV1UVFcQykHW1UGLV1SBAZ/UgBTV30GBQAALwRYUgU=',
    measurementId:'c2EnOF9+DyEnKwN1'
  },
  PROD:{
    apiKey:'dQUfADVNDTxMPFclSBNfcgZVKCp/JFE+MHN7Dg00VhQ1Iy1NdFJR',
    authDomain:'RykABUtHKRcXD1cpFk8AXT4AAwdHKQQRFhovCgw=',
    projectId:'RykABUtHKRcXD1cpFg==',
    storageBucket:'RykABUtHKRcXD1cpFk8AXT4AAwdHKRYVCUYtAgRIVTwV',
    messagingSenderId:'Bn9UVl8FflFQXwB8',
    appId:'BXZXUlcDdVRTUgV1UVFcQykHW1UGLV1SBAZ/UgBTV30GBQAALwRYUgU=',
    measurementId:'c2EnOF9+DyEnKwN1'
  }
};
const FIRESTORE_LB_COLLECTION_ENCODED_BY_ENV={
  DEV:'ViUCUypRLQEEFFYjBBMCZCAEGANGPw==',
  UAT:'ViUCUypRLQEEFFYjBBMCZCAEGANGPw==',
  PROD:'ViUCUypRLQEEFFYjBBMCZCAEGANGPw=='
};
function decodeEnvSecret(encoded){
  const raw=String(encoded??'').trim();
  if(!raw)return'';
  try{
    const bytes=atob(raw);
    let out='';
    for(let i=0;i<bytes.length;i+=1){
      const p=ENV_PASSCODE.charCodeAt(i%ENV_PASSCODE.length);
      out+=String.fromCharCode(bytes.charCodeAt(i)^p);
    }
    return out;
  }catch{
    return'';
  }
}
function decodeFirebaseConfigByEnv(envName){
  const safeEnv=['DEV','UAT','PROD'].includes(envName)?envName:'DEV';
  const encoded=FIREBASE_CONFIG_ENCODED_BY_ENV[safeEnv]??FIREBASE_CONFIG_ENCODED_BY_ENV.DEV;
  return{
    apiKey:decodeEnvSecret(encoded.apiKey),
    authDomain:decodeEnvSecret(encoded.authDomain),
    projectId:decodeEnvSecret(encoded.projectId),
    storageBucket:decodeEnvSecret(encoded.storageBucket),
    messagingSenderId:decodeEnvSecret(encoded.messagingSenderId),
    appId:decodeEnvSecret(encoded.appId),
    measurementId:decodeEnvSecret(encoded.measurementId)
  };
}
const FIREBASE_CONFIG=decodeFirebaseConfigByEnv(EFFECTIVE_ENV);
const FIRESTORE_LB_COLLECTION=decodeEnvSecret(
  FIRESTORE_LB_COLLECTION_ENCODED_BY_ENV[EFFECTIVE_ENV]??FIRESTORE_LB_COLLECTION_ENCODED_BY_ENV.DEV
);
const FIRESTORE_ROOMS_COLLECTION='big2Rooms';
const FIRESTORE_USERS_COLLECTION='big2Users';
const FIRESTORE_GAMELOGS_COLLECTION='big2GameLogs';
const FIRESTORE_FIREBASE_INSTANCES_COLLECTION='big2FirebaseInstances';
const FIRESTORE_ROOM_DIRECTORY_COLLECTION='big2RoomDirectory';
const FIRESTORE_ROOM_ROUTING_COLLECTION='big2RoomRouting';
const ROOM_ROUTING_DOC_ID='rotation';
const PRIMARY_FIREBASE_ROOM_ENABLED=false;
const THEMES={
  ocean:{'--bg-a':'#071a2f','--bg-b':'#0f4469','--bg-c':'#15808f','--panel':'rgba(255,255,255,0.08)','--panel-2':'rgba(7,22,34,0.62)','--table-a':'#17334f','--table-b':'#1f4468','--table-c':'#1c4262','--seat-a':'rgba(17,44,70,.82)','--seat-b':'rgba(9,33,55,.78)','--line-a':'rgba(126,177,215,.6)','--line-b':'rgba(126,177,215,.35)','--center-a':'rgba(19,88,49,.92)','--center-b':'rgba(12,63,35,.9)','--accent':'#f4a259','--danger':'#ef476f','--ok':'#52d273'},
  emerald:{'--bg-a':'#08261f','--bg-b':'#0f5a43','--bg-c':'#168f6a','--panel':'rgba(255,255,255,0.08)','--panel-2':'rgba(6,31,23,0.64)','--table-a':'#0e3a2e','--table-b':'#13614a','--table-c':'#15795a','--seat-a':'rgba(11,57,41,.82)','--seat-b':'rgba(8,40,29,.78)','--line-a':'rgba(120,196,156,.6)','--line-b':'rgba(120,196,156,.35)','--center-a':'rgba(23,103,62,.92)','--center-b':'rgba(13,73,44,.9)','--accent':'#f6c453','--danger':'#e95f6f','--ok':'#7ad97a'},
  sunset:{'--bg-a':'#2d1022','--bg-b':'#7a2d3f','--bg-c':'#d06b3a','--panel':'rgba(255,255,255,0.09)','--panel-2':'rgba(35,13,26,0.62)','--table-a':'#4b2132','--table-b':'#8a3c4b','--table-c':'#a55346','--seat-a':'rgba(58,25,39,.82)','--seat-b':'rgba(37,16,26,.78)','--line-a':'rgba(220,153,118,.6)','--line-b':'rgba(220,153,118,.35)','--center-a':'rgba(120,68,32,.92)','--center-b':'rgba(78,40,20,.9)','--accent':'#ffd166','--danger':'#ff5a5f','--ok':'#7fd37b'},
  slate:{'--bg-a':'#121a24','--bg-b':'#2b3a4d','--bg-c':'#4e647f','--panel':'rgba(255,255,255,0.08)','--panel-2':'rgba(13,19,30,0.64)','--table-a':'#1f2b3a','--table-b':'#33485f','--table-c':'#4a627f','--seat-a':'rgba(24,35,48,.82)','--seat-b':'rgba(14,23,33,.78)','--line-a':'rgba(139,171,202,.6)','--line-b':'rgba(139,171,202,.35)','--center-a':'rgba(46,86,72,.92)','--center-b':'rgba(30,58,49,.9)','--accent':'#f2b36d','--danger':'#de5c70','--ok':'#7bc99a'},
  aurora:{'--bg-a':'#1a0f3a','--bg-b':'#53328e','--bg-c':'#1f8e9c','--panel':'rgba(255,255,255,0.1)','--panel-2':'rgba(18,11,40,0.66)','--table-a':'#32235c','--table-b':'#4f3b81','--table-c':'#316f80','--seat-a':'rgba(41,27,74,.82)','--seat-b':'rgba(28,18,54,.78)','--line-a':'rgba(172,156,235,.62)','--line-b':'rgba(172,156,235,.35)','--center-a':'rgba(30,120,86,.9)','--center-b':'rgba(18,81,58,.88)','--accent':'#ffc857','--danger':'#f65c93','--ok':'#7fe0c9'},
  sand:{'--bg-a':'#3a2b1f','--bg-b':'#8a623f','--bg-c':'#c99f63','--panel':'rgba(255,255,255,0.1)','--panel-2':'rgba(44,31,20,0.64)','--table-a':'#5d432b','--table-b':'#8a6842','--table-c':'#9f7a4f','--seat-a':'rgba(72,50,30,.82)','--seat-b':'rgba(50,34,20,.78)','--line-a':'rgba(226,193,140,.62)','--line-b':'rgba(226,193,140,.35)','--center-a':'rgba(106,83,37,.92)','--center-b':'rgba(75,55,24,.9)','--accent':'#ffd166','--danger':'#e46a52','--ok':'#95d07a'},
  cyber:{'--bg-a':'#041a25','--bg-b':'#0a3c54','--bg-c':'#0f6378','--panel':'rgba(255,255,255,0.09)','--panel-2':'rgba(6,23,35,0.68)','--table-a':'#0c2f43','--table-b':'#11506a','--table-c':'#16718a','--seat-a':'rgba(8,46,63,.84)','--seat-b':'rgba(7,31,43,.8)','--line-a':'rgba(104,225,255,.62)','--line-b':'rgba(104,225,255,.36)','--center-a':'rgba(17,97,56,.92)','--center-b':'rgba(10,66,38,.9)','--accent':'#ffe66d','--danger':'#ff5d8f','--ok':'#5ce1a7'}
};
const seatCls=['south','east','north','west'];
const PLAYER_COLORS={south:'#ffd166',east:'#ff6b6b',north:'#6bbcff',west:'#a77bff'};
const playerColorByViewClass=(cls)=>PLAYER_COLORS[cls]??'#f4f9fb';
function colorDistanceSq(a,b){
  const ra=hexToRgb(a);
  const rb=hexToRgb(b);
  if(!ra||!rb)return 0;
  const dr=ra[0]-rb[0];
  const dg=ra[1]-rb[1];
  const db=ra[2]-rb[2];
  return(dr*dr)+(dg*dg)+(db*db);
}
function rgbToHex(r,g,b){
  const toHex=(value)=>Math.max(0,Math.min(255,Math.round(value))).toString(16).padStart(2,'0');
  return`#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function hslToHex(h,s,l){
  const hue=((Number(h)||0)%360+360)%360;
  const sat=Math.max(0,Math.min(100,Number(s)||0))/100;
  const light=Math.max(0,Math.min(100,Number(l)||0))/100;
  if(sat===0){
    const gray=Math.round(light*255);
    return rgbToHex(gray,gray,gray);
  }
  const c=(1-Math.abs(2*light-1))*sat;
  const x=c*(1-Math.abs((hue/60)%2-1));
  const m=light-(c/2);
  let r1=0,g1=0,b1=0;
  if(hue<60){r1=c;g1=x;}
  else if(hue<120){r1=x;g1=c;}
  else if(hue<180){g1=c;b1=x;}
  else if(hue<240){g1=x;b1=c;}
  else if(hue<300){r1=x;b1=c;}
  else{r1=c;b1=x;}
  return rgbToHex((r1+m)*255,(g1+m)*255,(b1+m)*255);
}
function relativeLuminance(hex){
  const rgb=hexToRgb(hex);
  if(rgb.length!==3)return 0;
  const linear=rgb.map((channel)=>{
    const value=channel/255;
    return value<=0.03928?value/12.92:Math.pow((value+0.055)/1.055,2.4);
  });
  return(0.2126*linear[0])+(0.7152*linear[1])+(0.0722*linear[2]);
}
function contrastRatio(a,b){
  const l1=relativeLuminance(a);
  const l2=relativeLuminance(b);
  const light=Math.max(l1,l2);
  const dark=Math.min(l1,l2);
  return(light+0.05)/(dark+0.05);
}
function randomNpcColor(){
  const hue=Math.random()*360;
  const saturation=68+Math.random()*22;
  const lightness=56+Math.random()*16;
  return hslToHex(hue,saturation,lightness);
}
function isReadableNpcColor(color){
  const backgrounds=Object.values(THEMES).flatMap((theme)=>[theme['--bg-a'],theme['--table-a']]);
  return backgrounds.every((bg)=>contrastRatio(color,bg)>=2.55);
}
function randomizeNpcColors(){
  const fallback=['#ff6b6b','#6bbcff','#a77bff'];
  const candidates=[];
  let attempts=0;
  while(candidates.length<36&&attempts<360){
    attempts+=1;
    const color=randomNpcColor();
    if(!isReadableNpcColor(color))continue;
    if(colorDistanceSq(color,PLAYER_COLORS.south)<14000)continue;
    if(candidates.some((entry)=>colorDistanceSq(entry,color)<7000))continue;
    candidates.push(color);
  }
  if(candidates.length<3){
    PLAYER_COLORS.east=fallback[0];
    PLAYER_COLORS.north=fallback[1];
    PLAYER_COLORS.west=fallback[2];
    return;
  }
  let bestScore=-1;
  let chosen=null;
  for(let i=0;i<candidates.length-2;i++){
    for(let j=i+1;j<candidates.length-1;j++){
      for(let k=j+1;k<candidates.length;k++){
        const trio=[candidates[i],candidates[j],candidates[k]];
        const distances=[
          colorDistanceSq(trio[0],trio[1]),
          colorDistanceSq(trio[0],trio[2]),
          colorDistanceSq(trio[1],trio[2]),
          colorDistanceSq(trio[0],PLAYER_COLORS.south),
          colorDistanceSq(trio[1],PLAYER_COLORS.south),
          colorDistanceSq(trio[2],PLAYER_COLORS.south)
        ];
        const minDistance=Math.min(...distances);
        const totalDistance=distances.reduce((sum,value)=>sum+value,0);
        const score=(minDistance*100)+totalDistance;
        if(score>bestScore){
          bestScore=score;
          chosen=trio;
        }
      }
    }
  }
  const assigned=[...(chosen||fallback)];
  for(let i=assigned.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [assigned[i],assigned[j]]=[assigned[j],assigned[i]];
  }
  PLAYER_COLORS.east=assigned[0]??fallback[0];
  PLAYER_COLORS.north=assigned[1]??fallback[1];
  PLAYER_COLORS.west=assigned[2]??fallback[2];
}
const isIOSDevice=()=>{
  try{
    const ua=String(navigator?.userAgent??'');
    const platform=String(navigator?.platform??'');
    const touchPts=Number(navigator?.maxTouchPoints??0);
    return /iPad|iPhone|iPod/i.test(ua) || (platform==='MacIntel'&&touchPts>1);
  }catch{
    return false;
  }
};
const runtimeProfileStore={players:{}};
let aiTimer=null;
let roomPresenceTimer=null;
const ROOM_PRESENCE_TOUCH_MIN_MS=5000;
let lastRoomPresenceTouch={roomId:'',at:0};
let emoteTimer=null;
let emotePickerTimer=null;
const EMOTE_PICKER_AUTO_CLOSE_MS=5000;
const BOT_EMOTE_COOLDOWN_MS=5000;
const botEmoteCooldownBySeat=new Map();
let roomCountdownTimer=null;
let roomResultExpiryReached=false;
let roomStartPendingTimer=null;
let playTypeCallTimer=null;
const playTypeCallState={key:'',seat:0,text:'',until:0,startedAt:0,nonce:'',historyLen:0};
let passCallTimer=null;
const passCallState={key:'',seat:0,text:'',until:0,startedAt:0,nonce:'',historyLen:0};
let recommendHintTimer=null;
let lastCardCallTimer=null;
const lastCardCallState={key:'',seat:0,text:'',until:0,startedAt:0,nonce:'',historyLen:0};
const must3CallState={key:'',seat:0,text:'',until:0,startedAt:0,nonce:''};
const lastCardAnnouncedSeats=new Set();
let calloutExpireTimer=null;
function scheduleCalloutExpiry(until=0){
  const wait=Math.max(0,Number(until||0)-Date.now()+40);
  if(!Number.isFinite(wait))return;
  if(calloutExpireTimer)clearTimeout(calloutExpireTimer);
  calloutExpireTimer=window.setTimeout(()=>{
    calloutExpireTimer=null;
    if(state.screen==='game')render();
  },wait);
}
function resetCalloutPlaybackState(){
  calloutAudioController.resetPlaybackState();
}
let lastCardProcessedHistoryLen=0;
let firebaseAuth=null;
let firebaseDb=null;
const firebaseRoomApps=new Map();
const firebaseRoomDbs=new Map();
let firebaseInstancesCache=null;
let leaderboardCloudRefreshInFlight=false;
let leaderboardCloudLoaded=false;
const sound={ctx:null,enabled:true};
let winSfxAudio=null;
let winSfxSeq=0;
let calloutGateUntilPlay=false;
let turnLockUntil=0;
let calloutDisplayEnabled=true;
let emoteDisplayEnabled=true;
let vibrateEnabled=true;
let nativeHaptics=null;
let nativeHapticsLoadAttempted=false;
let hapticFallbackTimer=null;
let calloutVoiceMode='auto'; // auto | recorded | off
let calloutStylePack='energetic'; // forced energetic
let orientationBlockActive=false;
let lastOrientation=null;
const calloutAudioController=createCalloutAudioController({
  KIND,
  deriveEnVariantClipKey,
  deriveWinnerVariantClipKey,
  deriveZhHkComposedClipKeys,
  deriveZhHkVariantClipKey,
  getCalloutGateUntilPlay:()=>calloutGateUntilPlay,
  getCalloutStylePack:()=>calloutStylePack,
  getCalloutVoiceMode:()=>calloutVoiceMode,
  getSound:()=>sound,
  getState:()=>state,
  isCanonicalRecordedCalloutText,
  isIOSDevice:()=>isIOSDevice(),
  isLastCalloutText,
  isPassCalloutText,
  maybeRunSoloAi,
  normalizeCalloutStylePack:(v)=>normalizeCalloutStylePack(v),
  playTone,
  unlockAudio,
  withBase:(p)=>withBase(p)
});
const langMenuController=createLangMenuController({
  LANGUAGE_NATIVE_LABEL,
  LANGUAGE_OPTIONS,
  getI18nLabel:(key)=>I18N[state.language]?.[key],
  getLangAriaLabel:()=>t('lang'),
  getLanguage:()=>state.language,
  isValidLanguage:(value)=>LANGUAGE_OPTIONS.some((opt)=>opt.value===value),
  onAfterLanguageChange:()=>{},
  onBeforeLanguageChange:()=>{},
  setLanguageState:(value,{reloadGoogle=false}={})=>{
    if(state.language!==value)resetCalloutPlaybackState();
    state.language=value;
    relabelSoloBots();
    if(reloadGoogle)reloadGoogleScriptForLocale();
    render();
  }
});
const BASE_URL=(import.meta.env?.BASE_URL??'./').replace(/\/?$/,'/');
const withBase=(p)=>`${BASE_URL}${String(p??'').replace(/^\/+/,'')}`;
const normalizeCalloutStylePack=(v)=>{
  void v;
  return 'energetic';
};
const winnerCalloutWinsByName=new Map();

const t=(k)=>I18N[state.language]?.[k]??I18N.en?.[k]??k;
function formatHobbyList(hobbies){
  const list=Array.isArray(hobbies)?hobbies.map((x)=>String(x??'').trim()).filter(Boolean):[];
  if(!list.length)return'-';
  const joiner=state.language==='zh-HK'?'、':', ';
  const translated=list.map((item)=>translateProfileHobby(item,state.language));
  return translated.join(joiner);
}
function hashTextSeed(seed=''){
  const txt=String(seed??'');
  let h=0;
  for(let i=0;i<txt.length;i++){
    h=((h*31)+txt.charCodeAt(i))>>>0;
  }
  return h;
}
function buildResponseCalloutText(type,kind='',seed='',meta={}){
  const lang=CALLOUT_RESPONSE_TEXT[state.language]?state.language:(CALLOUT_RESPONSE_TEXT.en?'en':'zh-HK');
  const bank=CALLOUT_RESPONSE_TEXT[lang]??CALLOUT_RESPONSE_TEXT['zh-HK'];
  if(type==='pass'){
    const opts=bank.pass??[];
    if(!opts.length)return lang==='en'?'Pass':'大';
    let idx=hashTextSeed(`${seed}|pass`) % opts.length;
    if(opts.length>1&&String(opts[idx])===String(passCallState.text??''))idx=(idx+1)%opts.length;
    return String(opts[idx]);
  }
  if(type==='play'){
    const opts=bank.play??[];
    const label=kindLabel(kind);
    if(Boolean(meta?.isRoundLead))return`${label}!`;
    if(!opts.length)return`${label}!`;
    const forcedIdxRaw=Number(meta?.playVariantIndex);
    let idx=Number.isFinite(forcedIdxRaw)
      ?Math.max(0,Math.min(opts.length-1,Math.trunc(forcedIdxRaw)))
      :hashTextSeed(`${seed}|play|${kind}`) % opts.length;
    let fmt=opts[idx];
    let out=typeof fmt==='function'?String(fmt(label)):String(fmt);
    if(opts.length>1&&out===String(playTypeCallState.text??'')){
      idx=(idx+1)%opts.length;
      fmt=opts[idx];
      out=typeof fmt==='function'?String(fmt(label)):String(fmt);
    }
    return out;
  }
  if(type==='last'){
    const opts=bank.last??[];
    if(!opts.length)return t('lastCardCall');
    let idx=hashTextSeed(`${seed}|last`) % opts.length;
    if(opts.length>1&&String(opts[idx])===String(lastCardCallState.text??''))idx=(idx+1)%opts.length;
    return String(opts[idx]);
  }
  return'';
}
function buildWinnerCalloutForSeat(game,seat){
  const lang=CALLOUT_RESPONSE_TEXT[state.language]?state.language:(CALLOUT_RESPONSE_TEXT.en?'en':'zh-HK');
  const bank=CALLOUT_RESPONSE_TEXT[lang]??CALLOUT_RESPONSE_TEXT['zh-HK'];
  const winnerLines=Array.isArray(bank.winner)?bank.winner:[];
  const winnerRepeat=String(bank.winnerRepeat??'').trim();
  const nameRaw=String(game?.players?.[seat]?.name??'').trim();
  const nameKey=nameRaw||`seat-${Number.isFinite(Number(seat))?Number(seat):0}`;
  const wins=(Number(winnerCalloutWinsByName.get(nameKey))||0)+1;
  winnerCalloutWinsByName.set(nameKey,wins);
  if(wins>1&&winnerRepeat)return{text:winnerRepeat,repeat:true};
  if(!winnerLines.length)return{text:'',repeat:false};
  const idx=Math.abs(hashTextSeed(`${nameKey}|winner|${wins}`))%winnerLines.length;
  return{text:String(winnerLines[idx]),repeat:false};
}
function normalizeCalloutText(msg=''){
  return String(msg??'')
    .toLowerCase()
    .replace(/[!！。.,，]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}
function isPassCalloutText(msg=''){
  const norm=normalizeCalloutText(msg);
  if(!norm)return false;
  if(norm==='pass'||norm==='大')return true;
  const lang=state.language==='en'?'en':'zh-HK';
  const bank=CALLOUT_RESPONSE_TEXT[lang]??CALLOUT_RESPONSE_TEXT['zh-HK'];
  const passSet=(bank.pass??[]).map((x)=>normalizeCalloutText(x)).filter(Boolean);
  return passSet.includes(norm);
}
function isLastCalloutText(msg=''){
  const norm=normalizeCalloutText(msg);
  if(!norm)return false;
  const lastNorm=normalizeCalloutText(t('lastCardCall'));
  if(norm===lastNorm||norm.includes('last'))return true;
  const lang=state.language==='en'?'en':'zh-HK';
  const bank=CALLOUT_RESPONSE_TEXT[lang]??CALLOUT_RESPONSE_TEXT['zh-HK'];
  const lastSet=(bank.last??[]).map((x)=>normalizeCalloutText(x)).filter(Boolean);
  return lastSet.includes(norm);
}
function isCanonicalRecordedCalloutText(msg='',clipKey=''){
  const norm=normalizeCalloutText(msg);
  const key=String(clipKey??'').trim().toLowerCase();
  if(!norm||!key)return false;
  if(key==='pass')return norm==='pass'||norm==='\u5927';
  if(key==='last')return norm===normalizeCalloutText(t('lastCardCall'));
  if(key==='winner'){
    const lang=state.language==='en'?'en':'zh-HK';
    const bank=CALLOUT_RESPONSE_TEXT[lang]??CALLOUT_RESPONSE_TEXT['zh-HK'];
    const winnerSet=(bank.winner??[]).map((x)=>normalizeCalloutText(x)).filter(Boolean);
    return winnerSet.includes(norm);
  }
  if(key==='winner-repeat'){
    const lang=state.language==='en'?'en':'zh-HK';
    const bank=CALLOUT_RESPONSE_TEXT[lang]??CALLOUT_RESPONSE_TEXT['zh-HK'];
    return norm===normalizeCalloutText(bank.winnerRepeat??'');
  }
  if(key.startsWith('kind-')){
    const kind=key.slice(5);
    const label=normalizeCalloutText(kindLabel(kind));
    return norm===label||norm===`${label}!`;
  }
  return false;
}

function deriveWinnerVariantClipKey(msg=''){
  const norm=normalizeCalloutText(msg);
  if(!norm)return'';
  const lang=state.language==='en'?'en':'zh-HK';
  const bank=CALLOUT_RESPONSE_TEXT[lang]??CALLOUT_RESPONSE_TEXT['zh-HK'];
  const repeatNorm=normalizeCalloutText(bank.winnerRepeat??'');
  if(repeatNorm&&repeatNorm===norm)return'line-winner-repeat';
  const winnerList=Array.isArray(bank.winner)?bank.winner:[];
  for(let i=0;i<winnerList.length;i+=1){
    if(normalizeCalloutText(winnerList[i])===norm)return`line-winner-${i+1}`;
  }
  return'';
}

async function playWinnerCallout(wc,gender='male',seat=0){
  await calloutAudioController.playWinnerCallout(wc,gender,seat);
}

function deriveZhHkVariantClipKey(msg='',meta={}){
  if(state.language!=='zh-HK')return'';
  const norm=normalizeCalloutText(msg);
  if(!norm)return'';
  const bank=CALLOUT_RESPONSE_TEXT['zh-HK']??{};
  const passList=Array.isArray(bank.pass)?bank.pass:[];
  for(let i=0;i<passList.length;i+=1){
    if(normalizeCalloutText(passList[i])===norm)return`line-pass-${i+1}`;
  }
  const lastList=Array.isArray(bank.last)?bank.last:[];
  for(let i=0;i<lastList.length;i+=1){
    if(normalizeCalloutText(lastList[i])===norm)return`line-last-${i+1}`;
  }
  const explicit=String(meta?.clipKey??'').trim().toLowerCase();
  let kindKey='';
  if(explicit.startsWith('kind-'))kindKey=explicit.slice(5);
  if(!kindKey){
    const zhKinds=KIND['zh-HK']??{};
    for(const[k,v]of Object.entries(zhKinds)){
      const label=normalizeCalloutText(v);
      if(label&&norm.startsWith(label)){kindKey=k;break;}
    }
  }
  if(!kindKey)return'';
  const playTemplates=Array.isArray(bank.play)?bank.play:[];
  const kindText=(KIND['zh-HK']?.[kindKey])??'';
  if(!kindText)return'';
  for(let i=0;i<playTemplates.length;i+=1){
    const tpl=playTemplates[i];
    const candidate=typeof tpl==='function'?String(tpl(kindText)):String(tpl??'');
    if(normalizeCalloutText(candidate)===norm)return`line-kind-${kindKey}-${i+1}`;
  }
  return'';
}
function deriveEnVariantClipKey(msg='',meta={}){
  if(state.language!=='en')return'';
  const norm=normalizeCalloutText(msg);
  if(!norm)return'';
  const bank=CALLOUT_RESPONSE_TEXT['en']??{};
  const passList=Array.isArray(bank.pass)?bank.pass:[];
  for(let i=0;i<passList.length;i+=1){
    if(normalizeCalloutText(passList[i])===norm){
      return i===0?'':`line-pass-${i+1}`;
    }
  }
  const lastList=Array.isArray(bank.last)?bank.last:[];
  for(let i=0;i<lastList.length;i+=1){
    if(normalizeCalloutText(lastList[i])===norm){
      return i===0?'':`line-last-${i+1}`;
    }
  }
  const explicit=String(meta?.clipKey??'').trim().toLowerCase();
  let kindKey='';
  if(explicit.startsWith('kind-'))kindKey=explicit.slice(5);
  if(!kindKey){
    const enKinds=KIND.en??{};
    for(const[k,v] of Object.entries(enKinds)){
      const label=normalizeCalloutText(v);
      if(label&&norm.startsWith(label)){kindKey=k;break;}
    }
  }
  if(!kindKey)return'';
  const playTemplates=Array.isArray(bank.play)?bank.play:[];
  const kindText=KIND.en?.[kindKey]??'';
  if(!kindText)return'';
  for(let i=0;i<playTemplates.length;i+=1){
    const tpl=playTemplates[i];
    const candidate=typeof tpl==='function'?String(tpl(kindText)):String(tpl??'');
    if(normalizeCalloutText(candidate)===norm){
      return i===0?'':`line-kind-${kindKey}-${i+1}`;
    }
  }
  return'';
}
function deriveZhHkComposedClipKeys(variantClipKey='',clipKey=''){
  if(state.language!=='zh-HK')return[];
  const key=String(variantClipKey??'').trim().toLowerCase();
  const baseClip=String(clipKey??'').trim().toLowerCase();
  if(!key||!baseClip.startsWith('kind-'))return[];
  const match=/^line-kind-[a-z]+-(\d+)$/.exec(key);
  if(!match)return[];
  const variantNum=Number(match[1]);
  if(!Number.isFinite(variantNum)||variantNum<1||variantNum>5)return[];
  if(variantNum===1)return[baseClip];
  const tailMap={
    2:'line-play-tail-2',
    3:'line-play-tail-3',
    4:'line-play-tail-4',
    5:'line-play-tail-5'
  };
  const tailKey=tailMap[variantNum]??'';
  if(!tailKey)return[];
  return[baseClip,tailKey];
}
const kindLabel=(k)=> (KIND[state.language]??KIND.en??KIND['zh-HK'])?.[k] ?? k;
function setSoloStatus(message,{appendLog=true}={}){
  const g=state.solo;
  if(!g)return;
  const text=String(message??'').trim();
  g.status=text;
  if(!appendLog||!text)return;
  if(!Array.isArray(g.systemLog))g.systemLog=[];
  const last=g.systemLog[g.systemLog.length-1];
  if(last&&last.text===text)return;
  g.systemLog.push({text,ts:Date.now()});
  if(g.systemLog.length>200)g.systemLog=g.systemLog.slice(-200);
}
function leaderboardPanelHtml(){
  return renderLeaderboardPanel({
    leaderboard:state.home.leaderboard,
    botProfiles:[...BOT_PROFILES.zh,...BOT_PROFILES.en],
    authPictureUrlFrom,
    avatarDataUri,
    esc,
    t,
    language:state.language
  });
}
function leaderboardModalHtml(){
  return renderLeaderboardModal({
    t,
    esc,
    leaderboardPanelHtml:leaderboardPanelHtml()
  });
}
function loadLeaderboardStore(){
  return runtimeProfileStore;
}
function saveLeaderboardStore(store){
  if(!store||typeof store!=='object')return;
  runtimeProfileStore.players=store.players&&typeof store.players==='object'?store.players:{};
}
const LOCAL_ROOM_KEY='big2.currentRoomId';
// Keep room identity helpers early: profile/settings wiring reads currentRoomPlayerId during init.
const roomIdentityHelpers=createRoomIdentityHelpers({
  getState:()=>state,
  getFirebaseAuth:()=>firebaseAuth
});
const {
  baseRoomPlayerId,
  currentAuthUserUid,
  currentRoomPlayerId
}=roomIdentityHelpers;
const {
  clampScoreValue,
  scoreFromStoredTotal,
  currentHumanScoreValue,
  roomSeatStartingScore,
  soloStartingTotals,
  collectMainSettings,
  applyMainSettings
}=createProfileSettingsHelpers({
  getState:()=>state,
  languageOptions:LANGUAGE_OPTIONS,
  backOptions:BACK_OPTIONS,
  getSoundEnabled:()=>sound.enabled,
  setSoundEnabled:(value)=>{sound.enabled=value;},
  getCalloutDisplayEnabled:()=>calloutDisplayEnabled,
  setCalloutDisplayEnabled:(value)=>{calloutDisplayEnabled=value;},
  getEmoteDisplayEnabled:()=>emoteDisplayEnabled,
  setEmoteDisplayEnabled:(value)=>{emoteDisplayEnabled=value;},
  getVibrateEnabled:()=>vibrateEnabled,
  setVibrateEnabled:(value)=>{vibrateEnabled=value;},
  normalizeCalloutStylePack,
  getCalloutStylePack:()=>calloutStylePack,
  setCalloutStylePack:(value)=>{calloutStylePack=value;},
  setCalloutVoiceMode:(value)=>{calloutVoiceMode=value;},
  currentLeaderboardIdentity,
  ensureLeaderboardEntry,
  loadLeaderboardStore,
  botLeaderboardIdentity,
  currentRoomPlayerId
});
const {
  AVATAR_BASE_SRC,
  authPictureUrl,
  authPictureUrlFrom,
  avatarDataUri,
  selfAvatarDataUri,
  avatarGenderClass
}=createAvatarProfileHelpers({
  withBase,
  hashNameSeed,
  pick,
  getGooglePicture:()=>String(state.home.google?.picture??'').trim(),
  isGoogleSignedIn:()=>Boolean(state.home.google?.signedIn),
  isGooglePictureLoaded:()=>Boolean(state.home.google?.pictureLoaded)
});
const {
  profileParagraphsHtml,
  profileFieldValue
}=createOpponentProfileHelpers({
  esc:(value)=>esc(value),
  getLanguage:()=>state.language
});
function syncSessionScoreFromStore(store,{force=false}={}){
  if(!store||typeof store!=='object'||!store.players||typeof store.players!=='object')return;
  const identity=currentLeaderboardIdentity();
  const players=store.players;
  const idRaw=String(identity.id??'').trim();
  const idLower=idRaw.toLowerCase();
  const email=String(identity.email??state.home.google?.email??'').trim().toLowerCase();
  const uid=String(state.home.google?.uid??'').trim();
  const sub=String(state.home.google?.sub??'').trim();
  const directKeys=[idRaw,idLower,uid,uid.toLowerCase(),sub,sub.toLowerCase()].filter(Boolean);
  let matchedKey=directKeys.find((k)=>players[k]);
  let entry=matchedKey?players[matchedKey]:null;
  if(!entry&&email){
    const byEmail=Object.entries(players).find(([,value])=>String(value?.email??'').trim().toLowerCase()===email);
    if(byEmail){
      matchedKey=String(byEmail[0]??'').trim();
      entry=byEmail[1];
    }
  }
  if(!entry)return;
  if(idRaw&&matchedKey&&matchedKey!==idRaw&&!players[idRaw]){
    players[idRaw]={...entry,id:idRaw};
    saveLeaderboardStore(store);
    entry=players[idRaw];
  }
  const inGame=state.screen==='game'&&Array.isArray(state.solo.players)&&state.solo.players.length>0&&!state.solo.gameOver;
  if(inGame&&!force)return;
  const restored=scoreFromStoredTotal(entry.totalScore);
  state.score=restored;
  state.solo.totals=[restored,5000,5000,5000];
}
async function hydrateProfileFromCloudByIdentity(identity){
  initFirebaseIfReady();
  try{
    const ids=identityLookupIds(identity);
    if(!ids.length)return{status:'not_found'};
    let data=null;
    let foundId='';
    let readFailed=false;
    for(const id of ids){
      if(firebaseDb){
        try{
          const s=await firebaseDb.collection(FIRESTORE_LB_COLLECTION).doc(id).get();
          if(s.exists){data=s.data()??{};foundId=id;break;}
        }catch{readFailed=true;}
      }
      if(!data){
        try{
          const d=await readProfileDocByRest(id);
          if(d){data=d;foundId=id;break;}
        }catch{readFailed=true;}
      }
    }
    if(!data){
      if(!readFailed&&(identity?.email||identity?.id)){
        const store=loadLeaderboardStore();
        const entry=ensureLeaderboardEntry(store,identity);
        if(entry){
          const name=String(state.home.google?.name||identity?.name||entry.name||'Player').trim().slice(0,18);
          const email=String(identity?.email??entry.email??'').trim().toLowerCase().slice(0,120);
          entry.name=name||entry.name;
          entry.email=email||entry.email;
          entry.gender=state.home.gender==='female'?'female':'male';
          entry.picture=String(state.home.google?.picture??entry.picture??'').trim();
          entry.settings=collectMainSettings();
          entry.totalScore=scoreFromStoredTotal(entry.totalScore);
          entry.updatedAt=Date.now();
          saveLeaderboardStore(store);
        }
        state.home.google.profileMissing=false;
        return{status:'not_found'};
      }
      return{status:'error'};
    }
    const d=data;
    const restoredName=String(d.name??'').trim().slice(0,18);
    const restoredScore=scoreFromStoredTotal(d.totalScore);
    const restoredGender=String(d.gender??state.home.gender??'male')==='female'?'female':'male';
    const restoredPicture=String(d.picture??'').trim();
    applyRestoredGoogleProfile({
      name:restoredName,
      gender:restoredGender,
      picture:restoredPicture,
      totalScore:restoredScore,
      settings:d.settings,
      updateScore:true
    });
    const store=loadLeaderboardStore();
    const entry=ensureLeaderboardEntry(store,identity);
    if(entry){
      entry.name=restoredName||entry.name;
      entry.gender=restoredGender;
      entry.settings=collectMainSettings();
      entry.totalScore=restoredScore;
      entry.games=Number(d.games)||Number(entry.games)||0;
      entry.wins=Number(d.wins)||Number(entry.wins)||0;
      entry.updatedAt=Number(d.updatedAt)||Date.now();
      saveLeaderboardStore(store);
    }
    const preferredId=String(currentLeaderboardIdentity().id??'');
    if(preferredId&&foundId&&preferredId!==foundId){
      await firebaseDb.collection(FIRESTORE_LB_COLLECTION).doc(preferredId).set({
        id:preferredId,
        name:restoredName||String(identity?.name??'Player').slice(0,32),
        email:String(identity?.email??'').toLowerCase().slice(0,120),
        gender:restoredGender,
        picture:restoredPicture,
        settings:collectMainSettings(),
        totalScore:restoredScore,
        games:Number(d.games)||0,
        wins:Number(d.wins)||0,
        updatedAt:Number(d.updatedAt)||Date.now()
      },{merge:true});
    }
    return{status:'found'};
  }catch(err){
    console.error('profile hydrate failed',err);
    return{status:'error'};
  }
}
function initFirebaseIfReady(){
  try{
    if(firebaseDb)return true;
    const fb=window.firebase;
    if(!fb)return false;
    if(!fb.apps?.length)fb.initializeApp(FIREBASE_CONFIG);else fb.app();
    firebaseAuth=fb.auth?.();
    firebaseDb=fb.firestore();
    return true;
  }catch{return false;}
}
function primaryFirebaseInstanceId(){
  return String(FIREBASE_CONFIG.projectId??'').trim();
}
function isFirebaseInstanceRoomEnabled(instance){
  const projectId=String(instance?.projectId??instance?.id??'').trim();
  if(projectId&&projectId===primaryFirebaseInstanceId())return PRIMARY_FIREBASE_ROOM_ENABLED;
  return instance?.roomEnabled!==false;
}
function deriveFirebaseInstanceConfig(instance){
  const projectId=String(instance?.projectId??'').trim();
  if(!projectId)return null;
  if(projectId===primaryFirebaseInstanceId())return{...FIREBASE_CONFIG};
  const apiKey=String(instance?.apiKey??'').trim();
  if(!apiKey)return null;
  return{
    apiKey,
    authDomain:`${projectId}.firebaseapp.com`,
    projectId,
    storageBucket:`${projectId}.firebasestorage.app`,
    messagingSenderId:String(instance?.projectNumber||'').trim(),
    appId:String(instance?.appId||'').trim(),
    measurementId:''
  };
}
async function loadFirebaseInstances(force=false){
  if(!initFirebaseIfReady())return[];
  if(firebaseInstancesCache&&!force)return firebaseInstancesCache;
  try{
    const snap=await firebaseDb.collection(FIRESTORE_FIREBASE_INSTANCES_COLLECTION).get();
    const rows=snap.docs.map((doc)=>({
      id:String(doc.id||'').trim(),
      ...doc.data()
    })).filter((row)=>String(row.projectId||row.id||'').trim());
    const seen=new Set();
    const out=[];
    rows.forEach((row)=>{
      const projectId=String(row.projectId||row.id||'').trim();
      if(!projectId||seen.has(projectId))return;
      seen.add(projectId);
      out.push({
        id:projectId,
        projectId,
        projectNumber:String(row.projectNumber||'').trim(),
        appId:String(row.appId||'').trim(),
        apiKey:String(row.apiKey||'').trim(),
        roomEnabled:row.roomEnabled!==false
      });
    });
    const primaryId=primaryFirebaseInstanceId();
    if(primaryId&&!seen.has(primaryId)){
      out.unshift({
        id:primaryId,
        projectId:primaryId,
        projectNumber:String(FIREBASE_CONFIG.messagingSenderId||'').trim(),
        appId:String(FIREBASE_CONFIG.appId||'').trim(),
        apiKey:String(FIREBASE_CONFIG.apiKey||'').trim(),
        roomEnabled:PRIMARY_FIREBASE_ROOM_ENABLED
      });
    }
    firebaseInstancesCache=out;
    return out;
  }catch{
    const primaryId=primaryFirebaseInstanceId();
    firebaseInstancesCache=primaryId?[{
      id:primaryId,
      projectId:primaryId,
      projectNumber:String(FIREBASE_CONFIG.messagingSenderId||'').trim(),
      appId:String(FIREBASE_CONFIG.appId||'').trim(),
      apiKey:String(FIREBASE_CONFIG.apiKey||'').trim(),
      roomEnabled:PRIMARY_FIREBASE_ROOM_ENABLED
    }]:[];
    return firebaseInstancesCache;
  }
}
async function getFirebaseDbForInstanceId(instanceId=''){
  if(!initFirebaseIfReady())return null;
  const target=String(instanceId||primaryFirebaseInstanceId()).trim()||primaryFirebaseInstanceId();
  if(!target||target===primaryFirebaseInstanceId())return firebaseDb;
  if(firebaseRoomDbs.has(target))return firebaseRoomDbs.get(target);
  const rows=await loadFirebaseInstances();
  const instance=rows.find((row)=>String(row.projectId||row.id||'').trim()===target)||null;
  const config=deriveFirebaseInstanceConfig(instance);
  if(!config||!config.apiKey||!config.projectId||!config.appId)return null;
  try{
    const fb=window.firebase;
    if(!fb)return null;
    const existing=fb.apps?.find?.((app)=>String(app?.name||'')===`room-${target}`)??null;
    const app=existing||fb.initializeApp(config,`room-${target}`);
    const db=app.firestore();
    firebaseRoomApps.set(target,app);
    firebaseRoomDbs.set(target,db);
    return db;
  }catch{
    return null;
  }
}
function currentRoomDb(){
  const instanceId=String(state.room?.firebaseInstanceId||'').trim();
  if(!instanceId||instanceId===primaryFirebaseInstanceId())return firebaseDb;
  return firebaseRoomDbs.get(instanceId)||null;
}
async function findRoomDirectoryByCode(code){
  if(!firebaseDb)return null;
  const snap=await firebaseDb.collection(FIRESTORE_ROOM_DIRECTORY_COLLECTION).where('code','==',String(code||'')).limit(1).get();
  return snap.docs?.[0]??null;
}
async function readRoomDirectory(roomId){
  if(!firebaseDb||!roomId)return null;
  const snap=await firebaseDb.collection(FIRESTORE_ROOM_DIRECTORY_COLLECTION).doc(String(roomId)).get();
  return snap.exists?snap:null;
}
async function writeRoomDirectory(roomId,data){
  if(!firebaseDb||!roomId)return false;
  await firebaseDb.collection(FIRESTORE_ROOM_DIRECTORY_COLLECTION).doc(String(roomId)).set(data,{merge:false});
  return true;
}
async function deleteRoomDirectory(roomId){
  if(!firebaseDb||!roomId)return;
  try{
    await firebaseDb.collection(FIRESTORE_ROOM_DIRECTORY_COLLECTION).doc(String(roomId)).delete();
  }catch{}
}
async function chooseNextRoomFirebaseInstanceId(){
  const rows=await loadFirebaseInstances();
  const available=[];
  for(const row of rows){
    if(!isFirebaseInstanceRoomEnabled(row))continue;
    const projectId=String(row.projectId||row.id||'').trim();
    if(!projectId)continue;
    const db=await getFirebaseDbForInstanceId(projectId);
    if(db)available.push(projectId);
  }
  if(!available.length)return'';
  if(!firebaseDb)return available[0];
  try{
    const ref=firebaseDb.collection(FIRESTORE_ROOM_ROUTING_COLLECTION).doc(ROOM_ROUTING_DOC_ID);
    return await firebaseDb.runTransaction(async(tx)=>{
      const snap=await tx.get(ref);
      const data=snap.exists?(snap.data()??{}):{};
      const lastId=String(data.lastRoomFirebaseInstanceId||'').trim();
      const idx=available.indexOf(lastId);
      const nextId=idx<0?available[0]:available[(idx+1)%available.length];
      tx.set(ref,{
        lastRoomFirebaseInstanceId:nextId,
        updatedAt:Date.now()
      },{merge:true});
      return nextId;
    });
  }catch{
    return available[0];
  }
}
async function connectToRoom(roomId,code='',instanceId=''){
  return roomSubscriptionController.connectToRoom(roomId,code,instanceId);
}
async function resolveRoomDocByDirectory(roomId='',code=''){
  return roomSubscriptionController.resolveRoomDocByDirectory(roomId,code);
}
async function ensureFirebaseWriteAuth(){
  return Boolean(firebaseDb||initFirebaseIfReady());
}
function toFirestoreValue(v){
  if(v===null||v===undefined)return{nullValue:null};
  if(typeof v==='string')return{stringValue:v};
  if(typeof v==='boolean')return{booleanValue:v};
  if(typeof v==='number')return Number.isFinite(v)?{integerValue:String(Math.trunc(v))}:{integerValue:'0'};
  if(Array.isArray(v))return{arrayValue:{values:v.map(toFirestoreValue)}};
  if(typeof v==='object'){
    const fields={};
    Object.entries(v).forEach(([k,val])=>{if(val!==undefined)fields[k]=toFirestoreValue(val);});
    return{mapValue:{fields}};
  }
  return{stringValue:String(v)};
}
function fromFirestoreValue(v){
  if(!v||typeof v!=='object')return null;
  if('stringValue'in v)return String(v.stringValue??'');
  if('booleanValue'in v)return Boolean(v.booleanValue);
  if('integerValue'in v)return Number(v.integerValue??0);
  if('doubleValue'in v)return Number(v.doubleValue??0);
  if('nullValue'in v)return null;
  if('arrayValue'in v)return Array.isArray(v.arrayValue?.values)?v.arrayValue.values.map(fromFirestoreValue):[];
  if('mapValue'in v){
    const out={};
    const f=v.mapValue?.fields??{};
    Object.keys(f).forEach((k)=>{out[k]=fromFirestoreValue(f[k]);});
    return out;
  }
  return null;
}
function firestoreRestDocUrl(collection,docId){
  const projectId=String(FIREBASE_CONFIG.projectId??'').trim();
  const apiKey=String(FIREBASE_CONFIG.apiKey??'').trim();
  if(!projectId||!apiKey)return'';
  return`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(docId)}?key=${encodeURIComponent(apiKey)}`;
}
async function writeProfileDocByRest(docId,data){
  const url=firestoreRestDocUrl(FIRESTORE_LB_COLLECTION,docId);
  if(!url)throw new Error('rest url unavailable');
  const fields={};
  Object.entries(data).forEach(([k,v])=>{if(v!==undefined)fields[k]=toFirestoreValue(v);});
  const res=await fetch(url,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields})});
  if(!res.ok){
    const text=await res.text().catch(()=>'');
    throw new Error(`rest write failed ${res.status} ${text}`);
  }
  return true;
}
async function readProfileDocByRest(docId){
  const url=firestoreRestDocUrl(FIRESTORE_LB_COLLECTION,docId);
  if(!url)throw new Error('rest url unavailable');
  const res=await fetch(url,{method:'GET'});
  if(res.status===404)return null;
  if(!res.ok){
    const text=await res.text().catch(()=>'');
    throw new Error(`rest read failed ${res.status} ${text}`);
  }
  const json=await res.json();
  const rawFields=json?.fields??{};
  const out={};
  Object.keys(rawFields).forEach((k)=>{out[k]=fromFirestoreValue(rawFields[k]);});
  return out;
}
function isBotIdentity(identity){return Boolean(identity?.isBot);}
function buildProfilePayload(identity,entry,updatedAt){
  const isBot=isBotIdentity(identity);
  const picture=isBot?'':String(identity?.picture??state.home.google?.picture??'').trim();
  const settings=isBot?{}:(identity?.settings&&typeof identity.settings==='object'?identity.settings:collectMainSettings());
  return{
    id:String(entry.id),
    name:String(identity?.name??entry.name??'Player').slice(0,32),
    email:String(identity?.email??entry.email??'').toLowerCase().slice(0,120),
    gender:String(identity?.gender??entry.gender??'male')==='female'?'female':'male',
    picture,
    settings,
    totalScore:scoreFromStoredTotal(entry.totalScore),
    games:Number(entry.games)||0,
    wins:Number(entry.wins)||0,
    updatedAt:Number(updatedAt)||Date.now()
  };
}
const googleProfileHelpers=createGoogleProfileHelpers({
  getState:()=>state,
  loadLeaderboardStore,
  scoreFromStoredTotal,
  applyMainSettings,
  preloadGooglePicture
});
const {
  applyCachedGoogleProfileFromStore,
  applyRestoredGoogleProfile,
  mergeBrowserGoogleProfile
}=googleProfileHelpers;
function signedInForPlay(){
  if(state.home.google?.hydrating)return false;
  if(state.home.google?.profileMissing)return false;
  const authUser=firebaseAuth?.currentUser;
  if(authUser?.uid)return true;
  const g=state.home.google??{};
  return Boolean(g.signedIn&&(String(g.email??'').trim()||String(g.uid??'').trim()||String(g.sub??'').trim()));
}
const googleSessionHelpers=createGoogleSessionHelpers({
  getState:()=>state,
  getWindow:()=>window,
  getStorage:()=>localStorage,
  sessionKey:GOOGLE_SESSION_KEY,
  getFirebaseAuth:()=>firebaseAuth,
  mergeBrowserGoogleProfile,
  applyCachedGoogleProfileFromStore,
  preloadGooglePicture,
  initFirebaseIfReady,
  hydrateProfileFromCloudByIdentity,
  currentLeaderboardIdentity,
  syncLeaderboardProfile,
  loadActiveRoomPointer,
  refreshLeaderboard,
  render
});
const {
  clearGoogleSession,
  hydrateProfileBlocking,
  handleCredentialResponse,
  loadGoogleSession,
  saveGoogleSession,
  signedInWithEmail
}=googleSessionHelpers;
const googleIdentityController=createGoogleIdentityController({
  getState:()=>state,
  getWindow:()=>window,
  getDocument:()=>document,
  getFirebaseAuth:()=>firebaseAuth,
  getT:()=>t,
  getRender:()=>render,
  signedInWithEmail,
  clearGoogleSession,
  handleCredentialResponse,
  authProviderBadgeHtml
});
const {
  onGoogleScriptLoaded,
  reloadGoogleScriptForLocale,
  renderGoogleInline
}=googleIdentityController;
const roomExpiryHelpers=createRoomExpiryHelpers({
  DEFAULT_TURN_TIMEOUT_MS,
  ROOM_IDLE_KILL_MS,
  ROOM_RESULT_IDLE_MS,
  ROOM_TIMEOUT_GRACE_MS
});
const {
  getRoomLifecycleExpiresAt,
  getRoomTurnTimeoutWithGrace,
  nextRoomIdleExpiry,
  roomCountdownText,
  roomLifecycleExpired,
  roomResultExpired
}=roomExpiryHelpers;
const roomLifecycleController=createRoomLifecycleController({
  FIRESTORE_ROOMS_COLLECTION,
  addRoomSystemLog,
  botProfileForSeat,
  clearRoomStartPending,
  cloneRoomGame,
  currentRoomDb,
  currentRoomPlayerId,
  deleteRoomDirectory,
  getRoomPresenceTimer:()=>roomPresenceTimer,
  getState:()=>state,
  loadActiveRooms,
  render,
  roomLeaveLogText:(name)=>t('roomLeaveLog').replace('{{name}}',name),
  roomPlayerIds,
  setRecommendHint,
  setRoomPresenceTimer:(value)=>{roomPresenceTimer=value;},
  setRoomResultExpiryReached:(value)=>{roomResultExpiryReached=Boolean(value);},
  updateActiveRoomPointer
});
function isValidDifficulty(value){
  return value==='easy'||value==='normal'||value==='hard';
}
function resetRoomState(){
  roomLifecycleController.resetRoomState();
}
function abandonRoomLocally(msg='',openLobby=true){
  roomLifecycleController.abandonRoomLocally(msg,openLobby);
}
const roomMutationsController=createRoomMutationsController({
  FIRESTORE_ROOMS_COLLECTION,
  FIRESTORE_USERS_COLLECTION,
  ROOM_RESULT_IDLE_MS,
  authPictureUrl,
  buildRoomGameState,
  bumpRoomPlayerLastSeen,
  clampScoreValue,
  clearRoomStartPending,
  currentHumanScoreValue,
  currentRoomDb,
  currentRoomPlayerId,
  getFirebaseDb:()=>firebaseDb,
  getState:()=>state,
  nextRoomIdleExpiry,
  normalizeRoomTotals,
  roomPlayerIds,
  roomResultExpired,
  roomSeatForPlayer,
  roomTotalsWithSeatScore,
  sanitizeRoomPlayerEntry,
  setRoomError,
  setSoloStatus,
  t
});
const roomActionsController=createRoomActionsController({
  FIRESTORE_ROOMS_COLLECTION,
  ROOM_RESULT_IDLE_MS,
  addRoomSystemLog,
  authPictureUrl,
  baseRoomPlayerId,
  chooseNextRoomFirebaseInstanceId,
  cloneRoomGame,
  collectMainSettings,
  connectToRoom,
  currentHumanScoreValue,
  ensureSingleRoomMembership,
  findRoomByCode,
  gateGuestRoomAccess,
  gateUserRoomAccess,
  generateRoomCode,
  getFirebaseDbForInstanceId,
  getState:()=>state,
  initFirebaseIfReady,
  isRoomPlayerActive,
  isRoomPlayerHuman,
  nextRoomIdleExpiry,
  normalizeRoomTotals,
  render,
  setRoomError,
  roomPlayerIds,
  roomTotalsWithSeatScore,
  signedInForPlay,
  subscribeRoom,
  t,
  updateActiveRoomPointer,
  writeRoomDirectory
});
const roomSubscriptionController=createRoomSubscriptionController({
  FIRESTORE_ROOMS_COLLECTION,
  FIRESTORE_USERS_COLLECTION,
  LOCAL_ROOM_KEY,
  ROOM_HOST_TAKEOVER_MS,
  ROOM_STALE_MS,
  abandonRoomLocally,
  applyRoomGameSnapshot,
  baseRoomPlayerId,
  clearRoomStartPending,
  currentAuthUserUid,
  currentRoomDb,
  deleteRoomDirectory,
  findRoomDirectoryByCode,
  getFirebaseDb:()=>firebaseDb,
  getFirebaseDbForInstanceId,
  getState:()=>state,
  isRoomPlayerActive,
  isRoomPresenceOnlyUpdate,
  matchGuestPlayerId,
  maybeRunRoomAi,
  primaryFirebaseInstanceId,
  readRoomDirectory,
  render,
  roomPlayerIds,
  roomLifecycleExpired,
  roomResultExpired,
  roomSelfSeat,
  selectRoomHostCandidate,
  setRoomError,
  setRoomResultExpiryReached:(value)=>{roomResultExpiryReached=Boolean(value);},
  startRoomPresencePing,
  syncRoomGameRoster,
  syncRoomSelfScoreIfNeeded,
  t
});
function setRoomError(msg){
  state.room.error=msg||'';
  render();
}
function clearRoomStartPending(){
  state.room.pendingStart=false;
  if(roomStartPendingTimer){clearTimeout(roomStartPendingTimer);roomStartPendingTimer=null;}
}
function resetSoloSessionCarryover(){
  state.solo=resetSoloSessionCarryoverState(state.solo);
}
function generateRoomCode(len=6){
  const chars='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out='';
  for(let i=0;i<len;i++){
    out+=chars[Math.floor(Math.random()*chars.length)];
  }
  return out;
}
function roomPlayerIds(players){
  if(!Array.isArray(players))return[];
  const seen=new Set();
  players.forEach((p)=>{
    const v=String(p?.uid??'').trim();
    if(v)seen.add(v);
  });
  return Array.from(seen);
}
function normalizeRoomTotals(totals){
  if(Array.isArray(totals)&&totals.length===4)return totals.map((v)=>clampScoreValue(v));
  return[5000,5000,5000,5000];
}
function roomTotalsWithSeatScore(totals,seat,score){
  const next=normalizeRoomTotals(totals);
  const safeSeat=Number(seat);
  if(!Number.isInteger(safeSeat)||safeSeat<0||safeSeat>3)return next;
  next[safeSeat]=clampScoreValue(score);
  return next;
}
function sanitizeRoomPlayerEntry(entry){
  const seatRaw=Number(entry?.seat);
  const lastSeenRaw=Number(entry?.lastSeen);
  const timeoutStrikesRaw=Number(entry?.timeoutStrikes);
  const next={
    uid:String(entry?.uid||'').trim(),
    name:String(entry?.name||'').slice(0,32),
    gender:String(entry?.gender||'male')==='female'?'female':'male',
    picture:String(entry?.picture||'').trim(),
    seat:Number.isFinite(seatRaw)?seatRaw:0,
    lastSeen:Number.isFinite(lastSeenRaw)&&lastSeenRaw>0?lastSeenRaw:0
  };
  if(Boolean(entry?.isHost))next.isHost=true;
  if(Number.isFinite(timeoutStrikesRaw)&&timeoutStrikesRaw>0)next.timeoutStrikes=Math.max(0,Math.trunc(timeoutStrikesRaw));
  if(entry?.isHuman===false)next.isHuman=false;
  return next;
}
function bumpRoomPlayerLastSeen(players,uid,now){
  if(!uid||!Array.isArray(players))return{players,changed:false};
  let changed=false;
  const next=players.map((p)=>{
    if(String(p?.uid)!==uid)return p;
    const prev=Number(p?.lastSeen)||0;
    if(now-prev<1500)return p;
    changed=true;
    return{...p,lastSeen:now};
  });
  return{players:next,changed};
}
async function findRoomByCode(code){
  const resolved=await resolveRoomDocByDirectory('',code);
  if(!resolved)return null;
  return{
    id:resolved.doc.id,
    ref:resolved.ref,
    data(){return resolved.doc.data()??{};},
    instanceId:resolved.instanceId,
    directory:resolved.directory
  };
}
async function findRoomByPlayerId(playerId){
  if(!firebaseDb||!playerId)return null;
  const rows=await loadFirebaseInstances();
  for(const row of rows){
    if(!isFirebaseInstanceRoomEnabled(row))continue;
    const projectId=String(row.projectId||row.id||'').trim();
    const roomDb=await getFirebaseDbForInstanceId(projectId);
    if(!roomDb)continue;
    try{
      const snap=await roomDb.collection(FIRESTORE_ROOMS_COLLECTION)
        .where('playerIds','array-contains',String(playerId))
        .limit(1)
        .get();
      const doc=snap.docs?.[0];
      if(!doc)continue;
      return{
        id:doc.id,
        ref:doc.ref,
        data(){return doc.data()??{};},
        instanceId:projectId
      };
    }catch{}
  }
  return null;
}
async function dropSelfFromRoom(roomDoc,playerId){
  if(!firebaseDb||!roomDoc||!playerId)return;
  const instanceId=String(roomDoc.instanceId||primaryFirebaseInstanceId()).trim()||primaryFirebaseInstanceId();
  const roomDb=(roomDoc.ref?.firestore)||await getFirebaseDbForInstanceId(instanceId);
  if(!roomDb)return;
  const ref=roomDoc.ref??roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc(roomDoc.id);
  let shouldDeleteDirectory=false;
  await roomDb.runTransaction(async(tx)=>{
    const snap=await tx.get(ref);
    if(!snap.exists)return;
    const data=snap.data()??{};
    const players=Array.isArray(data.players)?[...data.players]:[];
    const remaining=players.filter((p)=>String(p.uid)!==String(playerId));
    if(remaining.length===players.length)return;
    if(!remaining.length){
      tx.delete(ref);
      shouldDeleteDirectory=true;
      return;
    }
    const remainingHumans=remaining.filter((p)=>String(p.uid||'').startsWith('uid:')||String(p.uid||'').startsWith('guest:'));
    if(!remainingHumans.length){
      tx.delete(ref);
      shouldDeleteDirectory=true;
      return;
    }
    const hostLeaving=String(data.hostId)===String(playerId);
    const hostUpdate=hostLeaving
      ?{hostId:String(remainingHumans[0]?.uid??remaining[0]?.uid??''),hostName:String(remainingHumans[0]?.name??remaining[0]?.name??'')}
      :{};
    const now=Date.now();
    tx.update(ref,{players:remaining,playerIds:roomPlayerIds(remaining),updatedAt:now,...hostUpdate});
  });
  if(shouldDeleteDirectory)await deleteRoomDirectory(ref.id);
}
async function ensureSingleRoomMembership(targetRoomId=''){
  const playerId=baseRoomPlayerId();
  if(!playerId||!firebaseDb)return{ok:true};
  const existing=await findRoomByPlayerId(playerId);
  if(!existing)return{ok:true};
  const existingId=String(existing.id||'');
  if(targetRoomId&&existingId===String(targetRoomId))return{ok:true,already:true,roomId:existingId,instanceId:String(existing.instanceId||'')};
  const authUid=currentAuthUserUid();
  if(authUid){
    try{
      const userSnap=await firebaseDb.collection(FIRESTORE_USERS_COLLECTION).doc(authUid).get();
      const userData=userSnap.data()??{};
      const pointerRoomId=String(userData.currentRoomId??'').trim();
      if(pointerRoomId!==existingId){
        await dropSelfFromRoom(existing,playerId);
        return{ok:true,cleared:true};
      }
    }catch{}
  }
  const data=existing.data()??{};
  const status=String(data.status||'');
  const players=Array.isArray(data.players)?data.players:[];
  const entry=players.find((p)=>String(p.uid)===String(playerId));
  if(!entry){
    await dropSelfFromRoom(existing,playerId);
    return{ok:true,cleared:true};
  }
  const lastSeen=Number(entry?.lastSeen)||0;
  const now=Date.now();
  const stale=(status==='lobby'||status==='starting')&&lastSeen>0&&(now-lastSeen>roomPruneMs(status));
  if(stale){
    await dropSelfFromRoom(existing,playerId);
    return{ok:true,cleared:true};
  }
  return{ok:false,roomId:existingId,code:String(data.code||''),instanceId:String(existing.instanceId||'')};
}
async function gateUserRoomAccess(targetRoomId=''){
  const uid=currentAuthUserUid();
  if(!uid||!firebaseDb)return{ok:true};
  try{
    const ref=firebaseDb.collection(FIRESTORE_USERS_COLLECTION).doc(uid);
    const snap=await ref.get();
    if(!snap.exists)return{ok:true};
    const data=snap.data()??{};
    const active=String(data.currentRoomId??'').trim();
    if(!active)return{ok:true};
    if(targetRoomId&&active===String(targetRoomId))return{ok:true,already:true};
    const resolved=await resolveRoomDocByDirectory(active,'');
    if(!resolved){
      await ref.set({currentRoomId:'',updatedAt:Date.now()},{merge:true});
      return{ok:true,cleared:true};
    }
    const roomData=resolved.doc.data()??{};
    const roomStatus=String(roomData.status||'');
    const roomPlayers=Array.isArray(roomData.players)?roomData.players:[];
    const playerId=baseRoomPlayerId();
    const entry=roomPlayers.find((p)=>String(p.uid)===String(playerId));
    if(!entry){
      await ref.set({currentRoomId:'',updatedAt:Date.now()},{merge:true});
      return{ok:true,cleared:true};
    }
    const lastSeen=Number(entry?.lastSeen)||0;
    const now=Date.now();
    const stale=(roomStatus==='lobby'||roomStatus==='starting')&&lastSeen>0&&(now-lastSeen>roomPruneMs(roomStatus));
    if(stale){
      await ref.set({currentRoomId:'',updatedAt:Date.now()},{merge:true});
      return{ok:true,cleared:true};
    }
    return{ok:false};
  }catch{
    return{ok:true};
  }
}
async function gateGuestRoomAccess(targetRoomId=''){
  const uid=currentAuthUserUid();
  if(uid)return{ok:true};
  try{
    const active=String(localStorage.getItem(LOCAL_ROOM_KEY)||'').trim();
    if(!active)return{ok:true};
    if(targetRoomId&&active===String(targetRoomId))return{ok:true,already:true};
    if(firebaseDb){
      const existing=await findRoomByPlayerId(baseRoomPlayerId());
      if(!existing||String(existing.id||'')!==active){
        localStorage.removeItem(LOCAL_ROOM_KEY);
        return{ok:true,cleared:true};
      }
    }
    return{ok:false};
  }catch{
    return{ok:true};
  }
}
async function queryActiveRoomsFromDb(roomDb,instanceId){
  const statusFilters=['lobby','starting','playing','finished'];
  const roomFetchLimit=8;
  const currentPlayerId=currentRoomPlayerId();
  const currentRoomId=String(state.room.id||'').trim();
  let snap=null;
  try{
    snap=await roomDb.collection(FIRESTORE_ROOMS_COLLECTION)
      .where('status','in',statusFilters)
      .orderBy('updatedAt','desc')
      .limit(roomFetchLimit)
      .get();
  }catch{
    try{
      snap=await roomDb.collection(FIRESTORE_ROOMS_COLLECTION)
        .where('status','in',statusFilters)
        .limit(roomFetchLimit)
        .get();
    }catch{
      try{
        snap=await roomDb.collection(FIRESTORE_ROOMS_COLLECTION)
          .orderBy('updatedAt','desc')
          .limit(roomFetchLimit)
          .get();
      }catch{
        snap=await roomDb.collection(FIRESTORE_ROOMS_COLLECTION)
          .limit(roomFetchLimit)
          .get();
      }
    }
  }
  const now=Date.now();
  const rows=[];
  let hiddenRooms=0;
  for(const doc of snap.docs){
    const data=doc.data()??{};
    const status=String(data.status||'');
    if(status!=='lobby'&&status!=='starting'&&status!=='playing'&&status!=='finished'){
      hiddenRooms+=1;
      continue;
    }
    let players=Array.isArray(data.players)?[...data.players]:[];
    const selfListed=currentPlayerId&&players.some((p)=>String(p?.uid||'')===currentPlayerId);
    const staleSelfListed=selfListed&&(!currentRoomId||currentRoomId!==String(doc.id||''));
    if(staleSelfListed){
      await dropSelfFromRoom({
        id:doc.id,
        ref:doc.ref,
        data(){return data;},
        instanceId
      },currentPlayerId);
      players=players.filter((p)=>String(p?.uid||'')!==currentPlayerId);
    }
    const updatedAt=Number(data.updatedAt)||0;
    if(updatedAt>0){
      const staleAge=now-updatedAt;
      if((status==='lobby'||status==='starting'||status==='finished')&&staleAge>ROOM_PRUNE_LOBBY_MS){
        void roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc(doc.id).delete().catch(()=>{});
        void deleteRoomDirectory(doc.id);
        hiddenRooms+=1;
        continue;
      }
      if(status==='playing'&&staleAge>ROOM_PRUNE_PLAYING_MS){
        void roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc(doc.id).delete().catch(()=>{});
        void deleteRoomDirectory(doc.id);
        hiddenRooms+=1;
        continue;
      }
    }
    const isPlaying=status==='playing';
    const activePlayers=isPlaying?players:players.filter((p)=>isRoomPlayerActive(p,status,now));
    const expectedIds=roomPlayerIds(players);
    const existingIds=Array.isArray(data.playerIds)?data.playerIds.map((v)=>String(v)):null;
    const idsMatch=Array.isArray(existingIds)
      && existingIds.length===expectedIds.length
      && expectedIds.every((id)=>existingIds.includes(id));
    if(!isPlaying&&activePlayers.length!==players.length){
      const activeHumans=activePlayers.filter((p)=>String(p.uid||'').startsWith('uid:')||String(p.uid||'').startsWith('guest:'));
      if(!activeHumans.length){
        hiddenRooms+=1;
        continue;
      }
      const hostInfo=resolveRoomHostInfo({...data,players:activePlayers});
      void roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc(doc.id).update({
        players:activePlayers,
        playerIds:roomPlayerIds(activePlayers),
        hostId:hostInfo.hostId,
        hostName:hostInfo.hostName,
        updatedAt:now
      }).catch(()=>{});
    }else if(!idsMatch){
      void roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc(doc.id).update({
        playerIds:expectedIds,
        updatedAt:now
      }).catch(()=>{});
    }
    const humans=activePlayers.filter((p)=>isRoomPlayerHuman(p));
    if(!humans.length){
      void roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc(doc.id).delete().catch(()=>{});
      void deleteRoomDirectory(doc.id);
      hiddenRooms+=1;
      continue;
    }
    if(status==='finished'&&humans.length>=Number(data.maxPlayers||4)){
      hiddenRooms+=1;
      continue;
    }
    const hostId=String(data.hostId||'').trim();
    const hostPlayer=hostId?humans.find((p)=>String(p.uid)===hostId):humans[0];
    let roster=activePlayers
      .filter((p)=>Number.isFinite(Number(p?.seat))&&Number(p.seat)>=0&&Number(p.seat)<=3)
      .map((p)=>({
        seat:Number(p.seat),
        name:String(p.name||''),
        gender:p.gender==='female'?'female':'male',
        picture:String(p.picture||''),
        uid:String(p.uid||''),
        lastSeen:Number(p.lastSeen)||0,
        isBot:!isRoomPlayerHuman(p),
        avatarColor:'#7aaed8'
      }));
    if(status!=='lobby'&&data.game&&Array.isArray(data.game.players)){
      const gameRoster=data.game.players.map((p,idx)=>{
        const seat=Number.isFinite(Number(p?.seat))?Number(p.seat):idx;
        const safeSeat=Number.isFinite(seat)&&seat>=0&&seat<=3?seat:idx;
        const gender=String(p?.gender||'male')==='female'?'female':'male';
        const isBot=!p?.isHuman;
        return{
          seat:safeSeat,
          name:String(p?.name||`Bot ${safeSeat+1}`),
          gender,
          picture:String(p?.picture||''),
          uid:String(p?.uid||`bot:${safeSeat}`),
          lastSeen:0,
          isBot,
          avatarColor:isBot?playerColorByViewClass(seatCls[safeSeat]||'south'):'#7aaed8'
        };
      });
      roster=gameRoster.sort((a,b)=>a.seat-b.seat);
    }
    const displayPlayers=Math.max(activePlayers.length,roster.length);
    rows.push({
      id:doc.id,
      code:String(data.code||'').toUpperCase(),
      hostName:String(hostPlayer?.name||data.hostName||''),
      hostId:String(hostPlayer?.uid||data.hostId||''),
      isPrivate:Boolean(data.isPrivate),
      status,
      roundCount:Number(data.roundCount||0),
      players:activePlayers.length,
      displayPlayers,
      maxPlayers:Number(data.maxPlayers||4),
      roster,
      firebaseInstanceId:instanceId,
      updatedAt
    });
  }
  return{rows,hiddenRooms};
}
async function loadActiveRooms(attempt=0){
  if(!initFirebaseIfReady()){
    if(attempt<6)window.setTimeout(()=>{void loadActiveRooms(attempt+1);},500);
    return;
  }
  if(!firebaseDb)return;
  if(state.home.activeRooms.loading)return;
  state.home.activeRooms.loading=true;
  state.home.activeRooms.error='';
  render();
  try{
    const rows=[];
    let hiddenRooms=0;
    const instances=await loadFirebaseInstances();
    for(const instance of instances){
      if(!isFirebaseInstanceRoomEnabled(instance))continue;
      const instanceId=String(instance.projectId||instance.id||'').trim();
      const roomDb=await getFirebaseDbForInstanceId(instanceId);
      if(!roomDb)continue;
      const result=await queryActiveRoomsFromDb(roomDb,instanceId);
      rows.push(...result.rows);
      hiddenRooms+=result.hiddenRooms;
    }
    rows.sort((a,b)=>(Number(b.updatedAt)||0)-(Number(a.updatedAt)||0));
    state.home.activeRooms.rows=rows.slice(0,4).map((row)=>{
      const next={...row};
      delete next.updatedAt;
      return next;
    });
    state.home.activeRooms.hiddenCount=hiddenRooms;
    state.home.activeRooms.loadedAt=Date.now();
  }catch{
    state.home.activeRooms.error='load';
  }finally{
    state.home.activeRooms.loading=false;
    render();
  }
}
async function createRoom(){
  await roomActionsController.createRoom();
}
async function joinRoomByCode(codeRaw){
  await roomActionsController.joinRoomByCode(codeRaw);
}
function subscribeRoom(roomId,code,firebaseInstanceId='',roomDbOverride=null){
  roomSubscriptionController.subscribeRoom(roomId,code,firebaseInstanceId,roomDbOverride);
}
function resolveRoomHostInfo(roomData){
  return roomSubscriptionController.resolveRoomHostInfo(roomData);
}
async function leaveRoom(toLobby=false){
  await roomLifecycleController.leaveRoom(toLobby);
}
async function setRoomPrivacy(isPrivate){
  await roomMutationsController.setRoomPrivacy(isPrivate);
}
async function startRoom(){
  await roomMutationsController.startRoom();
}
async function restartRoomGame(){
  await roomMutationsController.restartRoomGame();
}

function cloneRoomGame(game){
  if(!game||typeof game!=='object')return null;
  try{return structuredClone(game);}catch{return JSON.parse(JSON.stringify(game));}
}
function setGameStatus(game,message,{appendLog=true,now=Date.now(),meta=null}={}){
  if(!game)return;
  const text=String(message??'').trim();
  game.status=text;
  if(meta&&typeof meta==='object'){
    game.statusMeta={...meta,ts:now};
  }else{
    game.statusMeta=null;
  }
  if(!appendLog||!text)return;
  if(!Array.isArray(game.systemLog))game.systemLog=[];
  const last=game.systemLog[game.systemLog.length-1];
  if(last&&last.text===text)return;
  game.systemLog.push({text,ts:now});
  if(game.systemLog.length>200)game.systemLog=game.systemLog.slice(-200);
}
function roomSeatForPlayer(roomData,playerId){
  const pid=String(playerId??'').trim();
  if(!pid)return-1;
  const roster=Array.isArray(roomData?.players)?roomData.players:[];
  const entry=roster.find((p)=>String(p.uid)===pid);
  return Number.isFinite(Number(entry?.seat))?Number(entry.seat):-1;
}
function roomSelfSeat(roomData){
  return roomSeatForPlayer(roomData,currentRoomPlayerId());
}
function resolveRoomEmoteSeat(roomData,raw){
  const explicitSeat=Number(raw?.seat);
  if(Number.isInteger(explicitSeat)&&explicitSeat>=0&&explicitSeat<=3)return explicitSeat;
  const by=String(raw?.by||'').trim();
  if(by.startsWith('seat:')){
    const parsed=Number(by.slice(5));
    if(Number.isInteger(parsed)&&parsed>=0&&parsed<=3)return parsed;
  }
  return roomSeatForPlayer(roomData,by);
}
async function resetRoomExpiryTo60s(){
  await roomMutationsController.resetRoomExpiryTo60s();
}
const roomTimeoutController=createRoomTimeoutController({
  ROOM_TIMEOUT_STRIKES_MAX,
  addRoomSystemLog,
  botProfileForSeat,
  cloneRoomGame,
  t
});
function applyTimeoutStrikeToRoomState(players,game,seat,now=Date.now()){
  return roomTimeoutController.applyTimeoutStrikeToRoomState(players,game,seat,now);
}
function resetTimeoutStrikeForSeat(players,seat){
  return roomTimeoutController.resetTimeoutStrikeForSeat(players,seat);
}
async function touchRoomPresence(force=false){
  const roomId=String(state.room.id||'').trim();
  const now=Date.now();
  const lastRoomId=String(lastRoomPresenceTouch.roomId||'').trim();
  const lastAt=Number(lastRoomPresenceTouch.at)||0;
  const sameRoom=roomId&&lastRoomId===roomId;
  if(sameRoom&&lastAt>0&&(now-lastAt)<ROOM_PRESENCE_TOUCH_MIN_MS)return;
  await roomMutationsController.touchRoomPresence(force);
  lastRoomPresenceTouch={roomId,at:now};
}
function startRoomPresencePing(){
  if(roomPresenceTimer||!state.room.id||!currentRoomDb())return;
  roomPresenceTimer=1;
  if(String(state.room.data?.status||'')!=='finished')void touchRoomPresence(true);
}
async function updateActiveRoomPointer(roomId){
  const uid=currentAuthUserUid();
  if(!uid){
    try{
      const v=String(roomId||'');
      if(v)localStorage.setItem(LOCAL_ROOM_KEY,v);
      else localStorage.removeItem(LOCAL_ROOM_KEY);
    }catch{}
    return;
  }
  if(!uid||!firebaseDb)return;
  try{
    const ref=firebaseDb.collection(FIRESTORE_USERS_COLLECTION).doc(uid);
    const payload={currentRoomId:String(roomId||''),updatedAt:Date.now()};
    await ref.set(payload,{merge:true});
  }catch{}
}
async function loadActiveRoomPointer(){
  await roomSubscriptionController.loadActiveRoomPointer();
}
async function syncRoomSelfScoreIfNeeded(){
  await roomMutationsController.syncRoomSelfScoreIfNeeded();
}
const roomRosterSyncController=createRoomRosterSyncController({
  ROOM_PRUNE_PLAYING_MS,
  botProfileForSeat,
  cloneRoomGame,
  isRoomPlayerActive
});
function botProfileForSeat(seat){
  const list=Array.isArray(BOT_PROFILE_POOL)&&BOT_PROFILE_POOL.length?BOT_PROFILE_POOL:[{name:'Bot',gender:'male'}];
  const idx=Math.abs(Number(seat)||0)%list.length;
  const pick=list[idx]??list[0];
  return{name:String(pick.name??'Bot'),gender:String(pick.gender??'male')==='female'?'female':'male'};
}
function isBotRoomEntry(entry){
  return roomRosterSyncController.isBotRoomEntry(entry);
}
function syncRoomGameRoster(roomData){
  return roomRosterSyncController.syncRoomGameRoster(roomData);
}
const roomGameRuntimeController=createRoomGameRuntimeController({
  botProfileForSeat,
  calcPenaltyDetail,
  canBeat,
  cardId:(c)=>cardId(c),
  cloneRoomGame,
  cmpCard:(a,b)=>cmpCard(a,b),
  cmpStrongPlayDesc,
  comparePower,
  createDeck,
  evaluatePlay,
  getStartingScoreForSeat:roomSeatStartingScore,
  getDefaultDifficulty:()=>state.home.aiDifficulty,
  has3d:(cards)=>has3d(cards),
  isBotRoomEntry,
  isValidDifficulty,
  kindLabel:(k)=>kindLabel(k),
  legalTurnPlays,
  setGameStatus,
  shouldForceMaxAgainstLastCard,
  shuffle,
  t
});
function buildRoomGameState(roomData){
  return roomGameRuntimeController.buildRoomGameState(roomData);
}
function applyPlayToGame(game,seat,cards,now=Date.now()){
  return roomGameRuntimeController.applyPlayToGame(game,seat,cards,now);
}
function applyPassToGame(game,seat,now=Date.now()){
  return roomGameRuntimeController.applyPassToGame(game,seat,now);
}
function applyRoomGameSnapshot(roomData){
  const game=roomData?.game;
  if(!game||!Array.isArray(game.players)||!game.players.length)return;
  syncRoomEmote(roomData);
  const move=game.lastMove;
  if(move&&typeof move==='object'){
    const key=`${move.type||''}:${move.seat||0}:${move.ts||0}`;
    if(key&&key!==state.room.lastMoveKey){
      const now=Date.now();
      if(Number(move.ts)&&now-Number(move.ts)<=1000){
        if(move.type==='play')playSound('play');
        if(move.type==='pass')playSound('pass');
        if(move.type==='win')playSound('win');
      }
      state.room.lastMoveKey=key;
    }
  }
  const nextGame=cloneRoomGame(game)||state.solo;
  if(Array.isArray(nextGame.players)&&Array.isArray(nextGame.handCount)){
    nextGame.players.forEach((p,i)=>{nextGame.handCount[i]=p?.hand?.length??nextGame.handCount[i]??0;});
  }
  state.solo=nextGame;
  state.room.selfSeat=roomSelfSeat(roomData);
  if(state.room.selfSeat<0){
    const pid=currentRoomPlayerId();
    const idx=game.players.findIndex((p)=>String(p?.uid??'')===String(pid));
    if(idx>=0)state.room.selfSeat=idx;
    else{
      resetRoomState();
      state.screen='home';
      state.room.joinOpen=true;
      state.room.error=t('roomDisconnected');
      render();
      return;
    }
  }
  state.screen='game';
  state.home.mode='room';
  state.home.showIntro=false;
  state.home.showLeaderboard=false;
  state.showScoreGuide=false;
  state.opponentProfileName='';
  state.logTouched=false;
  state.showLog=false;
  state.showLogSheet=false;
  state.recommendation=null;
  setRecommendHint('');
  const selfSeat=Number.isInteger(state.room.selfSeat)?state.room.selfSeat:0;
  const selfHand=state.solo.players?.[selfSeat]?.hand??[];
  const validIds=new Set(selfHand.map(cardId));
  state.selected=new Set([...state.selected].filter((id)=>validIds.has(id)));
  if(game.gameOver){
    const key=`${state.room.id}:${String(roomData?.gameVersion??'')}`;
    if(state.room.recordedGameKey!==key){
      state.room.recordedGameKey=key;
      const roster=Array.isArray(roomData?.players)?roomData.players:[];
      const rosterByUid=new Map(roster.map((p)=>[String(p?.uid||''),p]));
      state.room.lastResultPlayers=game.players.map((p)=>({
        uid:String(p?.uid||''),
        name:String(p?.name||''),
        gender:String(p?.gender||'male'),
        picture:String(p?.picture||rosterByUid.get(String(p?.uid||''))?.picture||'').trim(),
        isHuman:!!p?.isHuman,
        seat:Number(p?.seat)
      }));
      const summary=game.roundSummary;
      const deductions=Array.isArray(summary?.deductions)?summary.deductions:[];
      const winnerSeat=Number(summary?.winnerSeat);
      const winnerGain=Number(summary?.winnerGain)||0;
      const deltas=deductions.map((d,i)=>i===winnerSeat?winnerGain:-Number(d||0));
      const seatValid=Number.isInteger(selfSeat)&&selfSeat>=0;
      const selfPlayer=seatValid?game.players?.[selfSeat]:null;
      const isSelf=String(selfPlayer?.uid??'')===currentRoomPlayerId();
      if(isSelf&&selfPlayer?.isHuman){
        const delta=Number(deltas[selfSeat]??0);
        void recordLeaderboardRound(currentLeaderboardIdentity(),delta,selfSeat===winnerSeat);
      }
      void writeRoomGameLog(roomData,game);
    }
  }else{
    state.room.recordedGameKey='';
    state.room.lastResultPlayers=null;
  }
  render();
  maybeRunRoomAi();
}
async function writeRoomGameLog(roomData,game){
  if(!firebaseDb||!roomData||!game)return;
  const roomId=String(state.room.id||roomData.id||'').trim();
  const gameVersion=Number(roomData?.gameVersion);
  if(!roomId||!Number.isFinite(gameVersion))return;
  try{
    const ref=firebaseDb.collection(FIRESTORE_GAMELOGS_COLLECTION).doc(`${roomId}_${gameVersion}`);
    const payload={
      roomId,
      gameVersion:Math.trunc(gameVersion),
      status:String(roomData.status||''),
      createdAt:Date.now(),
      endedAt:Date.now(),
      settings:roomData.settings||{},
      summary:game.roundSummary||null,
      players:game.players?.map((p)=>({uid:String(p.uid||''),name:String(p.name||''),gender:String(p.gender||'male'),isHuman:!!p.isHuman}))||[],
      totals:game.totals||[],
      history:game.history||[]
    };
    await ref.set(payload,{merge:true});
  }catch{}
}
async function roomSubmitEmote(id,tsOverride=null,byOverride=''){
  const roomDb=currentRoomDb();
  if(!state.room.id||!roomDb)return;
  const match=EMOTE_STICKERS.find((x)=>x.id===id);
  if(!match)return;
  const now=Number.isFinite(Number(tsOverride))?Number(tsOverride):Date.now();
  try{
    const ref=roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc(state.room.id);
    const by=String(byOverride||currentRoomPlayerId()||'');
    const seat=Number.isInteger(state.room.selfSeat)&&state.room.selfSeat>=0
      ?state.room.selfSeat
      :roomSelfSeat(state.room.data);
    await ref.update({
      emote:{id:match.id,ts:Math.trunc(now),by,seat:Number.isInteger(seat)&&seat>=0?seat:undefined},
      updatedAt:Math.trunc(now)
    });
  }catch{}
}
async function roomSubmitFoodCallout(foodId,seatOverride=null,tsOverride=null,byOverride=''){
  const roomDb=currentRoomDb();
  if(!state.room.id||!roomDb)return;
  const foodKey=String(foodId||'').trim().toLowerCase();
  const foodMeta=FOOD_CALLOUT_META[foodKey]||null;
  if(!foodMeta)return;
  const seat=Number.isInteger(seatOverride)?seatOverride:roomSelfSeat(state.room.data);
  if(!Number.isInteger(seat)||seat<0||seat>3)return;
  const now=Number.isFinite(Number(tsOverride))?Number(tsOverride):Date.now();
  const by=String(byOverride||`seat:${seat}`);
  if(!by)return;
  try{
    const ref=roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc(state.room.id);
    await ref.update({
      emote:{id:`${FOOD_EMOTE_PREFIX}${foodKey}`,ts:Math.trunc(now),by}
    });
  }catch{}
}
async function roomSubmitPlay(cards,seatOverride=null){
  const roomDb=currentRoomDb();
  if(!state.room.id||!roomDb)return;
  const roomId=state.room.id;
  const seat=Number.isInteger(seatOverride)?seatOverride:roomSelfSeat(state.room.data);
  if(seat<0)return;
  const now=Date.now();
  try{
    const ref=roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc(roomId);
    await roomDb.runTransaction(async(tx)=>{
      const snap=await tx.get(ref);
      if(!snap.exists)throw new Error('room missing');
      const data=snap.data()??{};
      if(data.status!=='playing'||!data.game)throw new Error('room not playing');
      let game=data.game;
      if(Number(game.currentSeat)!==seat)throw new Error('not your turn');
      const selfUid=currentRoomPlayerId();
      const selfSeat=roomSeatForPlayer(data,selfUid);
      const isHostActor=String(data.hostId??'')===String(selfUid);
      let target=game.players?.[seat];
      const timeout=getRoomTurnTimeoutWithGrace(data);
      const startedAt=Number(game.turnStartedAt)||0;
      const timedOut=startedAt>0&&(Date.now()-startedAt)>=timeout;
      let nextPlayers=Array.isArray(data.players)?data.players:[];
      if(timedOut&&target?.isHuman){
        const timeoutUpdate=applyTimeoutStrikeToRoomState(nextPlayers,game,seat,now);
        if(timeoutUpdate.changed){
          nextPlayers=timeoutUpdate.players;
          game=timeoutUpdate.game||game;
          target=game.players?.[seat];
        }
      }else if(target?.isHuman){
        const reset=resetTimeoutStrikeForSeat(nextPlayers,seat);
        if(reset.changed)nextPlayers=reset.players;
      }
      const canAct=(selfSeat===seat)||((target&&!target.isHuman)&&isHostActor)||(timedOut&&target?.isHuman);
      if(!canAct)throw new Error('not allowed');
        const result=applyPlayToGame(game,seat,cards,now);
        if(!result.ok)throw new Error(result.reason||'invalid');
        const updates={game:result.game,updatedAt:now,gameVersion:Number(data.gameVersion||0)+1};
        const reaction=pickBotReaction(result.game,seat,'play',result);
        if(reaction){
          updates.game={...result.game,emote:{id:reaction.id,ts:Math.trunc(now),by:reaction.by,seat}};
        }
        const actorUid=(selfSeat===seat)?currentRoomPlayerId():'';
        const bumped=bumpRoomPlayerLastSeen(nextPlayers,actorUid,now);
        if(bumped.changed)updates.players=bumped.players;
        else if(nextPlayers!==data.players)updates.players=nextPlayers;
        if(updates.players){
          const hostStillHuman=updates.players.some((p)=>String(p?.uid||'')===String(data.hostId||'')&&isRoomPlayerHuman(p));
          if(!hostStillHuman){
            const nextHost=selectRoomHostCandidate(updates.players,now)||updates.players.find((p)=>isRoomPlayerHuman(p))||updates.players[0];
            updates.hostId=String(nextHost?.uid||'');
            updates.hostName=String(nextHost?.name||'');
          }
        }
        if(result.finished){
          updates.status='finished';
          updates.expiresAt=nextRoomIdleExpiry(now);
          updates.resultExpiresAt=now+ROOM_RESULT_IDLE_MS;
          updates.totals=result.game.totals||[];
          updates.roundCount=Number(data.roundCount||0)+1;
      }
      tx.update(ref,updates);
    });
    playSound('play');
    return true;
  }catch(err){
    const msg=String(err?.message??'');
    if(msg)setSoloStatus(msg);
  }
  return false;
}
async function roomSubmitPass(seatOverride=null){
  const roomDb=currentRoomDb();
  if(!state.room.id||!roomDb)return;
  const roomId=state.room.id;
  const seat=Number.isInteger(seatOverride)?seatOverride:roomSelfSeat(state.room.data);
  if(seat<0)return;
  const now=Date.now();
  try{
    const ref=roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc(roomId);
    await roomDb.runTransaction(async(tx)=>{
      const snap=await tx.get(ref);
      if(!snap.exists)throw new Error('room missing');
      const data=snap.data()??{};
      if(data.status!=='playing'||!data.game)throw new Error('room not playing');
      let game=data.game;
      if(Number(game.currentSeat)!==seat)throw new Error('not your turn');
      const selfUid=currentRoomPlayerId();
      const selfSeat=roomSeatForPlayer(data,selfUid);
      const isHostActor=String(data.hostId??'')===String(selfUid);
      let target=game.players?.[seat];
      const timeout=getRoomTurnTimeoutWithGrace(data);
      const startedAt=Number(game.turnStartedAt)||0;
      const timedOut=startedAt>0&&(Date.now()-startedAt)>=timeout;
      let nextPlayers=Array.isArray(data.players)?data.players:[];
      if(timedOut&&target?.isHuman){
        const timeoutUpdate=applyTimeoutStrikeToRoomState(nextPlayers,game,seat,now);
        if(timeoutUpdate.changed){
          nextPlayers=timeoutUpdate.players;
          game=timeoutUpdate.game||game;
          target=game.players?.[seat];
        }
      }else if(target?.isHuman){
        const reset=resetTimeoutStrikeForSeat(nextPlayers,seat);
        if(reset.changed)nextPlayers=reset.players;
      }
        const canAct=(selfSeat===seat)||((target&&!target.isHuman)&&isHostActor)||(timedOut&&target?.isHuman);
        if(!canAct)throw new Error('not allowed');
        const result=applyPassToGame(game,seat,now);
        if(!result.ok)throw new Error(result.reason||'invalid');
        const updates={game:result.game,updatedAt:now,gameVersion:Number(data.gameVersion||0)+1};
        const reaction=pickBotReaction(result.game,seat,'pass',null);
        if(reaction){
          updates.game={...result.game,emote:{id:reaction.id,ts:Math.trunc(now),by:reaction.by,seat}};
        }
        const actorUid=(selfSeat===seat)?currentRoomPlayerId():'';
        const bumped=bumpRoomPlayerLastSeen(nextPlayers,actorUid,now);
        if(bumped.changed)updates.players=bumped.players;
        else if(nextPlayers!==data.players)updates.players=nextPlayers;
        if(updates.players){
          const hostStillHuman=updates.players.some((p)=>String(p?.uid||'')===String(data.hostId||'')&&isRoomPlayerHuman(p));
          if(!hostStillHuman){
            const nextHost=selectRoomHostCandidate(updates.players,now)||updates.players.find((p)=>isRoomPlayerHuman(p))||updates.players[0];
            updates.hostId=String(nextHost?.uid||'');
            updates.hostName=String(nextHost?.name||'');
          }
        }
        tx.update(ref,updates);
      });
      playSound('pass');
  }catch(err){
    const msg=String(err?.message??'');
    if(msg)setSoloStatus(msg);
  }
}
function roomIsHost(){
  const data=state.room.data;
  if(!data)return false;
  const pid=currentRoomPlayerId();
  return String(data.hostId??'')===String(pid);
}
function maybeRunRoomAi(){
  if(state.home.mode!=='room')return;
  if(!state.room.id||!state.room.data||!state.room.data.game)return;
  if(aiTimer){clearTimeout(aiTimer);aiTimer=null;}
  const g=state.room.data.game;
  const current=g?.players?.[g?.currentSeat];
  if(!g||g.gameOver||!current)return;
  if(!current.isHuman&&!roomIsHost())return;
  if(current.isHuman){
    const timeout=getRoomTurnTimeoutWithGrace(state.room.data);
    const startedAt=Number(g.turnStartedAt)||0;
    const elapsed=startedAt>0?Date.now()-startedAt:0;
    const remaining=timeout-elapsed;
    const timedOut=startedAt>0&&remaining<=0;
    if(timedOut){
      if(g.lastPlay){
        void roomSubmitPass(g.currentSeat);
      }else{
        const legal=legalTurnPlays(current.hand,g);
        if(legal.length){
          legal.sort((a,b)=>comparePower(a.eval.power,b.eval.power));
          void roomSubmitPlay(legal[0].cards,g.currentSeat);
        }
      }
    }else{
      const wait=Math.min(1000,Math.max(200,Number.isFinite(remaining)?remaining:1000));
      aiTimer=window.setTimeout(()=>{maybeRunRoomAi();},wait);
    }
    return;
  }
  const DEFAULT_AI_DELAY_MS=320;
  const wait=DEFAULT_AI_DELAY_MS;
  aiTimer=window.setTimeout(async()=>{
    const live=state.room.data?.game;
    if(!live||live.gameOver)return;
    if(!roomIsHost())return;
    const actor=live.players?.[live.currentSeat];
    if(!actor||actor.isHuman)return;
    const ch=chooseAiPlay(actor.hand,live,live.aiDifficulty);
    if(!ch)await roomSubmitPass(live.currentSeat);
    else await roomSubmitPlay(ch.cards,live.currentSeat);
    window.setTimeout(()=>{maybeRunRoomAi();},420);
  },wait);
}
function syncRoomCountdownTicker(){
  const roomData=state.room.data;
  const status=String(roomData?.status||'');
  const lifecycleCountdown=getRoomLifecycleExpiresAt(roomData)>0;
  const activePlay=Boolean(roomData?.game&&!roomData.game.gameOver);
  const waitingScreen=state.screen==='home'&&(status==='lobby'||status==='starting');
  const shouldRun=state.home.mode==='room'&&Boolean(roomData)&&(activePlay||lifecycleCountdown)&&(state.screen==='game'||waitingScreen);
  if(!shouldRun){
    if(roomCountdownTimer){clearInterval(roomCountdownTimer);roomCountdownTimer=null;}
    return;
  }
  if(roomCountdownTimer)return;
  roomCountdownTimer=window.setInterval(()=>{
    const liveRoom=state.room.data;
    const liveStatus=String(liveRoom?.status||'');
    const liveLifecycleCountdown=getRoomLifecycleExpiresAt(liveRoom)>0;
    const liveActivePlay=Boolean(liveRoom?.game&&!liveRoom.game.gameOver);
    const liveWaitingScreen=state.screen==='home'&&(liveStatus==='lobby'||liveStatus==='starting');
    const active=state.home.mode==='room'&&Boolean(liveRoom)&&(liveActivePlay||liveLifecycleCountdown)&&(state.screen==='game'||liveWaitingScreen);
    if(!active){
      clearInterval(roomCountdownTimer);
      roomCountdownTimer=null;
      return;
    }
    if(liveRoom){
      document.querySelectorAll('[data-room-countdown-value]').forEach((el)=>{
        el.textContent=roomCountdownText(liveRoom);
      });
    }
    if((liveStatus==='finished'||liveStatus==='lobby'||liveStatus==='starting')&&liveRoom){
      const now=Date.now();
      const expired=Boolean(getRoomLifecycleExpiresAt(liveRoom)>0&&now>=getRoomLifecycleExpiresAt(liveRoom));
      if(expired!==roomResultExpiryReached){
        roomResultExpiryReached=expired;
        render();
      }
    }
  },1000);
}
function currentLeaderboardIdentity(){
  const g=state.home.google;
  const gender=state.home.gender==='female'?'female':'male';
  if(g.signedIn&&g.email){
    const email=String(g.email).toLowerCase();
    return{id:email,name:String(state.home.name||g.name||'Player').slice(0,32),email,gender};
  }
  const fallback=String(state.home.name??'').trim().slice(0,32)||'Player';
  return{id:fallback.toLowerCase(),name:fallback,email:'',gender};
}
function botLeaderboardIdentity(name,gender){
  const safe=String(name??'Bot').trim().slice(0,32)||'Bot';
  const g=String(gender??'male')==='female'?'female':'male';
  return{id:safe.toLowerCase(),name:safe,email:'',gender:g,isBot:true,picture:'',settings:{}};
}
function identityLookupIds(identity){
  const ids=[
    String(identity?.id??'').trim(),
    String(identity?.email??'').trim().toLowerCase(),
    String(state.home.google?.uid??'').trim(),
    String(state.home.google?.sub??'').trim()
  ].filter(Boolean);
  const seen=new Set();
  const out=[];
  ids.forEach((value)=>{
    const raw=String(value).trim();
    if(!raw)return;
    if(!seen.has(raw)){
      seen.add(raw);
      out.push(raw);
    }
    const lower=raw.toLowerCase();
    if(lower&&!seen.has(lower)){
      seen.add(lower);
      out.push(lower);
    }
  });
  return out;
}
function ensureLeaderboardEntry(store,identity){
  const safe=String(identity?.name??identity??'').trim().slice(0,32);
  if(!safe)return null;
  const email=String(identity?.email??'').trim().toLowerCase().slice(0,120);
  const gender=String(identity?.gender??state.home.gender??'male')==='female'?'female':'male';
  const isBot=isBotIdentity(identity);
  const picture=isBot?'':String(identity?.picture??state.home.google?.picture??'').trim();
  const key=isBot
    ?safe.toLowerCase()
    :String(identity?.id??email??safe.toLowerCase()).trim().slice(0,180);
  if(!key)return null;
  if(!store.players[key]){
    store.players[key]={id:key,name:safe,email,gender,picture,settings:isBot?{}:collectMainSettings(),games:0,wins:0,totalScore:5000,updatedAt:Date.now()};
  }
  if(safe)store.players[key].name=safe;
  if(email)store.players[key].email=email;
  store.players[key].gender=String(store.players[key].gender??gender)==='female'?'female':'male';
  if(picture)store.players[key].picture=picture;
  if(isBot)store.players[key].picture='';
  store.players[key].settings=isBot?{}:collectMainSettings();
  store.players[key].totalScore=scoreFromStoredTotal(store.players[key].totalScore);
  return store.players[key];
}
async function recordLeaderboardRound(identity,delta,won){
  if(!isBotIdentity(identity)&&state.home.google?.profileMissing)return;
  const store=loadLeaderboardStore();
  const entry=ensureLeaderboardEntry(store,identity);
  if(!entry)return;
  const value=Number.isFinite(Number(delta))?Math.trunc(Number(delta)):0;
  const now=Date.now();
  entry.games+=1;
  if(won)entry.wins+=1;
  entry.totalScore=scoreFromStoredTotal((Number(entry.totalScore)||5000)+value);
  entry.updatedAt=now;
  saveLeaderboardStore(store);
  const payload=buildProfilePayload(identity,entry,now);
  try{
    if(await ensureFirebaseWriteAuth()){
      const ref=firebaseDb.collection(FIRESTORE_LB_COLLECTION).doc(String(entry.id));
      await ref.set(payload,{merge:true});
      return;
    }
    await writeProfileDocByRest(String(entry.id),payload);
  }catch(err){
    console.error('leaderboard round write exception (sdk)',err);
    try{
      await writeProfileDocByRest(String(entry.id),payload);
    }catch(restErr){
      console.error('leaderboard round write exception (rest)',restErr);
    }
  }
}
async function syncLeaderboardProfile(identity){
  if(!isBotIdentity(identity)&&state.home.google?.profileMissing)return false;
  const store=loadLeaderboardStore();
  const entry=ensureLeaderboardEntry(store,identity);
  if(!entry)return false;
  entry.updatedAt=Date.now();
  entry.totalScore=scoreFromStoredTotal(entry.totalScore);
  entry.settings=collectMainSettings();
  saveLeaderboardStore(store);
  const payload=buildProfilePayload(identity,entry,entry.updatedAt);
  try{
    if(await ensureFirebaseWriteAuth()){
      const ref=firebaseDb.collection(FIRESTORE_LB_COLLECTION).doc(String(entry.id));
      await ref.set(payload,{merge:true});
      return true;
    }
    await writeProfileDocByRest(String(entry.id),payload);
    return true;
  }catch(err){
    console.error('leaderboard profile sync exception (sdk)',err);
    try{
      await writeProfileDocByRest(String(entry.id),payload);
      return true;
    }catch(restErr){
      console.error('leaderboard profile sync exception (rest)',restErr);
      return false;
    }
  }
}
function computeLeaderboardRowsFromStore(store,period,sort,limit){
  const merged={};
  Object.values(store.players).forEach((entry)=>{
    const name=String(entry.name??'').trim();
    const email=String(entry.email??'').trim().toLowerCase();
    const key=email||name.toLowerCase();
    if(!key)return;
    const current=merged[key];
    if(!current||Number(entry.updatedAt||0)>=Number(current.updatedAt||0)){
      merged[key]={...entry};
    }
  });
  const rows=Object.values(merged).map((entry)=>{
    const id=String(entry.id??'').trim();
    const games=Number(entry.games)||0;
    const wins=Number(entry.wins)||0;
    const totalScore=scoreFromStoredTotal(entry.totalScore);
    return{id,name:String(entry.name??''),email:String(entry.email??''),gender:String(entry.gender??'male')==='female'?'female':'male',picture:String(entry.picture??'').trim(),games,wins,winRate:games?wins/games:0,totalScore,updatedAt:Number(entry.updatedAt)||0};
  }).filter((row)=>row.games>0||period==='all');
  rows.sort((a,b)=>{
    if(sort==='wins')return b.wins-a.wins||b.totalScore-a.totalScore||a.name.localeCompare(b.name);
    if(sort==='games')return b.games-a.games||b.wins-a.wins||a.name.localeCompare(b.name);
    if(sort==='winRate')return b.winRate-a.winRate||b.wins-a.wins||a.name.localeCompare(b.name);
    return b.totalScore-a.totalScore||b.wins-a.wins||a.name.localeCompare(b.name);
  });
  const ranked=rows.map((r,i)=>({...r,rank:i+1}));
  void limit;
  return ranked.slice(0,20);
}
async function refreshLeaderboardCloud(){
  if(!firebaseDb||leaderboardCloudRefreshInFlight)return;
  leaderboardCloudRefreshInFlight=true;
  try{
    const lb=state.home.leaderboard;
    const snap=await firebaseDb.collection(FIRESTORE_LB_COLLECTION).get();
    const store={players:{}};
    snap.forEach((doc)=>{
      const d=doc.data()??{};
      const id=String(d.id??doc.id);
      store.players[id]={id,name:String(d.name??''),email:String(d.email??''),gender:String(d.gender??'male')==='female'?'female':'male',picture:String(d.picture??'').trim(),settings:d.settings&&typeof d.settings==='object'?d.settings:{},games:Number(d.games)||0,wins:Number(d.wins)||0,totalScore:scoreFromStoredTotal(d.totalScore),updatedAt:Number(d.updatedAt)||0};
    });
    saveLeaderboardStore(store);
    syncSessionScoreFromStore(store);
    lb.rows=computeLeaderboardRowsFromStore(store,lb.period,lb.sort,lb.limit);
    leaderboardCloudLoaded=true;
    if(state.home.showLeaderboard&&state.screen==='home')render();
  }catch(err){
    console.error('leaderboard fetch failed',err);
  }finally{leaderboardCloudRefreshInFlight=false;}
}
function refreshLeaderboard(forceCloud=false){
  const lb=state.home.leaderboard;
  const store=loadLeaderboardStore();
  syncSessionScoreFromStore(store);
  lb.rows=computeLeaderboardRowsFromStore(store,lb.period,lb.sort,lb.limit);
  if(firebaseDb&&(forceCloud||(!lb.rows.length&&!leaderboardCloudLoaded)))void refreshLeaderboardCloud();
}
function scoreGuideModalHtml(){
  return renderScoreGuideModal({
    scoreGuideText:getScoreGuideText(state.language),
    esc,
    cardImagePath,
    colorizeSuitText,
    t
  });
}
function speakCallout(text,gender='male',meta={}){
  calloutAudioController.speakCallout(text,gender,meta);
}
function authProviderBadgeHtml(provider){
  void provider;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.31h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.15 3.58-8.65Z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.86-3A7.17 7.17 0 0 1 12 19.3c-3.12 0-5.77-2.11-6.72-4.96H1.3v3.11A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.28 14.34a7.2 7.2 0 0 1 0-4.68V6.55H1.3a12 12 0 0 0 0 10.9l3.98-3.11Z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.94 1.23 15.24 0 12 0A12 12 0 0 0 1.3 6.55l3.98 3.11C6.23 6.88 8.88 4.77 12 4.77Z"/></svg>`;
}
window.handleCredentialResponse=handleCredentialResponse;
window.onGoogleScriptLoaded=()=>{if(state.screen==='home')onGoogleScriptLoaded(renderGoogleInline);};
function bootFirebase(attempt=0){
  if(initFirebaseIfReady()){
    if(signedInWithEmail()){
      void hydrateProfileBlocking().then(()=>{if(state.home.showLeaderboard)refreshLeaderboard(true);render();});
    }
    refreshLeaderboard(true);
    void loadActiveRoomPointer();
    return;
  }
  if(attempt<120)window.setTimeout(()=>bootFirebase(attempt+1),250);
}
function isMobilePointer(){return window.matchMedia('(max-width: 860px), (pointer: coarse)').matches;}
function isCoarsePointer(){
  return window.matchMedia('(pointer: coarse) and (hover: none)').matches;
}
function isWebView(){
  const ua=String(navigator?.userAgent??'');
  return /\bwv\b/.test(ua)||/WebView/i.test(ua)||/(Android.*Version\/\d+\.\d+.*Chrome\/\d+\.\d+ Mobile)/i.test(ua);
}
function isStandaloneWebApp(){
  return Boolean(
    navigator?.standalone||
    window.matchMedia?.('(display-mode: standalone)').matches||
    window.matchMedia?.('(display-mode: fullscreen)').matches
  );
}
const MIN_WEB_GAME_WIDTH=480;
const MIN_WEB_GAME_HEIGHT=520;
function isWebViewportTooSmall(){
  if(isWebView())return false;
  const coarse=window.matchMedia('(pointer: coarse)').matches;
  if(coarse)return false;
  const w=window.innerWidth||0;
  const h=window.innerHeight||0;
  return w>0&&h>0&&(w<MIN_WEB_GAME_WIDTH||h<MIN_WEB_GAME_HEIGHT);
}
function syncWebViewportGuardAttrs(){
  const tooSmall=isWebViewportTooSmall();
  const w=Math.round(window.innerWidth||0);
  const h=Math.round(window.innerHeight||0);
  document.body.setAttribute('data-web-too-small',tooSmall?'1':'0');
  document.body.setAttribute('data-webview',(isMobilePointer()||isWebView())?'1':'0');
  document.body.setAttribute('data-webapp',isStandaloneWebApp()?'1':'0');
  const msg=t('webTooSmall')
    .replace('{{w}}',String(w))
    .replace('{{h}}',String(h))
    .replace('{{minW}}',String(MIN_WEB_GAME_WIDTH))
    .replace('{{minH}}',String(MIN_WEB_GAME_HEIGHT));
  document.body.setAttribute('data-web-too-small-msg',msg);
  let overlay=document.getElementById('web-too-small-overlay');
  if(tooSmall){
    if(!overlay){
      overlay=document.createElement('div');
      overlay.id='web-too-small-overlay';
      overlay.style.cssText='position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:18px;text-align:center;font-weight:800;line-height:1.35;color:#f5fbff;background:rgba(4,11,18,.78);pointer-events:auto;';
      document.body.appendChild(overlay);
    }
    overlay.textContent=msg;
  }else if(overlay){
    overlay.remove();
  }
}
function shouldBlockLandscapeMobile(){
  const isCoarseLandscape=window.matchMedia('(pointer: coarse) and (orientation: landscape)').matches;
  if(!isCoarseLandscape)return false;
  // Block landscape on phones only; allow tablet/iPad landscape.
  const shortSide=Math.min(window.innerWidth||0,window.innerHeight||0);
  return shortSide>0&&shortSide<600;
}
function uiStatus(msg,meta){
  if(meta&&typeof meta==='object'){
    const name=String(meta.name??'').trim();
    if(meta.key==='start'&&name)return`${name} ${t('start')}`;
    if(meta.key==='retake'&&name)return`${name} ${t('retake')}`;
    if(meta.key==='pass'&&name)return`${name} ${t('pass')}.`;
    if(meta.key==='played'&&name)return`${name} ${t('played')} ${kindLabel(meta.kind)}.`;
    if(meta.key==='wins'&&name){
      const penalties=Array.isArray(meta.penalties)
        ?meta.penalties.filter((p)=>String(p?.name??'').trim()!==name).map((p)=>`${p?.name??''}:${p?.value??0}`)
        :[];
      return`${name} ${t('wins')} ${t('penalty')}:${penalties.join(' / ')}`;
    }
  }
  const s=String(msg??'');
  if(!s)return'';
  return s;
}
const esc=(s)=>String(s??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colorizeSuitText=(s)=>esc(s)
  .replaceAll('♦️','<span class="suit-red">♦️</span>')
  .replaceAll('♥️','<span class="suit-red">♥️</span>')
  .replaceAll('♣️','<span class="suit-black">♣️</span>')
  .replaceAll('♠️','<span class="suit-black">♠️</span>');
const footerMenuHelpers=createFooterMenuHelpers({
  esc,
  t,
  withBase,
  getLanguage:()=>state.language
});
const {
  legalMiniCopy,
  mainPageLegalMiniHtml
}=footerMenuHelpers;
const introGuideHelpers=createIntroGuideHelpers({
  getLanguage:()=>state.language,
  renderIntroPanel,
  colorizeSuitText,
  esc,
  withBase,
  t,
  renderStaticCard,
  ranks:RANKS,
  suits:SUITS
});
const {
  introText,
  introPanelHtml
}=introGuideHelpers;
function hashNameSeed(name){
  const s=String(name??'');
  let h=2166136261;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function pick(arr,seed,offset=0){return arr[(seed+offset)%arr.length];}
function hexToRgb(hex){
  const raw=String(hex??'').trim().replace(/^#/,'');
  if(raw.length!==6)return[];
  return[
    parseInt(raw.slice(0,2),16),
    parseInt(raw.slice(2,4),16),
    parseInt(raw.slice(4,6),16)
  ];
}
const cardId=(c)=>`${c.rank}-${c.suit}`;
const compareSingleCardPower=(a,b)=>a.rank-b.rank||a.suit-b.suit;
const cmpCard=compareSingleCardPower;
const HIGHEST_SINGLE={rank:12,suit:3}; // ♠️2
const LOWEST_SINGLE={rank:0,suit:0}; // ♦️3
const isHighestSingle=(c)=>compareSingleCardPower(c,HIGHEST_SINGLE)===0;
const isLowestSingle=(c)=>compareSingleCardPower(c,LOWEST_SINGLE)===0;

function createDeck(){const d=[];for(let r=0;r<RANKS.length;r++)for(let s=0;s<SUITS.length;s++)d.push({rank:r,suit:s});return d;}
function shuffle(d){for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
function straightMeta(ranks){
  if(ranks.length!==5)return null;
  const uniq=[...new Set(ranks)];
  if(uniq.length!==5)return null;
  const has=new Set(uniq);
  // Allowed starts: 3..10 (normal), A (A2345), 2 (23456).
  const starts=[0,1,2,3,4,5,6,7,11,12];
  for(const start of starts){
    const seq=[0,1,2,3,4].map((i)=>(start+i)%13);
    if(seq.every((r)=>has.has(r))){
      // Straight comparison uses the biggest rank by Big Two order (2 is highest).
      return{seq,high:Math.max(...seq)};
    }
  }
  return null;
}
function comparePower(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const av=a[i]??-1,bv=b[i]??-1;if(av!==bv)return av-bv;}return 0;}
function canBeat(c,tv){if(c.count!==tv.count)return false;if(c.count<5&&c.kind!==tv.kind)return false;if(c.count===5){const d=FIVE_KIND_POWER[c.kind]-FIVE_KIND_POWER[tv.kind];if(d!==0)return d>0;}return comparePower(c.power,tv.power)>0;}
const has3d=(cards)=>cards.some((c)=>c.rank===0&&c.suit===0);
function evaluatePlay(cards){
  const sorted=[...cards].sort(cmpCard);const count=sorted.length;const cnt=new Map();for(const c of sorted)cnt.set(c.rank,(cnt.get(c.rank)??0)+1);
  if(count===1)return{valid:true,count,kind:'single',power:[sorted[0].rank,sorted[0].suit],sorted};
  if(count===2){if(cnt.size!==1)return{valid:false,reason:t('pair')};return{valid:true,count,kind:'pair',power:[sorted[0].rank,Math.max(sorted[0].suit,sorted[1].suit)],sorted};}
  if(count===3){if(cnt.size!==1)return{valid:false,reason:t('triple')};return{valid:true,count,kind:'triple',power:[sorted[0].rank],sorted};}
  if(count!==5)return{valid:false,reason:t('count')};
  const ranks=sorted.map((c)=>c.rank).sort((a,b)=>a-b);const suits=sorted.map((c)=>c.suit);const flush=suits.every((s)=>s===suits[0]);const straight=straightMeta(ranks);const g=[...cnt.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
  const straightHighSuit=straight?sorted.filter((c)=>c.rank===straight.high).reduce((best,c)=>c.suit>best?c.suit:best,-1):-1;
  if(straight&&flush)return{valid:true,count,kind:'straightflush',power:[FIVE_KIND_POWER.straightflush,straight.high,straightHighSuit],sorted};
  if(g[0][1]===4)return{valid:true,count,kind:'fourofkind',power:[FIVE_KIND_POWER.fourofkind,g[0][0]],sorted};
  if(g[0][1]===3&&g[1][1]===2)return{valid:true,count,kind:'fullhouse',power:[FIVE_KIND_POWER.fullhouse,g[0][0]],sorted};
  if(flush){const d=[...ranks].sort((a,b)=>b-a);const flushSuit=sorted[0].suit;return{valid:true,count,kind:'flush',power:[FIVE_KIND_POWER.flush,...d,flushSuit],sorted};}
  if(straight)return{valid:true,count,kind:'straight',power:[FIVE_KIND_POWER.straight,straight.high,straightHighSuit],sorted};
  return{valid:false,reason:t('five')};
}

function combos(cards,size){const out=[];const dfs=(i,path)=>{if(path.length===size){out.push([...path]);return;}for(let x=i;x<cards.length;x++){path.push(cards[x]);dfs(x+1,path);path.pop();}};dfs(0,[]);return out;}
function allValidPlays(hand){
  const plays=[];
  for(const c of hand)plays.push({cards:[c],eval:evaluatePlay([c])});
  const byRank=new Map();
  for(const c of hand){
    const a=byRank.get(c.rank)??[];
    a.push(c);
    byRank.set(c.rank,a);
  }
  for(const [,cs]of byRank){
    if(cs.length>=2)for(const p of combos(cs,2))plays.push({cards:p,eval:evaluatePlay(p)});
    if(cs.length>=3)for(const p of combos(cs,3))plays.push({cards:p,eval:evaluatePlay(p)});
  }
  for(const p of combos(hand,5)){
    const ev=evaluatePlay(p);
    if(ev.valid)plays.push({cards:p,eval:ev});
  }
  const valid=plays.filter((p)=>p.eval.valid);
  const pickPreferred=(a,b,preferNonTwo)=>{
    if(!a)return b;
    if(!b)return a;
    const aIsTwo=a.rank===12;
    const bIsTwo=b.rank===12;
    if(preferNonTwo&&aIsTwo!==bIsTwo)return aIsTwo?b:a;
    if(a.rank!==b.rank)return a.rank<b.rank?a:b;
    return a.suit<b.suit?a:b;
  };
  const fourByRank=new Map();
  const fullByRank=new Map();
  const out=[];
  for(const p of valid){
    if(p.eval.kind!=='fourofkind'&&p.eval.kind!=='fullhouse'){
      out.push(p);
      continue;
    }
    const counts=new Map();
    for(const c of p.cards)counts.set(c.rank,(counts.get(c.rank)??0)+1);
    if(p.eval.kind==='fourofkind'){
      let fourRank=0;
      let kicker=null;
      for(const [rank,n] of counts.entries()){
        if(n===4)fourRank=rank;
        else if(n===1)kicker=p.cards.find((c)=>c.rank===rank)??kicker;
      }
      const entry=fourByRank.get(fourRank);
      if(!entry){
        fourByRank.set(fourRank,{play:p,kicker});
      }else{
        const preferred=pickPreferred(entry.kicker,kicker,true);
        if(preferred&&kicker&&cardId(preferred)===cardId(kicker)){
          fourByRank.set(fourRank,{play:p,kicker});
        }
      }
      continue;
    }
    let tripleRank=0;
    let pairRank=0;
    for(const [rank,n] of counts.entries()){
      if(n===3)tripleRank=rank;
      if(n===2)pairRank=rank;
    }
    const entry=fullByRank.get(tripleRank);
    if(!entry){
      fullByRank.set(tripleRank,{play:p,pairRank});
    }else{
      const preferNonTwo=entry.pairRank===12||pairRank!==12;
      const preferred=pickPreferred({rank:entry.pairRank,suit:0},{rank:pairRank,suit:0},preferNonTwo);
      if(preferred.rank===pairRank){
        fullByRank.set(tripleRank,{play:p,pairRank});
      }
    }
  }
  for(const row of fourByRank.values())out.push(row.play);
  for(const row of fullByRank.values())out.push(row.play);
  return out;
}
function legalTurnPlays(hand,game){
  let legal=allValidPlays(hand);
  if(game.isFirstTrick)legal=legal.filter((e)=>has3d(e.cards));
  if(game.lastPlay)legal=legal.filter((e)=>canBeat(e.eval,game.lastPlay.eval));
  return legal;
}
function canAnyOpponentBeatSingle(card,game,seat){
  for(let i=0;i<game.players.length;i++){
    if(i===seat)continue;
    const hand=game.players[i]?.hand??[];
    for(const c of hand){
      if(compareSingleCardPower(c,card)>0)return true;
    }
  }
  return false;
}
function forceFinishPlanPlay(hand,game,seat){
  if(!Array.isArray(hand)||hand.length<2)return null;
  const singles=[...hand].sort((a,b)=>compareSingleCardPower(b,a));
  for(const s of singles){
    if(canAnyOpponentBeatSingle(s,game,seat))continue;
    const rem=[...hand];
    const idx=rem.findIndex((c)=>cardId(c)===cardId(s));
    if(idx<0)continue;
    rem.splice(idx,1);
    const ev=evaluatePlay(rem);
    if(ev.valid&&(rem.length===1||rem.length===2||rem.length===3||rem.length===5))return{s};
  }
  return null;
}
function cmpStrongPlayDesc(a,b){
  if(a.eval.count!==b.eval.count)return b.eval.count-a.eval.count;
  if(a.eval.count===5&&a.eval.kind!==b.eval.kind)return FIVE_KIND_POWER[b.eval.kind]-FIVE_KIND_POWER[a.eval.kind];
  return comparePower(b.eval.power,a.eval.power);
}
function shouldForceMaxAgainstLastCard(game,seat){
  return !game.gameOver&&(minOpponentCardCount(game,seat)===1);
}
function removeCardsFromHand(hand,cards){
  const drop=new Set((cards??[]).map(cardId));
  return (hand??[]).filter((c)=>!drop.has(cardId(c)));
}
function handShapeMetrics(hand){
  const cards=[...(hand??[])];
  const rankCount=new Map();
  for(const c of cards)rankCount.set(c.rank,(rankCount.get(c.rank)??0)+1);
  let pairs=0;
  let triples=0;
  let highSingles=0;
  let twos=0;
  let topTwo=0;
  for(const [rank,cnt] of rankCount.entries()){
    if(cnt>=2)pairs+=Math.floor(cnt/2);
    if(cnt>=3)triples+=1;
    if(cnt===1&&rank>=11)highSingles+=1;
    if(rank===12){
      twos+=cnt;
      const spade=cards.some((c)=>c.rank===12&&c.suit===3);
      if(spade)topTwo=1;
    }
  }
  const valid=allValidPlays(cards);
  const fives=valid.filter((p)=>p.eval.count===5).length;
  const leadOptions=valid.length;
  return{pairs,triples,fives,highSingles,twos,topTwo,leadOptions};
}
function minOpponentCardCount(game,seat){
  const players=Array.isArray(game?.players)?game.players:[];
  let min=Infinity;
  for(let i=0;i<players.length;i++){
    if(i===seat)continue;
    const cnt=Array.isArray(players[i]?.hand)?players[i].hand.length:Infinity;
    if(cnt<min)min=cnt;
  }
  return Number.isFinite(min)?min:99;
}
function hasControlCheck(hand){
  const counts=new Map();
  for(const c of hand??[])counts.set(c.rank,(counts.get(c.rank)??0)+1);
  const twos=counts.get(12)??0;
  let highPairCount=0;
  for(const [rank,n] of counts.entries()){
    if(n>=2&&rank>=9)highPairCount+=1; // Q/K/A/2
  }
  return twos>=2||highPairCount>=2;
}
function recommendPlayScore(play,ctx){
  const {hand,lastPlay,isFirstTrick,game,seat,orderedByWeak,canPass,prePlayTriples}=ctx;
  const rem=removeCardsFromHand(hand,play.cards);
  const m=handShapeMetrics(rem);
  const startLen=(hand??[]).length;
  const endLen=rem.length;
  const usedLen=play.eval.count;
  const beforeRankCount=new Map();
  for(const c of hand??[])beforeRankCount.set(c.rank,(beforeRankCount.get(c.rank)??0)+1);
  const oppMin=minOpponentCardCount(game,seat);
  const threat=oppMin<=2;
  const blitz=hasControlCheck(hand)||threat;
  const preStraights=allValidPlays(hand).filter((p)=>p.eval.kind==='straight').length;
  const postStraights=allValidPlays(rem).filter((p)=>p.eval.kind==='straight').length;
  const beforeSingles=[...beforeRankCount.values()].filter((n)=>n===1).length;
  const afterRankCount=new Map();
  for(const c of rem??[])afterRankCount.set(c.rank,(afterRankCount.get(c.rank)??0)+1);
  const afterSingles=[...afterRankCount.values()].filter((n)=>n===1).length;
  const hasMust3=play.cards.some((c)=>c.rank===0&&c.suit===0);

  let score=0;
  score+=(startLen-endLen)*48;
  score+=m.pairs*8+m.triples*10+m.fives*25;
  score-=m.highSingles*7;
  score-=m.twos*12;
  score-=m.topTwo*10;
  score+=Math.min(14,m.leadOptions*0.45);

  const maxRank=Math.max(...play.cards.map((c)=>c.rank));
  if(lastPlay){
    const idx=orderedByWeak.findIndex((x)=>x===play);
    if(idx>=0){
      if(threat){
        // Opponents are close to finishing: prefer stronger replies over conserving.
        score+=idx*5;
      }else{
        const conserve=Math.max(0,orderedByWeak.length-1-idx);
        score+=conserve*3;
      }
    }
    if(maxRank>=11&&startLen>4)score-=8;
    if(play.eval.count===1){
      const single=play.cards[0];
      const cnt=beforeRankCount.get(single.rank)??0;
      if(cnt>1&&endLen>3)score-=14;
      if(isHighestSingle(single)&&startLen>3)score-=16;
    }
  }else{
    score+=usedLen===1?-5:(usedLen===2?5:(usedLen===3?8:11));
    if(play.eval.count<5&&(hand??[]).some((c)=>c.rank===12&&c.suit===3)){
      const hasAnyFive=allValidPlays(hand).some((p)=>p.eval.count===5);
      if(hasAnyFive)score-=14;
    }
    if(maxRank>=11&&startLen>5)score-=10;
    if(play.eval.count===1&&isLowestSingle(play.cards[0]))score+=2;
    if(play.cards.some((c)=>c.rank===12))score+=blitz?12:-18;
    if(hasControlCheck(hand)&&play.cards.some((c)=>c.rank===12)&&(play.eval.count===1||play.eval.count===2))score+=10;
    if(play.eval.kind==='flush'&&(play.eval.power?.[play.eval.power.length-1]??-1)===3)score+=12;
    if(threat){
      if(maxRank>=11)score+=8;
      else if(maxRank>=9)score+=4;
      if(play.eval.count===1&&isHighestSingle(play.cards[0]))score+=6;
    }
    if(play.eval.count===2){
      const twoCount=(hand??[]).filter((c)=>c.rank===12).length;
      const hasTopTwo=(hand??[]).some((c)=>c.rank===12&&c.suit===3);
      if(twoCount>=2&&hasTopTwo&&!play.cards.some((c)=>c.rank===12)){
        score+=10;
      }
    }
    if(isFirstTrick&&hasMust3){
      const isSingle=play.eval.count===1;
      const isTriple=play.eval.count===3;
      const isFive=play.eval.count===5;
      if(isSingle&&(beforeRankCount.get(0)??0)===1&&startLen>10)score+=25;
      if(afterSingles<beforeSingles)score+=15;
      if(isTriple&&play.cards.every((c)=>c.rank===0))score+=30;
      if(isFive){
        if(play.cards.some((c)=>c.rank===12||c.rank===11))score-=30;
        if(play.eval.kind==='straightflush')score-=50;
      }
    }
  }

  if(shouldForceMaxAgainstLastCard(game,seat)){
    const strongest=[...orderedByWeak].sort(cmpStrongPlayDesc)[0];
    if(strongest&&comparePower(play.eval.power,strongest.eval.power)!==0){
      score-=28;
    }else{
      score+=8;
    }
  }
  if(play.eval.kind==='fourofkind'||play.eval.kind==='fullhouse'){
    const counts=new Map();
    for(const c of play.cards)counts.set(c.rank,(counts.get(c.rank)??0)+1);
    let kickerRank=-1;
    for(const [rank,n] of counts.entries()){
      if(play.eval.kind==='fourofkind'&&n===1)kickerRank=rank;
      if(play.eval.kind==='fullhouse'&&n===2)kickerRank=rank;
    }
    if(kickerRank===12&&endLen>0)score-=28;
  }
  if(play.eval.kind==='straight'&&startLen>5){
    const hasWheelCard=play.cards.some((c)=>c.rank===12||c.rank===11);
    if(hasWheelCard)score-=25;
  }
  if(play.eval.kind==='flush'&&(play.eval.power?.[play.eval.power.length-1]??-1)===3)score+=15;
  if(play.eval.count<5&&preStraights>0&&postStraights<preStraights&&endLen>0&&oppMin!==1){
    score-=22;
  }
  if(endLen<=5)score+=(5-endLen)*14;
  if(endLen===0)score+=500;
  if(endLen===1||endLen===2||endLen===3)score+=26;
  if(threat&&play.eval.count===5)score+=12;
  if(threat&&play.eval.count===1)score+=6;
  if(threat){
    if(play.eval.count>1){
      score+=play.eval.count*10;
      if(maxRank<=9)score+=8;
    }else{
      const single=play.cards[0];
      if(single&&!isHighestSingle(single))score-=12;
    }
  }
  if(!canPass&&lastPlay)score+=4;
  if(play.eval.kind==='fullhouse'&&Array.isArray(prePlayTriples)){
    const counts=new Map();
    for(const c of play.cards)counts.set(c.rank,(counts.get(c.rank)??0)+1);
    let tripleRank=-1;
    let pairRank=-1;
    for(const [rank,n] of counts.entries()){
      if(n===3)tripleRank=rank;
      if(n===2)pairRank=rank;
    }
    if(pairRank>=0&&tripleRank>=0&&pairRank!==tripleRank&&prePlayTriples.includes(pairRank)){
      score-=30;
    }
  }
  return score;
}
function recommendPassScore(ctx,bestPlayScore){
  const {hand,lastPlay,isFirstTrick,canPass,game,seat}=ctx;
  if(!canPass||!lastPlay||isFirstTrick)return -Infinity;
  const len=(hand??[]).length;
  const m=handShapeMetrics(hand);
  let score=0;
  score+=m.twos*8+m.topTwo*10;
  score+=m.highSingles*5;
  score+=m.fives*2;
  if(len<=5)score-=45;
  if(len<=3)score-=70;
  if(shouldForceMaxAgainstLastCard(game,seat))score-=120;
  // If playing now is clearly beneficial, avoid passive pass recommendation.
  score-=(bestPlayScore>0?Math.min(64,bestPlayScore*0.16):0);
  return score;
}
function fullhousePairRank(play){
  if(play?.eval?.kind!=='fullhouse')return Infinity;
  const cnt=new Map();
  for(const c of play.cards??[])cnt.set(c.rank,(cnt.get(c.rank)??0)+1);
  for(const [r,n] of cnt.entries())if(n===2)return r;
  return Infinity;
}
function suggestPlay(hand,lastPlay,isFirstTrick,game){
  let legal=allValidPlays(hand);
  if(isFirstTrick)legal=legal.filter((e)=>has3d(e.cards));
  if(lastPlay)legal=legal.filter((e)=>canBeat(e.eval,lastPlay.eval));
  if(isFirstTrick&&!lastPlay){
    if(!hasControlCheck(hand)){
      const noTwos=legal.filter((e)=>!e.cards.some((c)=>c.rank===12));
      if(noTwos.length)legal=noTwos;
    }
  }
  if(!legal.length)return null;
  const winning=legal.filter((p)=>hand.length-(p.cards?.length||0)===0);
  if(winning.length){
    winning.sort((a,b)=>comparePower(a.eval.power,b.eval.power));
    return winning[0];
  }
  const seat=Number.isInteger(game?.currentSeat)?game.currentSeat:0;
  const sim=game&&Array.isArray(game.players)
    ?{
      ...game,
      isFirstTrick:Boolean(isFirstTrick),
      lastPlay:lastPlay?{...lastPlay}:null,
      gameOver:false,
      players:game.players.map((p,i)=>({...p,hand:i===seat?[...hand]:[...(p?.hand??[])]}))
    }
    :{players:[{hand:[...hand]}],currentSeat:0,lastPlay:lastPlay?{...lastPlay}:null,isFirstTrick:Boolean(isFirstTrick),gameOver:false};
  const moveKey=(p)=>`${(p?.cards??[]).map(cardId).sort().join(',')}|${String(p?.eval?.kind??'')}|${Number(p?.eval?.count??0)}`;
  const hardPick=chooseAiPlay([...hand],sim,'hard');
  const weakCmp=(a,b)=>{
    if(a.eval.count!==b.eval.count)return a.eval.count-b.eval.count;
    if(a.eval.count===5&&a.eval.kind!==b.eval.kind)return FIVE_KIND_POWER[a.eval.kind]-FIVE_KIND_POWER[b.eval.kind];
    return comparePower(a.eval.power,b.eval.power);
  };
  const byWeak=[...legal].sort(weakCmp);
  const prePlayTriples=[];
  const rankCount=new Map();
  for(const c of hand??[])rankCount.set(c.rank,(rankCount.get(c.rank)??0)+1);
  for(const [rank,n] of rankCount.entries())if(n>=3)prePlayTriples.push(rank);
  const ctx={hand:[...hand],lastPlay,isFirstTrick,game:sim,seat,orderedByWeak:byWeak,canPass:Boolean(lastPlay),prePlayTriples};
  if(hardPick&&legal.some((p)=>moveKey(p)===moveKey(hardPick))){
    hardPick.recommendScore=recommendPlayScore(hardPick,ctx);
    return hardPick;
  }
  const scoreByKey=new Map();
  const scored=[];
  for(const p of legal){
    const s=recommendPlayScore(p,ctx);
    scoreByKey.set(moveKey(p),s);
    scored.push({play:p,score:s});
  }
  if(!scored.length)return null;
  scored.sort((a,b)=>b.score-a.score||weakCmp(a.play,b.play));
  let best=scored[0]?.play??null;
  let bestScore=Number(scored[0]?.score??-Infinity);
  // When leading and opponents are not in immediate endgame threat, prefer conserving power.
  if(!lastPlay&&minOpponentCardCount(sim,seat)>2){
    const scoreMargin=12;
    const nearBest=scored.filter((x)=>x.score>=bestScore-scoreMargin);
    nearBest.sort((a,b)=>weakCmp(a.play,b.play)||b.score-a.score);
    if(nearBest[0]){
      best=nearBest[0].play;
      bestScore=nearBest[0].score;
    }
  }
  if(!lastPlay){
    const fivePlays=scored.filter((row)=>row.play.eval.count===5);
    if(fivePlays.length){
      fivePlays.sort((a,b)=>comparePower(b.play.eval.power,a.play.eval.power));
      const strongestFive=fivePlays[0];
      const scoreMargin=18;
      if(best?.eval?.count!==5&&strongestFive.score>=bestScore-scoreMargin){
        best=strongestFive.play;
        bestScore=Number(strongestFive.score??bestScore);
      }
      if(strongestFive?.play?.eval?.kind==='straightflush'&&minOpponentCardCount(sim,seat)>1){
        best=strongestFive.play;
        bestScore=Number(strongestFive.score??bestScore);
      }
    }
  }
  if(best&&best.eval.kind==='fullhouse'){
    const bestPair=fullhousePairRank(best);
    for(const row of scored){
      if(row.play.eval.kind!=='fullhouse')continue;
      if(row.score<bestScore)break;
      if(fullhousePairRank(row.play)<bestPair){
        best=row.play;
        break;
      }
    }
  }
  if(best&&!lastPlay&&!hasControlCheck(hand)){
    const usesTwo=best.cards.some((c)=>c.rank===12);
    if(usesTwo){
      const scoreMargin=10;
      const alt=scored.find((row)=>{
        if(row.score<bestScore-scoreMargin)return false;
        if(row.play.eval.count!==best.eval.count)return false;
        if(row.play.eval.kind!==best.eval.kind)return false;
        return !row.play.cards.some((c)=>c.rank===12);
      });
      if(alt){
        best=alt.play;
        bestScore=Number(alt.score??bestScore);
      }
    }
  }
  if(best)best.recommendScore=bestScore;
  return best;
}
function shouldRecommendPass(hand,lastPlay,isFirstTrick,canPass,game){
  const rec=suggestPlay(hand,lastPlay,isFirstTrick,game);
  if(!canPass||!lastPlay||isFirstTrick)return false;
  if(!rec)return true;
  const seat=Number.isInteger(game?.currentSeat)?game.currentSeat:0;
  const sim=game&&Array.isArray(game.players)
    ?{
      ...game,
      isFirstTrick:Boolean(isFirstTrick),
      lastPlay:lastPlay?{...lastPlay}:null,
      gameOver:false,
      players:game.players.map((p,i)=>({...p,hand:i===seat?[...hand]:[...(p?.hand??[])]}))
    }
    :{players:[{hand:[...hand]}],currentSeat:0,lastPlay:lastPlay?{...lastPlay}:null,isFirstTrick:Boolean(isFirstTrick),gameOver:false};
  const passCtx={hand:[...hand],lastPlay,isFirstTrick,canPass,game:sim,seat};
  const playScore=Number(rec?.recommendScore??0);
  const passScore=recommendPassScore(passCtx,playScore);
  if(minOpponentCardCount(sim,seat)<=2)return false;
  // Be conservative with pass hints when a legal play exists.
  return passScore>playScore+15;
}
function chooseAiPlay(hand,game,diff){
  let legal=legalTurnPlays(hand,game);
  if(!legal.length)return null;
  if(diff!=='easy'&&!game.lastPlay){
    const plan=forceFinishPlanPlay(hand,game,game.currentSeat);
    if(plan){
      const pick=legal.find((p)=>p.eval.count===1&&cardId(p.cards[0])===cardId(plan.s));
      if(pick)return pick;
    }
  }
  if(diff==='hard'&&shouldForceMaxAgainstLastCard(game,game.currentSeat)){
    const strongest=[...legal].sort(cmpStrongPlayDesc)[0];
    if(strongest?.eval?.count===1&&strongest.cards?.[0]?.rank===12&&hand.length>1){
      const altSingles=legal.filter((p)=>p.eval.count===1&&p.cards?.[0]?.rank!==12);
      if(altSingles.length){
        altSingles.sort(cmpStrongPlayDesc);
        return altSingles[0];
      }
    }
    return strongest;
  }
  if(diff==='normal'&&shouldForceMaxAgainstLastCard(game,game.currentSeat)&&Math.random()<0.6){
    return [...legal].sort(cmpStrongPlayDesc)[0];
  }
  if(diff==='easy'){
    const byWeak=[...legal].sort((a,b)=>comparePower(a.eval.power,b.eval.power));
    return Math.random()<0.7?byWeak[Math.floor(Math.random()*Math.min(4,byWeak.length))]:legal[Math.floor(Math.random()*legal.length)];
  }

  const rankCount=new Map();
  for(const c of hand)rankCount.set(c.rank,(rankCount.get(c.rank)??0)+1);
  const byMinPower=(a,b)=>{
    if(a.eval.count!==b.eval.count)return a.eval.count-b.eval.count;
    if(a.eval.count===5&&a.eval.kind!==b.eval.kind)return FIVE_KIND_POWER[a.eval.kind]-FIVE_KIND_POWER[b.eval.kind];
    return comparePower(a.eval.power,b.eval.power);
  };
  const byMaxPower=(a,b)=>{
    if(a.eval.count!==b.eval.count)return b.eval.count-a.eval.count;
    if(a.eval.count===5&&a.eval.kind!==b.eval.kind)return FIVE_KIND_POWER[b.eval.kind]-FIVE_KIND_POWER[a.eval.kind];
    return comparePower(a.eval.power,b.eval.power);
  };
  const preferSmallFullhousePair=(a,b)=>{
    if(a.eval.kind!=='fullhouse'||b.eval.kind!=='fullhouse')return 0;
    return fullhousePairRank(a)-fullhousePairRank(b);
  };
  const handLen=hand.length;
  const maxRank=(cards)=>Math.max(...cards.map((c)=>c.rank));
  const minRank=(cards)=>Math.min(...cards.map((c)=>c.rank));
  const leadScore=(play)=>{
    const c=play.eval.count;
    const kindBonus=c===5?FIVE_KIND_POWER[play.eval.kind]*4:0;
    const comboBase=c===5?30:c===3?20:c===2?14:4;
    const high=maxRank(play.cards);
    const low=minRank(play.cards);
    const preserveHigh=(high>=11&&handLen>5)?(c===1?12:c===2?5:2):0;
    const breakSet=(c===1&&(rankCount.get(play.cards[0].rank)??0)>1&&handLen>5)?10:0;
    const tooEarlySingle=(c===1&&handLen>8)?4:0;
    const lowSingleBonus=(c===1&&low<=5&&breakSet===0)?2:0;
    const bottomSingleBonus=(c===1&&isLowestSingle(play.cards[0]))?1:0;
    const closeoutBonus=(handLen<=5&&c>=2)?8:0;
    return comboBase+kindBonus+lowSingleBonus+bottomSingleBonus+closeoutBonus-preserveHigh-breakSet-tooEarlySingle;
  };
  const respondCost=(play)=>{
    const c=play.eval.count;
    const high=maxRank(play.cards);
    const rankDup=c===1?(rankCount.get(play.cards[0].rank)??0):0;
    let cost=0;
    if(c===1&&rankDup>1&&handLen>5)cost+=12;
    if(high>=11&&handLen>4)cost+=8;
    if(c===1&&isHighestSingle(play.cards[0])&&handLen>3)cost+=10;
    if(c===5)cost+=6;
    return cost;
  };

  if(!game.lastPlay){
    const scored=[...legal].sort((a,b)=>{
      const base=leadScore(b)-leadScore(a);
      if(base!==0)return base;
      if(diff==='hard'){
        const pairPref=preferSmallFullhousePair(a,b);
        if(pairPref!==0)return pairPref;
      }
      return byMinPower(a,b);
    });
    if(diff==='hard')return scored[0];
    // normal: keep variability while staying combo-first.
    if(Math.random()<0.2)return scored[Math.floor(Math.random()*Math.min(3,scored.length))];
    return scored[Math.floor(Math.random()*Math.min(2,scored.length))];
  }

  // Responding: win with minimal needed strength to conserve resources.
  const ordered=[...legal].sort((a,b)=>{
    const base=respondCost(a)-respondCost(b);
    if(base!==0)return base;
    if(diff==='hard'){
      const pairPref=preferSmallFullhousePair(a,b);
      if(pairPref!==0)return pairPref;
    }
    return byMinPower(a,b);
  });
  if(diff==='hard'){
    // Near endgame, spending stronger cards to keep tempo is acceptable.
    if(handLen<=4)return ordered.sort(byMaxPower)[0];
    return ordered[0];
  }
  if(Math.random()<0.18)return ordered[Math.floor(Math.random()*Math.min(3,ordered.length))];
  return ordered[0];
}
const basePenaltyByCount=(n)=>n>=13?n*3:n>=10?n*2:n;
const hasAnyTwo=(cards)=>(cards??[]).some((c)=>c.rank===12);
const hasTopTwo=(cards)=>(cards??[]).some((c)=>c.rank===12&&c.suit===3);
function chaoByRemain(remain){
  if(remain===13)return{multiplier:5,key:'scoreChaoBig'};
  if(remain===12)return{multiplier:4,key:'scoreChao4'};
  if(remain>=10&&remain<=11)return{multiplier:3,key:'scoreChao3'};
  if(remain>=8&&remain<=9)return{multiplier:2,key:'scoreChao2'};
  return{multiplier:1,key:''};
}
function calcPenaltyDetail(cards){
  const remain=(cards??[]).length;
  const base=basePenaltyByCount(remain);
  const anyTwo=hasAnyTwo(cards);
  const topTwo=hasTopTwo(cards);
  const chao=chaoByRemain(remain);
  let multiplier=1;
  if(anyTwo)multiplier*=2;
  if(topTwo)multiplier*=2;
  multiplier*=chao.multiplier;
  return{remain,base,multiplier,deduction:base*multiplier,anyTwo,topTwo,chaoMultiplier:chao.multiplier,chaoKey:chao.key};
}
const seatView=(s,self)=>(s-self+4)%4;
const botDisplay=(name,isBot)=>{if(!isBot)return name;const raw=String(name??'').trim();const m=raw.match(/(?:bot|ai)\s*([0-9]+)/i);if(!m)return raw||'Bot';const n=m[1]??'';return`Bot ${n}`.trim();};
const opponentFanStyleByName=(name)=>{
  const n=String(name??'').replace(/\s+/g,'').toLowerCase();
  const has=(...keys)=>keys.some((k)=>n.includes(k));
  if(has('小琪','milo'))return'fan-xiaoqi';
  if(has('天仔','jade'))return'fan-tinzai';
  if(has('嘉琪','kane'))return'fan-gaki';
  if(has('阿雲','axel'))return'fan-ayun';
  if(has('子晴','luna'))return'fan-ziqing';
  if(has('阿龍','nova'))return'fan-alung';
  return'';
};
function randomBotProfiles(count=3,avoidNames=[]){
  const normalize=(value)=>String(value??'').trim().toLowerCase();
  const seen=new Set();
  const uniquePool=[];
  for(const entry of BOT_PROFILE_POOL){
    const key=normalize(entry?.name);
    if(!key||seen.has(key))continue;
    seen.add(key);
    uniquePool.push({name:String(entry.name),gender:entry.gender==='female'?'female':'male'});
  }
  const avoidSet=new Set(avoidNames.map(normalize));
  const filtered=uniquePool.filter((p)=>!avoidSet.has(normalize(p.name)));
  const source=filtered.length>=count?filtered:uniquePool;
  const bag=[...source];
  for(let i=bag.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [bag[i],bag[j]]=[bag[j],bag[i]];
  }
  return bag.slice(0,count).map((p)=>({name:p.name,gender:p.gender==='female'?'female':'male'}));
}
function botGenderByName(name){
  const n=String(name??'').trim();
  const map=Object.fromEntries(
    BOT_PROFILE_POOL.map((p)=>[p.name,p.gender==='female'?'female':'male'])
  );
  return map[n]??(Math.random()<0.5?'female':'male');
}
function relabelSoloBots(){
  if(state.home.mode!=='solo'||!state.solo.players.length)return;
  const byProfile=Array.isArray(state.solo.botProfiles)&&state.solo.botProfiles.length===3
    ?state.solo.botProfiles.map((p)=>({name:String(p.name??''),gender:String(p.gender??'male')==='female'?'female':'male'}))
    :null;
  const byName=Array.isArray(state.solo.botNames)&&state.solo.botNames.length===3
    ?state.solo.botNames.map((name)=>({name:String(name??''),gender:botGenderByName(name)}))
    :null;
  const profiles=(byProfile??byName??randomBotProfiles()).slice(0,3);
  state.solo.botProfiles=profiles;
  state.solo.botNames=profiles.map((p)=>p.name);
  state.solo.players=state.solo.players.map((p,i)=>i===0?p:{...p,name:profiles[i-1].name,gender:profiles[i-1].gender});
}

function openEmotePicker(open,mode='normal'){
  if(emotePickerTimer){clearTimeout(emotePickerTimer);emotePickerTimer=null;}
  state.emote.open=Boolean(open);
  if(state.emote.open){
    emotePickerTimer=window.setTimeout(()=>{
      emotePickerTimer=null;
      if(state.emote.open){
        state.emote.open=false;
        render();
      }
    },EMOTE_PICKER_AUTO_CLOSE_MS);
  }
  render();
}
function triggerEmoteSticker(id){
  const match=EMOTE_STICKERS.find((x)=>x.id===id);
  if(!match)return;
  const now=Date.now();
  const seat=state.home.mode==='room'
    ?(Number.isInteger(state.room.selfSeat)&&state.room.selfSeat>=0
      ?state.room.selfSeat
      :roomSelfSeat(state.room.data))
    :0;
  state.emote.active={id:match.id,ts:now,source:'local',seat:Number.isInteger(seat)&&seat>=0?seat:undefined};
  state.emote.open=false;
  if(emotePickerTimer){clearTimeout(emotePickerTimer);emotePickerTimer=null;}
  playSound(`emote-${match.id}`);
  if(state.home.mode==='room'){
    void roomSubmitEmote(match.id,now);
  }
  if(emoteTimer){clearTimeout(emoteTimer);emoteTimer=null;}
  emoteTimer=window.setTimeout(()=>{
    if(state.emote.active&&state.emote.active.ts===now){
      state.emote.active=null;
      render();
    }
  },EMOTE_DURATION_MS);
  render();
}
let serviceBellFoodCalloutTimer=null;
function clearServiceBellFoodCallout(){
  if(serviceBellFoodCalloutTimer){clearTimeout(serviceBellFoodCalloutTimer);serviceBellFoodCalloutTimer=null;}
  if(state.serviceBell.foodCallout===null)return;
  state.serviceBell.foodCallout=null;
  render();
}
function setServiceBellFoodCallout(callout,durationMs=2600){
  if(serviceBellFoodCalloutTimer){clearTimeout(serviceBellFoodCalloutTimer);serviceBellFoodCalloutTimer=null;}
  state.serviceBell.foodCallout=callout;
  render();
  serviceBellFoodCalloutTimer=window.setTimeout(()=>{
    if(state.serviceBell.foodCallout===callout){
      state.serviceBell.foodCallout=null;
      render();
    }
    serviceBellFoodCalloutTimer=null;
  },Math.max(0,Number(durationMs)||0));
}
function pickRoomFoodCalloutSeat(){
  return null;
}
function canBotEmote(seat){
  const now=Date.now();
  const last=Number(botEmoteCooldownBySeat.get(seat)||0);
  if(now-last<BOT_EMOTE_COOLDOWN_MS)return false;
  botEmoteCooldownBySeat.set(seat,now);
  return true;
}
function pickBotEmoteForAction(action,actor,play,isSelf){
  const handCount=Array.isArray(actor?.hand)?actor.hand.length:0;
  const playCount=Array.isArray(play?.cards)?play.cards.length:0;
  const remaining=action==='play'?Math.max(0,handCount-playCount):handCount;
  const kind=String(play?.eval?.kind||'');
  const isBomb=kind==='straightflush'||kind==='fourofkind';
  const isFive=playCount>=5||kind==='fullhouse'||kind==='flush'||kind==='straight';
  const playedTop2=playCount===1&&play?.cards?.[0]?.rank===12;
  if(action==='play'&&remaining===0)return isSelf?'champagne':'shock';
  if(action==='pass'){
    if(remaining<=2)return isSelf?'cry':'think';
    return isSelf?'sweat':'thumbs';
  }
  if(action==='play'){
    if(isBomb)return isSelf?'fire':'shock';
    if(isFive)return isSelf?'smash':'shock';
    if(playedTop2)return isSelf?'cool':'shock';
    if(remaining<=2)return isSelf?'think':'think';
    return isSelf?'thumbs':'think';
  }
  return'';
}
function triggerBotEmoteLocal(seat,id){
  const match=EMOTE_STICKERS.find((x)=>x.id===id);
  if(!match)return;
  const now=Date.now();
  state.emote.active={id:match.id,ts:now,source:'local',by:`seat:${seat}`,seat};
  state.emote.open=false;
  if(emotePickerTimer){clearTimeout(emotePickerTimer);emotePickerTimer=null;}
  playSound(`emote-${match.id}`);
  if(emoteTimer){clearTimeout(emoteTimer);emoteTimer=null;}
  emoteTimer=window.setTimeout(()=>{
    if(state.emote.active&&state.emote.active.ts===now){
      state.emote.active=null;
      render();
    }
  },EMOTE_DURATION_MS);
  render();
}
function pickBotReaction(game,actorSeat,action,play){
  if(Math.random()>=1/3)return null;
  const players=Array.isArray(game?.players)?game.players:[];
  const actor=players[actorSeat];
  if(!actor)return null;
  if(!actor.isHuman&&canBotEmote(actorSeat)){
    const selfEmote=pickBotEmoteForAction(action,actor,play,true);
    if(selfEmote)return{seat:actorSeat,id:selfEmote,by:String(actor?.uid||'')};
  }
  const botSeats=[];
  players.forEach((p,i)=>{if(i!==actorSeat&&p&&!p.isHuman)botSeats.push(i);});
  if(!botSeats.length)return null;
  const botSeat=botSeats[Math.floor(Math.random()*botSeats.length)];
  if(!canBotEmote(botSeat))return null;
  const emoteId=pickBotEmoteForAction(action,actor,play,false);
  if(!emoteId)return null;
  const bot=players[botSeat];
  return{seat:botSeat,id:emoteId,by:String(bot?.uid||'')};
}
function syncRoomEmote(roomData){
  const gameRaw=roomData?.game?.emote;
  const rootRaw=roomData?.emote;
  const gameTs=Number(gameRaw?.ts||0);
  const rootTs=Number(rootRaw?.ts||0);
  const raw=(rootTs>=gameTs?rootRaw:gameRaw)??null;
  if(!raw||typeof raw!=='object'){
    if(state.emote.active?.source==='room'){
      state.emote.active=null;
      render();
    }
    return;
  }
  const id=String(raw.id||'').trim();
  const ts=Number(raw.ts||0);
  if(!id||!Number.isFinite(ts)){
    if(state.emote.active?.source==='room'){
      state.emote.active=null;
      render();
    }
    return;
  }
  const age=Date.now()-ts;
  const resolvedSeat=resolveRoomEmoteSeat(roomData,raw);
  if(id.startsWith(FOOD_EMOTE_PREFIX)){
    const foodId=id.slice(FOOD_EMOTE_PREFIX.length).trim().toLowerCase();
    const foodMeta=FOOD_CALLOUT_META[foodId]||null;
    const by=String(raw.by||'').trim();
    let seat=resolvedSeat;
    const selfSeat=Number.isInteger(state.room.selfSeat)&&state.room.selfSeat>=0
      ?state.room.selfSeat
      :roomSelfSeat(roomData);
    if(!foodMeta||!Number.isFinite(age)||age>2600||seat<0||seat===selfSeat){
      return;
    }
    const currentFood=state.serviceBell?.foodCallout;
    if(currentFood&&currentFood.ts===ts&&currentFood.seat===seat&&currentFood.foodId===foodId){
      return;
    }
    setServiceBellFoodCallout({
      seat,
      foodId,
      file:foodMeta.file,
      width:foodMeta.width,
      ts
    },Math.max(0,2600-age));
    return;
  }
  if(age>EMOTE_DURATION_MS){
    if(state.emote.active?.source==='room'&&state.emote.active.ts===ts){
      state.emote.active=null;
      render();
    }
    return;
  }
  const current=state.emote.active;
  if(current&&current.id===id&&current.ts===ts){
    if(current.source==='local')return;
    if(current.source==='room')return;
  }
  state.emote.active={id,ts,source:'room',by:String(raw.by||''),seat:Number.isInteger(resolvedSeat)&&resolvedSeat>=0?resolvedSeat:undefined};
  state.emote.open=false;
  if(emotePickerTimer){clearTimeout(emotePickerTimer);emotePickerTimer=null;}
  if(emoteTimer){clearTimeout(emoteTimer);emoteTimer=null;}
  const remaining=Math.max(0,EMOTE_DURATION_MS-age);
  emoteTimer=window.setTimeout(()=>{
    if(state.emote.active&&state.emote.active.ts===ts&&state.emote.active.source==='room'){
      state.emote.active=null;
      render();
    }
  },remaining);
  if(String(raw.by||'')!==currentRoomPlayerId()){
    playSound(`emote-${id}`);
  }
  render();
}
function newCalloutNonce(){
  return`${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
}
function clearCalloutStates(except=''){
  if(except!=='play'){
    if(playTypeCallTimer){clearTimeout(playTypeCallTimer);playTypeCallTimer=null;}
    playTypeCallState.until=0;
    playTypeCallState.startedAt=0;
    playTypeCallState.nonce='';
    playTypeCallState.historyLen=0;
  }
  if(except!=='pass'){
    if(passCallTimer){clearTimeout(passCallTimer);passCallTimer=null;}
    passCallState.until=0;
    passCallState.startedAt=0;
    passCallState.nonce='';
    passCallState.historyLen=0;
  }
  if(except!=='last'){
    if(lastCardCallTimer){clearTimeout(lastCardCallTimer);lastCardCallTimer=null;}
    lastCardCallState.text='';
    lastCardCallState.until=0;
    lastCardCallState.startedAt=0;
    lastCardCallState.nonce='';
    lastCardCallState.historyLen=0;
  }
  if(except!=='must3'){
    must3CallState.key='';
    must3CallState.text='';
    must3CallState.until=0;
    must3CallState.startedAt=0;
    must3CallState.nonce='';
  }
}
function lockTurnProgress(ms=0){
  const hold=Math.max(0,Number(ms)||0);
  if(!hold)return;
  turnLockUntil=Math.max(turnLockUntil,Date.now()+hold);
}

function reorderById(arr,fromId,toId,idFn){if(!fromId||!toId||fromId===toId)return arr;const copy=[...arr];const fi=copy.findIndex((x)=>idFn(x)===fromId),ti=copy.findIndex((x)=>idFn(x)===toId);if(fi<0||ti<0)return arr;const[m]=copy.splice(fi,1);copy.splice(ti,0,m);return copy;}
function patternSortCards(hand){return[...hand].sort((a,b)=>b.suit-a.suit||a.rank-b.rank);}

function triggerMust3LeadCallout(game,selfSeat=0){
  must3CallState.key='';
  must3CallState.text='';
  must3CallState.until=0;
  must3CallState.startedAt=0;
  must3CallState.nonce='';
  if(!game||!Array.isArray(game.players)||!game.players.length)return;
  const seatIndex=Number.isInteger(selfSeat)&&selfSeat>=0?selfSeat:0;
  const human=game.players[seatIndex];
  if(!human||!Array.isArray(human.hand)||!has3d(human.hand))return;
  const opponents=game.players.map((p,i)=>({player:p,seat:i})).filter((x)=>!x.player?.isHuman&&x.seat!==seatIndex);
  if(!opponents.length)return;
  const pick=opponents[Math.floor(Math.random()*opponents.length)];
  const text=t('must3');
  const now=Date.now();
  must3CallState.key=`must3-${now}-${pick.seat}`;
  must3CallState.seat=pick.seat;
  must3CallState.text=text;
  must3CallState.until=now+2400;
  must3CallState.startedAt=now;
  must3CallState.nonce=newCalloutNonce();
  scheduleCalloutExpiry(must3CallState.until);
  speakCallout(text,pick.player?.gender??'male',{seat:pick.seat,force:true,clipKey:'line-must3'});
}
function startSoloGame(options={}){randomizeNpcColors();const preserveOpponents=options?.preserveOpponents!==false;const resetRoundWins=options?.resetRoundWins===true;const resetTotals=options?.resetTotals===true;const storedBotProfiles=Array.isArray(state.solo.botProfiles)&&state.solo.botProfiles.length===3?state.solo.botProfiles.map((bp)=>({name:String(bp?.name||''),gender:String(bp?.gender||'male')})):null;const botProfiles=preserveOpponents&&storedBotProfiles&&storedBotProfiles.every((bp)=>bp.name)?storedBotProfiles:randomBotProfiles();const p=[{name:state.home.name||t('name'),gender:state.home.gender==='female'?'female':'male',hand:[],isHuman:true},{name:botProfiles[0].name,gender:botProfiles[0].gender,hand:[],isHuman:false},{name:botProfiles[1].name,gender:botProfiles[1].gender,hand:[],isHuman:false},{name:botProfiles[2].name,gender:botProfiles[2].gender,hand:[],isHuman:false}];const deck=shuffle(createDeck());p.forEach((x)=>{x.hand=deck.splice(0,13).sort(cmpCard);});const start=p.findIndex((x)=>x.hand.some((c)=>c.rank===0&&c.suit===0));const totals=resetTotals?soloStartingTotals(p):getNextSoloTotals(state.solo.totals,{resetTotals});const roundWins=getNextSoloRoundWins(state.solo.roundWins,{resetTotals,resetRoundWins});state.solo={players:p,botProfiles:botProfiles.map((bp)=>({name:bp.name,gender:bp.gender})),botNames:botProfiles.map((bp)=>bp.name),totals,roundWins,currentSeat:start,lastPlay:null,passStreak:0,isFirstTrick:true,gameOver:false,status:'',systemLog:[],history:[],aiDifficulty:state.home.aiDifficulty,lastCardBreach:null,roundSummary:null};setSoloStatus(`${p[start].name} ${t('start')}`);state.selected.clear();state.recommendation=null;state.logTouched=false;state.showLog=false;state.showLogSheet=false;state.screen='game';state.home.mode='solo';state.home.showIntro=false;state.home.showLeaderboard=false;state.showScoreGuide=false;calloutGateUntilPlay=true;playSound('start');triggerMust3LeadCallout(state.solo,0);render();maybeRunSoloAi();}
function soloApplyPlay(seat,cards){const g=state.solo;const ev=evaluatePlay(cards);if(!ev.valid){if(seat===0)setSoloStatus(ev.reason);return false;}if(g.isFirstTrick&&!has3d(cards)){if(seat===0)setSoloStatus(t('must3'));return false;}if(g.lastPlay&&!canBeat(ev,g.lastPlay.eval)){if(seat===0)setSoloStatus(t('beat'));return false;}
  if(shouldForceMaxAgainstLastCard(g,seat)){
    const legal=legalTurnPlays(g.players[seat].hand,g).sort(cmpStrongPlayDesc);
    const strongest=legal[0];
    const chosen=legal.find((x)=>x.eval.count===ev.count&&x.eval.kind===ev.kind&&comparePower(x.eval.power,ev.power)===0);
    if(chosen&&strongest&&comparePower(chosen.eval.power,strongest.eval.power)!==0){
      g.lastCardBreach={seat,threatenedSeat:(seat+1)%4};
    }
  }
  const ids=new Set(cards.map(cardId));g.players[seat].hand=g.players[seat].hand.filter((c)=>!ids.has(cardId(c)));g.lastPlay={seat,eval:ev,cards:ev.sorted};g.passStreak=0;g.isFirstTrick=false;g.history.push({action:'play',seat,name:g.players[seat].name,cards:ev.sorted,kind:ev.kind,ts:Date.now()});
  if(g.players[seat].hand.length===0){
    lockTurnProgress(900);
    g.gameOver=true;
    const details=g.players.map((p,i)=>i===seat?{remain:0,base:0,multiplier:1,deduction:0,anyTwo:false,topTwo:false,chaoMultiplier:1,chaoKey:''}:calcPenaltyDetail(p.hand));
    let deductions=details.map((d)=>d.deduction);
    if(g.lastCardBreach&&seat===g.lastCardBreach.threatenedSeat){
      const violator=g.lastCardBreach.seat;
      const transferred=deductions.reduce((sum,v)=>sum+v,0);
      deductions=deductions.map((v,i)=>i===violator?transferred:0);
    }
    const winnerGain=deductions.reduce((sum,v)=>sum+v,0);
    g.roundSummary={winnerSeat:seat,deductions:[...deductions],winnerGain,details,lastCardBreach:g.lastCardBreach?{...g.lastCardBreach}:null};
  g.roundWins=(Array.isArray(g.roundWins)&&g.roundWins.length===4?g.roundWins:[0,0,0,0]).map((v,i)=>i===seat?(Number(v)||0)+1:(Number(v)||0));
  g.totals=(g.totals??[5000,5000,5000,5000]).map((s,i)=>s+(i===seat?winnerGain:-deductions[i]));
  const remain=g.players.map((p,i)=>({p,i})).filter((x)=>x.i!==seat).map((x)=>`${x.p.name}:${deductions[x.i]}`).join(' / ');
  setSoloStatus(`${g.players[seat].name} ${t('wins')} ${t('penalty')}:${remain}`);
  const deltas=g.players.map((_,i)=>i===seat?winnerGain:-deductions[i]);
  g.players.forEach((p,i)=>{
    const identity=p.isHuman?currentLeaderboardIdentity():botLeaderboardIdentity(p.name,p.gender);
    void recordLeaderboardRound(identity,deltas[i],i===seat);
  });
  playSound('win');
  {const wc=buildWinnerCalloutForSeat(g,seat);playWinSfxThen(()=>{void playWinnerCallout(wc,g.players[seat]?.gender??'male',seat);},2200);}
  return true;
  }
  if(g.lastCardBreach&&seat===g.lastCardBreach.threatenedSeat)g.lastCardBreach=null;
  lockTurnProgress(900);
  g.currentSeat=(seat+1)%4;setSoloStatus(`${g.players[seat].name} ${t('played')} ${kindLabel(ev.kind)}.`,{appendLog:false});playSound('play');
  const reaction=pickBotReaction(g,seat,'play',{cards:ev.sorted,eval:ev});
  if(reaction)triggerBotEmoteLocal(reaction.seat,reaction.id);
  return true;}
function soloPass(seat){const g=state.solo;if(!g.lastPlay){if(seat===0)setSoloStatus(t('cantPass'));return false;}g.passStreak+=1;g.history.push({action:'pass',seat,name:g.players[seat].name,ts:Date.now()});if(g.lastCardBreach&&seat===g.lastCardBreach.threatenedSeat)g.lastCardBreach=null;lockTurnProgress(850);if(g.passStreak>=3){const lead=g.lastPlay.seat;g.currentSeat=lead;g.lastPlay=null;g.passStreak=0;setSoloStatus(`${g.players[lead].name} ${t('retake')}`);playSound('pass');return true;}g.currentSeat=(seat+1)%4;setSoloStatus(`${g.players[seat].name} ${t('pass')}.`,{appendLog:false});playSound('pass');const reaction=pickBotReaction(g,seat,'pass',null);if(reaction)triggerBotEmoteLocal(reaction.seat,reaction.id);return true;}
function maybeRunSoloAi(){
  if(aiTimer){clearTimeout(aiTimer);aiTimer=null;}
  if(state.home.mode!=='solo')return;
  const g=state.solo;
  const current=g?.players?.[g?.currentSeat];
  if(!g||g.gameOver||!current||current.isHuman)return;
  const now=Date.now();
  calloutAudioController.forceReleaseStale(now);
  const turnLockRemaining=Math.max(0,turnLockUntil-now);
  const remaining=Math.max(0,calloutAudioController.getSpeechUntil()-Date.now());
  const afterCallout=calloutAudioController.consumeResumePending();
  const DEFAULT_AI_DELAY_MS=350;
  const POST_CALLOUT_DELAY_MS=320;
  const MIN_AI_DELAY_MS=250;
  const wait=(calloutAudioController.isSpeechActive()||remaining>0||turnLockRemaining>0)
    ?Math.max(MIN_AI_DELAY_MS,remaining,turnLockRemaining)
    :afterCallout?POST_CALLOUT_DELAY_MS:DEFAULT_AI_DELAY_MS;
  aiTimer=window.setTimeout(()=>{
    try{
      const tickNow=Date.now();
      calloutAudioController.forceReleaseStale(tickNow);
      if(calloutAudioController.isSpeechActive()||tickNow<calloutAudioController.getSpeechUntil()){
        maybeRunSoloAi();
        return;
      }
      if(tickNow<turnLockUntil){
        maybeRunSoloAi();
        return;
      }
      const live=state.solo;
      const seat=live?.currentSeat;
      const actor=live?.players?.[seat];
      if(!live||live.gameOver||!actor||actor.isHuman)return;
      const ch=chooseAiPlay(actor.hand,live,live.aiDifficulty);
      if(!ch)soloPass(seat);else soloApplyPlay(seat,ch.cards);
      render();
    }catch(err){
      console.error('AI turn tick failed',err);
    }finally{
      maybeRunSoloAi();
    }
  },wait);
}

function unlockAudio(){
  if(!sound.enabled)return;
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(AudioCtx){
      if(!sound.ctx){
        sound.ctx=new AudioCtx();
      }
      if(sound.ctx?.state==='suspended'){
        sound.ctx.resume?.().catch(()=>{});
      }
      // iOS Safari often needs a real node start/stop in a user gesture to unlock playback.
      if(sound.ctx?.state==='running'){
        try{
          const c=sound.ctx;
          const o=c.createOscillator();
          const g=c.createGain();
          g.gain.value=0.00001;
          o.connect(g);
          g.connect(c.destination);
          const t=c.currentTime;
          o.start(t);
          o.stop(t+0.01);
        }catch{}
      }
    }
    calloutAudioController.primeHtmlAudioIfNeeded();
  }catch{
    // Keep user preference unchanged even if runtime audio context cannot initialize.
  }
}
function primeSpeech(){
  calloutAudioController.primeSpeech();
}
function isAudioReady(){
  return Boolean(sound.enabled&&sound.ctx&&sound.ctx.state==='running');
}
function isSpeechReady(){
  try{
    if(!window.speechSynthesis||typeof window.SpeechSynthesisUtterance==='undefined')return false;
    const voices=window.speechSynthesis.getVoices?.()??[];
    return voices.length>0;
  }catch{
    return false;
  }
}
function runtimeDiagnosticsText(){
  const zh=state.language==='zh-HK';
  const audio=isAudioReady()?(zh?'已啟用':'Ready'):(zh?'未啟用':'Off');
  const speech=isSpeechReady()?(zh?'可用':'Ready'):(zh?'不可用':'Unavailable');
  return zh?`診斷: 音效 ${audio} | 報牌語音 ${speech}`:`Diag: Audio ${audio} | Callout Speech ${speech}`;
}
function currentSfxDuckFactor(){
  return calloutAudioController.currentSfxDuckFactor();
}
function playTone(freq,d,type='sine',g=0.03,delay=0){
  if(!sound.ctx)return;
  const c=sound.ctx,o=c.createOscillator(),a=c.createGain();
  const duck=currentSfxDuckFactor();
  o.type=type;
  o.frequency.value=freq;
  a.gain.value=g*duck;
  o.connect(a);
  a.connect(c.destination);
  const now=c.currentTime+delay;
  o.start(now);
  a.gain.exponentialRampToValueAtTime(0.0001,now+d);
  o.stop(now+d);
}
function playSound(kind){
  if(!sound.enabled)return;
  unlockAudio();
  if(!sound.ctx)return;
  if(sound.ctx.state==='suspended'){
    sound.ctx.resume?.().catch(()=>{});
  }
  if(kind==='win-sfx'){
    try{
      if(!winSfxAudio){
        winSfxAudio=new Audio(withBase('audio/sfx/win.mp3'));
        winSfxAudio.preload='auto';
        winSfxAudio.playsInline=true;
        winSfxAudio.setAttribute?.('playsinline','');
      }
      const base=winSfxAudio;
      const useClone=base && !base.paused && !base.ended;
      const a=useClone ? base.cloneNode(true) : base;
      if(a!==base){
        a.src=base.src;
        a.preload='auto';
        a.playsInline=true;
        a.setAttribute?.('playsinline','');
      }
      a.volume=0.4*currentSfxDuckFactor();
      a.currentTime=0;
      void a.play();
      if(a!==base){
        a.addEventListener?.('ended',()=>{try{a.src='';}catch{}},{once:true});
      }
    }catch{}
    return;
  }
  if(kind.startsWith('emote-')){
    playTone(640,0.035,'sine',0.012);
    playTone(880,0.03,'sine',0.008,0.03);
    return;
  }
  if(kind==='select')playTone(520,0.08,'triangle',0.02);
  if(kind==='play'){playTone(330,0.11,'square',0.03);playTone(490,0.12,'triangle',0.02,0.03);}
  if(kind==='pass')playTone(210,0.1,'sine',0.02);
  // Make last-card ring clearly audible on mobile speakers (including iOS).
  if(kind==='last'){
    playTone(640,0.16,'triangle',0.065);
    playTone(960,0.18,'triangle',0.06,0.12);
    playTone(1280,0.2,'triangle',0.055,0.24);
  }
  if(kind==='start'){playTone(330,0.1,'triangle',0.025);playTone(495,0.12,'triangle',0.025,0.05);}
  if(kind==='congrats'){
    playTone(392,0.18,'triangle',0.05);
    playTone(494,0.2,'triangle',0.05,0.08);
    playTone(587,0.22,'triangle',0.05,0.16);
    playTone(784,0.24,'triangle',0.048,0.24);
    playTone(988,0.26,'triangle',0.046,0.34);
    playTone(1175,0.28,'triangle',0.044,0.46);
  }
  if(kind==='win'){playTone(392,0.13,'triangle',0.03);playTone(523,0.14,'triangle',0.03,0.06);playTone(659,0.2,'triangle',0.03,0.12);}
}
const serviceBellController=createServiceBellController({
  documentRef:()=>document,
  windowRef:()=>window,
  withBase:(path)=>withBase(path),
  unlockAudio,
  getSoundEnabled:()=>sound.enabled,
  createAudio:(src)=>new Audio(src),
  getFoodCalloutSeat:()=>pickRoomFoodCalloutSeat(),
  setFoodCallout:(callout)=>setServiceBellFoodCallout(callout),
  clearFoodCallout:()=>clearServiceBellFoodCallout(),
  onFoodSpawn:(item)=>{
    if(state.home.mode!=='room')return;
    const roomData=state.room.data;
    let seat=Number.isInteger(state.room.selfSeat)&&state.room.selfSeat>=0
      ?state.room.selfSeat
      :roomSelfSeat(roomData);
    if(!Number.isInteger(seat)||seat<0){
      seat=roomSeatForPlayer(roomData,currentRoomPlayerId());
    }
    void roomSubmitFoodCallout(item?.id||'',seat,Date.now());
  }
});
globalThis.serviceBellTrigger=()=>{
  serviceBellController.sync({active:state.screen==='game',portraitMode:isPortraitMode()});
  return serviceBellController.trigger();
};
function triggerVibration(pattern){
  try{
    if(!vibrateEnabled)return;
    const cap=window.Capacitor;
    const platform=String(cap?.getPlatform?.()||'').toLowerCase();
    const isNativePlatform=Boolean(cap?.isNativePlatform?.()||platform==='ios'||platform==='android');
    const useNativeHaptics=isNativePlatform&&(platform==='ios'||platform==='android');
    if(useNativeHaptics){
      void triggerNativeHaptics(pattern);
      return;
    }
    if(typeof navigator?.vibrate!=='function'){
      triggerHapticFallbackPulse();
      return;
    }
    const ok=navigator.vibrate(pattern);
    if(!ok)triggerHapticFallbackPulse();
  }catch{}
}
function triggerHapticFallbackPulse(){
  const body=document.body;
  if(!(body instanceof HTMLElement))return;
  body.setAttribute('data-haptic-fallback','0');
  // Force restart of CSS pulse animation when called repeatedly.
  void body.offsetWidth;
  body.setAttribute('data-haptic-fallback','1');
  if(hapticFallbackTimer)window.clearTimeout(hapticFallbackTimer);
  hapticFallbackTimer=window.setTimeout(()=>{
    hapticFallbackTimer=null;
    body.setAttribute('data-haptic-fallback','0');
  },220);
}
async function loadNativeHaptics(){
  if(nativeHapticsLoadAttempted)return nativeHaptics;
  nativeHapticsLoadAttempted=true;
  try{
    const cap=window.Capacitor;
    const direct=cap?.Plugins?.Haptics;
    if(direct&&typeof direct.vibrate==='function'){
      nativeHaptics=direct;
      return nativeHaptics;
    }
  }catch{}
  try{
    const mod=await import('@capacitor/haptics');
    const api=mod?.Haptics;
    if(api&&typeof api.vibrate==='function'){
      nativeHaptics=api;
      return nativeHaptics;
    }
  }catch{}
  return null;
}
async function triggerNativeHaptics(pattern){
  const api=await loadNativeHaptics();
  if(!api||typeof api.vibrate!=='function')return;
  const arr=Array.isArray(pattern)?pattern:[Number(pattern)||80];
  const pulses=arr
    .map((v,i)=>({v:Number(v)||0,i}))
    .filter((x)=>x.i%2===0&&x.v>0)
    .map((x)=>Math.max(10,Math.trunc(x.v)));
  if(!pulses.length){
    try{await api.vibrate({duration:80});}catch{}
    return;
  }
  let delay=0;
  pulses.forEach((duration,index)=>{
    const run=()=>{
      try{void api.vibrate({duration:Math.min(duration,500)});}catch{}
    };
    if(index===0)run();
    else window.setTimeout(run,delay);
    const off=Number(arr[(index*2)+1]||0);
    delay+=duration+Math.max(0,off);
  });
}
function playWinSfxThen(fn,delayFallback=2000){
  const seq=++winSfxSeq;
  let done=false;
  const fire=()=>{
    if(done||seq!==winSfxSeq)return;
    done=true;
    fn?.();
  };
  playSound('win-sfx');
  if(winSfxAudio){
    try{
      winSfxAudio.onended=fire;
    }catch{}
  }
  window.setTimeout(fire,delayFallback);
}
function applyTheme(){const theme=THEMES[state.home.theme]??THEMES.ocean;const root=document.documentElement;for(const[k,v]of Object.entries(theme))root.style.setProperty(k,v);}

function buildView(){
  const g=state.solo;
  if(!g||!Array.isArray(g.players)||!g.players.length)return null;
  const mode=state.home.mode==='room'?'room':'solo';
  const selfSeat=mode==='room'&&(Number.isInteger(state.room.selfSeat))?state.room.selfSeat:0;
  const seatIndex=Number.isInteger(selfSeat)&&selfSeat>=0?selfSeat:0;
  const selfPlayer=g.players[seatIndex]??g.players[0];
  return{
    mode,
    currentSeat:g.currentSeat,
    lastPlay:g.lastPlay,
    gameOver:g.gameOver,
    isFirstTrick:g.isFirstTrick,
    status:g.status,
    statusMeta:g.statusMeta??null,
    systemLog:g.systemLog??[],
    participants:g.players.map((p,seat)=>({seat,name:p.name,gender:p.gender??'male',picture:p.picture??'',isBot:!p.isHuman,count:p.hand.length,score:(!p.isHuman&&String(p.uid??'')===currentRoomPlayerId())?currentHumanScoreValue():(g.totals?.[seat]??0)})),
    hand:selfPlayer?.hand??[],
    history:g.history,
    selfSeat:seatIndex,
    canControl:!g.gameOver&&g.currentSeat===seatIndex,
    canPass:!g.gameOver&&g.currentSeat===seatIndex&&Boolean(g.lastPlay),
    revealedHands:g.gameOver?g.players.map((p)=>[...p.hand]):null,
    roundSummary:g.roundSummary??null,
    roundWins:Array.isArray(g.roundWins)&&g.roundWins.length===4?g.roundWins.map((v)=>Number(v)||0):[0,0,0,0]
  };
}

function gameLogLocale(){
  const localeMap={
    'zh-HK':'zh-HK',
    en:'en-US',
    fr:'fr-FR',
    de:'de-DE',
    es:'es-ES',
    ja:'ja-JP'
  };
  return localeMap[state.language]??'en-US';
}
function formatGameLogDateTime(ts){
  const n=Number(ts)||0;
  if(!n)return'';
  try{
    const locale=gameLogLocale();
    const d=new Date(n);
    const time=d.toLocaleTimeString(locale,{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
    return time;
  }catch{
    return'';
  }
}
function formatSystemLogDateTime(ts){
  const n=Number(ts)||0;
  if(!n)return'';
  try{
    const locale=gameLogLocale();
    const d=new Date(n);
    const time=d.toLocaleTimeString(locale,{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
    return time;
  }catch{
    return'';
  }
}
function gameLogCardText(cards){
  return(cards??[]).map((c)=>`${SUITS[c.suit]?.symbol??''}${RANKS[c.rank]??''}`).join('');
}
function gameLogDetailText(e){
  const lang=state.language;
  const textByLang={
    'zh-HK':{pass:'本回合選擇過牌。',played:'出牌：',card:'張'},
    en:{pass:'Passed this turn.',played:'Played:',card:'cards'},
    fr:{pass:'A passé ce tour.',played:'Joué:',card:'cartes'},
    de:{pass:'Zug gepasst.',played:'Gespielt:',card:'Karten'},
    es:{pass:'Pasó este turno.',played:'Jugó:',card:'cartas'},
    ja:{pass:'このターンはパスしました。',played:'出しました：',card:'枚'}
  };
  const copy=textByLang[lang]??textByLang.en;
  if(e.action==='pass')return copy.pass;
  const cards=e.cards??[];
  const kind=kindLabel(e.kind);
  const cardText=gameLogCardText(cards);
  if(lang==='zh-HK')return`${copy.played}${kind}(${cards.length}${copy.card})${cardText?`(${cardText})`:''}`;
  return`${copy.played} ${kind} (${cards.length} ${copy.card})${cardText?` (${cardText})`:''}`;
}
function historyHtml(h,self,systemLog=[]){
  const items=[];
  let seq=0;
  for(const e of (h??[])){
    const vIdx=seatView(e.seat,self);
    const cls=seatCls[vIdx]||'south';
    const color=playerColorByViewClass(cls);
    const timeText=formatGameLogDateTime(e.ts);
    const detail=gameLogDetailText(e);
    const tag=`<span class="player-color-chip" style="--player-color:${color};"></span><span class="history-name">${esc(e.name)}</span>`;
    if(e.action==='pass'){
      items.push({ts:Number(e.ts)||0,seq:seq++,html:`<div class="history-item"><div class="history-head"><div class="history-title">${tag}</div>${timeText?`<div class="history-time">${esc(timeText)}</div>`:''}</div><div class="history-detail">${esc(detail)}</div></div>`});
      continue;
    }
    const cards=(e.cards??[]).map((c)=>renderStaticCard(c,true)).join('');
    items.push({ts:Number(e.ts)||0,seq:seq++,html:`<div class="history-item"><div class="history-head"><div class="history-title">${tag}</div>${timeText?`<div class="history-time">${esc(timeText)}</div>`:''}</div><div class="history-detail-row"><div class="history-detail">${esc(detail)}</div><div class="history-cards">${cards}</div></div></div>`});
  }
  const sysEntries=(systemLog??[]).map((x)=>typeof x==='string'?{text:x,ts:0}:{text:String(x?.text??''),ts:Number(x?.ts)||0}).filter((x)=>x.text.trim());
  for(const s of sysEntries){
    const timeText=formatSystemLogDateTime(s.ts);
    items.push({ts:Number(s.ts)||0,seq:seq++,html:`<div class="history-item"><div class="history-head"><div class="history-meta history-system-line">${esc(s.text)}</div>${timeText?`<div class="history-time">${esc(timeText)}</div>`:''}</div></div>`});
  }
  const entries=items.sort((a,b)=>(b.ts-a.ts)||(b.seq-a.seq)).map((x)=>x.html);
  if(!entries.length)return`<div class="hint">${t('nolog')}</div>`;
  return entries.join('');
}
function addRoomSystemLog(game,text){
  if(!game||!text)return;
  if(!Array.isArray(game.systemLog))game.systemLog=[];
  const last=game.systemLog[game.systemLog.length-1];
  if(last&&String(last.text||'')===text)return;
  game.systemLog.push({text,ts:Date.now()});
  if(game.systemLog.length>200)game.systemLog=game.systemLog.slice(-200);
}
function centerMovesHtml(v){
  void v;
  return'';
}
function lastActionBySeat(h){
  const out=new Map();
  for(const e of h??[]){
    if(e.action==='play'&&Array.isArray(e.cards)&&e.cards.length){out.set(e.seat,{type:'play',cards:[...e.cards]});continue;}
    if(e.action==='pass')out.set(e.seat,{type:'pass'});
  }
  return out;
}
const TABLE_PLAY_SCALE=1;
const seatLastActionHtml=(action,sizeMultiplier=1)=>renderSeatLastAction(action,{
  t,
  renderStaticCard,
  fanNoise,
  cardId,
  sizeMultiplier
});
const centerLastMovesHtml=(lastActions,selfSeat)=>renderCenterLastMoves(lastActions,selfSeat,{
  seatCls,
  renderSeatLastAction:(action,sizeMultiplier)=>seatLastActionHtml(action,sizeMultiplier),
  tablePlayScale:TABLE_PLAY_SCALE
});
const revealHtml=()=>'';
const resultScreenHtml=(v,arr)=>buildResultScreenHtml({
  v,
  arr,
  state,
  t,
  esc,
  roomIsHost,
  roomResultExpired,
  roomCountdownText,
  uiStatus,
  playerColorByViewClass,
  calcPenaltyDetail,
  renderStaticCard,
  authPictureUrl,
  authPictureUrlFrom,
  avatarDataUri
});
const congratsOverlayHtml=(v,youWin)=>buildCongratsOverlayHtml({
  v,
  youWin,
  state,
  t,
  esc,
  roomIsHost,
  roomResultExpired,
  roomCountdownText,
  uiStatus
});
function setRecommendHint(msg=''){
  state.recommendHint=msg;
  if(recommendHintTimer){clearTimeout(recommendHintTimer);recommendHintTimer=null;}
  if(msg){
    recommendHintTimer=window.setTimeout(()=>{recommendHintTimer=null;state.recommendHint='';render();},2200);
  }
}

function markComboActive(comboId,value){
  document.querySelectorAll(`#${comboId} .combo-btn`).forEach((btn)=>{
    btn.classList.toggle('active',btn.getAttribute('data-value')===value);
  });
}
function renderLangMenu(id){
  return langMenuController.renderLangMenu(id);
}
function closeLangMenu(){
  langMenuController.closeLangMenu();
}
function bindLangMenu(root,{reloadGoogle=false}={}){
  langMenuController.bindLangMenu(root,{reloadGoogle});
}
const {
  currentMust3Call,
  currentLastCardSeat,
  currentPlayTypeCall,
  currentPassCall
}=createCalloutStateController({
  getSoloPlayers:()=>state?.solo?.players,
  stateRefs:{
    playTypeCallState,
    passCallState,
    lastCardCallState,
    must3CallState,
    lastCardAnnouncedSeats,
    lastCardProcessedHistoryLenRef:{
      get:()=>lastCardProcessedHistoryLen,
      set:(value)=>{lastCardProcessedHistoryLen=value;}
    }
  },
  cardId,
  evaluatePlay,
  fiveKindPower:FIVE_KIND_POWER,
  buildResponseCalloutText,
  newCalloutNonce,
  scheduleCalloutExpiry,
  lockTurnProgress,
  clearCalloutStates,
  playSound,
  triggerVibration,
  speakCallout,
  t
});
const bindGameEvents=createGameEventsBinder({
  state,
  app,
  bindLangMenu,
  closeLangMenu,
  clearAiTimer:()=>{if(aiTimer){clearTimeout(aiTimer);aiTimer=null;}},
  refreshLeaderboard,
  render,
  handleGameTopbarClick,
  leaveRoom,
  resetSoloSessionCarryover,
  setRecommendHint,
  resetRoomExpiryTo60s,
  waitMs:(ms)=>waitMs(ms),
  guardAction,
  armPopunderForGesture,
  schedulePopunderAfterRender,
  startSoloGame,
  roomResultExpired,
  t,
  roomIsHost,
  restartRoomGame,
  isPortraitMode,
  openEmotePicker,
  triggerEmoteSticker,
  unlockAudio,
  playSound,
  roomSubmitPass,
  soloPass,
  maybeRunSoloAi,
  evaluatePlay,
  has3d,
  canBeat,
  roomSubmitPlay,
  setRoomError,
  setSoloStatus,
  soloApplyPlay,
  shouldRecommendPass,
  suggestPlay,
  cardId,
  reorderCurrent,
  isMobilePointer,
  autoArrangeCurrent
});
const bindConfigEvents=createConfigEventsBinder();
const bindHomeEvents=createHomeEventsBinder();
const bindOpponentsEvents=createOpponentsEventsBinder();
function backAssetFile(value){
  const found=BACK_OPTIONS.find((x)=>x.value===value);
  return found?.file??'back-red.png';
}
function renderBackCarouselItems(){
  const items=BACK_OPTIONS.map((opt)=>`<button class="combo-btn ${state.home.backColor===opt.value?'active':''}" data-value="${opt.value}" aria-label="${opt.label[state.language]??opt.value}"><img class="combo-back-preview" src="${withBase(`card-assets/${opt.preview||opt.file}`)}" alt="${opt.label[state.language]??opt.value}" draggable="false"/></button>`).join('');
  return `${items}${items}${items}`;
}
function renderBackCarousel(comboId){
  return `<div class="cardback-carousel" data-carousel="${comboId}"><button class="carousel-btn prev" type="button" data-carousel-dir="prev" aria-label="${t('carouselPrev')}">‹</button><div class="option-combo cardback-combo cardback-track" id="${comboId}" data-carousel-track="1"><div class="cardback-rail">${renderBackCarouselItems()}</div></div><button class="carousel-btn next" type="button" data-carousel-dir="next" aria-label="${t('carouselNext')}">›</button></div>`;
}
const bindRoomTopMetaLayoutDom=createRoomTopMetaLayoutBinder();
const discardSizeObserverDom=createDiscardSizeObserver();
let homeCardbackZoomCleanup=null;
function clearHomeCardbackZoom(){
  if(typeof homeCardbackZoomCleanup==='function'){
    homeCardbackZoomCleanup();
  }
  homeCardbackZoomCleanup=null;
}
function showHomeCardbackZoom(previewEl,options={}){
  if(!(previewEl instanceof HTMLElement))return;
  if(state.screen!=='home'&&state.screen!=='config')return;
  clearHomeCardbackZoom();
  const rect=previewEl.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const initialValue=String(previewEl.closest?.('.combo-btn')?.getAttribute?.('data-value')||state.home.backColor||'red');
  const src=withBase(`card-assets/${backAssetFile(initialValue)}`);
  if(!src)return;
  let activeValue=initialValue;
  const ghost=document.createElement('img');
  ghost.className='cardback-zoom-ghost';
  ghost.src=src;
  ghost.alt=previewEl.getAttribute('alt')||t('cardBack');
  ghost.decoding='async';
  const backdrop=document.createElement('div');
  backdrop.className='cardback-zoom-backdrop';
  const controls=document.createElement('div');
  controls.className='cardback-zoom-controls';
  controls.innerHTML=`<button class="cardback-zoom-nav prev" type="button" aria-label="${t('carouselPrev')}"><svg class="cardback-zoom-nav-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M14.7 5.3a1 1 0 0 1 0 1.4L9.4 12l5.3 5.3a1 1 0 1 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0Z"/></svg></button><button class="cardback-zoom-nav next" type="button" aria-label="${t('carouselNext')}"><svg class="cardback-zoom-nav-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M9.3 18.7a1 1 0 0 1 0-1.4l5.3-5.3-5.3-5.3a1 1 0 1 1 1.4-1.4l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0Z"/></svg></button>`;
  const zoomMultiplier=Math.max(1,Number(options.zoomMultiplier)||1);
  const desiredW=Math.round(rect.width*zoomMultiplier);
  const desiredH=Math.round(rect.height*zoomMultiplier);
  const maxW=Math.round(window.innerWidth*0.9);
  const maxH=Math.round(window.innerHeight*0.9);
  const widthScale=Math.min(1,maxW/Math.max(1,desiredW));
  const heightScale=Math.min(1,maxH/Math.max(1,desiredH));
  const fitScale=Math.min(widthScale,heightScale);
  const targetW=Math.max(rect.width,Math.round(desiredW*fitScale));
  const targetH=Math.max(rect.height,Math.round(desiredH*fitScale));
  ghost.style.setProperty('--zoom-left',`${rect.left}px`);
  ghost.style.setProperty('--zoom-top',`${rect.top}px`);
  ghost.style.setProperty('--zoom-width',`${rect.width}px`);
  ghost.style.setProperty('--zoom-height',`${rect.height}px`);
  ghost.style.setProperty('--zoom-target-width',`${targetW}px`);
  ghost.style.setProperty('--zoom-target-height',`${targetH}px`);
  document.body.classList.add('cardback-zoom-open');
  document.body.appendChild(backdrop);
  document.body.appendChild(ghost);
  document.body.appendChild(controls);
  const applyBackColor=(value)=>{
    if(!value)return;
    activeValue=value;
    state.home.backColor=value;
    markComboActive('back-combo-left',value);
    markComboActive('back-combo-right',value);
    markComboActive('config-back-combo',value);
    const file=backAssetFile(value);
    ghost.src=withBase(`card-assets/${file}`);
  };
  const stepBackColor=(dir=1)=>{
    const idx=Math.max(0,BACK_OPTIONS.findIndex((opt)=>opt.value===activeValue));
    const nextIdx=(idx+dir+BACK_OPTIONS.length)%BACK_OPTIONS.length;
    applyBackColor(BACK_OPTIONS[nextIdx]?.value||activeValue);
  };
  let swipeStartX=0;
  let swipeStartY=0;
  let swipeMoved=false;
  const SWIPE_THRESHOLD=24;
  const SWIPE_VERTICAL_LIMIT=20;
  const handleControlsPointerDown=(ev)=>{
    if(!(ev.target instanceof Element))return;
    const nav=ev.target.closest('.cardback-zoom-nav');
    if(nav instanceof HTMLElement){
      ev.preventDefault();
      ev.stopPropagation();
      stepBackColor(nav.classList.contains('prev')?-1:1);
      swipeMoved=true;
      return;
    }
    swipeStartX=ev.clientX;
    swipeStartY=ev.clientY;
    swipeMoved=false;
  };
  const handleControlsPointerMove=(ev)=>{
    if(swipeMoved)return;
    const dx=ev.clientX-swipeStartX;
    const dy=ev.clientY-swipeStartY;
    if(Math.abs(dx)>=SWIPE_THRESHOLD&&Math.abs(dy)<=SWIPE_VERTICAL_LIMIT){
      ev.preventDefault();
      ev.stopPropagation();
      stepBackColor(dx<0?1:-1);
      swipeMoved=true;
    }
  };
  const handleControlsPointerUp=(ev)=>{
    if(swipeMoved)return;
    if(ev.target instanceof Element&&ev.target.closest('.cardback-zoom-nav'))return;
    dismiss();
  };
  controls.addEventListener('pointerdown',handleControlsPointerDown);
  controls.addEventListener('pointermove',handleControlsPointerMove);
  controls.addEventListener('pointerup',handleControlsPointerUp);
  requestAnimationFrame(()=>{
    ghost.classList.add('active');
    backdrop.classList.add('active');
    controls.classList.add('active');
  });
  const dismiss=()=>{
    document.removeEventListener('keydown',handleEsc,true);
    controls.removeEventListener('pointerdown',handleControlsPointerDown);
    controls.removeEventListener('pointermove',handleControlsPointerMove);
    controls.removeEventListener('pointerup',handleControlsPointerUp);
    ghost.classList.remove('active');
    backdrop.classList.remove('active');
    controls.classList.remove('active');
    window.setTimeout(()=>{
      ghost.remove();
      backdrop.remove();
      controls.remove();
      document.body.classList.remove('cardback-zoom-open');
    },120);
    homeCardbackZoomCleanup=null;
  };
  const handleEsc=(ev)=>{if(ev.key==='Escape')dismiss();};
  window.setTimeout(()=>{
    document.addEventListener('keydown',handleEsc,true);
  },0);
  homeCardbackZoomCleanup=dismiss;
}
const positionRoomTopMeta=()=>{
  positionRoomTopMetaDom();
  positionLandscapeSideStationsDom();
};
const bindRoomTopMetaLayout=()=>bindRoomTopMetaLayoutDom(positionRoomTopMeta);
const syncDiscardSizeFromHand=()=>syncDiscardSizeFromHandDom({state});
const syncLandscapeGameHandSizing=()=>syncLandscapeGameHandSizingDom();
const observeDiscardSize=()=>{
  const hand=document.querySelector('.action-strip .hand');
  if(!(hand instanceof HTMLElement))return;
  discardSizeObserverDom.observe(hand,()=>{
    syncLandscapeGameHandSizing();
    syncDiscardSizeFromHand();
  });
  syncLandscapeGameHandSizing();
  syncDiscardSizeFromHand();
  window.setTimeout(()=>{
    syncLandscapeGameHandSizing();
    syncDiscardSizeFromHand();
  },180);
};
function handleGameTopbarClick(ev){
  if(state.screen!=='game')return;
  const t=ev.target;
  if(!(t instanceof Element))return;
  const btn=t.closest?.('#game-intro-toggle,#score-guide-toggle,#game-lb-toggle,#game-log-fab');
  if(!btn)return;
  if(btn.id==='game-intro-toggle'){state.home.showIntro=true;render();return;}
  if(btn.id==='score-guide-toggle'){state.showScoreGuide=true;render();return;}
  if(btn.id==='game-lb-toggle'){state.home.showLeaderboard=true;refreshLeaderboard(true);render();return;}
  if(btn.id==='game-log-fab'){
    if(btn.getAttribute('data-ignore-click')==='1'){
      btn.setAttribute('data-ignore-click','0');
      return;
    }
    state.showLogSheet=!state.showLogSheet;
    render();
    return;
  }
}
const waitMs=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
function setSoundEnabled(on){
  const enabled=Boolean(on);
  if(enabled){
    sound.enabled=true;
    try{sound.ctx?.resume?.();}catch{}
    return;
  }
  resetCalloutPlaybackState();
  sound.enabled=false;
  try{sound.ctx?.suspend?.();}catch{}
}
function bindSoundToggle(sliderId){
  const slider=document.querySelector(`#${sliderId} .setting-slider`);
  if(!slider||typeof slider!=='object'||!('value' in slider))return;
  const sync=()=>{
    const enabled=Number(slider.value)>=1;
    setSoundEnabled(enabled);
    calloutVoiceMode=enabled?'auto':'off';
    slider.parentElement?.style.setProperty('--setting-index',enabled?'1':'0');
    document.querySelectorAll('.runtime-diagnostic-inline').forEach((el)=>{el.textContent=runtimeDiagnosticsText();});
  };
  slider.addEventListener('input',sync);
}
function bindCalloutDisplayToggle(sliderId){
  const slider=document.querySelector(`#${sliderId} .setting-slider`);
  if(!slider||typeof slider!=='object'||!('value' in slider))return;
  const sync=()=>{
    const enabled=Number(slider.value)>=1;
    calloutDisplayEnabled=enabled;
    slider.parentElement?.style.setProperty('--setting-index',enabled?'1':'0');
  };
  slider.addEventListener('input',sync);
}
function bindBackCarousel(comboId){
  const viewport=document.getElementById(comboId);
  if(!(viewport instanceof HTMLElement))return;
  if(viewport.dataset.carouselBound)return;
  viewport.dataset.carouselBound='1';
  const wrapper=viewport.closest('.cardback-carousel');
  if(!(wrapper instanceof HTMLElement))return;
  const rail=viewport.querySelector('.cardback-rail');
  if(!(rail instanceof HTMLElement))return;
  const optionCount=BACK_OPTIONS.length;
  const getButtons=()=>[...rail.querySelectorAll('.combo-btn')];
  const getSectionWidth=()=>{
    const buttons=getButtons();
    if(buttons.length<optionCount*2)return 0;
    const first=buttons[0];
    const last=buttons[optionCount-1];
    if(!(first instanceof HTMLElement)||!(last instanceof HTMLElement))return 0;
    return (last.offsetLeft+last.offsetWidth)-first.offsetLeft;
  };
  let offsetX=0;
  let dragActive=false;
  let dragMoved=false;
  let dragStartX=0;
  let dragStartY=0;
  let dragStartOffset=0;
  let velocity=0;
  let lastMoveAt=0;
  let lastMoveX=0;
  let momentumRaf=0;
  let snapTimer=0;
  let rafId=0;
  let pendingUpdate=false;
  let pendingMove=false;
  let pendingOffsetX=0;
  let rafMove=0;
  let lastSelectedValue='';
  let lastPreviewTapAt=0;
  let lastPreviewTapValue='';
  const normalizeOffset=()=>{
    const section=getSectionWidth();
    if(!section)return;
    while(offsetX<-section*2)offsetX+=section;
    while(offsetX>0)offsetX-=section;
  };
  const applyOffset=(animate=false)=>{
    rail.style.transition=animate?'transform 120ms cubic-bezier(.2,.8,.2,1)':'none';
    rail.style.transform=`translate3d(${offsetX}px,0,0)`;
  };
  const findNearestButton=(preferredValue='')=>{
    const buttons=getButtons();
    if(!buttons.length)return null;
    const centerX=viewport.clientWidth/2;
    let bestBtn=null;
    let bestDist=Infinity;
    buttons.forEach((btn)=>{
      if(!(btn instanceof HTMLElement))return;
      const btnValue=btn.getAttribute('data-value')||'';
      if(preferredValue&&btnValue!==preferredValue)return;
      const btnCenter=btn.offsetLeft+btn.offsetWidth/2+offsetX;
      const dist=Math.abs(btnCenter-centerX);
      if(dist<bestDist){
        bestDist=dist;
        bestBtn=btn;
      }
    });
    return bestBtn;
  };
  const updateSelectionFromOffset=(preferredValue='',forceScale=false)=>{
    const bestBtn=findNearestButton(preferredValue);
    const value=bestBtn?.getAttribute('data-value')||'';
    if(value&&value!==lastSelectedValue){
      state.home.backColor=value;
      markComboActive('back-combo-left',value);
      markComboActive('back-combo-right',value);
      markComboActive('config-back-combo',value);
      lastSelectedValue=value;
      forceScale=true;
    }
    if(forceScale&&value){
      const buttons=getButtons();
      buttons.forEach((btn)=>{
        const btnValue=btn.getAttribute('data-value');
        const isSelected=btnValue===value;
        const scale=isSelected?1:0.86;
        btn.style.transform=`scale(${scale})`;
      });
    }
  };
  const scheduleSelectionUpdate=(forceScale=false)=>{
    pendingUpdate=true;
    if(rafId)return;
    rafId=requestAnimationFrame(()=>{
      rafId=0;
      if(!pendingUpdate)return;
      pendingUpdate=false;
      updateSelectionFromOffset('',forceScale);
    });
  };
  const scheduleOffsetApply=()=>{
    pendingMove=true;
    if(rafMove)return;
    rafMove=requestAnimationFrame(()=>{
      rafMove=0;
      if(!pendingMove)return;
      pendingMove=false;
      offsetX=pendingOffsetX;
      normalizeOffset();
      applyOffset(false);
      scheduleSelectionUpdate(false);
    });
  };
  const snapToNearest=()=>{
    updateSelectionFromOffset('',true);
    const target=findNearestButton(state.home.backColor);
    if(target)centerToButton(target,true,state.home.backColor);
  };
  const stopMomentum=()=>{
    if(momentumRaf){
      cancelAnimationFrame(momentumRaf);
      momentumRaf=0;
    }
  };
  const startMomentum=()=>{
    stopMomentum();
    let lastFrame=performance.now();
    const step=(now)=>{
      const dt=Math.min(32,now-lastFrame);
      lastFrame=now;
      offsetX+=velocity*dt;
      velocity*=0.94;
      normalizeOffset();
      applyOffset(false);
      scheduleSelectionUpdate(false);
      if(Math.abs(velocity)<0.02){
        momentumRaf=0;
        snapToNearest();
        return;
      }
      momentumRaf=requestAnimationFrame(step);
    };
    momentumRaf=requestAnimationFrame(step);
  };
  const centerToButton=(btn,animate=true,preferredValue='',allowNormalize=false)=>{
    if(!(btn instanceof HTMLElement))return;
    if(snapTimer){
      window.clearTimeout(snapTimer);
      snapTimer=0;
    }
    const centerX=viewport.clientWidth/2;
    const btnCenter=btn.offsetLeft+btn.offsetWidth/2;
    offsetX=centerX-btnCenter;
    if(allowNormalize)normalizeOffset();
    applyOffset(animate);
    updateSelectionFromOffset(preferredValue);
    if(animate&&preferredValue){
      snapTimer=window.setTimeout(()=>{
        centerToMiddleValue(preferredValue);
        snapTimer=0;
      },190);
    }
  };
  const centerToIndex=(index,animate=true,allowNormalize=false)=>{
    const buttons=getButtons();
    const btn=buttons[index];
    if(btn)centerToButton(btn,animate,'',allowNormalize);
  };
  const centerToMiddleValue=(value)=>{
    const buttons=getButtons();
    if(!buttons.length)return;
    const middleIndex=buttons.findIndex((btn,idx)=>idx>=optionCount&&idx<optionCount*2&&btn.getAttribute('data-value')===value);
    if(middleIndex>=0)centerToIndex(middleIndex,false,true);
  };
  const centerToValue=(value,animate=true)=>{
    const buttons=getButtons();
    if(!buttons.length)return;
    const centerX=viewport.clientWidth/2;
    let bestBtn=null;
    let bestDelta=Infinity;
    buttons.forEach((btn)=>{
      if(btn.getAttribute('data-value')!==value)return;
      const btnCenter=btn.offsetLeft+btn.offsetWidth/2;
      const targetOffset=centerX-btnCenter;
      const delta=Math.abs(targetOffset-offsetX);
      if(delta<bestDelta){
        bestDelta=delta;
        bestBtn=btn;
      }
    });
    if(bestBtn)centerToButton(bestBtn,animate,value);
  };
  const getNextValue=(dir)=>{
    const current=state.home.backColor;
    const currentIndex=BACK_OPTIONS.findIndex((opt)=>opt.value===current);
    if(currentIndex<0)return BACK_OPTIONS[0]?.value;
    const delta=dir==='prev'?-1:1;
    const nextIndex=(currentIndex+delta+optionCount)%optionCount;
    return BACK_OPTIONS[nextIndex]?.value;
  };
  wrapper.querySelector('[data-carousel-dir="prev"]')?.addEventListener('click',()=>{
    if(dragActive)return;
    const nextValue=getNextValue('prev');
    if(!nextValue)return;
    centerToValue(nextValue,true);
  });
  wrapper.querySelector('[data-carousel-dir="next"]')?.addEventListener('click',()=>{
    if(dragActive)return;
    const nextValue=getNextValue('next');
    if(!nextValue)return;
    centerToValue(nextValue,true);
  });
  viewport.addEventListener('pointerdown',(ev)=>{
    if(!(ev.target instanceof HTMLElement))return;
    const onCard=ev.target.closest?.('.combo-btn');
    if(!onCard)return;
    if(ev.pointerType==='mouse'&&!isMobilePointer())return;
    viewport.setPointerCapture?.(ev.pointerId);
    stopMomentum();
    dragActive=true;
    dragMoved=false;
    dragStartX=ev.clientX;
    dragStartY=ev.clientY;
    dragStartOffset=offsetX;
    lastMoveAt=performance.now();
    lastMoveX=ev.clientX;
    velocity=0;
    applyOffset(false);
    if(snapTimer){
      window.clearTimeout(snapTimer);
      snapTimer=0;
    }
  });
  viewport.addEventListener('pointermove',(ev)=>{
    if(!dragActive)return;
    const dx=ev.clientX-dragStartX;
    const dy=Math.abs(ev.clientY-dragStartY);
    if(Math.abs(dx)>6||dy>6)dragMoved=true;
    const now=performance.now();
    const dt=Math.max(8,now-lastMoveAt);
    const stepX=ev.clientX-lastMoveX;
    velocity=velocity*0.8+(stepX/dt)*0.2;
    lastMoveAt=now;
    lastMoveX=ev.clientX;
    pendingOffsetX=dragStartOffset+dx;
    scheduleOffsetApply();
  });
  const endDrag=()=>{
    if(!dragActive)return;
    dragActive=false;
    if(pendingMove){
      offsetX=pendingOffsetX;
      normalizeOffset();
      applyOffset(false);
      pendingMove=false;
    }
    if(dragMoved&&Math.abs(velocity)>0.02){
      startMomentum();
      return;
    }
    snapToNearest();
  };
  viewport.addEventListener('pointerup',endDrag,{passive:true});
  viewport.addEventListener('pointercancel',endDrag,{passive:true});
  viewport.addEventListener('pointerleave',endDrag,{passive:true});
  viewport.addEventListener('click',(ev)=>{
    if(dragMoved)return;
    if(!(ev.target instanceof HTMLElement))return;
    const preview=ev.target.closest?.('.combo-back-preview');
    if(!preview)return;
    const btn=preview.closest?.('.combo-btn');
    if(!(btn instanceof HTMLElement))return;
    const value=btn.getAttribute('data-value');
    if(!value)return;
    state.home.backColor=value;
    markComboActive('back-combo-left',value);
    markComboActive('back-combo-right',value);
    markComboActive('config-back-combo',value);
    centerToMiddleValue(value);
    if(state.screen==='home'){
      if(!isMobilePointer())return;
      if((ev.detail||0)>=2){
        requestAnimationFrame(()=>{
          const selectedBtn=viewport.querySelector(`.combo-btn.active[data-value="${value}"]`);
          const selectedPreview=selectedBtn?.querySelector?.('.combo-back-preview');
          showHomeCardbackZoom(selectedPreview instanceof HTMLElement?selectedPreview:preview,{zoomMultiplier:6});
        });
        return;
      }
      const now=Date.now();
      const isDoubleTap=lastPreviewTapValue===value&&(now-lastPreviewTapAt)<320;
      lastPreviewTapAt=now;
      lastPreviewTapValue=value;
      if(!isDoubleTap)return;
      requestAnimationFrame(()=>{
        const selectedBtn=viewport.querySelector(`.combo-btn.active[data-value="${value}"]`);
        const selectedPreview=selectedBtn?.querySelector?.('.combo-back-preview');
        showHomeCardbackZoom(selectedPreview instanceof HTMLElement?selectedPreview:preview,{zoomMultiplier:6});
      });
    }
  });
  viewport.addEventListener('dblclick',(ev)=>{
    if(!(ev.target instanceof HTMLElement))return;
    const preview=ev.target.closest?.('.combo-back-preview');
    if(!(preview instanceof HTMLElement))return;
    const btn=preview.closest?.('.combo-btn');
    const value=String(btn?.getAttribute?.('data-value')||state.home.backColor||'red');
    state.home.backColor=value;
    markComboActive('back-combo-left',value);
    markComboActive('back-combo-right',value);
    markComboActive('config-back-combo',value);
    centerToMiddleValue(value);
    window.setTimeout(()=>{
      const selectedBtn=viewport.querySelector(`.combo-btn.active[data-value="${value}"]`);
      const selectedPreview=selectedBtn?.querySelector?.('.combo-back-preview');
      showHomeCardbackZoom(selectedPreview instanceof HTMLElement?selectedPreview:preview,{zoomMultiplier:6});
    },120);
  });
  viewport.addEventListener('dragstart',(ev)=>{
    ev.preventDefault();
  });
  requestAnimationFrame(()=>{
    centerToMiddleValue(state.home.backColor);
    updateSelectionFromOffset(state.home.backColor,true);
  });
}
function bindEmoteDisplayToggle(sliderId){
  const slider=document.querySelector(`#${sliderId} .setting-slider`);
  if(!slider||typeof slider!=='object'||!('value' in slider))return;
  const sync=()=>{
    const enabled=Number(slider.value)>=1;
    emoteDisplayEnabled=enabled;
    slider.parentElement?.style.setProperty('--setting-index',enabled?'1':'0');
  };
  slider.addEventListener('input',sync);
}
function bindVibrateToggle(sliderId){
  const slider=document.querySelector(`#${sliderId} .setting-slider`);
  if(!slider||typeof slider!=='object'||!('value' in slider))return;
  const sync=()=>{
    const enabled=Number(slider.value)>=1;
    vibrateEnabled=enabled;
    slider.parentElement?.style.setProperty('--setting-index',enabled?'1':'0');
  };
  slider.addEventListener('input',sync);
}
function difficultyIndex(value){
  if(value==='easy')return 0;
  if(value==='hard')return 2;
  return 1;
}
function difficultySliderHtml(id,value,t){
  const diffIndex=difficultyIndex(value);
  return `<div class="difficulty-slider-wrap" id="${id}" style="--difficulty-index:${diffIndex};"><input class="difficulty-slider" type="range" min="0" max="2" step="1" value="${diffIndex}" aria-label="${t('ai')}"><div class="difficulty-slider-labels" aria-hidden="true"><span>${t('easy')}</span><span>${t('normal')}</span><span>${t('hard')}</span></div></div>`;
}
function renderHome(){
  const intro=introText();
  const signedIn=signedInForPlay();
  const inRoom=Boolean(state.room.id);
  const joinOpen=Boolean(state.room.joinOpen);
  if(!joinOpen&&state.room.lobbyRefreshTimer){
    window.clearInterval(state.room.lobbyRefreshTimer);
    state.room.lobbyRefreshTimer=0;
  }
  state.room.joinOpenWasOpen=joinOpen;
  const roomData=state.room.data;
  if(inRoom&&roomData&&String(roomData.status)==='playing'&&roomData.game){
    applyRoomGameSnapshot(roomData);
    return;
  }
  const roomPlayers=Array.isArray(roomData?.players)?roomData.players:[];
  const roomUid=currentRoomPlayerId();
  const derivedHostId=String(roomData?.hostId||roomPlayers[0]?.uid||'');
  const roomIsHost=derivedHostId&&String(derivedHostId)===roomUid;
  const roomHumanPlayers=roomPlayers.filter((p)=>String(p.uid||'').startsWith('uid:')||String(p.uid||'').startsWith('guest:'));
  const roomCanStart=roomHumanPlayers.length>=2;
  const roomPrivate=Boolean(roomData?.isPrivate);
  const roomStatus=String(roomData?.status??'');
  const roomStarting=roomStatus==='starting';
  const roomGamePlayers=(roomStatus==='finished'&&Array.isArray(roomData?.game?.players))?roomData.game.players:null;
  const roomSeatMap=new Map(roomPlayers.map((p)=>[Number(p.seat),p]));
  const gameSeatMap=roomGamePlayers?new Map(roomGamePlayers.map((p,i)=>[Number.isFinite(Number(p?.seat))?Number(p.seat):i,p])):null;
  const useGameRoster=roomStatus==='finished'&&Boolean(gameSeatMap);
  const roomStartPending=Boolean(state.room.pendingStart);
  if(state.home.avatarChoice==='google'){
    state.home.avatarChoice=state.home.gender==='female'?'female':'male';
  }
  const allowOpponents=location.hash==='#opponents';
  if(state.home.showLeaderboard)refreshLeaderboard();
  const homeAvatarSrc=selfAvatarDataUri(state.home.name,'#7aaed8',state.home.gender);
  const cardBackLeft=`<label class="field field-cardback field-cardback-left"><span>${t('cardBack')}</span>${renderBackCarousel('back-combo-left')}</label>`;
  const cardBackRight=`<label class="field field-cardback field-cardback-right"><span>${t('cardBack')}</span>${renderBackCarousel('back-combo-right')}</label>`;
  const aiFieldLeft=`<label class="field field-ai field-ai-left"><span>${t('ai')}</span>${difficultySliderHtml('difficulty-slider-left',state.home.aiDifficulty,t)}</label>`;
  const aiFieldRight=`<label class="field field-ai field-ai-right"><span>${t('ai')}</span>${difficultySliderHtml('difficulty-slider-right',state.home.aiDifficulty,t)}</label>`;
  const roomErrorHtml=state.room.error?`<div class="hint room-error">${esc(state.room.error)}</div>`:'';
  const loginHint=t('loginToStart');
  const roomLobbyBtnCore=inRoom?'':`<button id="room-lobby-open" class="secondary royal-room-btn" ${signedIn?'':'disabled'}>${t('roomEnter')}</button>`;
  const roomButtonsHtml=roomLobbyBtnCore
    ?(signedIn
      ?roomLobbyBtnCore
      :`<span class="locked-btn">${roomLobbyBtnCore}<span class="locked-tip">${esc(loginHint)}</span></span>`)
    :'';
  const roomSeats=[0,1,2,3].map((seat)=>{
    const seatLabel=t('seatLabel').replace('{{n}}',String(seat+1));
    const seatData=resolveLobbySeatDisplayData({
      seat,
      roomSeatMap,
      gameSeatMap,
      roomStatus,
      useGameRoster,
      derivedHostId,
      state,
      playerColorByViewClass,
      authPictureUrlFrom,
      avatarDataUri
    });
    if(!seatData){
      return`<div class="lobby-seat empty"><div class="lobby-seat-avatar empty">+</div><div class="lobby-seat-name">${t('roomSeatOpen')}</div><div class="lobby-seat-label">${seatLabel}</div></div>`;
    }
    const {entryName,avatarSrc,isHost,offline,displayName}=seatData;
    const hostBadge=isHost?`<span class="lobby-seat-host-badge">🚩</span>`:'';
    const nameHtml=`<div class="lobby-seat-name">${displayName?esc(displayName):'&nbsp;'}</div>`;
    return`<div class="lobby-seat ${isHost?'host':''} ${offline?'offline':''}">
      <span class="lobby-seat-avatar-wrap"><img class="lobby-seat-avatar" src="${avatarSrc}" alt="${esc(entryName)}"/>${hostBadge}</span>
      ${nameHtml}
      <div class="lobby-seat-label">${seatLabel}</div>
    </div>`;
  }).join('');
  const roomPrivacyRow=roomIsHost
    ?`<div class="room-privacy-row"><span>${t('roomPrivacy')}</span>
        <div class="option-combo toggle-combo" id="room-privacy-toggle">
          <button class="combo-btn toggle-btn ${roomPrivate?'':'active'}" data-private="0">${t('roomPublic')}</button>
          <button class="combo-btn toggle-btn ${roomPrivate?'active':''}" data-private="1">🔑 ${t('roomPrivate')}</button>
        </div>
      </div>`
    :'';
  const roomStartControl=roomIsHost
    ?`${`<button id="room-start" class="primary" ${(roomStarting||!roomCanStart||roomStartPending)?'disabled':''}>${t('roomStart')}</button>`}${roomStartPending?`<span class="hint">${t('roomSending')}</span>`:roomStarting?`<span class="hint">${t('roomStarting')}</span>`:(!roomStarting&&!roomCanStart)?`<span class="hint">${t('roomNeedPlayers')}</span>`:''}`
    :`<span class="hint">${roomStarting?t('roomStarting'):t('roomWaitingHost')}</span>`;
  const roomPendingHint='';
  const roomTitle=t('roomTableTitle');
  const roomLobbyCountdown=(inRoom&&roomStatus!=='playing'&&state.room.data)?roomCountdownText(state.room.data):'';
  const roomLobbyHtml=renderRoomLobbyOverlay({
    visible:inRoom&&roomStatus!=='playing',
    roomTitle,
    roomCode:state.room.code,
    roomLobbyCountdown,
    roomPrivacyRow,
    roomSeats,
    roomErrorHtml,
    roomStartControl,
    roomPendingHint,
    roomStarting,
    t,
    esc
  });
  const activeRoomsState=state.home.activeRooms;
  const activeRooms=Array.isArray(activeRoomsState?.rows)?activeRoomsState.rows:[];
  const hiddenCount=Number(state.home.activeRooms.hiddenCount)||0;
  const roomJoinModal=renderRoomJoinOverlay({
    visible:!inRoom&&state.room.joinOpen,
    activeRooms,
    activeRoomsLoading:Boolean(activeRoomsState?.loading),
    hiddenCount,
    roomErrorHtml,
    t,
    esc,
    isRoomPlayerHuman,
    authPictureUrlFrom,
    avatarDataUri
  });
  const soloBtnCore=`<button id="solo-start" class="primary royal-start-btn" ${signedIn?'':'disabled'}>${t('solo')}</button>`;
  const soloBtnHtml=signedIn
    ?soloBtnCore
    :`<span class="locked-btn">${soloBtnCore}<span class="locked-tip">${esc(loginHint)}</span></span>`;
  app.innerHTML=renderHomeMarkup({
    intro,
    allowOpponents,
    renderLangMenu,
    withBase,
    homeAvatarSrc,
    esc,
    state,
    t,
    aiFieldLeft,
    cardBackLeft,
    aiFieldRight,
    soundEnabled:Boolean(sound.enabled),
    calloutDisplayEnabled:Boolean(calloutDisplayEnabled),
    emoteDisplayEnabled:Boolean(emoteDisplayEnabled),
    vibrateEnabled:Boolean(vibrateEnabled),
    moreSettingsOpen:Boolean(state.home.showMoreSettings),
    cardBackRight,
    soloBtnHtml,
    roomButtonsHtml,
    mainPageLegalMiniHtml:mainPageLegalMiniHtml(),
    roomLobbyHtml,
    roomJoinModal,
    introPanelHtml:state.home.showIntro?introPanelHtml():'',
    leaderboardModalHtml:state.home.showLeaderboard?leaderboardModalHtml():'',
    scoreGuideModalHtml:state.showScoreGuide?scoreGuideModalHtml():''
  });

  bindLangMenu(document.querySelector('.royal-head-actions'),{reloadGoogle:!state.home.google?.signedIn});
  bindHomeEvents({
    state,
    joinOpen,
    render,
    refreshLeaderboard,
    signedInForPlay,
    signedInWithEmail,
    markComboActive,
    saveGoogleSession,
    difficultyIndex,
    backOptions:BACK_OPTIONS,
    bindBackCarousel,
    bindSoundToggle,
    bindCalloutDisplayToggle,
    bindEmoteDisplayToggle,
    bindVibrateToggle,
    setRoomError,
    t,
    loadActiveRooms,
    createRoom,
    joinRoomByCode,
    resetRoomExpiryTo60s,
    leaveRoom,
    roomIsHost,
    setRoomPrivacy,
    pendingStartTimerRef:{
      get:()=>roomStartPendingTimer,
      set:(value)=>{roomStartPendingTimer=value;}
    },
    runPopunderAd,
    syncLeaderboardProfile,
    currentLeaderboardIdentity,
    waitMs,
    startRoom,
    guardAction,
    unlockAudio,
    initFirebaseIfReady,
    startSoloGame,
    armPopunderForGesture,
    schedulePopunderAfterRender,
    legalMiniCopy
  });
  onGoogleScriptLoaded(renderGoogleInline);
}
function renderConfig(){
  const diffIndex=difficultyIndex(state.home.aiDifficulty);
  app.innerHTML=renderConfigMarkup({
    diffIndex,
    renderLangMenu,
    state,
    t,
    soundEnabled:Boolean(sound.enabled),
    calloutDisplayEnabled:Boolean(calloutDisplayEnabled),
    emoteDisplayEnabled:Boolean(emoteDisplayEnabled),
    renderBackCarousel
  });
  bindLangMenu(document.querySelector('.topbar-right'),{reloadGoogle:!state.home.google?.signedIn});
  bindConfigEvents({
    state,
    render,
    markComboActive,
    difficultyIndex,
    backOptions:BACK_OPTIONS,
    bindBackCarousel,
    bindSoundToggle,
    bindCalloutDisplayToggle,
    bindEmoteDisplayToggle
  });
}
function resolveLobbySeatDisplayData({seat,roomSeatMap,gameSeatMap,roomStatus,useGameRoster,derivedHostId,state,playerColorByViewClass,authPictureUrlFrom,avatarDataUri}){
  const roomEntry=roomSeatMap.get(seat)||null;
  const gameEntry=gameSeatMap?gameSeatMap.get(seat)||null:null;
  const entry=useGameRoster?(gameEntry||roomEntry):roomEntry;
  if(!entry)return null;
  const resolvedSeat=useGameRoster?entry:resolveRoomSeatProfile({name:entry.name,state});
  const entryName=String(entry.name||'');
  const entryGender=String(entry.gender||(useGameRoster?null:roomEntry?.gender)||resolvedSeat?.gender||'male')==='female'?'female':'male';
  const entryPicture=String(useGameRoster?entry.picture:(entry.picture||resolvedSeat?.picture)||'').trim();
  const isBot=useGameRoster?(!entry.isHuman):(!roomEntry?false:!isRoomPlayerHuman(roomEntry));
  const avatarColor=isBot?playerColorByViewClass(seatCls[seat]||'south'):'#7aaed8';
  const avatarSrc=resolveAvatarSrc({
    picture:entryPicture,
    name:entryName,
    color:avatarColor,
    gender:entryGender,
    isBot,
    authPictureUrlFrom,
    avatarDataUri
  });
  const isHost=String(entry.uid)===String(derivedHostId);
  const lastSeen=Number(roomEntry?.lastSeen)||0;
  const offline=roomStatus==='playing'&&lastSeen>0&&(Date.now()-lastSeen>ROOM_OFFLINE_MS);
  return{
    entryName,
    avatarSrc,
    isHost,
    offline,
    displayName:roomStatus==='finished'?'':entryName
  };
}
function renderOpponents(){
  const seen=new Set();
  const bots=BOT_PROFILE_POOL.filter((b)=>{
    if(seen.has(b.name))return false;
    seen.add(b.name);
    return true;
  });
  const cards=bots.map((b)=>{
    const link=resolveAvatarSrc({
      picture:'',
      name:b.name,
      color:'#7aaed8',
      gender:b.gender,
      isBot:true,
      authPictureUrlFrom,
      avatarDataUri
    });
    const profile=OPPONENT_PROFILE_BY_NAME[b.name]??{dob:'-',hobbies:{},profile:{}};
    const hobbies=profileFieldValue(profile,'hobbies',[]);
    const hobbyText=formatHobbyList(hobbies);
    const profileText=profileFieldValue(profile,'profile','-');
    const profileHtml=profileParagraphsHtml(profileText);
    const zodiacTextRaw=profileFieldValue(profile,'zodiac','-');
    const zodiacText=PROFILE_ZODIAC_TRANSLATIONS[state.language]?.[zodiacTextRaw]??zodiacTextRaw;
    const zodiacMark=zodiacSymbol(zodiacText);
    const mottoText=profileFieldValue(profile,'motto','-');
  const genderLabel=b.gender==='female'?t('female'):t('male');
    const genderClass=b.gender==='female'?'gender-female':'gender-male';
    return renderOpponentCard({
      link,
      name:b.name,
      genderClass,
      genderLabel,
      zodiacLabel:t('zodiac'),
      zodiacMark,
      zodiacText,
      dobLabel:t('dob'),
      dob:profile.dob,
      hobbiesLabel:t('hobbies'),
      hobbyText,
      mottoText,
      profileLabel:t('profile'),
      profileHtml,
      esc
    });
  }).join('');
  app.innerHTML=renderOpponentsMarkup({
    heading:t('opponents'),
    homeLabel:t('home'),
    renderLangMenu,
    cardsHtml:cards
  });
  bindOpponentsEvents({
    state,
    render
  });
  bindLangMenu(document.querySelector('.topbar-right'),{reloadGoogle:!state.home.google?.signedIn});
}
function opponentProfileModalHtml(name){
  const {
    profile,
    roomSeatProfile,
    hasProfileCard,
    gender,
    avatarSrc
  }=resolveOpponentProfileModalState({
    name,
    state,
    opponentProfiles:OPPONENT_PROFILE_BY_NAME,
    botGenderByName,
    authPictureUrlFrom,
    avatarDataUri
  });
  const hobbies=profileFieldValue(profile,'hobbies',[]);
  const hobbyText=formatHobbyList(hobbies);
  const profileText=profileFieldValue(profile,'profile','-');
  const profileHtml=profileParagraphsHtml(profileText);
  const zodiacTextRaw=profileFieldValue(profile,'zodiac','-');
  const zodiacText=PROFILE_ZODIAC_TRANSLATIONS[state.language]?.[zodiacTextRaw]??zodiacTextRaw;
  const zodiacMark=zodiacSymbol(zodiacText);
  const mottoText=profileFieldValue(profile,'motto','-');
  const genderLabel=gender==='female'?t('female'):t('male');
  const genderClass=gender==='female'?'gender-female':'gender-male';
  const avatarStampHtml=!hasProfileCard&&Boolean(roomSeatProfile)
    ?renderConfidentialStamp({text:t('confidential'),esc,classes:'opponent-profile-confidential-stamp'})
    :'';
  const closeLabel=t('close');
  return renderOpponentProfileModal({
    name,
    closeLabel,
    genderClass,
    genderLabel,
    avatarSrc,
    avatarStampHtml,
    zodiacLabel:t('zodiac'),
    zodiacMark,
    zodiacText,
    dobLabel:t('dob'),
    dob:profile.dob,
    hobbiesLabel:t('hobbies'),
    hobbyText,
    mottoLabel:t('motto'),
    mottoText,
    profileLabel:t('profile'),
    profileHtml,
    esc
  });
}
function renderGame(){
  const v=buildView();
  if(!v){state.screen='home';renderHome();return;}
  const intro=introText();
  const rightSidebarDesktop=window.matchMedia('(min-width: 1081px)').matches;
  const rightSidebarMobileLandscape=window.matchMedia('(max-width: 860px) and (orientation: landscape)').matches;
  const rightSidebarTabletLandscape=window.matchMedia('(min-width: 861px) and (max-width: 1080px) and (orientation: landscape)').matches;
  const fullHeightLogLayout=rightSidebarDesktop||rightSidebarMobileLandscape||rightSidebarTabletLandscape;
  const logUnderSouthPanel=window.matchMedia('(max-width: 1080px)').matches&&!rightSidebarMobileLandscape&&!rightSidebarTabletLandscape;
  if(!state.logTouched){
    state.showLog=logUnderSouthPanel?false:fullHeightLogLayout;
  }
  if(fullHeightLogLayout)state.showLog=true;
  if(!v.canControl||v.gameOver){state.recommendation=null;}
  if(state.recommendation?.action==='play'){
    const inHand=state.recommendation.cardIds.every((id)=>v.hand.some((c)=>cardId(c)===id));
    if(!inHand)state.recommendation=null;
  }
  const arr=v.participants.map((p)=>{
    const vi=seatView(p.seat,v.selfSeat);
    return{...p,rawName:p.name,name:botDisplay(p.name,p.isBot),viewIndex:vi,cls:seatCls[vi]};
  }).sort((a,b)=>a.viewIndex-b.viewIndex);
  const selected=v.hand.filter((c)=>state.selected.has(cardId(c)));
  const selEv=selected.length?evaluatePlay(selected):null;
  const canPlay=v.canControl&&selEv&&selEv.valid&&(!v.lastPlay||canBeat(selEv,v.lastPlay.eval))&&(!v.isFirstTrick||has3d(selected));
  const canAutoSort=!v.gameOver&&v.hand.length>0;
  const selfScoreValue=v.mode==='solo'
    ?(state.solo.totals?.[0]??currentHumanScoreValue())
    :(state.solo.totals?.[v.selfSeat]??currentHumanScoreValue());
  const roundWinsBySeat=Array.isArray(v.roundWins)&&v.roundWins.length===4
    ?v.roundWins.map((vv)=>Number(vv)||0)
    :[0,0,0,0];
  const roundWinsChipHtml=(wins)=>`<span class="seat-round-wins" aria-label="${esc(t('roundWins'))}"><span class="seat-round-wins-icon" aria-hidden="true">✦</span><span>${Number(wins)||0}</span></span>`;
  const canSuggest=v.canControl;
  const showMust3Highlight=Boolean(v.canControl&&v.isFirstTrick&&!v.lastPlay&&has3d(v.hand)&&!has3d(selected));
  const self=arr.find((p)=>p.viewIndex===0);
  const youWin=Boolean(v.gameOver&&self&&self.count===0);
  const roomTopMetaTable=buildRoomMetaTableHtml({
    v,
    state,
    t,
    esc,
    roomCountdownText
  });
  const {
    emoteSeat,
    selfTableEmoteHtml,
    seatCalloutHtml,
    seatEmoteHtml,
    seatFoodCalloutHtml
  }=buildCalloutRenderState({
    v,
    state,
    t,
    esc,
    withBase,
    EMOTE_STICKERS,
    currentPlayTypeCall,
    currentPassCall,
    currentMust3Call,
    currentLastCardSeat,
    playTypeCallState,
    passCallState,
    must3CallState,
    lastCardCallState,
    calloutDisplayEnabled,
    emoteDisplayEnabled,
    calloutJitterStyle
  });
  const lastActions=lastActionBySeat(v.history);
  const playKey=v.lastPlay?`${v.lastPlay.seat}-${v.lastPlay.cards.map(cardId).join(',')}`:'';
  if(playKey&&state.playAnimKey!==playKey)state.playAnimKey=playKey;
  const roomData=state.home.mode==='room'?state.room.data:null;
  const hostSeat=(()=>{
    if(!roomData)return null;
    const hostId=String(roomData.hostId||'').trim();
    if(!hostId)return null;
    const players=Array.isArray(roomData.players)?roomData.players:[];
    const host=players.find((p)=>String(p?.uid||'')===hostId);
    const seat=Number(host?.seat);
    return Number.isFinite(seat)?seat:null;
  })();
  const seatHtml=buildOpponentSeatsHtml({
    arr,
    v,
    t,
    esc,
    state,
    hostSeat,
    emoteSeat,
    lastActions,
    roundWinsBySeat,
    TABLE_PLAY_SCALE,
    renderOpponentSeats,
    renderOpponentSeat,
    renderOpponentLabel,
    renderOpponentStationFlow,
    renderStaticCard,
    renderBackCards,
    withBase,
    playerColorByViewClass,
    authPictureUrlFrom,
    avatarDataUri,
    profileFieldValue,
    OPPONENT_PROFILE_BY_NAME,
    hashTextSeed,
    roundWinsChipHtml,
    seatCalloutHtml,
    seatEmoteHtml,
    seatFoodCalloutHtml,
    avatarGenderClass,
    opponentFanStyleByName,
    seatLastActionHtml,
    isMobilePointer
  });
  const {
    selfScore,
    selfName,
    selfRoundWinsHtml,
    selfAvatar,
    selfCalloutHtml
  }=buildSelfRenderState({
    self,
    selfScoreValue,
    state,
    t,
    esc,
    hostSeat,
    roundWinsBySeat,
    v,
    AVATAR_BASE_SRC,
    authPictureUrl,
    selfAvatarDataUri,
    avatarGenderClass,
    playerColorByViewClass,
    roundWinsChipHtml,
    seatCalloutHtml,
    seatEmoteHtml
  });
  const {
    portraitMode,
    logSheetOpen,
    logToggleStateText,
    gameHistoryHtml,
    closeLabel,
    isRecPass,
    isRecEmpty,
    showRecommendHint,
    isRecPlay,
    emotePanel,
    handHtml
  }=buildGameAuxRenderState({
    state,
    v,
    t,
    esc,
    withBase,
    historyHtml,
    isPortraitMode,
    EMOTE_STICKERS,
    renderHandCard,
    cardId,
    showMust3Highlight,
    isLowestSingle
  });
  const logSheetHtml=renderGameLogSheet({
    logSheetOpen,
    closeLabel,
    historyHtml:gameHistoryHtml,
    t
  });
  const sideZoneHtml=renderGameSideZone({
    portraitMode,
    logToggleStateText,
    historyHtml:gameHistoryHtml,
    t,
    esc
  });
  const gameTopbarHtml=renderGameTopbar({
    renderLangMenu,
    introButtonLabel:intro.btnShow,
    t,
    esc,
    withBase
  });
  const gameActionZoneHtml=renderGameActionZone({
    canControl:v.canControl,
    gameOver:v.gameOver,
    playerColor:playerColorByViewClass('south'),
    selfAvatar,
    selfName,
    selfScore,
    selfRoundWinsHtml,
    selfCalloutHtml,
    isRecPlay,
    canPlay,
    isRecPass,
    canPass:v.canPass,
    canSuggest,
    showRecommendHint,
    isRecEmpty,
    recommendHint:state.recommendHint,
    t,
    esc,
    canAutoSort,
    emotePanel,
    handHtml
  });
  app.innerHTML=buildGameShellMarkup({
    v,
    youWin,
    state,
    t,
    roomTopMetaTable,
    seatHtml,
    lastActions,
    selfTableEmoteHtml,
    sideZoneHtml,
    gameTopbarHtml,
    gameActionZoneHtml,
    renderGameTable,
    renderGameShell,
    centerMovesHtml,
    centerLastMovesHtml,
    withBase,
    congratsOverlayHtml,
    revealHtml:(view)=>revealHtml(view,arr),
    resultScreenHtml:(view)=>resultScreenHtml(view,arr),
    opponentProfileModalHtml,
    scoreGuideModalHtml,
    introPanelHtml,
    leaderboardModalHtml
  });
  runGamePostRender({
    app,
    state,
    t,
    v,
    arr,
    portraitMode,
    logSheetOpen,
    logSheetHtml,
    bindGameEvents,
    positionRoomTopMeta,
    bindRoomTopMetaLayout,
    observeDiscardSize,
    syncConfettiCanvases,
    syncLandscapeGameHandSizing,
    syncDiscardSizeFromHand,
    syncHandStackMode,
    retargetCalloutTails,
    maybeRunRoomAi
  });
}
const retargetCalloutTails=()=>retargetCalloutTailsDom({
  isMobilePointer
});
const syncHandStackMode=()=>syncHandStackModeDom();
const confettiStates=new Map();
const CONFETTI_COLORS=['#f39c12','#e74c3c','#9b59b6','#3498db','#2ecc71','#f1c40f','#ff7aa2','#66d1ff'];
const CONFETTI_COUNT=160;
function createConfettiParticle(w,h){
  const size=Math.random()*10+6;
  return{
    x:Math.random()*w,
    y:Math.random()*h-h,
    size,
    color:CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)],
    speedX:Math.random()*1.8-0.9,
    speedY:Math.random()*3.4+1.6,
    rotation:Math.random()*360,
    rotationSpeed:Math.random()*6+3,
    opacity:Math.random()*0.45+0.55,
    swaySeed:Math.random()*Math.PI*2
  };
}
function syncConfettiCanvasSize(canvas,state){
  const ratio=window.devicePixelRatio||1;
  const w=Math.max(1,canvas.clientWidth);
  const h=Math.max(1,canvas.clientHeight);
  const targetW=Math.round(w*ratio);
  const targetH=Math.round(h*ratio);
  if(canvas.width!==targetW||canvas.height!==targetH){
    canvas.width=targetW;
    canvas.height=targetH;
    state.scale=ratio;
    state.width=w;
    state.height=h;
    state.ctx.setTransform(ratio,0,0,ratio,0,0);
  }
}
function startConfettiCanvas(canvas){
  if(confettiStates.has(canvas))return;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const state={
    canvas,
    ctx,
    width:canvas.clientWidth||1,
    height:canvas.clientHeight||1,
    scale:window.devicePixelRatio||1,
    particles:[],
    raf:0,
    last:performance.now()
  };
  for(let i=0;i<CONFETTI_COUNT;i+=1){
    state.particles.push(createConfettiParticle(state.width,state.height));
  }
  const tick=(now)=>{
    if(!canvas.isConnected){
      stopConfettiCanvas(canvas);
      return;
    }
    syncConfettiCanvasSize(canvas,state);
    const dt=Math.min(3,(now-state.last)/16.6667);
    state.last=now;
    const w=state.width;
    const h=state.height;
    ctx.clearRect(0,0,w,h);
    for(const p of state.particles){
      p.y+=p.speedY*dt;
      p.x+=p.speedX*dt+Math.sin((p.y/30)+p.swaySeed)*0.9*dt;
      p.rotation+=p.rotationSpeed*dt;
      if(p.y>h+20){
        const np=createConfettiParticle(w,h);
        p.x=np.x;
        p.y=-20;
        p.size=np.size;
        p.color=np.color;
        p.speedX=np.speedX;
        p.speedY=np.speedY;
        p.rotation=np.rotation;
        p.rotationSpeed=np.rotationSpeed;
        p.opacity=np.opacity;
        p.swaySeed=np.swaySeed;
      }
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate((p.rotation*Math.PI)/180);
      ctx.globalAlpha=p.opacity;
      ctx.fillStyle=p.color;
      ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size/1.6);
      ctx.restore();
    }
    state.raf=window.requestAnimationFrame(tick);
  };
  confettiStates.set(canvas,state);
  state.raf=window.requestAnimationFrame(tick);
}
function stopConfettiCanvas(canvas){
  const state=confettiStates.get(canvas);
  if(!state)return;
  if(state.raf)cancelAnimationFrame(state.raf);
  confettiStates.delete(canvas);
}
function syncConfettiCanvases(){
  const nodes=[...document.querySelectorAll('canvas.confetti-canvas')];
  const live=new Set(nodes);
  for(const canvas of confettiStates.keys()){
    if(!live.has(canvas))stopConfettiCanvas(canvas);
  }
  for(const canvas of nodes){
    startConfettiCanvas(canvas);
  }
}
function reorderCurrent(v,fromId,toId){
  const seat=Number.isInteger(v?.selfSeat)?v.selfSeat:0;
  if(!state.solo.players?.[seat])return;
  state.solo.players[seat].hand=reorderById(state.solo.players[seat].hand,fromId,toId,cardId);
}
function autoArrangeCurrent(v,mode='seq'){
  const seat=Number.isInteger(v?.selfSeat)?v.selfSeat:0;
  if(!state.solo.players?.[seat])return;
  state.solo.players[seat].hand=mode==='pattern'?patternSortCards(state.solo.players[seat].hand):[...state.solo.players[seat].hand].sort(cmpCard);
}

function isPortraitMode(){
  const query=window.matchMedia?.('(orientation: portrait)');
  if(query)return query.matches;
  return window.innerHeight>window.innerWidth;
}
function isPortraitLogSheetOpen(){
  if(state.screen!=='game'||!state.showLogSheet)return false;
  return isPortraitMode();
}
function syncLogFabPosition(){
  const logFab=document.getElementById('game-log-fab');
  if(!(logFab instanceof HTMLElement))return;
  let x=state.logFab?.x;
  let y=state.logFab?.y;
  if(!Number.isFinite(x)||!Number.isFinite(y))return;
  const viewW=Math.max(0,window.innerWidth||0);
  const viewH=Math.max(0,window.innerHeight||0);
  const lastW=Number(state.logFab?.vw||0);
  const lastH=Number(state.logFab?.vh||0);
  if(lastW>0&&lastH>0&&(lastW!==viewW||lastH!==viewH)){
    x=(x/lastW)*viewW;
    y=(y/lastH)*viewH;
  }
  const pad=8;
  const fabW=Math.max(0,logFab.offsetWidth||0);
  const fabH=Math.max(0,logFab.offsetHeight||0);
  if(!fabW||!fabH)return;
  const maxX=Math.max(0,viewW-fabW-pad);
  const maxY=Math.max(0,viewH-fabH-pad);
  const nx=Math.max(pad,Math.min(x,maxX));
  const ny=Math.max(pad,Math.min(y,maxY));
  state.logFab.x=nx;
  state.logFab.y=ny;
  state.logFab.vw=viewW;
  state.logFab.vh=viewH;
  logFab.style.left=`${nx}px`;
  logFab.style.top=`${ny}px`;
  logFab.style.right='auto';
  logFab.style.bottom='auto';
}
function render(){
  if(state.screen!=='home'){
    clearHomeCardbackZoom();
  }
  if(state.screen==='home'&&location.hash==='#opponents'){
    state.screen='opponents';
  }
  applyTheme();
  document.title=t('title');
  document.body.setAttribute('data-screen',state.screen);
  document.body.setAttribute('data-game-mode',state.home.mode==='room'?'room':'solo');
  document.body.setAttribute('data-ios',isIOSDevice()?'1':'0');
  document.body.setAttribute('data-is-mobile',isMobilePointer()?'1':'0');
  const blockLandscapeMobile=shouldBlockLandscapeMobile();
  if(state.screen!=='game'||blockLandscapeMobile){
    serviceBellController.sync({active:false,portraitMode:isPortraitMode()});
  }
  if(state.screen==='game'&&!isPortraitMode()){
    state.showLog=true;
  }
  document.body.setAttribute('data-log-open',state.screen==='game'&&state.showLog?'1':'0');
  document.body.setAttribute('data-log-sheet',isPortraitLogSheetOpen()?'1':'0');
  syncWebViewportGuardAttrs();
  syncRoomCountdownTicker();
  if(blockLandscapeMobile){
    app.innerHTML=`<section class="orientation-block"><div class="orientation-card"><div class="orientation-hero" aria-hidden="true"><span class="orientation-phone">📱</span><span class="orientation-rotate">↻</span></div><h2>${esc(t('portraitTitle'))}</h2><p>${esc(t('portraitBody'))}</p></div></section>`;
    return;
  }
  if(state.screen==='home'){renderHome();return;}
  if(state.screen==='config'){renderConfig();return;}
  if(state.screen==='opponents'){renderOpponents();return;}
  renderGame();
  serviceBellController.sync({active:true,portraitMode:isPortraitMode()});
}
function syncViewport(){
  const root=document.documentElement;
  const short=Math.min(window.innerWidth,window.innerHeight);
  const viewportH=Math.max(0,Math.round(window.visualViewport?.height||window.innerHeight||0));
  const coarse=isCoarsePointer();
  const portrait=isPortraitMode();
  const webApp=isStandaloneWebApp();
  const appViewportH=viewportH&&webApp&&coarse
    ?Math.max(0,viewportH-44)
    :viewportH;
  const scale=coarse
    ?Math.max(0.74,Math.min(1.1,short/520))
    :1;
  root.style.setProperty('--card-scale',scale.toFixed(3));
  if(appViewportH){
    root.style.setProperty('--app-vh',`${appViewportH}px`);
  }
  const orientation=portrait?'portrait':'landscape';
  const orientationChanged=Boolean(lastOrientation)&&orientation!==lastOrientation;
  lastOrientation=orientation;
  document.body.setAttribute('data-orientation',orientation);
  syncLogFabPosition();
  syncWebViewportGuardAttrs();
  root.style.setProperty('--table-tilt','0deg');
  const blocked=shouldBlockLandscapeMobile();
  if(blocked!==orientationBlockActive){
    orientationBlockActive=blocked;
    if(orientationChanged&&state.screen==='game'){
      state.logTouched=false;
    }
    render();
    return;
  }
  if(orientationChanged&&state.screen==='game'){
    state.logTouched=false;
    render();
  }
  requestAnimationFrame(syncDiscardSizeFromHand);
  requestAnimationFrame(syncLandscapeGameHandSizing);
  requestAnimationFrame(syncHandStackMode);
}

let viewportRecoveryTimer=0;
function scheduleViewportRecovery(delayMs=0){
  if(viewportRecoveryTimer){
    window.clearTimeout(viewportRecoveryTimer);
    viewportRecoveryTimer=0;
  }
  const runRecovery=()=>{
    viewportRecoveryTimer=0;
    window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{
      syncViewport();
      if(state.screen==='game'){
        render();
        window.requestAnimationFrame(syncDiscardSizeFromHand);
        window.requestAnimationFrame(syncLandscapeGameHandSizing);
        window.requestAnimationFrame(syncHandStackMode);
        window.setTimeout(()=>{
          syncViewport();
          syncLandscapeGameHandSizing();
          syncDiscardSizeFromHand();
          syncHandStackMode();
        },180);
      }
    }));
  };
  const delay=Math.max(0,Number(delayMs)||0);
  if(!delay){
    runRecovery();
    return;
  }
  viewportRecoveryTimer=window.setTimeout(runRecovery,delay);
}

window.addEventListener('resize',syncViewport);
window.addEventListener('orientationchange',syncViewport);
window.addEventListener('focus',()=>{
  if(state.home.mode==='room'&&state.room.id)void touchRoomPresence(true);
  if(state.screen==='game')scheduleViewportRecovery(30);
});
window.addEventListener('pageshow',()=>{
  if(state.screen==='game')scheduleViewportRecovery(30);
});
const bootstrapAudioAndSpeech=()=>{if(!sound.enabled)return;unlockAudio();primeSpeech();};
document.addEventListener('pointerdown',bootstrapAudioAndSpeech,{once:true});
document.addEventListener('touchstart',bootstrapAudioAndSpeech,{once:true,passive:true});
document.addEventListener('click',bootstrapAudioAndSpeech,{once:true});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&aiTimer){
    clearTimeout(aiTimer);
    aiTimer=null;
  }else if(!document.hidden){
    void touchRoomPresence(true);
    unlockAudio();
    if(state.screen==='game'){
      calloutAudioController.markInterrupted(Date.now());
      if(state.home.mode==='room')maybeRunRoomAi();
      else maybeRunSoloAi();
      scheduleViewportRecovery(30);
    }
  }
});
window.addEventListener('load',()=>{if(state.screen==='home')onGoogleScriptLoaded(renderGoogleInline);},{once:true});
loadGoogleSession();bootFirebase();syncViewport();render();
