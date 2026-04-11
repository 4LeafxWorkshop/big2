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
import {renderIntroPanel, renderLeaderboardModal, renderLeaderboardPanel, renderOpponentProfileModal, renderScoreGuideModal} from './modalViews.js';
import {createOpponentProfileHelpers} from './opponentProfile.js';
import {createOpponentsEventsBinder} from './opponentsEvents.js';
import {createProfileSettingsHelpers} from './profileSettings.js';
import {renderRoomJoinOverlay, renderRoomLobbyOverlay} from './roomView.js';
import {createRoomLifecycleController} from './roomLifecycle.js';
import {createRoomGameRuntimeController} from './roomGameRuntime.js';
import {createRoomMutationsController} from './roomMutations.js';
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
const ROOM_HOST_TAKEOVER_MS=45000;
const ROOM_HOST_ACTIVE_MS=20000;
const EMOTE_DURATION_MS=2400;
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
  return true;
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
  if(currentAuthUid())return '';
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

const I18N = {
  'zh-HK': {
    title: '鋤大D',
    sub: '',
    lang: '語言 / Language',
    zh: '繁體中文',
    en: 'English',
    fr: '法文',
    de: '德文',
    es: '西班牙文',
    ja: '日文',
    close: '關閉',
    carouselPrev: '上一個',
    carouselNext: '下一個',
    supportCoffee: '支持我們一杯咖啡',
    supportCoffeeQr: '支持我們一杯咖啡 QR',
    roomEnterCodeHint: '輸入代碼即可加入。',
    roomCreateCallout: '歡近光臨😀',
    webTooSmall:
      '視窗太小（目前 {{w}} x {{h}}），請將瀏覽器放大至至少 {{minW}} x {{minH}} 後繼續。',
    portraitTitle: '請使用直向模式',
    portraitBody: '此遊戲僅支援手機直向模式，請將裝置旋轉為直向再繼續。',
    diagLabel: '診斷',
    diagAudio: '音效',
    diagSpeech: '報牌語音',
    diagReady: '已啟用',
    diagOff: '未啟用',
    diagUnavailable: '不可用',
    lbBest: '最佳',
    lbWorst: '最差',
    lbUpdated: '更新',
    lbWR: '勝率',
    lbAvg: '平均',
    roundWins: '回合勝場',
    name: '玩家名稱',
    ai: '對手級數',
    gender: '性別',
    playerSettings: '玩家設定',
    systemSettings: '系統設定',
    male: '男',
    female: '女',
    easy: '新手',
    normal: '熟手',
    hard: '老手',
    solo: '開局',
    loginToStart: '請先登入',
    config: '設定',
    soundFx: '音效',
    audioVoice: '語音音效',
    voiceMode: '報牌語音',
    calloutDisplay: '報牌顯示',
    calloutDisplayOn: '開',
    calloutDisplayOff: '關',
    emoteDisplay: '表情顯示',
    voiceAuto: '自動',
    voiceOff: '關',
    voicePack: '語音風格',
    voicePackClassic: '經典',
    voicePackEnergetic: '活力',
    voicePackMinimal: '簡約',
    soundOn: '開',
    soundOff: '關',
    home: '返回主頁',
    again: '再玩一局',
    restart: '重新開始',
    play: '出牌',
    pass: '過牌',
    autoSeq: '順子排序',
    autoPattern: '牌型排序',
    suggest: '建議',
    score: '分數',
    suggestCost: '',
    cards: '手牌',
    log: '遊戲紀錄',
    nolog: '未有紀錄',
    rules: '規則重點',
    ruleItems: [
      '以下列出所有合法出牌組合：',
      '一張牌',
      '兩張牌(Pair)',
      '出牌時跟單隻一樣，必須大於上家出的牌。例如紅心A黑桃A是大於紅心K黑桃K。當點數相同時，比較較大的花色。',
      '三張牌(三張牌要同一點數)',
      '五張牌組合',
      '蛇（Straight）：5張點數各差1點的連續牌，牌組以A-2-3-4-5為最大，3-4-5-6-7最小。若是數字相同的蛇，則比較蛇最點數最大那張的花色大小。蛇的任何組合中不能出現J-Q-K-A-2、Q-K-A-2-3和K-A-3-4-5。',
      '花（Flush）：任何5隻牌同花但數字不連續的。以5隻中點數最大的作等級比較，若最大的點數一樣，則繼以第2大的點數比較，如此類推，最後以花色來計算等級。例如黑桃2-4-5-6-8是大於紅心A-K-Q-10-8。',
      '俘虜（Full House）：一對點數相同的牌和3張點數相同的牌所組成的5張牌。以三條排大小。',
      '四條（Four of a Kind）：4張點數全部相同外加任一單張的5張牌，以同點數的牌面大小計算等級。',
      '同花順（Royal Flush）：相同花色的「蛇」。最大的同花順為黑桃A-2-3-4-5。',
      '以上組合大小依次為：蛇 < 花 < 俘虜 < 四條 < 同花順',
    ],
    wait: '等待出牌...',
    free: '而家無上手，話事可任意出牌。',
    last: '上手',
    recentCard: '最近出牌',
    reveal: '完局攤牌',
    revealSub: '有人勝出，所有玩家餘牌如下：',
    drag: '可拖曳手牌重新排序',
    must3: '階磚♦️3出先。',
    beat: '你所選牌未能大過上手。',
    cantPass: '話事中不可過牌。',
    retake: '重新話事。',
    pick: '請先揀牌。',
    pair: '雙牌必須同點數。',
    triple: '三條必須同點數。',
    count: '只可出1、2、3或5張。',
    five: '五張牌只接受蛇、花、俘佬、四條、同花順。',
    illegal: '出牌不合法。',
    penalty: '輸家記牌',
    aiTag: '(AI)',
    wins: '勝出！',
    congrats: '恭喜你贏咗哩局！',
    resultTitle: '對局結果',
    resultWinner: '本局勝出',
    resultRemain: '剩餘手牌',
    resultLastDiscard: '最後出牌',
    resultDelta: '本局分數變動',
    resultDetail: '計分明細',
    scoreBase: '基本',
    scoreMul: '加乘',
    scoreDeduct: '扣分',
    scoreGain: '加分',
    scoreAnyTwo: '有2',
    scoreTopTwo: '無頂大♠️2',
    scoreChao2: '雙炒',
    scoreChao3: '三炒',
    scoreChao4: '四炒',
    scoreChaoBig: '大炒',
    scorePenaltyBoost: '加乘罰則',
    lastCardCall: 'Last card',
    noSuggest: '暫無建議。',
    needScore: '',
    recPass: '過牌。',
    recReady: '已產生建議，請先出牌或過牌。',
    accept: '接受建議',
    reject: '拒絕建議',
    start: '先出牌。',
    played: '出咗',
    cardBack: '牌背風格',
    blue: '藍色',
    red: '紅色',
    theme: '主題風格',
    themeOcean: '海洋藍',
    themeEmerald: '翡翠綠',
    themeSunset: '晚霞橙',
    themeSlate: '石板灰',
    themeAurora: '極光紫',
    themeSand: '沙岸金',
    themeCyber: '霓虹夜',
    useGoogleName: '使用 Google 名稱',
    signOut: '登出',
    lb: '排行榜',
    opponents: '對手資料',
    dob: '出生日期',
    hobbies: '興趣',
    profile: '簡介',
    zodiac: '星座',
    motto: '座右銘',
    lbHeadingDesc: '根據分數變動、勝場與勝率等表現指標即時更新排名。',
    lbRefresh: '更新排行榜',
    lbSort: '排序',
    lbPeriod: '期間',
    lbNoData: '未有排行資料',
    lbTotalDelta: '總分變動',
    lbWins: '勝場',
    lbGames: '局數',
    lbWinRate: '勝率',
    lbAvgDelta: '平均分差',
    lbAll: '全部',
    lb7d: '7日',
    lb30d: '30日',
    scoreGuide: '計分方法',
    clickProfile: '點擊名稱卡查看',
    scoreGuideTitle: '計分方法',
    scoreGuideItems: [
      '所有玩家起始 5000 分。',
      '有人出清手牌即勝出該局。',
      '基本計分：輸家按剩餘張數扣分：1-9 張 x1、10-12 張 x2、13 張 x3。',
      '加乘罰則：持有任意 2 再 x2；持有 ♠️2（頂大）再 x2，可疊乘。',
      '最後一張規則：若上家冇頂大而令下家出清，上家需兼負其餘兩家輸分。',
      '所有輸家扣分總和加到贏家。',
    ],
    roomLobby: '大堂',
    roomTableTitle: '房間',
    roomSettings: '房間設定',
    roomCreate: '建立房間',
    roomCreateHint: '',
    roomJoin: '加入房間',
    roomEnter: '進入大堂',
    roomCode: '房間代碼',
    roomCodeExample: 'ABC123',
    roomCopy: '複製房間代碼',
    roomReady: '準備好',
    roomNotReady: '未準備',
    roomWaiting: '請等待',
    roomStart: '開局',
    roomLeave: '返回大堂',
    roomLoginRequired: '請先登入才可以建立或加入房間。',
    roomFull: '房間已滿。',
    roomNotFound: '找不到房間。',
    roomClosed: '房間已關閉。',
    roomJoinFail: '加入房間失敗。',
    roomCreateFail: '建立房間失敗。',
    roomAlreadyIn: '你已在其他房間，請先離開再加入。',
    roomReadyHint: '等待房主開始。',
    roomDisconnected: '你已離開房間，請重新加入。',
    roomHost: '房主',
    roomHostTag: '房主',
    roomPrivacy: '房間私隱',
    roomPrivate: '私人',
    roomPublic: '公開',
    roomNeedPlayers: '至少 2 位玩家才可開始遊戲',
    roomRoomId: '房間 ID',
    roomRound: '回合',
    roomCountdown: '倒數',
    emote: '表情',
    emoteLabelCool: '大牌',
    emoteLabelThrow: '掟電話',
    emoteLabelRude: '爆粗',
    emoteLabelSweat: '無牌',
    emoteLabelRage: '反枱',
    emoteLabelSmash: '揼枱',
    emoteLabelFire: '着火',
    emoteLabelThink: '諗緊',
    emoteLabelCry: '爆喊',
    emoteLabelCheers: '飲勝',
    emoteLabelThumbs: '讚好',
    emoteLabelCrack: '爆牆',
    emoteLabelSleep: '眼瞓',
    emoteLabelLove: '心心',
    emoteLabelChampagne: '開香濱',
    emoteLabelShock: 'Shock',
    seatLabel: '座位 {{n}}',
    roomAvailable: '可加入',
    roomSeatOpen: '吉位',
    roomActiveList: '房間列表',
    roomActiveEmpty: '未有可加入房間。',
    roomActiveHidden: '隱藏',
    roomActiveRefresh: '更新列表',
    secondsShort: '秒',
    roomStatusLabel: '房間狀態',
    roomStatusPlaying: '戰鬥中',
    roomWaitingReady: '等待玩家加入',
    roomStarted: '遊戲進行中',
    roomWelcomeJoin: '歡迎加入',
    roomWaitingHost: '等待房主開局',
    roomHostSneakAway: '房主好像想偷偷溜走了。',
    roomKickedTimeout: '你連續兩次超時，已被請離房間並由機器人頂替。',
    roomReconnecting: '連線中斷，正在重新連線...',
    roomStale: '房間太久未更新，請返回大堂重試。',
    roomJoinLog: '{{name}} 加入了房間。',
    roomLeaveLog: '{{name}} 離開了房間。',
    roomStarting: '房間準備中...',
    roomReadyCount: '已準備 {{ready}}/{{total}}',
    roomSending: '提交中...',
    roomSendTimeout: '連線較慢，請重試。',
  },
  en: {
    title: 'Big Two',
    sub: '',
    lang: 'Language',
    zh: 'Traditional Chinese',
    en: 'English',
    fr: 'French',
    de: 'German',
    es: 'Spanish',
    ja: 'Japanese',
    close: 'Close',
    carouselPrev: 'Previous',
    carouselNext: 'Next',
    supportCoffee: 'Buy Me a Coffee',
    supportCoffeeQr: 'Buy Me a Coffee QR',
    roomEnterCodeHint: 'Enter room code to join.',
    roomCreateCallout: 'Welcome😀',
    webTooSmall:
      'Window too small (current {{w}} x {{h}}). Please resize to at least {{minW}} x {{minH}}.',
    portraitTitle: 'Portrait Mode Required',
    portraitBody:
      'This game supports portrait mode on mobile only. Please rotate your device to continue.',
    diagLabel: 'Diag',
    diagAudio: 'Audio',
    diagSpeech: 'Callout Speech',
    diagReady: 'Ready',
    diagOff: 'Off',
    diagUnavailable: 'Unavailable',
    lbBest: 'Best',
    lbWorst: 'Worst',
    lbUpdated: 'Updated',
    lbWR: 'WR',
    lbAvg: 'Avg',
    roundWins: 'Round wins',
    name: 'Player Name',
    ai: 'Opponent Level',
    gender: 'Gender',
    playerSettings: 'Player Settings',
    systemSettings: 'System Settings',
    male: 'Male',
    female: 'Female',
    easy: 'Novice',
    normal: 'Skilled',
    hard: 'Veteran',
    solo: 'Start Game',
    loginToStart: 'Please sign in',
    config: 'Config',
    soundFx: 'Sound Effects',
    audioVoice: 'Sound & Voice',
    voiceMode: 'Callout Voice',
    calloutDisplay: 'Callout Display',
    calloutDisplayOn: 'On',
    calloutDisplayOff: 'Off',
    emoteDisplay: 'Emote Display',
    voiceAuto: 'Auto',
    voiceOff: 'Off',
    voicePack: 'Voice Style',
    voicePackClassic: 'Classic',
    voicePackEnergetic: 'Energetic',
    voicePackMinimal: 'Minimal',
    soundOn: 'On',
    soundOff: 'Off',
    home: 'Home',
    again: 'Play Again',
    restart: 'Restart',
    play: 'Play',
    pass: 'Pass',
    autoSeq: 'Sort Sequence',
    autoPattern: 'Sort Pattern',
    suggest: 'Recommend',
    score: 'Score',
    suggestCost: '',
    cards: 'Cards',
    log: 'Game Log',
    nolog: 'No history yet',
    rules: 'Rule Highlights',
    ruleItems: [
      'All legal play combinations are listed below:',
      'Single card',
      'Pair',
      'Pairs follow the single-card rule: must beat the previous pair. Example: ♥️A♠️A beats ♥️K♠️K. If ranks are the same, compare the higher suit.',
      'Triple (three cards must be the same rank)',
      'Five-card hands',
      'Straight: five consecutive ranks. A-2-3-4-5 is the highest, 3-4-5-6-7 is the lowest. If two straights have the same ranks, compare the suit of the highest card. Straights cannot be J-Q-K-A-2, Q-K-A-2-3, or K-A-3-4-5.',
      'Flush: any five cards of the same suit that are not consecutive. Compare by the highest rank, then the second highest, and so on; finally compare suit if still tied. Example: ♠️2-4-5-6-8 beats ♥️A-K-Q-10-8.',
      'Full House: a pair plus three of a kind. Compare by the triple rank.',
      'Four of a Kind: four cards of the same rank plus any single. Compare by the four-card rank.',
      'Straight Flush (Royal Flush): a straight in the same suit. The highest straight flush is ♠️A-2-3-4-5.',
      'Hand order: Straight < Flush < Full House < Four of a Kind < Straight Flush.',
    ],
    wait: 'Waiting...',
    free: 'No active hand. Lead may play any valid set.',
    last: 'Last',
    recentCard: 'Recent Card',
    reveal: 'Showdown',
    revealSub: 'Winner decided. Remaining cards are revealed:',
    drag: 'Drag cards to resequence your hand',
    must3: 'First turn must include ♦️Diamond 3.',
    beat: 'Your selection does not beat last play.',
    cantPass: 'Cannot pass while holding lead.',
    retake: 'regains lead.',
    pick: 'Select cards first.',
    pair: 'Pair must match rank.',
    triple: 'Triple must match rank.',
    count: 'Only 1,2,3,5 cards allowed.',
    five: 'Invalid five-card hand.',
    illegal: 'Invalid play.',
    penalty: 'Penalty',
    aiTag: '(AI)',
    wins: 'wins!',
    congrats: 'Congratulations! You win!',
    resultTitle: 'Round Result',
    resultWinner: 'Winner',
    resultRemain: 'Remaining Cards',
    resultLastDiscard: 'Last Discarded Card',
    resultDelta: 'Round Score Change',
    resultDetail: 'Scoring Detail',
    scoreBase: 'Base',
    scoreMul: 'Multiplier',
    scoreDeduct: 'Deduction',
    scoreGain: 'Gain',
    scoreAnyTwo: 'Has 2',
    scoreTopTwo: 'No top ♠️Spade 2',
    scoreChao2: 'Chao Two',
    scoreChao3: 'Chao Three',
    scoreChao4: 'Chao Four',
    scoreChaoBig: 'Big Chao',
    scorePenaltyBoost: 'Multiplier Penalties',
    lastCardCall: 'Last card',
    noSuggest: 'No suggestion now.',
    needScore: '',
    recPass: 'Pass.',
    recReady: 'Already active. Play or pass first.',
    accept: 'Accept',
    reject: 'Reject',
    start: 'starts first.',
    played: 'played',
    cardBack: 'Card Back',
    blue: 'Blue',
    red: 'Red',
    theme: 'Theme',
    themeOcean: 'Ocean Blue',
    themeEmerald: 'Emerald Green',
    themeSunset: 'Sunset Orange',
    themeSlate: 'Slate Gray',
    themeAurora: 'Aurora Purple',
    themeSand: 'Sand Gold',
    themeCyber: 'Neon Night',
    useGoogleName: 'Use Google Name',
    signOut: 'Sign out',
    lb: 'Leaderboard',
    opponents: 'Opponents',
    dob: 'Date of Birth',
    hobbies: 'Hobbies',
    profile: 'Profile',
    zodiac: 'Zodiac',
    motto: 'Motto',
    lbHeadingDesc:
      'Live ranking updates based on score delta, wins, and win rate.',
    lbRefresh: 'Refresh Leaderboard',
    lbSort: 'Sort',
    lbPeriod: 'Period',
    lbNoData: 'No leaderboard data yet',
    lbTotalDelta: 'Total Delta',
    lbWins: 'Wins',
    lbGames: 'Games',
    lbWinRate: 'Win Rate',
    lbAvgDelta: 'Avg Delta',
    lbAll: 'All',
    lb7d: '7D',
    lb30d: '30D',
    scoreGuide: 'Scoring',
    clickProfile: 'Click name card to view',
    scoreGuideTitle: 'Scoring Method',
    scoreGuideItems: [
      'All players start at 5000 points.',
      'A round ends when one player empties their hand.',
      'Base scoring for losers by remaining cards: 1-9 cards x1, 10-12 cards x2, 13 cards x3.',
      'Multiplier penalties: holding any 2 applies x2; holding ♠️Spade 2 (top 2) applies another x2; multipliers stack.',
      "Last-card rule: if you fail to top against a next player on 1 card and they win, you also absorb the other two losers' deductions.",
      'Total deductions from all losers are added to the winner.',
    ],
    roomLobby: 'Lobby',
    roomTableTitle: 'Room',
    roomSettings: 'Room Settings',
    roomCreate: 'Create Room',
    roomCreateHint: 'Tap Create Room👆🏻',
    roomJoin: 'Join Room',
    roomEnter: 'Enter Lobby',
    roomCode: 'Room Code',
    roomCodeExample: 'ABC123',
    roomCopy: 'Copy Code',
    roomReady: 'Ready',
    roomNotReady: 'Not Ready',
    roomWaiting: 'Waiting',
    roomStart: 'Start',
    roomLeave: 'Return to Lobby',
    roomLoginRequired: 'Please sign in to create or join rooms.',
    roomFull: 'Room is full.',
    roomNotFound: 'Room not found.',
    roomClosed: 'Room is closed.',
    roomJoinFail: 'Failed to join room.',
    roomCreateFail: 'Failed to create room.',
    roomAlreadyIn: 'You are already in another room. Leave it before joining.',
    roomReadyHint: 'Waiting for host to start.',
    roomDisconnected: 'You left the room. Please join again.',
    roomHost: 'Host',
    roomHostTag: 'HOST',
    roomPrivacy: 'Room Privacy',
    roomPrivate: 'Private',
    roomPublic: 'Public',
    roomNeedPlayers: 'Need at least 2 players to start the game',
    roomRoomId: 'Room ID',
    roomRound: 'Round',
    roomCountdown: 'Countdown',
    emote: 'Emote',
    emoteLabelCool: 'Cool',
    emoteLabelThrow: 'Throw',
    emoteLabelRude: 'Rude',
    emoteLabelSweat: 'No Card',
    emoteLabelRage: 'Rage',
    emoteLabelSmash: 'Smash',
    emoteLabelFire: 'Fire',
    emoteLabelThink: 'Thinking',
    emoteLabelCry: 'Cry',
    emoteLabelCheers: 'Cheers',
    emoteLabelThumbs: 'Thumbs',
    emoteLabelCrack: 'Crack',
    emoteLabelSleep: 'Sleepy',
    emoteLabelLove: 'Love',
    emoteLabelChampagne: 'Champagne',
    emoteLabelShock: 'Shock',
    seatLabel: 'Seat {{n}}',
    roomAvailable: 'Available',
    roomSeatOpen: 'Open Seat',
    roomActiveList: 'Available Rooms',
    roomActiveEmpty: 'No rooms available.',
    roomActiveHidden: 'Hidden',
    roomActiveRefresh: 'Refresh',
    secondsShort: 's',
    roomStatusLabel: 'Room status',
    roomStatusPlaying: 'In Game',
    roomWaitingReady: 'Waiting for players to join',
    roomStarted: 'Game in progress',
    roomWelcomeJoin: 'Welcome to join',
    roomWaitingHost: 'Waiting for host to start...',
    roomHostSneakAway: 'Host looks to sneak away already.',
    roomKickedTimeout: 'You timed out twice and were replaced by a bot.',
    roomReconnecting: 'Connection lost. Reconnecting...',
    roomStale: 'Room is stale. Return to lobby and try again.',
    roomJoinLog: '{{name}} joined the room.',
    roomLeaveLog: '{{name}} left the room.',
    roomStarting: 'Room is starting...',
    roomReadyCount: 'Ready {{ready}}/{{total}}',
    roomSending: 'Sending...',
    roomSendTimeout: 'Connection issue — retry.',
  },
  fr: {
    title: 'Big Two',
    sub: '',
    lang: 'Langue / Language',
    zh: 'Chinois traditionnel',
    en: 'Anglais',
    fr: 'Français',
    de: 'Allemand',
    es: 'Espagnol',
    close: 'Fermer',
    carouselPrev: 'Précédent',
    carouselNext: 'Suivant',
    supportCoffee: 'Offrez-nous un café',
    supportCoffeeQr: 'QR Offrez-nous un café',
    roomEnterCodeHint: 'Entrez le code pour rejoindre.',
    roomCreateCallout: 'Bienvenue😀',
    webTooSmall:
      'Fenêtre trop petite ({{w}} x {{h}}). Redimensionnez au moins {{minW}} x {{minH}}.',
    portraitTitle: 'Mode portrait requis',
    portraitBody:
      'Ce jeu prend en charge le mode portrait sur mobile uniquement. Veuillez tourner l’appareil.',
    diagLabel: 'Diag',
    diagAudio: 'Audio',
    diagSpeech: 'Voix d’annonce',
    diagReady: 'Prêt',
    diagOff: 'Non',
    diagUnavailable: 'Indisponible',
    lbBest: 'Meilleur',
    lbWorst: 'Pire',
    lbUpdated: 'Mis à jour',
    lbWR: 'Taux',
    lbAvg: 'Moy.',
    roundWins: 'Manches gagnées',
    name: 'Nom du joueur',
    ai: 'Niveau des adversaires',
    gender: 'Genre',
    playerSettings: 'Paramètres du joueur',
    systemSettings: 'Paramètres système',
    male: 'Homme',
    female: 'Femme',
    easy: 'Débutant',
    normal: 'Confirmé',
    hard: 'Expert',
    solo: 'Démarrer',
    loginToStart: 'Veuillez vous connecter',
    config: 'Configuration',
    soundFx: 'Effets sonores',
    audioVoice: 'Son & voix',
    voiceMode: 'Voix des annonces',
    calloutDisplay: 'Affichage des annonces',
    calloutDisplayOn: 'Oui',
    calloutDisplayOff: 'Non',
    emoteDisplay: 'Affichage des émoticônes',
    voiceAuto: 'Auto',
    voiceOff: 'Non',
    voicePack: 'Style de voix',
    voicePackClassic: 'Classique',
    voicePackEnergetic: 'Énergique',
    voicePackMinimal: 'Minimaliste',
    soundOn: 'Oui',
    soundOff: 'Non',
    home: 'Accueil',
    again: 'Rejouer',
    restart: 'Redémarrer',
    play: 'Jouer',
    pass: 'Passer',
    autoSeq: 'Trier les suites',
    autoPattern: 'Trier les combinaisons',
    suggest: 'Recommander',
    score: 'Score',
    suggestCost: '',
    cards: 'Cartes',
    log: 'Historique',
    nolog: 'Aucun historique',
    rules: 'Règles clés',
    ruleItems: [
      'Toutes les combinaisons légales sont listées ci‑dessous :',
      'Carte simple',
      'Paire',
      'Les paires suivent la règle de la carte simple : elles doivent battre la paire précédente. Ex. ♥️A♠️A bat ♥️K♠️K. À rang égal, comparer la couleur la plus haute.',
      'Brelan (trois cartes du même rang)',
      'Mains de cinq cartes',
      'Suite : cinq rangs consécutifs. A‑2‑3‑4‑5 est la plus haute, 3‑4‑5‑6‑7 la plus basse. À égalité, comparer la couleur de la plus haute carte. Suites interdites : J‑Q‑K‑A‑2, Q‑K‑A‑2‑3, K‑A‑3‑4‑5.',
      'Couleur : cinq cartes de même couleur non consécutives. Comparer par la plus haute carte, puis la suivante, etc. Enfin la couleur si encore égalité. Ex. ♠️2‑4‑5‑6‑8 bat ♥️A‑K‑Q‑10‑8.',
      'Full : une paire + un brelan. Comparer par le brelan.',
      'Carré : quatre cartes du même rang + une carte. Comparer par le rang du carré.',
      'Quinte flush : suite de même couleur. La plus haute est ♠️A‑2‑3‑4‑5.',
      'Ordre : Suite < Couleur < Full < Carré < Quinte flush.',
    ],
    wait: 'En attente...',
    free: 'Pas de main active. Le joueur en tête peut jouer n’importe quel set valide.',
    last: 'Dernier',
    recentCard: 'Dernière carte',
    reveal: 'Dévoiler',
    revealSub: 'Vainqueur décidé. Cartes restantes révélées :',
    drag: 'Glissez pour réordonner votre main',
    must3: 'Le premier tour doit contenir le ♦️3.',
    beat: 'Votre sélection ne bat pas la dernière main.',
    cantPass: 'Impossible de passer quand vous êtes en tête.',
    retake: 'reprend la main.',
    pick: 'Sélectionnez d’abord des cartes.',
    pair: 'La paire doit avoir le même rang.',
    triple: 'Le brelan doit avoir le même rang.',
    count: 'Seulement 1, 2, 3 ou 5 cartes.',
    five: 'Main de cinq cartes invalide.',
    illegal: 'Coup invalide.',
    penalty: 'Pénalité',
    aiTag: '(IA)',
    wins: 'gagne !',
    congrats: 'Félicitations ! Vous gagnez !',
    resultTitle: 'Résultat',
    resultWinner: 'Vainqueur',
    resultRemain: 'Cartes restantes',
    resultLastDiscard: 'Dernière carte jouée',
    resultDelta: 'Variation de score',
    resultDetail: 'Détail du score',
    scoreBase: 'Base',
    scoreMul: 'Multiplicateur',
    scoreDeduct: 'Déduction',
    scoreGain: 'Gain',
    scoreAnyTwo: 'Possède un 2',
    scoreTopTwo: 'Sans ♠️2 max',
    scoreChao2: 'Chao deux',
    scoreChao3: 'Chao trois',
    scoreChao4: 'Chao quatre',
    scoreChaoBig: 'Grand chao',
    scorePenaltyBoost: 'Pénalités multiplicatrices',
    lastCardCall: 'Dernière carte',
    noSuggest: 'Aucune suggestion.',
    needScore: '',
    recPass: 'Passer.',
    recReady: 'Déjà actif. Jouez ou passez d’abord.',
    accept: 'Accepter',
    reject: 'Refuser',
    start: 'commence.',
    played: 'a joué',
    cardBack: 'Dos des cartes',
    blue: 'Bleu',
    red: 'Rouge',
    theme: 'Thème',
    themeOcean: 'Bleu océan',
    themeEmerald: 'Vert émeraude',
    themeSunset: 'Orange coucher de soleil',
    themeSlate: 'Gris ardoise',
    themeAurora: 'Violet aurore',
    themeSand: 'Or sable',
    themeCyber: 'Nuit néon',
    useGoogleName: 'Utiliser le nom Google',
    signOut: 'Se déconnecter',
    lb: 'Classement',
    opponents: 'Adversaires',
    dob: 'Date de naissance',
    hobbies: 'Loisirs',
    profile: 'Profil',
    zodiac: 'Zodiaque',
    motto: 'Devise',
    lbHeadingDesc:
      'Classement mis à jour selon l’écart de score, les victoires et le taux de victoire.',
    lbRefresh: 'Actualiser',
    lbSort: 'Trier',
    lbPeriod: 'Période',
    lbNoData: 'Aucune donnée',
    lbTotalDelta: 'Delta total',
    lbWins: 'Victoires',
    lbGames: 'Parties',
    lbWinRate: 'Taux de victoire',
    lbAvgDelta: 'Delta moyen',
    lbAll: 'Tout',
    lb7d: '7 j',
    lb30d: '30 j',
    scoreGuide: 'Barème',
    clickProfile: 'Cliquez sur la carte du nom',
    scoreGuideTitle: 'Méthode de score',
    scoreGuideItems: [
      'Tous les joueurs commencent à 5000 points.',
      'La manche se termine quand un joueur n’a plus de cartes.',
      'Score de base des perdants : 1‑9 cartes x1, 10‑12 cartes x2, 13 cartes x3.',
      'Multiplicateurs : avoir un 2 applique x2 ; avoir le ♠️2 ajoute encore x2 ; ils se cumulent.',
      'Règle de la dernière carte : si vous ne battez pas le joueur suivant à 1 carte et qu’il gagne, vous prenez aussi les pertes des deux autres.',
      'Le total des pertes est ajouté au vainqueur.',
    ],
    roomLobby: 'Hall',
    roomTableTitle: 'Salle',
    roomSettings: 'Paramètres de salle',
    roomCreate: 'Créer une salle',
    roomCreateHint: 'Touchez Créer une salle👆🏻',
    roomJoin: 'Rejoindre une salle',
    roomEnter: 'Entrer dans le hall',
    roomCode: 'Code de salle',
    roomCodeExample: 'ABC123',
    roomCopy: 'Copier le code',
    roomReady: 'Prêt',
    roomNotReady: 'Pas prêt',
    roomWaiting: 'En attente',
    roomStart: 'Démarrer',
    roomLeave: 'Retour au hall',
    roomLoginRequired:
      'Veuillez vous connecter pour créer ou rejoindre des salles.',
    roomFull: 'Salle pleine.',
    roomNotFound: 'Salle introuvable.',
    roomClosed: 'Salle fermée.',
    roomJoinFail: 'Échec pour rejoindre la salle.',
    roomCreateFail: 'Échec de la création de la salle.',
    roomAlreadyIn: 'Vous êtes déjà dans une autre salle.',
    roomReadyHint: 'En attente du démarrage de l’hôte.',
    roomDisconnected: 'Vous avez quitté la salle. Rejoignez‑la.',
    roomHost: 'Hôte',
    roomHostTag: 'HÔTE',
    roomPrivacy: 'Visibilité',
    roomPrivate: 'Privée',
    roomPublic: 'Publique',
    roomNeedPlayers:
      'Au moins 2 joueurs sont nécessaires pour commencer la partie.',
    roomRoomId: 'ID de salle',
    roomRound: 'Manche',
    roomCountdown: 'Compte à rebours',
    emote: 'Émoticône',
    emoteLabelCool: 'Cool',
    emoteLabelThrow: 'Lancer',
    emoteLabelRude: 'Grossier',
    emoteLabelSweat: 'Plus de cartes',
    emoteLabelRage: 'Rage',
    emoteLabelSmash: 'Frapper',
    emoteLabelFire: 'Feu',
    emoteLabelThink: 'Réflexion',
    emoteLabelCry: 'Pleurer',
    emoteLabelCheers: 'Santé',
    emoteLabelThumbs: 'Pouce',
    emoteLabelCrack: 'Fissure',
    emoteLabelSleep: 'Sommeil',
    emoteLabelLove: 'Amour',
    emoteLabelChampagne: 'Champagne',
    emoteLabelShock: 'Choc',
    seatLabel: 'Siège {{n}}',
    roomAvailable: 'Disponible',
    roomSeatOpen: 'Siège libre',
    roomActiveList: 'Salles disponibles',
    roomActiveEmpty: 'Aucune salle disponible.',
    roomActiveHidden: 'Masquées',
    roomActiveRefresh: 'Actualiser',
    secondsShort: 's',
    roomStatusLabel: 'Statut de la salle',
    roomStatusPlaying: 'En jeu',
    roomWaitingReady: 'En attente des joueurs',
    roomStarted: 'Partie en cours',
    roomWelcomeJoin: 'Bienvenue',
    roomWaitingHost: 'En attente de l’hôte...',
    roomHostSneakAway: 'On dirait que l’hôte veut déjà filer en douce.',
    roomKickedTimeout:
      'Vous avez dépassé le délai deux fois et avez été remplacé par un bot.',
    roomReconnecting: 'Connexion perdue. Reconnexion...',
    roomStale: 'Salle obsolète. Revenez au hall.',
    roomJoinLog: '{{name}} a rejoint la salle.',
    roomLeaveLog: '{{name}} a quitté la salle.',
    roomStarting: 'La salle démarre...',
    roomReadyCount: 'Prêt {{ready}}/{{total}}',
    roomSending: 'Envoi...',
    roomSendTimeout: 'Problème de connexion — réessayez.',
  },
  de: {
    title: 'Big Two',
    sub: '',
    lang: 'Sprache / Language',
    zh: 'Traditionelles Chinesisch',
    en: 'Englisch',
    fr: 'Französisch',
    de: 'Deutsch',
    es: 'Spanisch',
    close: 'Schließen',
    carouselPrev: 'Zurück',
    carouselNext: 'Weiter',
    supportCoffee: 'Kaffee spendieren',
    supportCoffeeQr: 'QR Kaffee spendieren',
    roomEnterCodeHint: 'Raumcode eingeben, um beizutreten.',
    roomCreateCallout: 'Willkommen😀',
    webTooSmall:
      'Fenster zu klein ({{w}} x {{h}}). Bitte auf mindestens {{minW}} x {{minH}} vergrößern.',
    portraitTitle: 'Hochformat erforderlich',
    portraitBody:
      'Dieses Spiel unterstützt nur den Hochformat‑Modus auf Mobilgeräten. Bitte Gerät drehen.',
    diagLabel: 'Diag',
    diagAudio: 'Audio',
    diagSpeech: 'Ansage',
    diagReady: 'Bereit',
    diagOff: 'Aus',
    diagUnavailable: 'Nicht verfügbar',
    lbBest: 'Beste',
    lbWorst: 'Schlechteste',
    lbUpdated: 'Aktualisiert',
    lbWR: 'S‑Quote',
    lbAvg: 'Ø',
    roundWins: 'Rundensiege',
    name: 'Spielername',
    ai: 'Gegnerstufe',
    gender: 'Geschlecht',
    playerSettings: 'Spielereinstellungen',
    systemSettings: 'Systemeinstellungen',
    male: 'Männlich',
    female: 'Weiblich',
    easy: 'Anfänger',
    normal: 'Fortgeschritten',
    hard: 'Experte',
    solo: 'Start',
    loginToStart: 'Bitte anmelden',
    config: 'Einstellungen',
    soundFx: 'Soundeffekte',
    audioVoice: 'Sound & Stimme',
    voiceMode: 'Ansage‑Stimme',
    calloutDisplay: 'Ansagen anzeigen',
    calloutDisplayOn: 'An',
    calloutDisplayOff: 'Aus',
    emoteDisplay: 'Emotes anzeigen',
    voiceAuto: 'Auto',
    voiceOff: 'Aus',
    voicePack: 'Stimmstil',
    voicePackClassic: 'Klassisch',
    voicePackEnergetic: 'Energiegeladen',
    voicePackMinimal: 'Minimalista',
    soundOn: 'An',
    soundOff: 'Aus',
    home: 'Startseite',
    again: 'Nochmal spielen',
    restart: 'Neustart',
    play: 'Ausspielen',
    pass: 'Passen',
    autoSeq: 'Straßen sortieren',
    autoPattern: 'Kombinationen sortieren',
    suggest: 'Empfehlung',
    score: 'Punkte',
    suggestCost: '',
    cards: 'Karten',
    log: 'Spielprotokoll',
    nolog: 'Noch keine Historie',
    rules: 'Regel‑Highlights',
    ruleItems: [
      'Alle erlaubten Kombinationen:',
      'Einzelkarte',
      'Paar',
      'Paare folgen der Einzelkarten‑Regel: müssen das vorige Paar schlagen. Beispiel: ♥️A♠️A schlägt ♥️K♠️K. Bei gleichem Rang zählt die höhere Farbe.',
      'Drilling (drei Karten gleichen Rangs)',
      'Fünf‑Karten‑Hände',
      'Straße: fünf aufeinanderfolgende Ränge. A‑2‑3‑4‑5 ist die höchste, 3‑4‑5‑6‑7 die niedrigste. Bei Gleichstand zählt die Farbe der höchsten Karte. Verbotene Straßen: J‑Q‑K‑A‑2, Q‑K‑A‑2‑3, K‑A‑3‑4‑5.',
      'Farbe: fünf Karten derselben Farbe ohne Folge. Vergleich nach höchster Karte, dann nächsthöchste usw., zuletzt nach Farbe. Beispiel: ♠️2‑4‑5‑6‑8 schlägt ♥️A‑K‑Q‑10‑8.',
      'Full House: Paar + Drilling. Vergleich nach Drilling.',
      'Vierling: vier Karten gleichen Rangs + eine Karte. Vergleich nach dem Vierlings‑Rang.',
      'Straight Flush: Straße in derselben Farbe. Höchste Straight Flush ist ♠️A‑2‑3‑4‑5.',
      'Reihenfolge: Straße < Farbe < Full House < Vierling < Straight Flush.',
    ],
    wait: 'Warten...',
    free: 'Kein aktives Stich. Vorhand darf beliebig legen.',
    last: 'Letzte',
    recentCard: 'Letzte Karte',
    reveal: 'Aufdecken',
    revealSub: 'Sieger festgelegt. Restkarten werden gezeigt:',
    drag: 'Karten ziehen, um die Hand zu sortieren',
    must3: 'Erster Zug muss ♦️3 enthalten.',
    beat: 'Deine Auswahl schlägt den letzten Zug nicht.',
    cantPass: 'Als Vorhand kann man nicht passen.',
    retake: 'übernimmt den Stich.',
    pick: 'Bitte zuerst Karten wählen.',
    pair: 'Paar muss denselben Rang haben.',
    triple: 'Drilling muss denselben Rang haben.',
    count: 'Nur 1, 2, 3 oder 5 Karten.',
    five: 'Ungültige 5‑Karten‑Hand.',
    illegal: 'Ungültiger Zug.',
    penalty: 'Strafe',
    aiTag: '(KI)',
    wins: 'gewinnt!',
    congrats: 'Glückwunsch! Du gewinnst!',
    resultTitle: 'Rundenergebnis',
    resultWinner: 'Sieger',
    resultRemain: 'Restkarten',
    resultLastDiscard: 'Letzte abgelegte Karte',
    resultDelta: 'Punkteänderung',
    resultDetail: 'Punktedetails',
    scoreBase: 'Basis',
    scoreMul: 'Multiplikator',
    scoreDeduct: 'Abzug',
    scoreGain: 'Gewinn',
    scoreAnyTwo: 'Hat eine 2',
    scoreTopTwo: 'Ohne höchste ♠️2',
    scoreChao2: 'Doppelt',
    scoreChao3: 'Dreifach',
    scoreChao4: 'Vierfach',
    scoreChaoBig: 'Groß',
    scorePenaltyBoost: 'Straf‑Multiplikator',
    lastCardCall: 'Letzte Karte',
    noSuggest: 'Keine Empfehlung.',
    needScore: '',
    recPass: 'Passen.',
    recReady: 'Bereits aktiv. Erst spielen oder passen.',
    accept: 'Annehmen',
    reject: 'Ablehnen',
    start: 'beginnt.',
    played: 'spielte',
    cardBack: 'Kartenrücken',
    blue: 'Blau',
    red: 'Rot',
    theme: 'Thema',
    themeOcean: 'Ozeanblau',
    themeEmerald: 'Smaragdgrün',
    themeSunset: 'Sonnenuntergangsorange',
    themeSlate: 'Schiefergrau',
    themeAurora: 'Aurora‑Violett',
    themeSand: 'Sandgold',
    themeCyber: 'Neon‑Nacht',
    useGoogleName: 'Google‑Name verwenden',
    signOut: 'Abmelden',
    lb: 'Rangliste',
    opponents: 'Gegner',
    dob: 'Geburtsdatum',
    hobbies: 'Hobbys',
    profile: 'Profil',
    zodiac: 'Sternzeichen',
    motto: 'Motto',
    lbHeadingDesc:
      'Live‑Ranking basierend auf Punktedifferenz, Siegen und Siegquote.',
    lbRefresh: 'Rangliste aktualisieren',
    lbSort: 'Sortieren',
    lbPeriod: 'Zeitraum',
    lbNoData: 'Keine Daten',
    lbTotalDelta: 'Gesamtdifferenz',
    lbWins: 'Siege',
    lbGames: 'Spiele',
    lbWinRate: 'Siegquote',
    lbAvgDelta: 'Ø‑Differenz',
    lbAll: 'Alle',
    lb7d: '7 T',
    lb30d: '30 T',
    scoreGuide: 'Punktetabelle',
    clickProfile: 'Name anklicken',
    scoreGuideTitle: 'Punktesystem',
    scoreGuideItems: [
      'Alle starten mit 5000 Punkten.',
      'Eine Runde endet, wenn ein Spieler keine Karten mehr hat.',
      'Basiswertung der Verlierer: 1‑9 Karten x1, 10‑12 Karten x2, 13 Karten x3.',
      'Multiplikatoren: beliebige 2 = x2; ♠️2 = weiteres x2; Multiplikatoren stapeln.',
      'Letzte‑Karte‑Regel: Wenn du die letzte Karte des nächsten Spielers nicht schlägst und er gewinnt, übernimmst du auch die Abzüge der anderen zwei.',
      'Die Summe der Abzüge geht an den Gewinner.',
    ],
    roomLobby: 'Lobby',
    roomTableTitle: 'Raum',
    roomSettings: 'Raumeinstellungen',
    roomCreate: 'Raum erstellen',
    roomCreateHint: 'Tippe auf Raum erstellen👆🏻',
    roomJoin: 'Raum beitreten',
    roomEnter: 'Lobby betreten',
    roomCode: 'Raum‑Code',
    roomCodeExample: 'ABC123',
    roomCopy: 'Code kopieren',
    roomReady: 'Bereit',
    roomNotReady: 'Nicht bereit',
    roomWaiting: 'Warten',
    roomStart: 'Start',
    roomLeave: 'Zur Lobby',
    roomLoginRequired:
      'Bitte anmelden, um Räume zu erstellen oder beizutreten.',
    roomFull: 'Raum voll.',
    roomNotFound: 'Raum nicht gefunden.',
    roomClosed: 'Raum geschlossen.',
    roomJoinFail: 'Beitritt fehlgeschlagen.',
    roomCreateFail: 'Erstellen fehlgeschlagen.',
    roomAlreadyIn: 'Du bist bereits in einem anderen Raum.',
    roomReadyHint: 'Warte auf den Host.',
    roomDisconnected: 'Du hast den Raum verlassen. Bitte erneut beitreten.',
    roomHost: 'Host',
    roomHostTag: 'HOST',
    roomPrivacy: 'Sichtbarkeit',
    roomPrivate: 'Privat',
    roomPublic: 'Öffentlich',
    roomNeedPlayers:
      'Mindestens 2 Spieler werden benötigt, um das Spiel zu starten.',
    roomRoomId: 'Raum‑ID',
    roomRound: 'Runde',
    roomCountdown: 'Countdown',
    emote: 'Emote',
    emoteLabelCool: 'Cool',
    emoteLabelThrow: 'Werfen',
    emoteLabelRude: 'Unhöflich',
    emoteLabelSweat: 'Keine Karten',
    emoteLabelRage: 'Wut',
    emoteLabelSmash: 'Zerschmettern',
    emoteLabelFire: 'Feuer',
    emoteLabelThink: 'Denken',
    emoteLabelCry: 'Weinen',
    emoteLabelCheers: 'Prost',
    emoteLabelThumbs: 'Daumen',
    emoteLabelCrack: 'Riss',
    emoteLabelSleep: 'Müde',
    emoteLabelLove: 'Liebe',
    emoteLabelChampagne: 'Champagner',
    emoteLabelShock: 'Schock',
    seatLabel: 'Sitz {{n}}',
    roomAvailable: 'Verfügbar',
    roomSeatOpen: 'Freier Sitz',
    roomActiveList: 'Verfügbare Räume',
    roomActiveEmpty: 'Keine Räume verfügbar.',
    roomActiveHidden: 'Versteckt',
    roomActiveRefresh: 'Aktualisieren',
    secondsShort: 's',
    roomStatusLabel: 'Raumstatus',
    roomStatusPlaying: 'Im Spiel',
    roomWaitingReady: 'Warte auf Spieler',
    roomStarted: 'Spiel läuft',
    roomWelcomeJoin: 'Willkommen',
    roomWaitingHost: 'Warte auf Host...',
    roomHostSneakAway: 'Der Host scheint sich schon davonschleichen zu wollen.',
    roomKickedTimeout:
      'Du hast zweimal das Zeitlimit verpasst und wurdest durch einen Bot ersetzt.',
    roomReconnecting: 'Verbindung verloren. Verbinde neu...',
    roomStale: 'Raum veraltet. Zur Lobby zurückkehren.',
    roomJoinLog: '{{name}} ist dem Raum beigetreten.',
    roomLeaveLog: '{{name}} hat den Raum verlassen.',
    roomStarting: 'Raum startet...',
    roomReadyCount: 'Bereit {{ready}}/{{total}}',
    roomSending: 'Sende...',
    roomSendTimeout: 'Verbindungsproblem — bitte erneut versuchen.',
  },
  es: {
    title: 'Big Two',
    sub: '',
    lang: 'Idioma / Language',
    zh: 'Chino tradicional',
    en: 'Inglés',
    fr: 'Francés',
    de: 'Alemán',
    es: 'Español',
    close: 'Cerrar',
    carouselPrev: 'Anterior',
    carouselNext: 'Siguiente',
    supportCoffee: 'Invítanos un café',
    supportCoffeeQr: 'QR Invítanos un café',
    roomEnterCodeHint: 'Ingresa el código para unirte.',
    roomCreateCallout: 'Bienvenido😀',
    webTooSmall:
      'Ventana demasiado pequeña ({{w}} x {{h}}). Redimensiona al menos a {{minW}} x {{minH}}.',
    portraitTitle: 'Se requiere modo vertical',
    portraitBody:
      'Este juego solo admite modo vertical en móvil. Gira el dispositivo.',
    diagLabel: 'Diag',
    diagAudio: 'Audio',
    diagSpeech: 'Voz de anuncio',
    diagReady: 'Listo',
    diagOff: 'Apagado',
    diagUnavailable: 'No disponible',
    lbBest: 'Mejor',
    lbWorst: 'Peor',
    lbUpdated: 'Actualizado',
    lbWR: 'Tasa',
    lbAvg: 'Prom.',
    roundWins: 'Rondas ganadas',
    name: 'Nombre del jugador',
    ai: 'Nivel de oponentes',
    gender: 'Género',
    playerSettings: 'Configuración del jugador',
    systemSettings: 'Configuración del sistema',
    male: 'Hombre',
    female: 'Mujer',
    easy: 'Principiante',
    normal: 'Intermedio',
    hard: 'Experto',
    solo: 'Iniciar',
    loginToStart: 'Por favor inicia sesión',
    config: 'Configuración',
    soundFx: 'Efectos de sonido',
    audioVoice: 'Sonido y voz',
    voiceMode: 'Voz de anuncios',
    calloutDisplay: 'Mostrar anuncios',
    calloutDisplayOn: 'Sí',
    calloutDisplayOff: 'No',
    emoteDisplay: 'Mostrar emoticonos',
    voiceAuto: 'Auto',
    voiceOff: 'No',
    voicePack: 'Estilo de voz',
    voicePackClassic: 'Clásico',
    voicePackEnergetic: 'Enérgico',
    voicePackMinimal: 'Minimal',
    soundOn: 'Sí',
    soundOff: 'No',
    home: 'Inicio',
    again: 'Jugar de nuevo',
    restart: 'Reiniciar',
    play: 'Jugar',
    pass: 'Pasar',
    autoSeq: 'Ordenar escaleras',
    autoPattern: 'Ordenar combinaciones',
    suggest: 'Recomendar',
    score: 'Puntuación',
    suggestCost: '',
    cards: 'Cartas',
    log: 'Registro',
    nolog: 'Sin historial',
    rules: 'Reglas clave',
    ruleItems: [
      'Todas las combinaciones legales están abajo:',
      'Carta simple',
      'Pareja',
      'Las parejas siguen la regla de carta simple: deben vencer a la pareja anterior. Ej.: ♥️A♠️A vence a ♥️K♠️K. A igual rango, gana el palo más alto.',
      'Trío (tres cartas del mismo rango)',
      'Manos de cinco cartas',
      'Escalera: cinco rangos consecutivos. A‑2‑3‑4‑5 es la más alta, 3‑4‑5‑6‑7 la más baja. En empate, compara el palo de la carta más alta. Escaleras prohibidas: J‑Q‑K‑A‑2, Q‑K‑A‑2‑3, K‑A‑3‑4‑5.',
      'Color: cinco cartas del mismo palo no consecutivas. Se compara la carta más alta, luego la siguiente, etc.; finalmente el palo si persiste el empate. Ej.: ♠️2‑4‑5‑6‑8 vence a ♥️A‑K‑Q‑10‑8.',
      'Full: pareja + trío. Se compara el trío.',
      'Póker: cuatro cartas del mismo rango + una. Se compara el rango del póker.',
      'Escalera de color: escalera del mismo palo. La más alta es ♠️A‑2‑3‑4‑5.',
      'Orden: Escalera < Color < Full < Póker < Escalera de color.',
    ],
    wait: 'Esperando...',
    free: 'Sin mano activa. El líder puede jugar cualquier set válido.',
    last: 'Último',
    recentCard: 'Carta reciente',
    reveal: 'Mostrar',
    revealSub: 'Ganador decidido. Cartas restantes:',
    drag: 'Arrastra para ordenar tu mano',
    must3: 'El primer turno debe incluir ♦️3.',
    beat: 'Tu selección no supera la última jugada.',
    cantPass: 'No puedes pasar si tienes la mano.',
    retake: 'retoma la mano.',
    pick: 'Selecciona cartas primero.',
    pair: 'La pareja debe ser del mismo rango.',
    triple: 'El trío debe ser del mismo rango.',
    count: 'Solo 1, 2, 3 o 5 cartas.',
    five: 'Mano de 5 cartas inválida.',
    illegal: 'Jugada inválida.',
    penalty: 'Penalización',
    aiTag: '(IA)',
    wins: '¡gana!',
    congrats: '¡Felicidades! ¡Has ganado!',
    resultTitle: 'Resultado',
    resultWinner: 'Ganador',
    resultRemain: 'Cartas restantes',
    resultLastDiscard: 'Última carta jugada',
    resultDelta: 'Cambio de puntuación',
    resultDetail: 'Detalle de puntuación',
    scoreBase: 'Base',
    scoreMul: 'Multiplicador',
    scoreDeduct: 'Deducción',
    scoreGain: 'Ganancia',
    scoreAnyTwo: 'Tiene un 2',
    scoreTopTwo: 'Sin ♠️2 mayor',
    scoreChao2: 'Chao dos',
    scoreChao3: 'Chao tres',
    scoreChao4: 'Chao cuatro',
    scoreChaoBig: 'Chao grande',
    scorePenaltyBoost: 'Penalizaciones multiplicadoras',
    lastCardCall: 'Última carta',
    noSuggest: 'Sin sugerencias.',
    needScore: '',
    recPass: 'Pasar.',
    recReady: 'Ya activo. Juega o pasa primero.',
    accept: 'Aceptar',
    reject: 'Rechazar',
    start: 'comienza.',
    played: 'jugó',
    cardBack: 'Reverso',
    blue: 'Azul',
    red: 'Rojo',
    theme: 'Tema',
    themeOcean: 'Azul océano',
    themeEmerald: 'Verde esmeralda',
    themeSunset: 'Naranja atardecer',
    themeSlate: 'Gris pizarra',
    themeAurora: 'Violeta aurora',
    themeSand: 'Oro arena',
    themeCyber: 'Noche neón',
    useGoogleName: 'Usar nombre de Google',
    signOut: 'Cerrar sesión',
    lb: 'Clasificación',
    opponents: 'Oponentes',
    dob: 'Fecha de nacimiento',
    hobbies: 'Pasatiempos',
    profile: 'Perfil',
    zodiac: 'Zodiaco',
    motto: 'Lema',
    lbHeadingDesc:
      'Ranking en vivo basado en delta de puntos, victorias y tasa de victoria.',
    lbRefresh: 'Actualizar ranking',
    lbSort: 'Ordenar',
    lbPeriod: 'Periodo',
    lbNoData: 'Sin datos',
    lbTotalDelta: 'Delta total',
    lbWins: 'Victorias',
    lbGames: 'Partidas',
    lbWinRate: 'Tasa de victoria',
    lbAvgDelta: 'Delta medio',
    lbAll: 'Todo',
    lb7d: '7 días',
    lb30d: '30 días',
    scoreGuide: 'Puntuación',
    clickProfile: 'Haz clic en la tarjeta de nombre',
    scoreGuideTitle: 'Método de puntuación',
    scoreGuideItems: [
      'Todos comienzan con 5000 puntos.',
      'La ronda termina cuando un jugador se queda sin cartas.',
      'Puntuación base de los perdedores: 1‑9 cartas x1, 10‑12 cartas x2, 13 cartas x3.',
      'Multiplicadores: tener cualquier 2 aplica x2; tener el ♠️2 aplica otro x2; se acumulan.',
      'Regla de última carta: si no puedes superar al siguiente con 1 carta y gana, también absorbes las pérdidas de los otros dos.',
      'La suma de pérdidas se añade al ganador.',
    ],
    roomLobby: 'Lobby',
    roomTableTitle: 'Sala',
    roomSettings: 'Configuración de sala',
    roomCreate: 'Crear sala',
    roomCreateHint: 'Toca Crear sala👆🏻',
    roomJoin: 'Unirse a la sala',
    roomEnter: 'Entrar al lobby',
    roomCode: 'Código de sala',
    roomCodeExample: 'ABC123',
    roomCopy: 'Copiar código',
    roomReady: 'Listo',
    roomNotReady: 'No listo',
    roomWaiting: 'Esperando',
    roomStart: 'Iniciar',
    roomLeave: 'Volver al lobby',
    roomLoginRequired: 'Inicia sesión para crear o unirte a salas.',
    roomFull: 'Sala llena.',
    roomNotFound: 'Sala no encontrada.',
    roomClosed: 'Sala cerrada.',
    roomJoinFail: 'Error al unirse.',
    roomCreateFail: 'Error al crear.',
    roomAlreadyIn: 'Ya estás en otra sala.',
    roomReadyHint: 'Esperando al anfitrión.',
    roomDisconnected: 'Has salido de la sala. Vuelve a unirte.',
    roomHost: 'Anfitrión',
    roomHostTag: 'HOST',
    roomPrivacy: 'Visibilidad',
    roomPrivate: 'Privada',
    roomPublic: 'Pública',
    roomNeedPlayers:
      'Se necesitan al menos 2 jugadores para empezar la partida.',
    roomRoomId: 'ID de sala',
    roomRound: 'Ronda',
    roomCountdown: 'Cuenta atrás',
    emote: 'Emote',
    emoteLabelCool: 'Genial',
    emoteLabelThrow: 'Lanzar',
    emoteLabelRude: 'Grosero',
    emoteLabelSweat: 'Sin cartas',
    emoteLabelRage: 'Furia',
    emoteLabelSmash: 'Golpear',
    emoteLabelFire: 'Fuego',
    emoteLabelThink: 'Pensando',
    emoteLabelCry: 'Llorar',
    emoteLabelCheers: 'Salud',
    emoteLabelThumbs: 'Pulgar',
    emoteLabelCrack: 'Grieta',
    emoteLabelSleep: 'Sueño',
    emoteLabelLove: 'Amor',
    emoteLabelChampagne: 'Champán',
    emoteLabelShock: 'Shock',
    seatLabel: 'Asiento {{n}}',
    roomAvailable: 'Disponible',
    roomSeatOpen: 'Asiento libre',
    roomActiveList: 'Salas disponibles',
    roomActiveEmpty: 'No hay salas disponibles.',
    roomActiveHidden: 'Ocultas',
    roomActiveRefresh: 'Actualizar',
    secondsShort: 's',
    roomStatusLabel: 'Estado de sala',
    roomStatusPlaying: 'En juego',
    roomWaitingReady: 'Esperando jugadores',
    roomStarted: 'Partida en curso',
    roomWelcomeJoin: 'Bienvenido',
    roomWaitingHost: 'Esperando al anfitrión...',
    roomHostSneakAway: 'Parece que el anfitrión ya quiere escabullirse.',
    roomKickedTimeout:
      'Has agotado el tiempo dos veces y un bot te ha sustituido.',
    roomReconnecting: 'Conexión perdida. Reconectando...',
    roomStale: 'Sala desactualizada. Vuelve al lobby.',
    roomJoinLog: '{{name}} se unió a la sala.',
    roomLeaveLog: '{{name}} salió de la sala.',
    roomStarting: 'La sala está iniciando...',
    roomReadyCount: 'Listos {{ready}}/{{total}}',
    roomSending: 'Enviando...',
    roomSendTimeout: 'Problema de conexión — reintenta.',
  },
  ja: {
    title: 'ビッグツー',
    sub: '',
    lang: '言語',
    zh: '繁体字中国語',
    en: '英語',
    fr: 'フランス語',
    de: 'ドイツ語',
    es: 'スペイン語',
    ja: '日本語',
    close: '閉じる',
    carouselPrev: '前へ',
    carouselNext: '次へ',
    supportCoffee: 'コーヒーで応援',
    supportCoffeeQr: 'コーヒーで応援 QR',
    roomEnterCodeHint: 'コードを入力して参加。',
    roomCreateCallout: 'ようこそ😀',
    webTooSmall:
      'ウィンドウが小さすぎます（現在 {{w}} x {{h}}）。少なくとも {{minW}} x {{minH}} に拡大してください。',
    portraitTitle: '縦向きが必要です',
    portraitBody:
      'このゲームはモバイルの縦向きのみ対応です。端末を回転してください。',
    diagLabel: '診断',
    diagAudio: '音声',
    diagSpeech: 'コール音声',
    diagReady: '有効',
    diagOff: 'オフ',
    diagUnavailable: '利用不可',
    lbBest: '最高',
    lbWorst: '最低',
    lbUpdated: '更新',
    lbWR: '勝率',
    lbAvg: '平均',
    roundWins: 'ラウンド勝利',
    name: 'プレイヤー名',
    ai: '対戦相手レベル',
    gender: '性別',
    playerSettings: 'プレイヤー設定',
    systemSettings: 'システム設定',
    male: '男性',
    female: '女性',
    easy: '初心者',
    normal: '普通',
    hard: '上級者',
    solo: 'ゲーム開始',
    loginToStart: 'サインインしてください',
    config: '設定',
    soundFx: '効果音',
    audioVoice: '音声とボイス',
    voiceMode: 'コールボイス',
    calloutDisplay: 'コール表示',
    calloutDisplayOn: 'オン',
    calloutDisplayOff: 'オフ',
    emoteDisplay: 'エモート表示',
    voiceAuto: '自動',
    voiceOff: 'オフ',
    voicePack: 'ボイススタイル',
    voicePackClassic: 'クラシック',
    voicePackEnergetic: 'エネルギッシュ',
    voicePackMinimal: 'ミニマル',
    soundOn: 'オン',
    soundOff: 'オフ',
    home: 'ホーム',
    again: 'もう一度',
    restart: 'リスタート',
    play: '出す',
    pass: 'パス',
    autoSeq: '順子並び替え',
    autoPattern: '役並び替え',
    suggest: 'おすすめ',
    score: 'スコア',
    suggestCost: '',
    cards: '手札',
    log: 'ゲームログ',
    nolog: '履歴なし',
    rules: 'ルール概要',
    ruleItems: [
      '合法な出し方は以下のとおりです。',
      '単札',
      'ペア',
      'ペアは単札と同じルールで、前のペアを上回る必要があります。例：♥️A♠️A は ♥️K♠️K に勝ちます。同じランクの場合は高いスートで比較します。',
      'トリプル（同じランク3枚）',
      '5枚役',
      'ストレート：5枚の連番。A-2-3-4-5 が最強、3-4-5-6-7 が最弱。同じランクのストレートは最高位カードのスートで比較します。J-Q-K-A-2、Q-K-A-2-3、K-A-3-4-5 のストレートは不可。',
      'フラッシュ：同じスートの5枚で連番ではないもの。最も高いランクから順に比較し、それでも同じならスートで比較します。例：♠️2-4-5-6-8 は ♥️A-K-Q-10-8 に勝ちます。',
      'フルハウス：ペア＋トリプル。トリプルのランクで比較します。',
      'フォーカード：同じランク4枚＋任意1枚。4枚のランクで比較します。',
      'ストレートフラッシュ：同じスートのストレート。最強は ♠️A-2-3-4-5。',
      '役の強さ：ストレート < フラッシュ < フルハウス < フォーカード < ストレートフラッシュ。',
    ],
    wait: '待機中...',
    free: '現在上がりがないため、親は任意の役を出せます。',
    last: '直前',
    recentCard: '直前のカード',
    reveal: '公開',
    revealSub: '勝者決定。残りのカードを公開:',
    drag: 'ドラッグして手札の順を変更',
    must3: '最初の手番は♦️3を含める必要があります。',
    beat: '選択したカードは前の出し札に勝てません。',
    cantPass: '親のときはパスできません。',
    retake: 'が親になります。',
    pick: 'まずカードを選択してください。',
    pair: 'ペアは同じランクである必要があります。',
    triple: 'トリプルは同じランクである必要があります。',
    count: '出せる枚数は1、2、3、5のみ。',
    five: '無効な5枚役です。',
    illegal: '無効な出し方です。',
    penalty: 'ペナルティ',
    aiTag: '(AI)',
    wins: '勝ち！',
    congrats: 'おめでとう！勝ちました！',
    resultTitle: 'ラウンド結果',
    resultWinner: '勝者',
    resultRemain: '残りの手札',
    resultLastDiscard: '最後に出したカード',
    resultDelta: 'スコア変動',
    resultDetail: 'スコア詳細',
    scoreBase: '基本',
    scoreMul: '倍率',
    scoreDeduct: '減点',
    scoreGain: '加点',
    scoreAnyTwo: '2を所持',
    scoreTopTwo: '無頂大♠️2',
    scoreChao2: 'チャオ2',
    scoreChao3: 'チャオ3',
    scoreChao4: 'チャオ4',
    scoreChaoBig: '大チャオ',
    scorePenaltyBoost: '倍率ペナルティ',
    lastCardCall: 'ラストカード',
    noSuggest: '現在おすすめはありません。',
    needScore: '',
    recPass: 'パス。',
    recReady: 'すでに提案があります。先に出すかパスしてください。',
    accept: '採用',
    reject: '却下',
    start: 'が先手です。',
    played: 'を出した',
    cardBack: 'カード背面',
    blue: '青',
    red: '赤',
    theme: 'テーマ',
    themeOcean: 'オーシャンブルー',
    themeEmerald: 'エメラルドグリーン',
    themeSunset: 'サンセットオレンジ',
    themeSlate: 'スレートグレー',
    themeAurora: 'オーロラパープル',
    themeSand: 'サンドゴールド',
    themeCyber: 'ネオンナイト',
    useGoogleName: 'Google名を使用',
    signOut: 'サインアウト',
    lb: 'ランキング',
    opponents: '対戦相手',
    dob: '生年月日',
    hobbies: '趣味',
    profile: 'プロフィール',
    zodiac: '星座',
    motto: 'モットー',
    lbHeadingDesc: 'スコア差、勝利数、勝率に基づきランキングを更新します。',
    lbRefresh: 'ランキング更新',
    lbSort: '並び替え',
    lbPeriod: '期間',
    lbNoData: 'データがありません',
    lbTotalDelta: '総増減',
    lbWins: '勝利数',
    lbGames: '試合数',
    lbWinRate: '勝率',
    lbAvgDelta: '平均差',
    lbAll: '全期間',
    lb7d: '7日',
    lb30d: '30日',
    scoreGuide: 'スコア表',
    clickProfile: 'ネームカードをクリック',
    scoreGuideTitle: 'スコア算出',
    scoreGuideItems: [
      '全員5000点から開始。',
      '誰かが手札を出し切るとラウンド終了。',
      '敗者の基本点：残り1-9枚 x1、10-12枚 x2、13枚 x3。',
      '倍率ペナルティ：2を所持で x2、♠️2（最強）を所持でさらに x2。倍率は累積。',
      'ラストカード規則：次のプレイヤーが1枚で上がるのを止められない場合、他2人の減点も負担。',
      '敗者の減点合計が勝者に加算。',
    ],
    roomLobby: 'ロビー',
    roomTableTitle: 'ルーム',
    roomSettings: 'ルーム設定',
    roomCreate: 'ルーム作成',
    roomCreateHint: '「テーブル作成」をタップ👆🏻',
    roomJoin: 'ルーム参加',
    roomEnter: 'ロビーに入る',
    roomCode: 'ルームコード',
    roomCodeExample: 'ABC123',
    roomCopy: 'コードをコピー',
    roomReady: '準備完了',
    roomNotReady: '未準備',
    roomWaiting: '待機中',
    roomStart: '開始',
    roomLeave: 'ロビーに戻る',
    roomLoginRequired: 'ルームを作成または参加するにはサインインしてください。',
    roomFull: '満員です。',
    roomNotFound: 'ルームが見つかりません。',
    roomClosed: 'ルームは閉じています。',
    roomJoinFail: '参加に失敗しました。',
    roomCreateFail: '作成に失敗しました。',
    roomAlreadyIn:
      'すでに別のルームに参加しています。退出してから参加してください。',
    roomReadyHint: 'ホストの開始を待っています。',
    roomDisconnected: 'ルームから退出しました。再参加してください。',
    roomHost: 'ホスト',
    roomHostTag: 'ホスト',
    roomPrivacy: '公開範囲',
    roomPrivate: '非公開',
    roomPublic: '公開',
    roomNeedPlayers: 'ゲーム開始には少なくとも2人のプレイヤーが必要です。',
    roomRoomId: 'ルームID',
    roomRound: 'ラウンド',
    roomCountdown: '残り時間',
    emote: 'エモート',
    emoteLabelCool: 'クール',
    emoteLabelThrow: '投げる',
    emoteLabelRude: '失礼',
    emoteLabelSweat: '手札なし',
    emoteLabelRage: '激怒',
    emoteLabelSmash: '叩く',
    emoteLabelFire: '炎',
    emoteLabelThink: '考え中',
    emoteLabelCry: '泣く',
    emoteLabelCheers: '乾杯',
    emoteLabelThumbs: 'いいね',
    emoteLabelCrack: 'ヒビ',
    emoteLabelSleep: '眠い',
    emoteLabelLove: 'ハート',
    emoteLabelChampagne: 'シャンパン',
    emoteLabelShock: 'ショック',
    seatLabel: '席 {{n}}',
    roomAvailable: '参加可能',
    roomSeatOpen: '空席',
    roomActiveList: '参加可能なルーム',
    roomActiveEmpty: '参加可能なルームはありません。',
    roomActiveHidden: '非表示',
    roomActiveRefresh: '更新',
    secondsShort: '秒',
    roomStatusLabel: 'ルーム状態',
    roomStatusPlaying: 'プレイ中',
    roomWaitingReady: '参加者待ち',
    roomStarted: '対局中',
    roomWelcomeJoin: 'ようこそ',
    roomWaitingHost: 'ホストの開始待ち...',
    roomHostSneakAway: 'ホストはもうこっそり抜けたがっているようです。',
    roomKickedTimeout:
      '2回連続で時間切れになったため、Bot に置き換えられました。',
    roomReconnecting: '接続が切れました。再接続中...',
    roomStale: 'ルーム情報が古くなりました。ロビーに戻ってください。',
    roomJoinLog: '{{name}} が参加しました。',
    roomLeaveLog: '{{name}} が退出しました。',
    roomStarting: 'ルームを開始しています...',
    roomReadyCount: '準備 {{ready}}/{{total}}',
    roomSending: '送信中...',
    roomSendTimeout: '接続に問題があります — 再試行してください。',
  },
};
const KIND={
  'zh-HK':{single:'單張',pair:'一對',triple:'三條',straight:'蛇',flush:'花',fullhouse:'俘佬',fourofkind:'四條',straightflush:'同花順'},
  en:{single:'Single',pair:'Pair',triple:'Triple',straight:'Straight',flush:'Flush',fullhouse:'Full House',fourofkind:'Four Kind',straightflush:'Straight Flush'},
  fr:{single:'Carte',pair:'Paire',triple:'Brelan',straight:'Suite',flush:'Couleur',fullhouse:'Full',fourofkind:'Carré',straightflush:'Quinte flush'},
  de:{single:'Einzel',pair:'Paar',triple:'Drilling',straight:'Straße',flush:'Farbe',fullhouse:'Full House',fourofkind:'Vierling',straightflush:'Straight Flush'},
  es:{single:'Carta',pair:'Pareja',triple:'Trío',straight:'Escalera',flush:'Color',fullhouse:'Full',fourofkind:'Póker',straightflush:'Escalera de color'},
  ja:{single:'1枚',pair:'ペア',triple:'トリプル',straight:'ストレート',flush:'フラッシュ',fullhouse:'フルハウス',fourofkind:'フォーカード',straightflush:'ストレートフラッシュ'}
};
const LANGUAGE_OPTIONS=[
  {value:'zh-HK',labelKey:'zh'},
  {value:'en',labelKey:'en'},
  {value:'fr',labelKey:'fr'},
  {value:'de',labelKey:'de'},
  {value:'es',labelKey:'es'},
  {value:'ja',labelKey:'ja'}
];
const LANGUAGE_NATIVE_LABEL={
  'zh-HK':'繁體中文',
  en:'English',
  fr:'Français',
  de:'Deutsch',
  es:'Español',
  ja:'日本語'
};
const CALLOUT_RESPONSE_TEXT = {
  'zh-HK': {
    pass: ['大', '唔跟', '唔去', '過', 'Pass!'],
    last: [
      '最後一張！',
      '淨翻一張！',
      '埋門一腳！',
      '準備找數💰',
      'Last Card!',
    ],
    play: [
      (kind) => `${kind}！`,
      (kind) => `跟！${kind}`,
      (kind) => `${kind}，頂住。`,
      (kind) => `${kind}，大你少少😏`,
      (kind) => `${kind}，大過你😏`,
    ],
    winner: [
      '\u591A\u8B1D\u6652\u3002',
      '\u904B\u6C23\u597D\u5230\u5187\u670B\u53CB\uD83D\uDE43',
      '\u4ECA\u65E5\u624B\u6C23\u5E7E\u9806\u3002',
      '\u8D0F\u7FFB\u676F\u5976\u8336\u2615',
      '\u4ECA\u92EA\u6211\u8D0F\uff01',
      '\u884C\u904B\u884C\u5230\u8173\u8DBE\u5C3E',
    ],
    winnerRepeat: '\u5514\u597D\u610F\u601D\uff0c\u53C8\u4FC2\u6211\u3002',
  },
  en: {
    pass: ['Pass', 'No beat', 'I pass', 'Pass this round'],
    last: [
      'Last card!',
      'One card left!',
      'Final card!',
      'Get ready to pay up 💰',
      'Last card, watch it 😉',
    ],
    play: [
      (kind) => `${kind}!`,
      (kind) => `${kind}. Beat that.`,
      (kind) => `${kind}. Holding.`,
      (kind) => `${kind}, higher.`,
    ],
    winner: [
      'Thanks a lot.',
      'Just got lucky.',
      'My luck is pretty good today.',
      'Won back bubble tea ☕',
      'This round is mine!',
      'Lucky down to my toes.',
    ],
    winnerRepeat: 'Sorry, me again.',
  },
  fr: {
    pass: ['Je passe', 'Passe', 'À toi'],
    last: ['Dernière carte !', 'Une carte !'],
    play: [
      (kind) => `${kind} !`,
      (kind) => `${kind}. À toi.`,
      (kind) => `${kind}.`,
    ],
    winner: [
      'Bien joué.',
      'Coup de chance.',
      'Cette manche est à moi !'
    ],
    winnerRepeat: 'Encore moi.',
  },
  de: {
    pass: ['Ich passe', 'Passe', 'Du bist dran'],
    last: ['Letzte Karte!', 'Nur noch eine!'],
    play: [
      (kind) => `${kind}!`,
      (kind) => `${kind}. Dein Zug.`,
      (kind) => `${kind}.`,
    ],
    winner: [
      'Gut gespielt.',
      'Glück gehabt.',
      'Diese Runde gehört mir!'
    ],
    winnerRepeat: 'Schon wieder ich.',
  },
  es: {
    pass: ['Paso', 'No voy', 'Te toca'],
    last: ['¡Última carta!', '¡Una carta!'],
    play: [
      (kind) => `¡${kind}!`,
      (kind) => `${kind}. Tu turno.`,
      (kind) => `${kind}.`,
    ],
    winner: [
      'Bien jugado.',
      'Solo suerte.',
      '¡Esta ronda es mía!'
    ],
    winnerRepeat: 'Otra vez yo.',
  },
  ja: {
    pass: ['パス', '出せない', 'あなたの番'],
    last: ['ラストカード！', '残り1枚！'],
    play: [
      (kind) => `${kind}！`,
      (kind) => `${kind}、どうぞ。`,
      (kind) => `${kind}。`,
    ],
    winner: [
      'いい勝負でした。',
      '運が良かった。',
      'このラウンドは私の勝ち！'
    ],
    winnerRepeat: 'また私ですね。',
  },
};
const app=document.getElementById('app');
const state={language:'zh-HK',screen:'home',screenBeforeConfig:'home',showRules:false,showLog:false,showLogSheet:false,logTouched:false,showScoreGuide:false,opponentProfileName:'',mottoPeekName:'',selected:new Set(),drag:{id:null,moved:false},playAnimKey:'',autoPassKey:'',score:5000,suggestCost:0,recommendation:null,recommendHint:'',logFab:{x:null,y:null},home:{mode:'solo',name:'玩家',gender:'male',avatarChoice:'male',aiDifficulty:'normal',backColor:'red',theme:'ocean',showIntro:false,showLeaderboard:false,google:{signedIn:false,provider:'',name:'',email:'',uid:'',sub:'',token:'',picture:'',gender:''},leaderboard:{rows:[],sort:'totalDelta',period:'all',limit:20},activeRooms:{rows:[],loading:false,loadedAt:0,error:''}},room:{id:'',code:'',firebaseInstanceId:'',data:null,joinOpen:false,error:'',started:false,unsub:null,selfSeat:-1,recordedGameKey:'',lastMoveKey:'',playerId:'',pendingStart:false,lastResultPlayers:null},sessionId:'',solo:{players:[],botNames:[],totals:[5000,5000,5000,5000],currentSeat:0,lastPlay:null,passStreak:0,isFirstTrick:true,gameOver:false,status:'',history:[],aiDifficulty:'normal',lastCardBreach:null},emote:{open:false,active:null}};
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
let emoteTimer=null;
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
let googleInlineRetryTimer=null;
let googleIdentityInitialized=false;
let googleScriptReloading=false;
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
const BOT_PROFILE_POOL=[
  {name:'志明',gender:'male'},
  {name:'俊傑',gender:'male'},
  {name:'家樂',gender:'male'},
  {name:'子朗',gender:'male'},
  {name:'少龍',gender:'male'},
  {name:'天樂',gender:'male'},
  {name:'嘉欣',gender:'female'},
  {name:'芷晴',gender:'female'},
  {name:'穎欣',gender:'female'},
  {name:'佩儀',gender:'female'},
  {name:'詠琪',gender:'female'},
  {name:'秀文',gender:'female'},
  {name:'澄希',gender:'female'},
  {name:'葵芳',gender:'female'},
  {name:'Nova',gender:'female'},
  {name:'Milo',gender:'male'},
  {name:'Jade',gender:'female'},
  {name:'Axel',gender:'male'},
  {name:'Iris',gender:'female'},
  {name:'Luna',gender:'female'},
  {name:'ReXX',gender:'male'},
  {name:'Nora',gender:'female'},
  {name:'Kane',gender:'male'},
  {name:'Skye',gender:'female'},
  {name:'Orion',gender:'male'},
  {name:'葵兄',gender:'male'},
  {name:'Jax',gender:'male'}
];
const BOT_PROFILES={zh:BOT_PROFILE_POOL,en:BOT_PROFILE_POOL};
const OPPONENT_PROFILE_BY_NAME={
  '志明':{
    dob:'1992-05-18',
    hobbies:{'zh-HK':['海釣','桌上遊戲','即影即有'],en:['shore fishing','board games','instant photos']},
    profile:{'zh-HK':['開局像慢煮湯，越拖越香。他最愛說「再等一手」，其實早就算好你會誤判，連你會用哪張牌都猜中。','他最擅長拖你到你自己心急，然後在你出錯那秒收尾。桌上最安靜，但最會算，像老派會計把每張牌都記在心裡。'],en:['Opens like a slow simmer, then flips the table at the perfect time. He says “one more hand” while already reading your next card.','He drags you into impatience and ends it on your mistake. Quiet at the table, loud in the math—every card is already booked.']},
    zodiac:{'zh-HK':'金牛座',en:'Taurus'},
    motto:{'zh-HK':'慢就係快。',en:'Slow is smooth.'}
  },
  '俊傑':{
    dob:'1990-11-03',
    hobbies:{'zh-HK':['跑步','棋類','咖啡拉花'],en:['running','chess variants','latte art']},
    profile:{'zh-HK':['最愛把牌排成棋盤，再用咖啡杯當計時器。輸給他不是輸牌，是輸節奏，連你呼吸的節拍都會被他帶走。','他會記你每一次出錯的節奏，下一局還會重播。對他而言，牌局只是時間管理課，勝負只是加分題。'],en:['Arranges cards like a chessboard and times turns with a coffee cup. You don’t lose to his cards, you lose to his tempo—even your breathing follows it.','He remembers your mistakes by tempo and replays them next round. To him, the game is time management, winning is just extra credit.']},
    zodiac:{'zh-HK':'天蠍座',en:'Scorpio'},
    motto:{'zh-HK':'每步都要值回票價。',en:'Make every move count.'}
  },
  '家樂':{
    dob:'1994-02-27',
    hobbies:{'zh-HK':['街拍','電影海報收藏','模型'],en:['street photography','movie posters','model kits']},
    profile:{'zh-HK':['出牌像快門，咔嚓一聲就爆你節奏。喜歡快攻，偶爾也會浪漫到留最後一張，讓你以為還有機會。','他會在你覺得要爆的時候留一手，然後用最後的浪漫收尾。照片上你還在笑，結果他已經清桌。'],en:['Plays like a camera shutter—click, your rhythm is gone. Loves fast attacks, sometimes keeps one card just for the drama.','He keeps a card when you think he is all-in, then finishes with a dramatic last touch. You are still smiling in the photo while he already cleared the table.']},
    zodiac:{'zh-HK':'雙魚座',en:'Pisces'},
    motto:{'zh-HK':'快一步，靚好多。',en:'One step faster, a lot sharper.'}
  },
  '子朗':{
    dob:'1996-07-09',
    hobbies:{'zh-HK':['籃球','機械鍵盤','城市夜景'],en:['basketball','mechanical keyboards','city nights']},
    profile:{'zh-HK':['看似佛系，其實暗藏殺招。末段一波連出，像球場快攻，快到你還在想就已經結束。','他不多話，卻最愛用一波連出讓你懷疑人生。你以為是運氣，其實是他早就排好的路線。'],en:['Looks chill, hides a dagger. Late game bursts like a fast break—so fast you are still thinking when it ends.','Few words, but a rapid sequence that makes you question everything. What looks like luck is just his route, pre‑planned.']},
    zodiac:{'zh-HK':'巨蟹座',en:'Cancer'},
    motto:{'zh-HK':'留到最後先開火。',en:'Save the strike for last.'}
  },
  '少龍':{
    dob:'1991-03-22',
    hobbies:{'zh-HK':['登山','拳擊訓練','武俠小說'],en:['hiking','boxing drills','wuxia novels']},
    profile:{'zh-HK':['出牌像練拳，先探路再重擊。你一眨眼，他就全桌清空，連你的反應都變慢。','他會先讓你覺得安全，然後突然加速收尾。等你回神，他已經把節奏鎖死。'],en:['Boxes with the deck—probe, feint, then a heavy punch. Blink and the table is empty, and your reactions feel slow.','He lets you feel safe, then hits the accelerator to finish. By the time you notice, the tempo is locked.']},
    zodiac:{'zh-HK':'白羊座',en:'Aries'},
    motto:{'zh-HK':'先手就係王道。',en:'Lead and dominate.'}
  },
  '天樂':{
    dob:'1993-09-14',
    hobbies:{'zh-HK':['吉他','慢跑','旅行計劃'],en:['guitar','jogging','trip planning']},
    profile:{'zh-HK':['說話慢慢，出牌更慢，但每一步都踩在節拍上。你越急，他越穩，像慢歌的鼓點。','他會把節奏拉到你睡著，再用一記乾淨收牌。最後一手很安靜，但你會聽到心碎聲。'],en:['Speaks slow, plays slower—always on beat. The more you rush, the steadier he becomes, like a slow drum.','He slows the tempo until you drift, then closes with clean hands. The last move is quiet, but it lands.']},
    zodiac:{'zh-HK':'處女座',en:'Virgo'},
    motto:{'zh-HK':'穩先，唔好急。',en:'Steady first, speed later.'}
  },
  '嘉欣':{
    dob:'1995-01-30',
    hobbies:{'zh-HK':['烘焙','插畫','香薰'],en:['baking','illustration','aromatherapy']},
    profile:{'zh-HK':['牌桌像烤箱，先升溫再反殺。最怕你亂來，因為她最愛你亂來，越亂越香。','她最愛看你自亂陣腳，因為那是她的甜點時間。你以為她在放水，她其實在量火候。'],en:['Treats the table like an oven—preheat, then serve a surprise. Hopes you overreach, then punishes it.','She waits for you to spiral; that is when dessert is served. What you think is mercy is just heat control.']},
    zodiac:{'zh-HK':'水瓶座',en:'Aquarius'},
    motto:{'zh-HK':'氣定神閒先贏。',en:'Stay cool, win clean.'}
  },
  '芷晴':{
    dob:'1997-06-12',
    hobbies:{'zh-HK':['瑜伽','花藝','攝影'],en:['yoga','floral design','photography']},
    profile:{'zh-HK':['動作輕柔卻刀刀見骨。別被她的微笑騙了，微笑是她的煙幕彈。','你以為她在養牌，其實她在養你。等你以為安全，她就用最小的牌把你推下去。'],en:['Soft moves, sharp results. Don’t let the smile fool you—it is just smoke.','You think she is slow-building, she is just baiting you. When you feel safe, the smallest card pushes you off.']},
    zodiac:{'zh-HK':'雙子座',en:'Gemini'},
    motto:{'zh-HK':'溫柔也可以致命。',en:'Soft can still sting.'}
  },
  '穎欣':{
    dob:'1992-08-05',
    hobbies:{'zh-HK':['爵士樂','手作','陶藝'],en:['jazz','handcrafts','ceramics']},
    profile:{'zh-HK':['喜歡連段節奏，像即興爵士。你以為她迷路，其實她在鋪路，每一手都是節拍器。','她會把最強的組合留到你覺得安全那刻。等你放鬆，她的副歌就上來了。'],en:['Strings combos like jazz riffs. When you think she is lost, she is setting a trap, each hand a metronome.','She saves the strongest combo for the moment you feel safe. Once you relax, the chorus hits.']},
    zodiac:{'zh-HK':'獅子座',en:'Leo'},
    motto:{'zh-HK':'連段先係表演。',en:'Combos are the show.'}
  },
  '佩儀':{
    dob:'1994-12-19',
    hobbies:{'zh-HK':['閱讀','烘焙','拼圖'],en:['reading','baking','puzzles']},
    profile:{'zh-HK':['慢慢拼圖，慢慢拆你手牌。看起來保守，其實很會算，每一張都在她的棋盤裡。','她的牌桌像拼圖桌，最後一塊永遠在她手上。你以為只差一張，她已經收好盒子。'],en:['Builds a puzzle, then disassembles your hand. Conservative on the surface, ruthless underneath, every card has a slot.','Her table is a puzzle; the last piece is always in her hand. When you think you are one card away, she is already packing.']},
    zodiac:{'zh-HK':'射手座',en:'Sagittarius'},
    motto:{'zh-HK':'算清楚先出手。',en:'Count it, then strike.'}
  },
  '詠琪':{
    dob:'1991-10-11',
    hobbies:{'zh-HK':['旅行誌','街頭小吃','畫畫'],en:['travel journals','street food','sketching']},
    profile:{'zh-HK':['喜歡冒險路線，一手牌能走三條路。你猜不透她下一站，因為她自己也想試新路。','她的路線不固定，你的預判卻一直固定。她最愛用你的自信把你帶離正路。'],en:['Always takes the scenic route—one hand, three lines. You never know her next stop because she likes the detour.','Her routes change; your predictions do not. She uses your confidence to pull you off course.']},
    zodiac:{'zh-HK':'天秤座',en:'Libra'},
    motto:{'zh-HK':'隨機應變，最穩。',en:'Adapt fast, stay balanced.'}
  },
  '秀文':{
    dob:'1993-04-02',
    hobbies:{'zh-HK':['園藝','輕音樂','手沖咖啡'],en:['gardening','lo-fi music','pour-over coffee']},
    profile:{'zh-HK':['慢熱型，但一開花就停不下來。最後幾手通常最兇，你會突然發現已經追不回來。','前半場像散步，後半場像開花火。她會等到你放鬆那刻再點火。'],en:['Slow grower, then unstoppable bloom. Most dangerous in the last few hands—you realize too late.','First half is a stroll, second half is fireworks. She waits for your guard to drop, then lights it up.']},
    zodiac:{'zh-HK':'白羊座',en:'Aries'},
    motto:{'zh-HK':'後段先係主場。',en:'Late game is home turf.'}
  },
  '澄希':{
    dob:'1996-09-03',
    hobbies:{'zh-HK':['海邊跑步','城市探店','底片相機'],en:['seaside runs','city food hunts','film cameras']},
    profile:{'zh-HK':['她像海風一樣，來得快、走得也快。前段用節奏把你帶離正軌，後段直接收線。','她最擅長用很普通的牌打出高級感，讓你以為她在省牌，其實她在省你的路。'],en:['She moves like a sea breeze—fast in, fast out. Early tempo pulls you off course; late game she just closes the line.','She makes ordinary cards look premium, so you think she is conserving. She is really conserving your options.']},
    zodiac:{'zh-HK':'處女座',en:'Virgo'},
    motto:{'zh-HK':'風向對，就唔洗出力。',en:'With the right wind, you barely push.'}
  },
  '葵芳':{
    dob:'1995-08-18',
    hobbies:{'zh-HK':['夜間活動','飲酒'],en:['night activities','drinks']},
    profile:{'zh-HK':['夜越深越清醒，出牌節奏像霓虹一樣閃爍。她習慣在你最放鬆時加速收尾。','她愛夜場的節拍，也愛用節拍把你拖入她的節奏裡。'],en:['More awake as night deepens, her tempo flashes like neon. She speeds up when you relax.','She loves the night’s rhythm and pulls you into it with every hand.']},
    zodiac:{'zh-HK':'獅子座',en:'Leo'},
    motto:{'zh-HK':'夜深先係主場。',en:'Night is the home court.'}
  },
  '葵兄':{
    dob:'1992-10-04',
    hobbies:{'zh-HK':['夜生活','深夜食堂','夜跑'],en:['nightlife','late-night eats','night runs']},
    profile:{'zh-HK':['喜歡夜生活，越夜越精神。節奏快狠準，出手唔拖泥帶水。','夜晚先係佢嘅主場，出牌像霓虹閃過，快得你未反應佢已經收尾。'],en:['Lives for the night. Faster tempo, sharper strikes, no hesitation.','Night is his arena—neon-fast plays and clean finishes before you can react.']},
    zodiac:{'zh-HK':'天蠍座',en:'Scorpio'},
    motto:{'zh-HK':'夜晚先係舞台。',en:'Night is the stage.'}
  },
  'Jax':{
    dob:'1990-07-02',
    hobbies:{'zh-HK':['3D 繪圖','打機','童軍','游泳'],en:['3D drawing','gaming','cadet','swimming']},
    profile:{'zh-HK':['做事有條理，習慣先畫模型再落手。節奏穩定，出牌像在校準。','鍾意訓練同耐力運動，牌局一拖長就變成佢嘅節奏。'],en:['Methodical and precise, he models first then executes. Steady tempo, calibrated plays.','He likes drills and endurance—long games turn into his rhythm.']},
    zodiac:{'zh-HK':'巨蟹座',en:'Cancer'},
    motto:{'zh-HK':'先量再落。',en:'Measure, then move.'}
  },
  'Nova':{
    dob:'1998-03-08',
    hobbies:{'zh-HK':['觀星','合成器音樂','魔方'],en:['stargazing','synth music','speed cubing']},
    profile:{'zh-HK':['腦內像星圖，總能預判你下手。出牌乾脆，收尾超快，像導航把你帶進死巷。','她會先清出你能看到的路，再把看不到的路封死。你以為有三條路，其實只有她那條。'],en:['Plays with a star map in mind—predicts your next move. Clean, fast, and surgical, like a GPS into a dead end.','She clears the obvious path, then blocks the hidden one. You think you have three routes; she keeps one.']},
    zodiac:{'zh-HK':'雙魚座',en:'Pisces'},
    motto:{'zh-HK':'看得遠，先著數。',en:'See far, win early.'}
  },
  'Milo':{
    dob:'1991-07-21',
    hobbies:{'zh-HK':['街籃','滑板','拉麵地圖'],en:['streetball','skateboarding','ramen hunts']},
    profile:{'zh-HK':['快攻型選手，第一波就要把你推下坡，讓你從一開始就被迫防守。','他要你跟他跑，但你根本跟不上。等你喘過氣，他已經在終點線上揮手。'],en:['All-in on speed. The first rush is meant to push you downhill and keep you defending.','He wants you to run with him. You cannot. By the time you breathe, he is waving at the finish.']},
    zodiac:{'zh-HK':'獅子座',en:'Leo'},
    motto:{'zh-HK':'快，先贏一半。',en:'Speed wins half.'}
  },
  'Jade':{
    dob:'1996-01-16',
    hobbies:{'zh-HK':['書法','城市散步','黑膠'],en:['calligraphy','city walks','vinyl']},
    profile:{'zh-HK':['出牌像寫字，線條俐落。你以為他慢，其實他只是不亂，筆畫少但每一筆都準。','他討厭浪費牌，因為每張都該有角色。你打亂他的節奏，他會用更簡短的句子回你。'],en:['Plays like calligraphy—clean lines, no wasted strokes. You think he is slow, he just refuses chaos.','He hates wasting cards; every card must play a role. Try to disrupt him and he answers with shorter, cleaner lines.']},
    zodiac:{'zh-HK':'摩羯座',en:'Capricorn'},
    motto:{'zh-HK':'唔亂先贏。',en:'Order beats chaos.'}
  },
  'Axel':{
    dob:'1990-09-27',
    hobbies:{'zh-HK':['滑雪','街機','復古相機'],en:['snowboarding','arcades','retro cameras']},
    profile:{'zh-HK':['敢上高坡就敢滑下來。高風險高回報，輸一次都不介意。','他相信一波翻盤勝過十次小贏。你以為他亂，其實他在等最刺激的角度。'],en:['High slopes, high stakes. He is fine losing once for a big return.','He would rather flip the table once than win small ten times. What looks wild is just his favorite angle.']},
    zodiac:{'zh-HK':'天秤座',en:'Libra'},
    motto:{'zh-HK':'搏一搏，單車變跑車。',en:'Bet big, win big.'}
  },
  'Iris':{
    dob:'1995-05-04',
    hobbies:{'zh-HK':['陶藝','書店咖啡','水彩'],en:['pottery','book cafés','watercolor']},
    profile:{'zh-HK':['喜歡慢慢堆塔，堆好就一口氣推倒。她的耐心比你的手牌還長。','她會把你最愛的路線一點點封起來。等你發現時，你的路已經變成她的路。'],en:['Builds patiently, then knocks the tower down. Her patience outlasts your hand.','She quietly seals off the line you love most. When you notice, your road already belongs to her.']},
    zodiac:{'zh-HK':'金牛座',en:'Taurus'},
    motto:{'zh-HK':'慢功出細貨。',en:'Patience pays.'}
  },
  'Luna':{
    dob:'1997-10-23',
    hobbies:{'zh-HK':['夜市','獨立電影','手帳'],en:['night markets','indie films','journaling']},
    profile:{'zh-HK':['節奏多變，忽快忽慢。你一鬆懈，她就收尾，像突然關燈那一刻。','她會故意慢一拍，讓你先出錯。你以為是錯覺，其實是她的節拍器。'],en:['Switches pace on a dime. Relax once and she finishes, like lights out.','She pauses a beat on purpose, so you blink first. What feels like a glitch is her metronome.']},
    zodiac:{'zh-HK':'天蠍座',en:'Scorpio'},
    motto:{'zh-HK':'變速先係武器。',en:'Tempo is the weapon.'}
  },
  'ReXX':{
    dob:'1989-12-07',
    hobbies:{'zh-HK':['羽毛球','策略遊戲','播客'],en:['badminton','strategy games','podcasts']},
    profile:{'zh-HK':['穩定器型選手，犯錯率極低。你要贏他得靠冒險，但冒險就是他的陷阱。','他會逼你做選擇，然後把兩條路都堵住。你越想贏，越掉進他的節奏。'],en:['Low error rate, high discipline. You beat him by taking risks, but risk is his trap.','He forces a choice, then blocks both roads. The more you chase the win, the deeper you fall into his tempo.']},
    zodiac:{'zh-HK':'射手座',en:'Sagittarius'},
    motto:{'zh-HK':'穩定先係輸少。',en:'Stability saves.'}
  },
  'Nora':{
    dob:'1996-02-10',
    hobbies:{'zh-HK':['烘焙','網球','修圖'],en:['baking','tennis','photo edits']},
    profile:{'zh-HK':['平衡型，節奏舒服但不會放水。她像空調一樣，永遠在你覺得剛好的溫度。','她最會把局勢維持在剛剛好，讓你不敢冒險。等你猶豫，她就已經走完。'],en:['Balanced and steady—friendly pace, no free wins. She is like perfect air‑conditioning, always “just right.”','She keeps the game at just right so you will not risk it. While you hesitate, she is already done.']},
    zodiac:{'zh-HK':'水瓶座',en:'Aquarius'},
    motto:{'zh-HK':'舒服唔代表放鬆。',en:'Calm doesn’t mean soft.'}
  },
  'Kane':{
    dob:'1992-04-15',
    hobbies:{'zh-HK':['拳擊','圖案T','電單車'],en:['boxing','graphic tees','motorbikes']},
    profile:{'zh-HK':['喜歡硬碰硬，越打越亢奮。對他來說，安穩的牌局等於無聊。','他越被壓就越狠，像彈簧。你以為他在撐，其實他在蓄力。'],en:['Prefers head‑on clashes. The longer the fight, the more alive he gets.','The more you press, the harder he snaps back. You think he is surviving; he is charging.']},
    zodiac:{'zh-HK':'白羊座',en:'Aries'},
    motto:{'zh-HK':'硬拼先有戲。',en:'Go hard or go home.'}
  },
  'Skye':{
    dob:'1998-11-29',
    hobbies:{'zh-HK':['皮拉提斯','lo‑fi','文具收藏'],en:['pilates','lo‑fi beats','stationery']},
    profile:{'zh-HK':['表面溫柔，內心精算。最後一手最狠，像畫龍點睛。','她的微笑是陷阱，最後一張是鎖。你以為她在聊天，其實她在收網。'],en:['Soft vibe, sharp math. Deadly on the last card, like the final stroke.','Her smile is bait, her last card is the lock. You think she is chatting; she is closing the net.']},
    zodiac:{'zh-HK':'射手座',en:'Sagittarius'},
    motto:{'zh-HK':'尾段才是真功夫。',en:'The endgame tells all.'}
  },
  'Orion':{
    dob:'1990-02-02',
    hobbies:{'zh-HK':['天文攝影','登高夜景','競技遊戲'],en:['astro photography','city night hikes','competitive games']},
    profile:{'zh-HK':['他像星圖導航，先標記你所有出路，再一個個收掉。你以為還有選擇，其實已經被他圈住。','他不怕慢，怕的是你太快亂來。只要你一急，他就會用最簡單的牌把你關燈。'],en:['He plays like a star chart—marks every exit, then closes them one by one. You think you have options; he has already ringed you.','He is not afraid of slow, only of you rushing. The moment you panic, he ends it with the simplest cards.']},
    zodiac:{'zh-HK':'水瓶座',en:'Aquarius'},
    motto:{'zh-HK':'睇清先落。',en:'See it, then land it.'}
  }
};
const BACK_OPTIONS=[
  {value:'blue',file:'back-blue.png',preview:'back-blue-sm.png',label:{'zh-HK':'藍色',en:'Blue',fr:'Bleu',de:'Blau',es:'Azul',ja:'青'}},
  {value:'red',file:'back-red.png',preview:'back-red-sm.png',label:{'zh-HK':'紅色',en:'Red',fr:'Rouge',de:'Rot',es:'Rojo',ja:'赤'}},
  {value:'green',file:'back-green.png',preview:'back-green-sm.png',label:{'zh-HK':'綠色',en:'Green',fr:'Vert',de:'Grün',es:'Verde',ja:'緑'}},
  {value:'gold',file:'back-gold.png',preview:'back-gold-sm.png',label:{'zh-HK':'金色',en:'Gold',fr:'Or',de:'Gold',es:'Oro',ja:'金'}},
  {value:'silver',file:'back-silver.png',preview:'back-silver-sm.png',label:{'zh-HK':'銀色',en:'Silver',fr:'Argent',de:'Silber',es:'Plata',ja:'銀'}},
  {value:'purple',file:'back-purple.png',preview:'back-purple-sm.png',label:{'zh-HK':'紫色',en:'Purple',fr:'Violet',de:'Lila',es:'Morado',ja:'紫'}}
];
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
function zodiacSymbol(name=''){
  const key=String(name??'').toLowerCase();
  if(!key)return'';
  if(key.includes('aries')||key.includes('白羊'))return'♈';
  if(key.includes('taurus')||key.includes('金牛'))return'♉';
  if(key.includes('gemini')||key.includes('雙子'))return'♊';
  if(key.includes('cancer')||key.includes('巨蟹'))return'♋';
  if(key.includes('leo')||key.includes('獅子'))return'♌';
  if(key.includes('virgo')||key.includes('處女'))return'♍';
  if(key.includes('libra')||key.includes('天秤'))return'♎';
  if(key.includes('scorpio')||key.includes('天蠍'))return'♏';
  if(key.includes('sagittarius')||key.includes('射手'))return'♐';
  if(key.includes('capricorn')||key.includes('摩羯'))return'♑';
  if(key.includes('aquarius')||key.includes('水瓶'))return'♒';
  if(key.includes('pisces')||key.includes('雙魚'))return'♓';
  return'';
}
const PROFILE_HOBBY_TRANSLATIONS={
  fr:{
    'shore fishing':'pêche en bord de mer',
    'board games':'jeux de société',
    'instant photos':'photos instantanées',
    'running':'course à pied',
    'chess variants':'variantes d’échecs',
    'latte art':'latte art',
    'street photography':'photo de rue',
    'movie posters':'affiches de films',
    'model kits':'maquettes',
    'basketball':'basket-ball',
    'mechanical keyboards':'claviers mécaniques',
    'city nights':'nuits urbaines',
    'hiking':'randonnée',
    'boxing drills':'entraînement de boxe',
    'wuxia novels':'romans wuxia',
    'guitar':'guitare',
    'jogging':'jogging',
    'trip planning':'planification de voyages',
    'baking':'pâtisserie',
    'illustration':'illustration',
    'aromatherapy':'aromathérapie',
    'yoga':'yoga',
    'floral design':'art floral',
    'photography':'photographie',
    'jazz':'jazz',
    'handcrafts':'artisanat',
    'ceramics':'céramique',
    'reading':'lecture',
    'puzzles':'puzzles',
    'travel journals':'carnets de voyage',
    'street food':'street food',
    'sketching':'croquis',
    'gardening':'jardinage',
    'lo-fi music':'musique lo‑fi',
    'pour-over coffee':'café filtre',
    'seaside runs':'course en bord de mer',
    'city food hunts':'chasse aux bonnes adresses',
    'film cameras':'appareils argentiques',
    'night activities':'sorties nocturnes',
    'drinks':'boissons',
    'nightlife':'vie nocturne',
    'late-night eats':'repas tardifs',
    'night runs':'courses de nuit',
    '3D drawing':'dessin 3D',
    'gaming':'jeux vidéo',
    'cadet':'cadets',
    'swimming':'natation',
    'stargazing':'observation des étoiles',
    'synth music':'musique synthé',
    'speed cubing':'speed cubing',
    'streetball':'streetball',
    'skateboarding':'skateboard',
    'ramen hunts':'chasse aux ramen',
    'calligraphy':'calligraphie',
    'city walks':'balades en ville',
    'vinyl':'vinyle',
    'snowboarding':'snowboard',
    'arcades':'salles d’arcade',
    'retro cameras':'appareils rétro',
    'pottery':'poterie',
    'book cafés':'cafés‑librairies',
    'watercolor':'aquarelle',
    'night markets':'marchés de nuit',
    'indie films':'films indépendants',
    'journaling':'journal intime',
    'badminton':'badminton',
    'strategy games':'jeux de stratégie',
    'podcasts':'podcasts',
    'tennis':'tennis',
    'photo edits':'retouche photo',
    'boxing':'boxe',
    'graphic tees':'t‑shirts graphiques',
    'motorbikes':'motos',
    'pilates':'pilates',
    'lo‑fi beats':'beats lo‑fi',
    'stationery':'papeterie',
    'astro photography':'astrophotographie',
    'city night hikes':'randos nocturnes en ville',
    'competitive games':'jeux compétitifs'
  },
  de:{
    'shore fishing':'Küstenangeln',
    'board games':'Brettspiele',
    'instant photos':'Sofortfotos',
    'running':'Laufen',
    'chess variants':'Schachvarianten',
    'latte art':'Latte Art',
    'street photography':'Straßenfotografie',
    'movie posters':'Filmplakate',
    'model kits':'Modellbausätze',
    'basketball':'Basketball',
    'mechanical keyboards':'mechanische Tastaturen',
    'city nights':'Stadtnächte',
    'hiking':'Wandern',
    'boxing drills':'Boxtraining',
    'wuxia novels':'Wuxia‑Romane',
    'guitar':'Gitarre',
    'jogging':'Jogging',
    'trip planning':'Reiseplanung',
    'baking':'Backen',
    'illustration':'Illustration',
    'aromatherapy':'Aromatherapie',
    'yoga':'Yoga',
    'floral design':'Floristik',
    'photography':'Fotografie',
    'jazz':'Jazz',
    'handcrafts':'Handarbeit',
    'ceramics':'Keramik',
    'reading':'Lesen',
    'puzzles':'Puzzles',
    'travel journals':'Reisetagebücher',
    'street food':'Streetfood',
    'sketching':'Skizzieren',
    'gardening':'Gartenarbeit',
    'lo-fi music':'Lo‑Fi‑Musik',
    'pour-over coffee':'Filterkaffee',
    'seaside runs':'Läufe am Meer',
    'city food hunts':'Food‑Hunts in der Stadt',
    'film cameras':'Analogkameras',
    'night activities':'Nachtaktivitäten',
    'drinks':'Getränke',
    'nightlife':'Nachtleben',
    'late-night eats':'Spät‑Essen',
    'night runs':'Nachtläufe',
    '3D drawing':'3D‑Zeichnen',
    'gaming':'Gaming',
    'cadet':'Kadetten',
    'swimming':'Schwimmen',
    'stargazing':'Sternenbeobachtung',
    'synth music':'Synth‑Musik',
    'speed cubing':'Speed Cubing',
    'streetball':'Streetball',
    'skateboarding':'Skateboarding',
    'ramen hunts':'Ramen‑Suche',
    'calligraphy':'Kalligrafie',
    'city walks':'Stadtspaziergänge',
    'vinyl':'Vinyl',
    'snowboarding':'Snowboarden',
    'arcades':'Spielhallen',
    'retro cameras':'Retro‑Kameras',
    'pottery':'Töpfern',
    'book cafés':'Buchcafés',
    'watercolor':'Aquarell',
    'night markets':'Nachtmärkte',
    'indie films':'Indie‑Filme',
    'journaling':'Journaling',
    'badminton':'Badminton',
    'strategy games':'Strategiespiele',
    'podcasts':'Podcasts',
    'tennis':'Tennis',
    'photo edits':'Fotobearbeitung',
    'boxing':'Boxen',
    'graphic tees':'Grafik‑T‑Shirts',
    'motorbikes':'Motorräder',
    'pilates':'Pilates',
    'lo‑fi beats':'Lo‑Fi‑Beats',
    'stationery':'Schreibwaren',
    'astro photography':'Astrofotografie',
    'city night hikes':'nächtliche Stadtwanderungen',
    'competitive games':'Wettkampfspiele'
  },
  es:{
    'shore fishing':'pesca costera',
    'board games':'juegos de mesa',
    'instant photos':'fotos instantáneas',
    'running':'correr',
    'chess variants':'variantes de ajedrez',
    'latte art':'latte art',
    'street photography':'fotografía callejera',
    'movie posters':'pósters de cine',
    'model kits':'maquetas',
    'basketball':'baloncesto',
    'mechanical keyboards':'teclados mecánicos',
    'city nights':'noches urbanas',
    'hiking':'senderismo',
    'boxing drills':'entrenamiento de boxeo',
    'wuxia novels':'novelas wuxia',
    'guitar':'guitarra',
    'jogging':'trote',
    'trip planning':'planificación de viajes',
    'baking':'repostería',
    'illustration':'ilustración',
    'aromatherapy':'aromaterapia',
    'yoga':'yoga',
    'floral design':'diseño floral',
    'photography':'fotografía',
    'jazz':'jazz',
    'handcrafts':'artesanías',
    'ceramics':'cerámica',
    'reading':'lectura',
    'puzzles':'rompecabezas',
    'travel journals':'diarios de viaje',
    'street food':'comida callejera',
    'sketching':'bocetos',
    'gardening':'jardinería',
    'lo-fi music':'música lo‑fi',
    'pour-over coffee':'café filtrado',
    'seaside runs':'correr junto al mar',
    'city food hunts':'búsqueda de comida en la ciudad',
    'film cameras':'cámaras analógicas',
    'night activities':'actividades nocturnas',
    'drinks':'bebidas',
    'nightlife':'vida nocturna',
    'late-night eats':'comida nocturna',
    'night runs':'correr de noche',
    '3D drawing':'dibujo 3D',
    'gaming':'videojuegos',
    'cadet':'cadetes',
    'swimming':'natación',
    'stargazing':'observación de estrellas',
    'synth music':'música synth',
    'speed cubing':'speed cubing',
    'streetball':'streetball',
    'skateboarding':'skateboarding',
    'ramen hunts':'búsqueda de ramen',
    'calligraphy':'caligrafía',
    'city walks':'paseos por la ciudad',
    'vinyl':'vinilo',
    'snowboarding':'snowboard',
    'arcades':'salas recreativas',
    'retro cameras':'cámaras retro',
    'pottery':'cerámica',
    'book cafés':'cafés con libros',
    'watercolor':'acuarela',
    'night markets':'mercados nocturnos',
    'indie films':'cine indie',
    'journaling':'diario personal',
    'badminton':'bádminton',
    'strategy games':'juegos de estrategia',
    'podcasts':'podcasts',
    'tennis':'tenis',
    'photo edits':'edición de fotos',
    'boxing':'boxeo',
    'graphic tees':'camisetas gráficas',
    'motorbikes':'motocicletas',
    'pilates':'pilates',
    'lo‑fi beats':'beats lo‑fi',
    'stationery':'papelería',
    'astro photography':'astrofotografía',
    'city night hikes':'paseos nocturnos por la ciudad',
    'competitive games':'juegos competitivos'
  },
  ja:{
    'shore fishing':'海釣り',
    'board games':'ボードゲーム',
    'instant photos':'インスタント写真',
    'running':'ランニング',
    'chess variants':'チェスのバリエーション',
    'latte art':'ラテアート',
    'street photography':'ストリート写真',
    'movie posters':'映画ポスター',
    'model kits':'模型',
    'basketball':'バスケットボール',
    'mechanical keyboards':'メカニカルキーボード',
    'city nights':'都会の夜',
    'hiking':'ハイキング',
    'boxing drills':'ボクシング練習',
    'wuxia novels':'武侠小説',
    'guitar':'ギター',
    'jogging':'ジョギング',
    'trip planning':'旅行計画',
    'baking':'お菓子作り',
    'illustration':'イラスト',
    'aromatherapy':'アロマテラピー',
    'yoga':'ヨガ',
    'floral design':'フラワーデザイン',
    'photography':'写真',
    'jazz':'ジャズ',
    'handcrafts':'手作り',
    'ceramics':'陶芸',
    'reading':'読書',
    'puzzles':'パズル',
    'travel journals':'旅行日記',
    'street food':'屋台グルメ',
    'sketching':'スケッチ',
    'gardening':'園芸',
    'lo-fi music':'ローファイ音楽',
    'pour-over coffee':'ハンドドリップ',
    'seaside runs':'海辺ラン',
    'city food hunts':'街の食べ歩き',
    'film cameras':'フィルムカメラ',
    'night activities':'夜のアクティビティ',
    'drinks':'お酒',
    'nightlife':'ナイトライフ',
    'late-night eats':'深夜ごはん',
    'night runs':'夜ラン',
    '3D drawing':'3D描画',
    'gaming':'ゲーム',
    'cadet':'少年隊',
    'swimming':'水泳',
    'stargazing':'星空観察',
    'synth music':'シンセ音楽',
    'speed cubing':'スピードキューブ',
    'streetball':'ストリートバスケ',
    'skateboarding':'スケートボード',
    'ramen hunts':'ラーメン探し',
    'calligraphy':'書道',
    'city walks':'街歩き',
    'vinyl':'レコード',
    'snowboarding':'スノーボード',
    'arcades':'アーケード',
    'retro cameras':'レトロカメラ',
    'pottery':'陶芸',
    'book cafés':'ブックカフェ',
    'watercolor':'水彩',
    'night markets':'夜市',
    'indie films':'インディー映画',
    'journaling':'日記',
    'badminton':'バドミントン',
    'strategy games':'戦略ゲーム',
    'podcasts':'ポッドキャスト',
    'tennis':'テニス',
    'photo edits':'写真編集',
    'boxing':'ボクシング',
    'graphic tees':'グラフィックT',
    'motorbikes':'バイク',
    'pilates':'ピラティス',
    'lo‑fi beats':'ローファイビート',
    'stationery':'文房具',
    'astro photography':'天体写真',
    'city night hikes':'夜の街歩き',
    'competitive games':'競技ゲーム'
  }
};
const PROFILE_ZODIAC_TRANSLATIONS={
  fr:{
    Taurus:'Taureau',
    Scorpio:'Scorpion',
    Pisces:'Poissons',
    Cancer:'Cancer',
    Aries:'Bélier',
    Virgo:'Vierge',
    Aquarius:'Verseau',
    Gemini:'Gémeaux',
    Leo:'Lion',
    Sagittarius:'Sagittaire',
    Libra:'Balance',
    Capricorn:'Capricorne'
  },
  de:{
    Taurus:'Stier',
    Scorpio:'Skorpion',
    Pisces:'Fische',
    Cancer:'Krebs',
    Aries:'Widder',
    Virgo:'Jungfrau',
    Aquarius:'Wassermann',
    Gemini:'Zwillinge',
    Leo:'Löwe',
    Sagittarius:'Schütze',
    Libra:'Waage',
    Capricorn:'Steinbock'
  },
  es:{
    Taurus:'Tauro',
    Scorpio:'Escorpio',
    Pisces:'Piscis',
    Cancer:'Cáncer',
    Aries:'Aries',
    Virgo:'Virgo',
    Aquarius:'Acuario',
    Gemini:'Géminis',
    Leo:'Leo',
    Sagittarius:'Sagitario',
    Libra:'Libra',
    Capricorn:'Capricornio'
  },
  ja:{
    Taurus:'おうし座',
    Scorpio:'さそり座',
    Pisces:'うお座',
    Cancer:'かに座',
    Aries:'おひつじ座',
    Virgo:'おとめ座',
    Aquarius:'みずがめ座',
    Gemini:'ふたご座',
    Leo:'しし座',
    Sagittarius:'いて座',
    Libra:'てんびん座',
    Capricorn:'やぎ座'
  }
};
function translateProfileHobby(value,langKey){
  const map=PROFILE_HOBBY_TRANSLATIONS[langKey];
  if(!map||typeof value!=='string')return value;
  const key=String(value).trim();
  return map[key]??map[key.replace(/\s+/g,' ')]??value;
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
function legalMiniCopy(){
  const lang=state.language;
  const zh=lang==='zh-HK';
  const fr=lang==='fr';
  const de=lang==='de';
  const es=lang==='es';
  const ja=lang==='ja';
  const listHtml=(items,ordered=false)=>`${ordered?'<ol>':'<ul>'}${items.map((x)=>`<li>${esc(x)}</li>`).join('')}${ordered?'</ol>':'</ul>'}`;
  const labels=zh
    ?{privacy:'私隱政策',about:'關於我們',contact:'聯絡我們',terms:'使用條款'}
    :fr
      ?{privacy:'Confidentialité',about:'À propos',contact:'Contact',terms:'Conditions'}
      :de
        ?{privacy:'Datenschutz',about:'Über uns',contact:'Kontakt',terms:'Bedingungen'}
        :es
          ?{privacy:'Privacidad',about:'Acerca de',contact:'Contacto',terms:'Términos'}
          :ja
            ?{privacy:'プライバシー',about:'概要',contact:'連絡先',terms:'利用規約'}
            :{privacy:'Privacy',about:'About',contact:'Contact',terms:'Terms'};
  const privacyIntro=zh
    ?'我們重視你的私隱並以最少必要原則處理資料。'
    :fr
      ?'Nous appliquons une collecte minimale pour protéger votre vie privée.'
      :de
        ?'Wir nutzen einen datensparsamen Ansatz zum Schutz deiner Privatsphäre.'
        :es
          ?'Seguimos un enfoque de datos mínimos para proteger tu privacidad.'
          :ja
            ?'プライバシー保護のため、最小限のデータ収集を行います。'
            :'We follow a data-minimal approach to protect your privacy.';
  const privacyCollect=zh
    ?[
      '帳戶資料：顯示名稱、登入電郵',
      '遊戲資料：設定、對戰紀錄、分數與排行榜',
      '技術資料：裝置類型、作業系統、瀏覽器版本、語言、基本錯誤記錄'
    ]
    :fr
      ?[
        'Données de compte : nom d’affichage, e‑mail de connexion',
        'Données de jeu : paramètres, parties, scores, classement',
        'Données techniques : type d’appareil, OS, navigateur, langue, logs d’erreurs basiques'
      ]
      :de
        ?[
          'Kontodaten: Anzeigename, Anmelde‑E‑Mail',
          'Spieldaten: Einstellungen, Spielverläufe, Punkte, Rangliste',
          'Technische Daten: Gerätetyp, OS, Browser, Sprache, einfache Fehlerlogs'
        ]
        :es
          ?[
            'Datos de cuenta: nombre visible, correo de inicio de sesión',
            'Datos de juego: ajustes, partidas, puntuaciones, clasificación',
            'Datos técnicos: tipo de dispositivo, SO, navegador, idioma, registros básicos'
          ]
          :ja
            ?[
              'アカウント情報: 表示名、ログインメール',
              'ゲーム情報: 設定、対戦履歴、スコア、ランキング',
              '技術情報: 端末種別、OS、ブラウザ、言語、基本エラーログ'
            ]
            :[
              'Account data: display name, sign-in email',
              'Game data: settings, match records, scores, leaderboard',
              'Technical data: device type, OS, browser version, language, basic error logs'
            ];
  const privacyUse=zh
    ?[
      '維持登入與偏好設定（Cookies 或同類技術）',
      '遊戲運作、排行榜與統計分析',
      '防止濫用、風險控制與技術維護'
    ]
    :fr
      ?[
        'Maintenir la connexion et les préférences (cookies ou équivalents)',
        'Fonctionnement du jeu, classement et statistiques',
        'Prévention des abus, contrôle des risques et maintenance'
      ]
      :de
        ?[
          'Anmeldung und Einstellungen aufrechterhalten (Cookies o. ä.)',
          'Spielbetrieb, Rangliste und Statistiken',
          'Missbrauchsprävention, Risikokontrolle und Wartung'
        ]
        :es
          ?[
            'Mantener inicio de sesión y preferencias (cookies o similares)',
            'Juego principal, clasificación y estadísticas',
            'Prevención de abuso, control de riesgos y mantenimiento'
          ]
          :ja
            ?[
              'ログインと設定の保持（Cookie等）',
              'ゲーム運営、ランキング、統計',
              '不正防止、リスク管理、保守'
            ]
            :[
              'Maintain sign-in and preferences (cookies or similar)',
              'Core gameplay, leaderboard, and statistics',
              'Abuse prevention, risk control, and maintenance'
            ];
  const privacyNotes=zh
    ?'資料不會出售作第三方行銷用途，並會在合理期限內清理。你可在瀏覽器管理 Cookies；停用後可能影響登入或偏好保存。如需查詢或更正／刪除資料，請透過聯絡方式與我們聯絡。'
    :fr
      ?'Nous ne vendons pas vos données à des tiers et les conservons uniquement le temps nécessaire. Vous pouvez gérer les cookies dans votre navigateur ; leur désactivation peut affecter la connexion ou les préférences. Pour toute question ou demande de correction/suppression, contactez‑nous.'
      :de
        ?'Wir verkaufen keine Daten an Dritte und speichern sie nur so lange wie nötig. Cookies können im Browser verwaltet werden; eine Deaktivierung kann Anmeldung oder Einstellungen beeinträchtigen. Für Auskünfte oder Korrektur/Löschung kontaktiere uns.'
        :es
          ?'No vendemos tus datos a terceros y solo los conservamos el tiempo necesario. Puedes gestionar las cookies en tu navegador; desactivarlas puede afectar el inicio de sesión o las preferencias. Para consultas o corrección/eliminación, contáctanos.'
          :ja
            ?'データは第三者マーケティング目的で販売せず、必要な期間のみ保持します。Cookieはブラウザで管理できますが、無効化するとログインや設定保存に影響する場合があります。お問い合わせや訂正・削除は連絡先からお願いします。'
            :'We do not sell your data for third‑party marketing and retain it only as needed before cleanup. You can manage cookies in your browser; disabling them may affect sign-in or preferences. For questions or correction/removal requests, contact us.';
  const aboutIntro=zh
    ?'《鋤大D（Big Two）》網頁版專注於跨裝置一致體驗。'
    :fr
      ?'Cette version web de Big Two vise une expérience cohérente sur tous les appareils.'
      :de
        ?'Diese Browser‑Version von Big Two fokussiert auf eine konsistente Geräte‑Erfahrung.'
        :es
          ?'Esta versión web de Big Two se centra en una experiencia consistente entre dispositivos.'
          :ja
            ?'このBig Twoのウェブ版は、デバイス間で一貫した体験を重視しています。'
            :'This browser-based Big Two focuses on consistent play across devices.';
  const aboutList=zh
    ?[
      '支援手機、平板與桌面快速開局',
      '提供單人對戰與房間對戰',
      '排行榜、個人設定與成績追蹤',
      '清晰出牌提示、即時狀態與計分明細'
    ]
    :fr
      ?[
        'Démarrage rapide sur mobile, tablette et desktop',
        'Solo et parties en salon',
        'Classement, paramètres personnels, suivi des performances',
        'Indications claires, état en direct et détails de score'
      ]
      :de
        ?[
          'Schnellstart auf Handy, Tablet und Desktop',
          'Solo‑ und Raumspiele',
          'Rangliste, persönliche Einstellungen, Leistungs‑Tracking',
          'Klare Hinweise, Live‑Status und Punktedetails'
        ]
        :es
          ?[
            'Inicio rápido en móvil, tableta y escritorio',
            'Partidas en solitario y en sala',
            'Clasificación, ajustes personales, seguimiento de resultados',
            'Indicaciones claras, estado en vivo y detalles de puntuación'
          ]
          :ja
            ?[
              'スマホ・タブレット・PCで素早く開始',
              'ソロ対戦とルーム対戦',
              'ランキング、個人設定、成績管理',
              '明確な出牌ガイド、リアルタイム状況、計分詳細'
            ]
            :[
              'Fast start on phone, tablet, and desktop',
              'Solo and room matches',
              'Leaderboard, personal settings, performance tracking',
              'Clear play cues, live status, and scoring details'
            ];
  const aboutNotes=zh
    ?'我們持續優化效能、互動回饋、版面適配與穩定性，並依玩家回饋改進。'
    :fr
      ?'Nous améliorons en continu les performances, le feedback, l’interface et la stabilité selon les retours.'
      :de
        ?'Wir verbessern fortlaufend Performance, Feedback, Layout und Stabilität basierend auf Rückmeldungen.'
        :es
          ?'Mejoramos continuamente el rendimiento, la respuesta, el diseño y la estabilidad según comentarios.'
          :ja
            ?'パフォーマンス、操作感、レイアウト、安定性を継続的に改善しています。'
            :'We continuously improve performance, interaction feedback, responsive layout, and stability based on player feedback.';
  const termsIntro=zh
    ?'使用本網站即表示你同意：'
    :fr
      ?'En utilisant ce site, vous acceptez :'
      :de
        ?'Durch die Nutzung dieser Website stimmst du zu:'
        :es
          ?'Al usar este sitio, aceptas:'
          :ja
            ?'本サイトを利用することで、以下に同意したものとします:'
            :'By using this website, you agree to:';
  const termsList=zh
    ?[
      '合法及公平使用服務，不作弊、濫用或干擾系統',
      '不使用外掛、自動化程式、爬蟲或非正常手段影響對局或排行',
      '帳戶與裝置安全由使用者自行管理',
      '排行榜與戰績以系統記錄為準，異常數據可被修正或移除',
      '維護、安全或法規需要下可調整功能或暫停部分服務',
      '對於網絡、裝置或第三方服務導致的中斷或損失不作保證'
    ]
    :fr
      ?[
        'Utiliser le service légalement et équitablement, sans triche ni abus',
        'Éviter plugins, automatisations, robots ou méthodes non standard affectant parties ou classements',
        'Gérer la sécurité de votre compte/appareil',
        'Les classements se basent sur les logs et peuvent être corrigés',
        'Des fonctionnalités peuvent changer ou être suspendues pour maintenance, sécurité ou obligations légales',
        'Aucune garantie contre interruptions ou pertes dues au réseau/appareil/tiers'
      ]
      :de
        ?[
          'Dienst legal und fair nutzen, ohne Betrug oder Missbrauch',
          'Keine Plugins, Automatisierung, Crawler oder unübliche Methoden, die Spiele/Rankings beeinflussen',
          'Sicherheit von Konto und Gerät selbst verwalten',
          'Ranglisten basieren auf Systemlogs und können korrigiert werden',
          'Funktionen können aus Wartungs-, Sicherheits- oder Rechtsgründen geändert/pausiert werden',
          'Keine Garantie bei Ausfällen oder Verlusten durch Netzwerk/Gerät/Drittanbieter'
        ]
        :es
          ?[
            'Usar el servicio legalmente y con equidad, sin trampas ni abuso',
            'Evitar plugins, automatización, rastreadores o métodos no estándar que afecten partidas o clasificaciones',
            'Gestionar la seguridad de tu cuenta/dispositivo',
            'Las clasificaciones siguen los registros del sistema y pueden corregirse',
            'Funciones pueden cambiar o suspenderse por mantenimiento, seguridad o requisitos legales',
            'Sin garantía ante interrupciones o pérdidas por red/dispositivo/terceros'
          ]
          :ja
            ?[
              '不正や濫用をせず、合法かつ公平に利用する',
              'プラグイン、自動化、クローラー等で対戦やランキングに影響を与えない',
              'アカウント/端末の安全管理は利用者が行う',
              'ランキングや戦績はシステム記録に基づき、異常は修正/削除されることがある',
              '保守・安全・法令上の理由で機能変更や一時停止を行う場合がある',
              'ネットワーク/端末/第三者サービスによる中断や損失は保証しない'
            ]
            :[
              'Use the service lawfully and fairly without cheating or abuse',
              'Avoid plugins, automation, crawlers, or non-standard methods that affect matches or leaderboards',
              'Keep your account/device secure',
              'Leaderboards and records follow system logs and may be corrected for anomalies',
              'Features may change or suspend for maintenance, security, or legal needs',
              'No guarantee against interruptions or data loss from network/device/third-party outages'
            ];
  const termsNotes=zh
    ?'若不同意上述條款，請停止使用本網站。'
    :fr
      ?'Si vous n’acceptez pas ces conditions, veuillez cesser d’utiliser le site.'
      :de
        ?'Wenn du diese Bedingungen nicht akzeptierst, nutze die Website bitte nicht.'
        :es
          ?'Si no aceptas estos términos, deja de usar el sitio.'
          :ja
            ?'同意できない場合はご利用をお控えください。'
            :'Discontinue use if you do not accept these terms.';
  const supportText=zh
    ?'喜歡這個遊戲？歡迎點擊或掃描支持我們一杯咖啡，讓我們持續更新與改善。'
    :fr
      ?'Vous aimez le jeu ? Cliquez ou scannez pour nous offrir un café et soutenir les améliorations.'
      :de
        ?'Gefällt dir das Spiel? Unterstütze uns mit einem Kaffee per Klick oder Scan.'
        :es
          ?'¿Te gusta el juego? Haz clic o escanea para apoyarnos con un café.'
          :ja
            ?'このゲームが気に入ったら、クリックまたはスキャンでコーヒー支援をお願いします。'
            :'Enjoying the game? Click or scan to support us with a coffee so we can keep improving it.';
  const supportHtml=`<div class="bmac-cta"><div class="bmac-msg">${esc(supportText)}</div><div class="bmac-row"><a href="https://www.buymeacoffee.com/4leafx" target="_blank" rel="noopener noreferrer"><img class="bmac-button" src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="${esc(t('supportCoffee'))}"></a><img class="bmac-qr" src="${withBase('bmac-qr.png')}" alt="${esc(t('supportCoffeeQr'))}"></div></div>`;
  const contactHtml=zh
    ?'如有查詢，請電郵至 <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a>。'
    :fr
      ?'Pour toute demande, écrivez à <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a>.'
      :de
        ?'Bei Fragen: <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a>.'
        :es
          ?'Para consultas, escribe a <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a>.'
          :ja
            ?'お問い合わせは <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a> まで。'
            :'For enquiries, email <a href="mailto:4LeafxCS@gmail.com">4LeafxCS@gmail.com</a>.';
  const contactList=zh
    ?[
      '裝置型號與系統版本',
      '瀏覽器與版本',
      '發生時間與操作步驟',
      '截圖或錄影（如適用）'
    ]
    :fr
      ?[
        'Modèle d’appareil et version du système',
        'Navigateur et version',
        'Heure et étapes de reproduction',
        'Captures d’écran ou enregistrement (si possible)'
      ]
      :de
        ?[
          'Gerätemodell und OS‑Version',
          'Browser und Version',
          'Zeitpunkt und Schritte zur Reproduktion',
          'Screenshots oder Bildschirmaufnahme (falls vorhanden)'
        ]
        :es
          ?[
            'Modelo de dispositivo y versión del SO',
            'Navegador y versión',
            'Hora y pasos para reproducir',
            'Capturas o grabación de pantalla (si aplica)'
          ]
          :ja
            ?[
              '端末機種とOSバージョン',
              'ブラウザとバージョン',
              '発生時刻と再現手順',
              'スクリーンショット/画面録画（可能なら）'
            ]
            :[
              'Device model and OS version',
              'Browser and version',
              'Time and steps to reproduce',
              'Screenshots or screen recording (if any)'
            ];
  return{
    labels,
    closeLabel:t('close'),
      content:{
        privacy:`<h4>${esc(labels.privacy)}</h4><p>${esc(privacyIntro)}</p><p>${esc(zh?'收集資料':fr?'Données collectées':de?'Erhobene Daten':es?'Datos que recopilamos':ja?'収集するデータ':'Data we collect')}</p>${listHtml(privacyCollect)}<p>${esc(zh?'使用目的':fr?'Utilisation des données':de?'Datennutzung':es?'Cómo usamos los datos':ja?'データの利用目的':'How we use data')}</p>${listHtml(privacyUse)}<p>${esc(privacyNotes)}</p>`,
        about:`<h4>${esc(labels.about)}</h4><div class="legal-about-grid"><div class="legal-about-main"><p>${esc(aboutIntro)}</p>${listHtml(aboutList)}<p>${esc(aboutNotes)}</p></div><div class="legal-about-side">${supportHtml}</div></div>`,
        contact:`<h4>${esc(labels.contact)}</h4><p>${contactHtml}</p><p>${esc(zh?'建議提供':fr?'Merci d’inclure':de?'Bitte angeben':es?'Incluye':ja?'可能であれば以下を添付':'Please include')}</p>${listHtml(contactList)}`,
        terms:`<h4>${esc(labels.terms)}</h4><p>${esc(termsIntro)}</p>${listHtml(termsList,true)}<p>${esc(termsNotes)}</p>`
      }
    };
  }
  function mainPageLegalMiniHtml(){
    const legal=legalMiniCopy();
    return`<section class="legal-mini" id="legal-mini"><div class="legal-mini-links"><button type="button" class="legal-mini-link" data-legal="privacy">${legal.labels.privacy}</button><span class="legal-mini-sep">◦</span><button type="button" class="legal-mini-link" data-legal="about">${legal.labels.about}</button><span class="legal-mini-sep">◦</span><button type="button" class="legal-mini-link" data-legal="contact">${legal.labels.contact}</button><span class="legal-mini-sep">◦</span><button type="button" class="legal-mini-link" data-legal="terms">${legal.labels.terms}</button></div><div class="intro-modal legal-modal" id="legal-modal"><button class="intro-backdrop" id="legal-backdrop" aria-label="${legal.closeLabel}"></button><section class="intro-sheet legal-sheet"><header class="intro-head"><div><h3 id="legal-modal-title"></h3></div><button id="legal-close" class="secondary">${legal.closeLabel}</button></header><div class="legal-modal-body" id="legal-modal-body"></div></section></div></section>`;
  }
const introText=()=>{
  if(state.language==='en'){
    return{
      btnShow:'Guide',
      btnHide:'Close',
      panelTitle:'Guide',
      panelSub:'Official quick reference covering core rules, hand hierarchy, opening flow, and practical table strategy.',
      historyTitle:'Background',
      historyBody:'Big Two (Cho Dai Di) is a four-player shedding card game using a standard 52-card deck without jokers. Each player receives 13 cards, and the objective is to empty your hand before all opponents. The game is known for high decision density, compact round duration, and strong strategic interaction between tempo control, hand preservation, and timing of power cards.',
      playTitle:'Gameplay Highlights',
      playList:[
        'Opening lead of the first round must contain {{3D}}.',
        'Follow play must match card count: single, pair, triple, or 5-card hand.',
        'Five-card hierarchy: Straight < Flush < Full House < Four of a Kind < Straight Flush.',
        'For equal ranks, suit order is ♦️ < ♣️ < ♥️ < ♠️.',
        'Single-card order: 2 > A > K > ... > 3 (highest: ♠️Spade 2, lowest: ♦️3).',
        'After three consecutive passes, initiative returns to the last successful player.',
        'When you hold initiative, choose a tempo that preserves control and blocks opponent exits.'
      ],
      flowTitle:'Opening Flow',
      flowList:[
        'Deal 13 cards to each of the 4 players.',
        'The player holding {{3D}} must open the first trick.',
        'Other players either beat with matching card count or pass.',
        'After three passes, the previous winning play resets the lead.',
        'Round ends immediately when one player plays all cards.'
      ],
      guideHowTitle:'How to Play',
      guideHowIntro:'Quick start steps to begin a match:',
      guideHowList:[
        'Sign in to enable room play and leaderboard tracking.',
        'From Home, choose Solo or enter the Lobby to create/join a room.',
        'In a room, the host can press Start when at least 2 players are inside.',
        'On your turn, select cards and tap Play; tap Pass when allowed.',
        'Use Suggest for help, and sort/drag to organize your hand.'
      ],
      guideHomeTitle:'Add to Home Screen',
      guideHomeIntro:'Add it to your Home screen for a full-screen, app-like launch.',
      guideAndroidTitle:'Android (Chrome)',
      guideAndroidSteps:[
        'Open this site in Chrome.',
        'Tap the three-dot menu.',
        'Select Add to Home screen.',
        'Confirm the name and tap Add.'
      ],
      guideIosTitle:'iPhone / iPad (Safari)',
      guideIosSteps:[
        'Open this site in Safari.',
        'Tap Share (square with an up arrow).',
        'Choose Add to Home Screen.',
        'Confirm the name and tap Add.'
      ],
      guideHomeNotes:'If you do not see the option, make sure you are using Safari/Chrome rather than an in-app browser.',
      howTitle:'Hand Types',
      howBody:'To follow, card count must match the active play. For 5-card contests, compare hand category first, then compare the relevant high cards and suits under game rules.',
      howList:[]
    };
  }
  if(state.language==='fr'){
    return{
      btnShow:'Guide',
      btnHide:'Fermer',
      panelTitle:'Guide',
      panelSub:'Référence rapide officielle : règles clés, hiérarchie des mains, ouverture et stratégie de table.',
      historyTitle:'Contexte',
      historyBody:'Big Two (Cho Dai Di) est un jeu de défausse à 4 joueurs, joué avec un jeu standard de 52 cartes sans jokers. Chaque joueur reçoit 13 cartes et l’objectif est de vider sa main avant les autres. Le jeu est connu pour sa densité de décisions, ses manches rapides et l’interaction stratégique entre le contrôle du tempo, la conservation des cartes fortes et le timing.',
      playTitle:'Points clés',
      playList:[
        'La première sortie du premier tour doit contenir {{3D}}.',
        'Pour suivre, le nombre de cartes doit correspondre : simple, paire, brelan ou 5 cartes.',
        'Hiérarchie des 5 cartes : Suite < Couleur < Full House < Carré < Quinte flush.',
        'À rang égal, l’ordre des couleurs est ♦️ < ♣️ < ♥️ < ♠️.',
        'Ordre des cartes simples : 2 > A > K > ... > 3 (max : ♠️2, min : ♦️3).',
        'Après trois passes consécutives, l’initiative revient au dernier joueur ayant joué.',
        'Avec l’initiative, choisissez un tempo qui garde le contrôle et bloque les sorties adverses.'
      ],
      flowTitle:'Déroulement initial',
      flowList:[
        'Distribuer 13 cartes à chacun des 4 joueurs.',
        'Le joueur qui a {{3D}} ouvre la première levée.',
        'Les autres jouent la même quantité ou passent.',
        'Après trois passes, le dernier jeu valide reprend la main.',
        'La manche se termine quand un joueur n’a plus de cartes.'
      ],
      guideHowTitle:'Comment jouer',
      guideHowIntro:'Étapes rapides pour démarrer :',
      guideHowList:[
        'Connectez-vous pour activer les salles et le classement.',
        'Depuis l’accueil, choisissez Solo ou entrez dans le Lobby pour créer/rejoindre.',
        'Dans une salle, l’hôte lance dès que 2 joueurs sont présents.',
        'À votre tour, sélectionnez des cartes puis Jouer ; Passez si autorisé.',
        'Utilisez Suggestion et triez/drag pour organiser votre main.'
      ],
      guideHomeTitle:'Ajouter à l’écran d’accueil',
      guideHomeIntro:'Ajoutez l’app pour un lancement plein écran, comme une application.',
      guideAndroidTitle:'Android (Chrome)',
      guideAndroidSteps:[
        'Ouvrez ce site dans Chrome.',
        'Appuyez sur le menu à trois points.',
        'Choisissez Ajouter à l’écran d’accueil.',
        'Confirmez le nom puis Ajouter.'
      ],
      guideIosTitle:'iPhone / iPad (Safari)',
      guideIosSteps:[
        'Ouvrez ce site dans Safari.',
        'Appuyez sur Partager (carré avec flèche).',
        'Choisissez Sur l’écran d’accueil.',
        'Confirmez le nom puis Ajouter.'
      ],
      guideHomeNotes:'Si l’option n’apparaît pas, utilisez Safari/Chrome plutôt qu’un navigateur intégré.',
      howTitle:'Types de mains',
      howBody:'Pour suivre, le nombre de cartes doit correspondre. En 5 cartes, comparez d’abord la catégorie, puis les cartes hautes et la couleur.',
      howList:[]
    };
  }
  if(state.language==='de'){
    return{
      btnShow:'Guide',
      btnHide:'Schließen',
      panelTitle:'Guide',
      panelSub:'Offizielle Kurzübersicht: Regeln, Hand-Rangfolge, Startablauf und Taktik.',
      historyTitle:'Hintergrund',
      historyBody:'Big Two (Cho Dai Di) ist ein 4‑Spieler‑Ausstiegsspiel mit einem 52‑Karten‑Deck ohne Joker. Jeder erhält 13 Karten; Ziel ist, die eigene Hand zuerst zu leeren. Das Spiel ist bekannt für hohe Entscheidungsdichte, kurze Runden und starke strategische Wechselwirkung zwischen Tempo, Kartenmanagement und Timing starker Karten.',
      playTitle:'Spiel-Highlights',
      playList:[
        'Der Eröffnungszug der ersten Runde muss {{3D}} enthalten.',
        'Nachspielen muss die Kartenanzahl treffen: Einzel, Paar, Drilling oder 5‑Karten‑Hand.',
        '5‑Karten‑Hierarchie: Straße < Farbe < Full House < Vierling < Straight Flush.',
        'Bei gleichem Rang gilt die Farb-Reihenfolge ♦️ < ♣️ < ♥️ < ♠️.',
        'Einzelkarten-Rang: 2 > A > K > ... > 3 (höchste: ♠️2, niedrigste: ♦️3).',
        'Nach drei Pässen in Folge geht die Initiative an den letzten Gewinner zurück.',
        'Mit Initiative wähle ein Tempo, das Kontrolle hält und Ausstiege blockiert.'
      ],
      flowTitle:'Startablauf',
      flowList:[
        '13 Karten an jeden der 4 Spieler verteilen.',
        'Der Spieler mit {{3D}} eröffnet den ersten Stich.',
        'Andere überbieten mit gleicher Kartenanzahl oder passen.',
        'Nach drei Pässen setzt der letzte gültige Zug die Führung fort.',
        'Die Runde endet sofort, wenn ein Spieler alle Karten gespielt hat.'
      ],
      guideHowTitle:'So spielst du',
      guideHowIntro:'Schnellstart in 5 Schritten:',
      guideHowList:[
        'Anmelden, um Räume und Rangliste zu aktivieren.',
        'Im Home Solo wählen oder Lobby öffnen, um Raum zu erstellen/beitreten.',
        'Im Raum kann der Host starten, sobald mindestens 2 Spieler drin sind.',
        'Im Zug Karten wählen und Spielen; Passen, wenn erlaubt.',
        'Vorschlag nutzen und per Sortieren/Drag die Hand ordnen.'
      ],
      guideHomeTitle:'Zum Startbildschirm hinzufügen',
      guideHomeIntro:'Füge es zum Startbildschirm hinzu für einen Vollbild‑App‑Start.',
      guideAndroidTitle:'Android (Chrome)',
      guideAndroidSteps:[
        'Diese Seite in Chrome öffnen.',
        'Drei‑Punkte‑Menü tippen.',
        'Zum Startbildschirm hinzufügen auswählen.',
        'Name bestätigen und Hinzufügen.'
      ],
      guideIosTitle:'iPhone / iPad (Safari)',
      guideIosSteps:[
        'Diese Seite in Safari öffnen.',
        'Teilen tippen (Quadrat mit Pfeil).',
        'Zum Home‑Bildschirm wählen.',
        'Name bestätigen und Hinzufügen.'
      ],
      guideHomeNotes:'Falls die Option fehlt, nutze Safari/Chrome statt In‑App‑Browser.',
      howTitle:'Handtypen',
      howBody:'Beim Nachspielen muss die Kartenanzahl passen. Bei 5 Karten zuerst die Kategorie, dann hohe Karten und Farben vergleichen.',
      howList:[]
    };
  }
  if(state.language==='es'){
    return{
      btnShow:'Guía',
      btnHide:'Cerrar',
      panelTitle:'Guía',
      panelSub:'Referencia rápida oficial: reglas clave, jerarquía de manos, apertura y estrategia.',
      historyTitle:'Contexto',
      historyBody:'Big Two (Cho Dai Di) es un juego de descarte para 4 jugadores con una baraja estándar de 52 cartas sin comodines. Cada jugador recibe 13 cartas y el objetivo es vaciar la mano antes que los demás. Es un juego de alta densidad de decisiones, rondas rápidas y gran interacción estratégica entre control del ritmo, conservación de cartas fuertes y timing.',
      playTitle:'Puntos clave',
      playList:[
        'La primera jugada de la primera ronda debe incluir {{3D}}.',
        'Para responder, la cantidad de cartas debe coincidir: simple, pareja, trío o 5 cartas.',
        'Jerarquía de 5 cartas: Escalera < Color < Full House < Póker < Escalera de color.',
        'A igual rango, el orden de palos es ♦️ < ♣️ < ♥️ < ♠️.',
        'Orden de cartas simples: 2 > A > K > ... > 3 (máxima: ♠️2, mínima: ♦️3).',
        'Tras tres pases seguidos, la iniciativa vuelve al último que jugó.',
        'Con la iniciativa, elige un ritmo que mantenga el control y bloquee salidas.'
      ],
      flowTitle:'Flujo de apertura',
      flowList:[
        'Repartir 13 cartas a cada uno de los 4 jugadores.',
        'El jugador con {{3D}} debe abrir la primera baza.',
        'Los demás superan con la misma cantidad o pasan.',
        'Tras tres pases, el último juego válido reinicia el turno.',
        'La ronda termina en cuanto alguien se queda sin cartas.'
      ],
      guideHowTitle:'Cómo jugar',
      guideHowIntro:'Pasos rápidos para empezar:',
      guideHowList:[
        'Inicia sesión para habilitar salas y ranking.',
        'En Inicio, elige Solo o entra al Lobby para crear/unirte.',
        'En una sala, el anfitrión inicia cuando hay al menos 2 jugadores dentro.',
        'En tu turno, selecciona cartas y pulsa Jugar; Pasa si está permitido.',
        'Usa Sugerir y ordena/arrastra para organizar la mano.'
      ],
      guideHomeTitle:'Añadir a la pantalla de inicio',
      guideHomeIntro:'Añádelo a Inicio para abrirlo a pantalla completa como app.',
      guideAndroidTitle:'Android (Chrome)',
      guideAndroidSteps:[
        'Abre este sitio en Chrome.',
        'Toca el menú de tres puntos.',
        'Selecciona Añadir a pantalla de inicio.',
        'Confirma el nombre y pulsa Añadir.'
      ],
      guideIosTitle:'iPhone / iPad (Safari)',
      guideIosSteps:[
        'Abre este sitio en Safari.',
        'Toca Compartir (cuadrado con flecha).',
        'Elige Añadir a pantalla de inicio.',
        'Confirma el nombre y pulsa Añadir.'
      ],
      guideHomeNotes:'Si no aparece la opción, usa Safari/Chrome en lugar de un navegador integrado.',
      howTitle:'Tipos de manos',
      howBody:'Para responder, la cantidad de cartas debe coincidir. En 5 cartas, compara primero la categoría y luego las cartas altas y palos.',
      howList:[]
    };
  }
  if(state.language==='ja'){
    return{
      btnShow:'ガイド',
      btnHide:'閉じる',
      panelTitle:'ガイド',
      panelSub:'コアルール、役の序列、開局フロー、実戦のセオリーをまとめた公式クイックリファレンス。',
      historyTitle:'概要',
      historyBody:'Big Two（Chō Dai Di）は4人用の出し切り型カードゲームで、ジョーカーなしの標準52枚デッキを使います。各プレイヤーに13枚ずつ配られ、最初に手札を無くした人が勝利です。テンポ管理、強い札の温存、パワーカードのタイミングなど、密度の高い判断が求められるゲームとして知られています。',
      playTitle:'ポイント',
      playList:[
        '最初のラウンドの初手は {{3D}} を含む必要があります。',
        '後出しは同じ枚数で合わせます：単札・ペア・スリー・5枚役。',
        '5枚役の強さ：ストレート < フラッシュ < フルハウス < フォーカード < ストレートフラッシュ。',
        '同ランクの場合、スート順は ♦️ < ♣️ < ♥️ < ♠️。',
        '単札の強さ：2 > A > K > ... > 3（最強：♠️2、最弱：♦️3）。',
        '3人連続パス後、最後に出したプレイヤーが主導権を得ます。',
        '主導権がある時は、テンポと手札温存のバランスで相手の上がりを阻止します。'
      ],
      flowTitle:'開局フロー',
      flowList:[
        '4人に13枚ずつ配ります。',
        '{{3D}} を持つプレイヤーが最初のトリックを開始します。',
        '他のプレイヤーは同じ枚数で上回るかパスします。',
        '3人がパスしたら、直前の勝ち手から再開します。',
        '誰かが手札を出し切った時点でラウンド終了です。'
      ],
      guideHowTitle:'遊び方',
      guideHowIntro:'すぐ始める手順：',
      guideHowList:[
        'サインインしてルーム対戦とランキングを有効にします。',
        'ホームでソロを選ぶか、ロビーからルーム作成/参加します。',
        'ルームでは2人以上でホストが開始できます。',
        '自分の番にカードを選び、プレイをタップ。必要ならパスします。',
        'サジェストで補助し、並び替え/ドラッグで手札を整理します。'
      ],
      guideHomeTitle:'ホーム画面に追加',
      guideHomeIntro:'ホーム画面に追加すると、アプリのように全画面起動できます。',
      guideAndroidTitle:'Android (Chrome)',
      guideAndroidSteps:[
        'このサイトをChromeで開きます。',
        '右上の三点メニューをタップ。',
        '「ホーム画面に追加」を選択。',
        '名前を確認して追加。'
      ],
      guideIosTitle:'iPhone / iPad (Safari)',
      guideIosSteps:[
        'このサイトをSafariで開きます。',
        '共有（上向き矢印の四角）をタップ。',
        '「ホーム画面に追加」を選択。',
        '名前を確認して追加。'
      ],
      guideHomeNotes:'表示されない場合は、アプリ内ブラウザではなくSafari/Chromeを使用してください。',
      howTitle:'役の種類',
      howBody:'後出しは同じ枚数で合わせる必要があります。5枚勝負では、まず役の種類を比べ、次に高い札とスートで比較します。',
      howList:[]
    };
  }
  return{
    btnShow:'玩法指南',
    btnHide:'關閉',
    panelTitle:'玩法指南',
    panelSub:'提供核心規則、牌型次序、開局流程與實戰節奏的官方速覽。',
    historyTitle:'背景',
    historyBody:'《鋤大D》（Big Two）為四人出清型撲克牌遊戲，使用標準52張牌（不含鬼牌），每位玩家派發13張。玩家的目標是在其他對手之前出清手牌。此遊戲特色在於回合節奏明確、決策密度高，並重視控場、保留關鍵牌與出牌時機的策略取捨。\n\n在香港，《鋤大D》是非常普及的休閒紙牌遊戲，常見於家庭聚會、朋友聚餐及節日活動（例如農曆新年）。許多香港人自小便接觸此遊戲，並在社交場合中用作娛樂和聯誼。遊戲節奏快速且富競技性，因此深受年輕人及成年人歡迎，也逐漸發展出不同地方版本與玩法變化，成為香港流行文化的一部分。',
    playTitle:'玩法重點',
    playList:[
      '首圈開局第一手必須包含 {{3D}}。',
      '跟牌必須跟相同張數：單張／一對／三條／五張牌型。',
      '五張牌型大小：蛇 < 花 < 俘佬 < 四條 < 同花順。',
      '同點數比較花色：♦️< ♣️ < ♥️< ♠️。',
      '單張大小：2 > A > K > ... > 3（最大單張：♠️2；最小單張：♦️3）。',
      '連續三家過牌後，由最後有效出牌者重新話事。',
      '當你話事時，應平衡節奏控制與大牌保留，避免被對手一手出清。'
    ],
      flowTitle:'開局流程',
      flowList:[
        '4 位玩家每人派發 13 張手牌。',
        '持有 {{3D}} 的玩家必須先開第一手。',
        '其餘玩家需以相同張數壓過，或選擇過牌。',
        '連續三家過牌後，回到上一手有效出牌者重新話事。',
        '直至有玩家先出清手牌，該局立即結束。'
      ],
      guideHowTitle:'玩法教學',
      guideHowIntro:'快速上手，以下步驟可完成開局並開始對戰：',
      guideHowList:[
        '登入後可進行房間對戰與排行榜記錄。',
        '主頁選擇「開局」（單人）或進入大堂建立／加入房間。',
        '房主可在至少 2 位玩家進入房間後按「開始」。',
        '輪到你時，選牌後按「出牌」，可過牌時按「過牌」。',
        '需要提示可按「建議」，亦可使用排序或拖曳整理手牌。'
      ],
      guideHomeTitle:'加到主畫面',
      guideHomeIntro:'加到主畫面後可像 App 一樣全螢幕開啟。',
      guideAndroidTitle:'Android（Chrome）',
      guideAndroidSteps:[
        '用 Chrome 開啟本網站。',
        '點右上角「⋮」選單。',
        '選擇「加到主畫面」。',
        '確認名稱後點「新增」。'
      ],
      guideIosTitle:'iPhone / iPad（Safari）',
      guideIosSteps:[
        '用 Safari 開啟本網站。',
        '點下方「分享」按鈕（方形向上箭頭）。',
        '選擇「加入主畫面」。',
        '確認名稱後點「加入」。'
      ],
      guideHomeNotes:'如看不到相關選項，請確認不是在其他 App 的內置瀏覽器內開啟。',
      howTitle:'牌型',
      howBody:'跟牌時必須符合相同張數。若為五張牌對比，先比較牌型等級，再按規則比較相關主牌點數與花色。',
      howList:[]
    };
};
function introHandSamples(){
  const card=(rank,suit)=>{
    const r=RANKS.indexOf(rank);
    const s=SUITS.findIndex((x)=>x.symbol===suit);
    return{rank:Math.max(0,r),suit:Math.max(0,s)};
  };
  if(state.language==='en'){
    return[
      {name:'Single',desc:'1 card',cards:[card('A','♠️')]},
      {name:'Pair',desc:'2 same rank',cards:[card('9','♦️'),card('9','♣️')]},
      {name:'Triple',desc:'3 same rank',cards:[card('7','♦️'),card('7','♣️'),card('7','♠️')]},
      {name:'Straight (Snake)',desc:'5 consecutive ranks',cards:[card('6','♦️'),card('7','♣️'),card('8','♥️'),card('9','♠️'),card('10','♣️')]},
      {name:'Flush (Flower)',desc:'5 same suit',cards:[card('3','♥️'),card('7','♥️'),card('9','♥️'),card('J','♥️'),card('A','♥️')]},
      {name:'Full House',desc:'Triple + Pair',cards:[card('Q','♣️'),card('Q','♦️'),card('Q','♠️'),card('5','♥️'),card('5','♣️')]},
      {name:'Four of a Kind',desc:'4 same rank + kicker',cards:[card('8','♦️'),card('8','♣️'),card('8','♥️'),card('8','♠️'),card('2','♣️')]},
      {name:'Straight Flush',desc:'Same suit + consecutive',cards:[card('5','♠️'),card('6','♠️'),card('7','♠️'),card('8','♠️'),card('9','♠️')]}
    ];
  }
  if(state.language==='fr'){
    return[
      {name:'Carte',desc:'1 carte',cards:[card('A','♠️')]},
      {name:'Paire',desc:'2 même rang',cards:[card('9','♦️'),card('9','♣️')]},
      {name:'Brelan',desc:'3 même rang',cards:[card('7','♦️'),card('7','♣️'),card('7','♠️')]},
      {name:'Suite',desc:'5 rangs consécutifs',cards:[card('6','♦️'),card('7','♣️'),card('8','♥️'),card('9','♠️'),card('10','♣️')]},
      {name:'Couleur',desc:'5 même couleur',cards:[card('3','♥️'),card('7','♥️'),card('9','♥️'),card('J','♥️'),card('A','♥️')]},
      {name:'Full House',desc:'Brelan + Paire',cards:[card('Q','♣️'),card('Q','♦️'),card('Q','♠️'),card('5','♥️'),card('5','♣️')]},
      {name:'Carré',desc:'4 même rang + kicker',cards:[card('8','♦️'),card('8','♣️'),card('8','♥️'),card('8','♠️'),card('2','♣️')]},
      {name:'Quinte flush',desc:'Même couleur + suite',cards:[card('5','♠️'),card('6','♠️'),card('7','♠️'),card('8','♠️'),card('9','♠️')]}
    ];
  }
  if(state.language==='de'){
    return[
      {name:'Einzel',desc:'1 Karte',cards:[card('A','♠️')]},
      {name:'Paar',desc:'2 gleiche Ränge',cards:[card('9','♦️'),card('9','♣️')]},
      {name:'Drilling',desc:'3 gleiche Ränge',cards:[card('7','♦️'),card('7','♣️'),card('7','♠️')]},
      {name:'Straße',desc:'5 aufeinanderfolgende Ränge',cards:[card('6','♦️'),card('7','♣️'),card('8','♥️'),card('9','♠️'),card('10','♣️')]},
      {name:'Farbe',desc:'5 gleiche Farbe',cards:[card('3','♥️'),card('7','♥️'),card('9','♥️'),card('J','♥️'),card('A','♥️')]},
      {name:'Full House',desc:'Drilling + Paar',cards:[card('Q','♣️'),card('Q','♦️'),card('Q','♠️'),card('5','♥️'),card('5','♣️')]},
      {name:'Vierling',desc:'4 gleiche Ränge + Beikarte',cards:[card('8','♦️'),card('8','♣️'),card('8','♥️'),card('8','♠️'),card('2','♣️')]},
      {name:'Straight Flush',desc:'Gleiche Farbe + Straße',cards:[card('5','♠️'),card('6','♠️'),card('7','♠️'),card('8','♠️'),card('9','♠️')]}
    ];
  }
  if(state.language==='es'){
    return[
      {name:'Carta',desc:'1 carta',cards:[card('A','♠️')]},
      {name:'Pareja',desc:'2 del mismo rango',cards:[card('9','♦️'),card('9','♣️')]},
      {name:'Trío',desc:'3 del mismo rango',cards:[card('7','♦️'),card('7','♣️'),card('7','♠️')]},
      {name:'Escalera',desc:'5 rangos consecutivos',cards:[card('6','♦️'),card('7','♣️'),card('8','♥️'),card('9','♠️'),card('10','♣️')]},
      {name:'Color',desc:'5 del mismo palo',cards:[card('3','♥️'),card('7','♥️'),card('9','♥️'),card('J','♥️'),card('A','♥️')]},
      {name:'Full House',desc:'Trío + Pareja',cards:[card('Q','♣️'),card('Q','♦️'),card('Q','♠️'),card('5','♥️'),card('5','♣️')]},
      {name:'Póker',desc:'4 del mismo rango + kicker',cards:[card('8','♦️'),card('8','♣️'),card('8','♥️'),card('8','♠️'),card('2','♣️')]},
      {name:'Escalera de color',desc:'Mismo palo + escalera',cards:[card('5','♠️'),card('6','♠️'),card('7','♠️'),card('8','♠️'),card('9','♠️')]}
    ];
  }
  return[
    {name:'單張',desc:'1張牌',cards:[card('A','♠️')]},
    {name:'一對',desc:'2張同點數',cards:[card('9','♦️'),card('9','♣️')]},
    {name:'三條',desc:'3張同點數',cards:[card('7','♦️'),card('7','♣️'),card('7','♠️')]},
    {name:'蛇',desc:'5張連續點數',cards:[card('6','♦️'),card('7','♣️'),card('8','♥️'),card('9','♠️'),card('10','♣️')]},
    {name:'花',desc:'5張同花色',cards:[card('3','♥️'),card('7','♥️'),card('9','♥️'),card('J','♥️'),card('A','♥️')]},
    {name:'俘佬',desc:'三條 + 一對',cards:[card('Q','♣️'),card('Q','♦️'),card('Q','♠️'),card('5','♥️'),card('5','♣️')]},
    {name:'四條',desc:'4張同點數 + 腳',cards:[card('8','♦️'),card('8','♣️'),card('8','♥️'),card('8','♠️'),card('2','♣️')]},
    {name:'同花順',desc:'同花色 + 連續點數',cards:[card('5','♠️'),card('6','♠️'),card('7','♠️'),card('8','♠️'),card('9','♠️')]}
  ];
}
function introPanelHtml(){
  return renderIntroPanel({
    intro:introText(),
    language:state.language,
    colorizeSuitText,
    esc,
    withBase,
    renderStaticCard,
    introHandSamples:introHandSamples()
  });
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
  isGoogleSignedIn:()=>Boolean(state.home.google?.signedIn)
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
  const entry=store.players[String(identity.id??'')];
  if(!entry)return;
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
    if(!ids.length)return false;
    let data=null;
    let foundId='';
    for(const id of ids){
      if(firebaseDb){
        try{
          const s=await firebaseDb.collection(FIRESTORE_LB_COLLECTION).doc(id).get();
          if(s.exists){data=s.data()??{};foundId=id;break;}
        }catch{}
      }
      if(!data){
        try{
          const d=await readProfileDocByRest(id);
          if(d){data=d;foundId=id;break;}
        }catch{}
      }
    }
    if(!data)return false;
    const d=data;
    const restoredName=String(d.name??'').trim().slice(0,18);
    const restoredScore=scoreFromStoredTotal(d.totalScore);
    const restoredGender=String(d.gender??state.home.gender??'male')==='female'?'female':'male';
    const restoredPicture=String(d.picture??'').trim();
    applyMainSettings(d.settings);
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
    if(restoredName){
      state.home.name=restoredName;
    }
    state.home.gender=restoredGender;
    if(restoredPicture&&state.home.google?.signedIn){
      state.home.google.picture=restoredPicture;
    }
    const inGame=state.screen==='game'&&Array.isArray(state.solo.players)&&state.solo.players.length>0&&!state.solo.gameOver;
    if(!inGame){
      state.score=restoredScore;
      state.solo.totals=[restoredScore,5000,5000,5000];
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
    return true;
  }catch(err){
    console.error('profile hydrate failed',err);
    return false;
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
        apiKey:String(row.apiKey||'').trim()
      });
    });
    const primaryId=primaryFirebaseInstanceId();
    if(primaryId&&!seen.has(primaryId)){
      out.unshift({
        id:primaryId,
        projectId:primaryId,
        projectNumber:String(FIREBASE_CONFIG.messagingSenderId||'').trim(),
        appId:String(FIREBASE_CONFIG.appId||'').trim(),
        apiKey:String(FIREBASE_CONFIG.apiKey||'').trim()
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
      apiKey:String(FIREBASE_CONFIG.apiKey||'').trim()
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
    const projectId=String(row.projectId||row.id||'').trim();
    if(!projectId)continue;
    const db=await getFirebaseDbForInstanceId(projectId);
    if(db)available.push(projectId);
  }
  if(!available.length)return primaryFirebaseInstanceId();
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
function loadGoogleSession(){
  try{
    const raw=localStorage.getItem(GOOGLE_SESSION_KEY);
    const parsed=raw?JSON.parse(raw):null;
    const email=String(parsed?.email??'').trim().toLowerCase().slice(0,120);
    if(!email)return;
    state.home.google={...state.home.google,signedIn:true,provider:'google',email};
    if(initFirebaseIfReady()){
      void hydrateProfileFromCloudByIdentity(currentLeaderboardIdentity()).then(()=>{if(state.home.showLeaderboard)refreshLeaderboard(true);render();});
    }
  }catch{}
}
function saveGoogleSession(){
  try{
    const email=String(state.home.google.email??'').trim().toLowerCase().slice(0,120);
    if(!email){
      localStorage.removeItem(GOOGLE_SESSION_KEY);
      return;
    }
    localStorage.setItem(GOOGLE_SESSION_KEY,JSON.stringify({email}));
  }catch{}
}
function clearGoogleSession(){
  try{localStorage.removeItem(GOOGLE_SESSION_KEY);}catch{}
}
function normalizeAuthProvider(provider){
  const v=String(provider??'').trim().toLowerCase();
  if(v==='google')return v;
  return 'google';
}
function authProviderPrefix(){
  return normalizeAuthProvider(state.home.google?.provider);
}
function signedInForPlay(){
  const authUser=firebaseAuth?.currentUser;
  if(authUser?.uid)return true;
  const g=state.home.google??{};
  return Boolean(g.signedIn&&(String(g.email??'').trim()||String(g.uid??'').trim()||String(g.sub??'').trim()));
}
function signedInWithEmail(){return Boolean(state.home.google.signedIn&&state.home.google.email);}
function currentAuthUid(){return String(firebaseAuth?.currentUser?.uid??'').trim();}
const LOCAL_ROOM_KEY='big2.currentRoomId';
function baseRoomPlayerId(){
  const uid=currentAuthUid();
  if(uid)return `uid:${uid}`;
  if(!state.sessionId){
    const rand=(()=>{try{return crypto.randomUUID();}catch{return Math.random().toString(36).slice(2,10);}})();
    state.sessionId=`guest:${rand}`;
  }
  return state.sessionId;
}
function currentRoomPlayerId(){
  const pinned=String(state.room?.playerId??'').trim();
  if(pinned)return pinned;
  return baseRoomPlayerId();
}
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
  ROOM_RESULT_IDLE_MS,
  authPictureUrl,
  buildRoomGameState,
  bumpRoomPlayerLastSeen,
  clampScoreValue,
  clearRoomStartPending,
  currentHumanScoreValue,
  currentRoomDb,
  currentRoomPlayerId,
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
  roomLifecycleExpired,
  roomPlayerIds,
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
function isRoomPresenceOnlyUpdate(prev,next){
  if(!prev||!next)return false;
  const prevStatus=String(prev.status||'');
  const nextStatus=String(next.status||'');
  if(prevStatus!==nextStatus)return false;
  if(prevStatus!=='playing'&&prevStatus!=='finished')return false;
  if(Number(prev.gameVersion||0)!==Number(next.gameVersion||0))return false;
  if(String(prev.code||'')!==String(next.code||''))return false;
  if(String(prev.hostId||'')!==String(next.hostId||''))return false;
  if(String(prev.hostName||'')!==String(next.hostName||''))return false;
  if(Boolean(prev.isPrivate)!==Boolean(next.isPrivate))return false;
  if(Number(prev.maxPlayers||0)!==Number(next.maxPlayers||0))return false;
  if(Number(prev.roundCount||0)!==Number(next.roundCount||0))return false;
  const prevPlayers=Array.isArray(prev.players)?prev.players:[];
  const nextPlayers=Array.isArray(next.players)?next.players:[];
  if(prevPlayers.length!==nextPlayers.length)return false;
  const prevMap=new Map(prevPlayers.map((p)=>[String(p?.uid??''),p]));
  for(const p of nextPlayers){
    const uid=String(p?.uid??'');
    const before=prevMap.get(uid);
    if(!before)return false;
    if(String(before.name||'')!==String(p.name||''))return false;
    if(String(before.gender||'')!==String(p.gender||''))return false;
    if(String(before.picture||'')!==String(p.picture||''))return false;
    if(Boolean(before.isHost)!==Boolean(p.isHost))return false;
    if(Number(before.seat)!==Number(p.seat))return false;
  }
  return true;
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
      const resolved=await resolveRoomDocByDirectory(active,'');
      if(!resolved){
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
  const roomFetchLimit=20;
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
    const players=Array.isArray(data.players)?data.players:[];
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
    const recentHumans=activePlayers.filter((p)=>isRoomPlayerHuman(p)&&Number(p.lastSeen)>0&&(now-Number(p.lastSeen)<=ROOM_OFFLINE_MS));
    if((status!=='playing'&&!recentHumans.length)||(status==='playing'&&!recentHumans.length)){
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
    if(hiddenRooms){
      console.warn('Hidden rooms',hiddenRooms);
    }
    state.home.activeRooms.loadedAt=Date.now();
  }catch{
    state.home.activeRooms.error='load';
  }finally{
    state.home.activeRooms.loading=false;
    render();
  }
}
async function createRoom(){
  if(!initFirebaseIfReady()){
    setRoomError(t('roomCreateFail'));
    return;
  }
  if(!signedInForPlay()){
    setRoomError(t('roomLoginRequired'));
    return;
  }
  setRoomError('');
  try{
    if(state.room.id){
      setRoomError(t('roomAlreadyIn'));
      return;
    }
    const membership=await ensureSingleRoomMembership('');
    if(!membership.ok){
      if(membership.roomId){
        void connectToRoom(membership.roomId,membership.code||'',membership.instanceId||'');
        void updateActiveRoomPointer(membership.roomId);
      }
      setRoomError(t('roomAlreadyIn'));
      return;
    }
    const gate=await gateUserRoomAccess('');
    const gateGuest=await gateGuestRoomAccess('');
    if(!gateGuest.ok){
      setRoomError(t('roomAlreadyIn'));
      return;
    }
    if(!gate.ok){
      setRoomError(t('roomAlreadyIn'));
      return;
    }
    const firebaseInstanceId=await chooseNextRoomFirebaseInstanceId();
    const roomDb=await getFirebaseDbForInstanceId(firebaseInstanceId);
    if(!roomDb){setRoomError(t('roomCreateFail'));return;}
    let code='';
    for(let i=0;i<5;i++){
      const candidate=generateRoomCode();
      const exists=await findRoomByCode(candidate);
      if(!exists){code=candidate;break;}
    }
    if(!code){setRoomError(t('roomCreateFail'));return;}
    const uid=baseRoomPlayerId();
    state.room.playerId=uid;
    const name=String(state.home.name||'Player').slice(0,32);
    const now=Date.now();
    const ref=roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc();
    const data={
      hostId:uid,
      hostName:name,
      code,
      status:'lobby',
      createdAt:now,
      updatedAt:now,
      expiresAt:nextRoomIdleExpiry(now),
        maxPlayers:4,
        isPrivate:false,
        players:[{uid,name,gender:state.home.gender==='female'?'female':'male',picture:authPictureUrl(),isHost:true,seat:0,lastSeen:now}],
      playerIds:[uid],
      settings:collectMainSettings(),
      totals:[currentHumanScoreValue(),5000,5000,5000],
      roundCount:0,
      gameVersion:0
    };
    await ref.set(data);
    try{
      await writeRoomDirectory(ref.id,{
        roomId:ref.id,
        code,
        createdAt:now,
        hostId:uid,
        hostName:name,
        firebaseInstanceId
      });
    }catch(err){
      await ref.delete().catch(()=>{});
      throw err;
    }
    subscribeRoom(ref.id,code,firebaseInstanceId,roomDb);
    void updateActiveRoomPointer(ref.id);
  }catch(err){
    console.error('create room failed',err);
    setRoomError(t('roomCreateFail'));
  }
}
async function joinRoomByCode(codeRaw){
  if(!initFirebaseIfReady()){
    setRoomError(t('roomJoinFail'));
    return;
  }
  if(!signedInForPlay()){
    setRoomError(t('roomLoginRequired'));
    return;
  }
  const code=String(codeRaw??'').trim().toUpperCase();
  if(!code)return;
  setRoomError('');
  try{
    const doc=await findRoomByCode(code);
    if(!doc){setRoomError(t('roomNotFound'));return;}
    const data=doc.data()??{};
    const roomDb=(doc.ref?.firestore)||await getFirebaseDbForInstanceId(doc.instanceId);
    if(!roomDb){setRoomError(t('roomJoinFail'));return;}
    const status=String(data.status||'');
    if(status==='playing'){
      setRoomError(t('roomStatusPlaying'));
      return;
    }
    if(status&&status!=='lobby'&&status!=='starting'&&status!=='finished'){
      setRoomError(t('roomClosed'));
      return;
    }
    if(state.room.id){
      const same=String(state.room.id)===String(doc.id);
      if(same){
        subscribeRoom(doc.id,code,doc.instanceId,roomDb);
        void updateActiveRoomPointer(doc.id);
        state.room.joinOpen=false;
        render();
        return;
      }
      setRoomError(t('roomAlreadyIn'));
      return;
    }
    const membership=await ensureSingleRoomMembership(doc.id);
    if(!membership.ok){
      if(membership.roomId){
        void connectToRoom(membership.roomId,membership.code||'',membership.instanceId||'');
        void updateActiveRoomPointer(membership.roomId);
      }
      setRoomError(t('roomAlreadyIn'));
      return;
    }
    const gate=await gateUserRoomAccess(doc.id);
    const gateGuest=await gateGuestRoomAccess(doc.id);
    if(!gateGuest.ok){
      setRoomError(t('roomAlreadyIn'));
      return;
    }
    if(!gate.ok){
      setRoomError(t('roomAlreadyIn'));
      return;
    }
    if(gate.already){
      subscribeRoom(doc.id,code,doc.instanceId,roomDb);
      void updateActiveRoomPointer(doc.id);
      state.room.joinOpen=false;
      render();
      return;
    }
    const uid=baseRoomPlayerId();
    state.room.playerId=uid;
    await roomDb.runTransaction(async(tx)=>{
      const snap=await tx.get(doc.ref);
      if(!snap.exists)throw new Error('room missing');
      const data=snap.data()??{};
      if(data.status!=='lobby'&&data.status!=='starting'&&data.status!=='finished')throw new Error('room closed');
      const now=Date.now();
      const players=Array.isArray(data.players)?[...data.players]:[];
      const already=players.find((p)=>String(p.uid)===uid);
      const prevCount=players.length;
      const name=String(state.home.name||'Player').slice(0,32);
      const gender=state.home.gender==='female'?'female':'male';
      const picture=authPictureUrl();
      let hostId=String(data.hostId||'').trim();
      let hostName=String(data.hostName||'').trim();
      let tookOver=false;
      if(!already && uid.startsWith('guest:') && (data.status==='lobby'||data.status==='starting')){
        const candidates=players.filter((p)=>{
          if(!isRoomPlayerHuman(p))return false;
          if(!String(p.uid||'').startsWith('guest:'))return false;
          if(String(p.name||'').trim()!==name)return false;
          const pg=String(p.gender||'male')==='female'?'female':'male';
          if(pg!==gender)return false;
          const pp=String(p.picture||'').trim();
          if(pp&&picture&&pp!==picture)return false;
          if(!isRoomPlayerActive(p,data.status,now))return false;
          return true;
        });
        if(candidates.length===1){
          const idx=players.findIndex((p)=>p===candidates[0]);
          if(idx>=0){
            const oldUid=String(players[idx]?.uid||'');
            players[idx]={...players[idx],uid,name,gender,picture,lastSeen:now};
            if(oldUid&&hostId===oldUid){
              hostId=uid;
              hostName=name;
            }
            tookOver=true;
          }
        }
      }
      if(!already && !tookOver){
        if(players.length>=Number(data.maxPlayers||4))throw new Error('room full');
        const usedSeats=new Set(players.map((p)=>Number(p.seat)));
        let seat=0;
        while(usedSeats.has(seat)&&seat<4)seat+=1;
        if(seat>=4)throw new Error('room full');
        players.push({uid,name,gender,picture,isHost:false,seat,lastSeen:now});
      }
      const updates={players,playerIds:roomPlayerIds(players),updatedAt:now,hostId,hostName};
      const selfSeat=Number(players.find((p)=>String(p?.uid||'')===uid)?.seat);
      if(Number.isInteger(selfSeat)&&selfSeat>=0&&selfSeat<4){
        const nextTotals=roomTotalsWithSeatScore(data.totals,selfSeat,currentHumanScoreValue());
        const prevTotals=normalizeRoomTotals(data.totals);
        if(nextTotals.some((v,i)=>v!==prevTotals[i]))updates.totals=nextTotals;
      }
      if(String(data.status)==='lobby'||String(data.status)==='starting'){
        updates.expiresAt=nextRoomIdleExpiry(now);
      }
      if(String(data.status)==='finished'){
        updates.expiresAt=nextRoomIdleExpiry(now);
        updates.resultExpiresAt=now+ROOM_RESULT_IDLE_MS;
        updates.gameVersion=Number(data.gameVersion||0)+1;
      }
      if(data.game&&String(data.status)==='playing'&&players.length>prevCount){
        const game=cloneRoomGame(data.game);
        if(game){
          const text=t('roomJoinLog').replace('{{name}}',name);
          addRoomSystemLog(game,text);
          updates.game=game;
          updates.gameVersion=Number(data.gameVersion||0)+1;
        }
      }
      tx.update(doc.ref,updates);
    });
    subscribeRoom(doc.id,code,doc.instanceId,roomDb);
    void updateActiveRoomPointer(doc.id);
    state.room.joinOpen=false;
    render();
  }catch(err){
    console.error('join room failed',err);
    if(String(err?.message??'').includes('full'))setRoomError(t('roomFull'));
    else if(String(err?.message??'').includes('closed'))setRoomError(t('roomClosed'));
    else setRoomError(t('roomJoinFail'));
  }
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
function nextRoomIdleExpiry(now=Date.now()){
  return now+ROOM_IDLE_KILL_MS;
}
function getRoomTurnTimeout(roomData){
  const v=Number(roomData?.settings?.turnTimeout);
  if(Number.isFinite(v)&&v>=5000&&v<=60000)return Math.trunc(v);
  return DEFAULT_TURN_TIMEOUT_MS;
}
function getRoomTurnTimeoutWithGrace(roomData){
  return getRoomTurnTimeout(roomData)+ROOM_TIMEOUT_GRACE_MS;
}
function getRoomResultExpiresAt(roomData){
  const status=String(roomData?.status??'');
  if(status!=='finished')return 0;
  const direct=Number(roomData?.resultExpiresAt||roomData?.game?.resultExpiresAt||0);
  if(Number.isFinite(direct)&&direct>0)return direct;
  const fallback=Number(roomData?.updatedAt||0);
  return fallback>0?(fallback+ROOM_RESULT_IDLE_MS):0;
}
function getRoomWaitingExpiresAt(roomData){
  const status=String(roomData?.status??'');
  if(status!=='lobby'&&status!=='starting')return 0;
  const direct=Number(roomData?.expiresAt||0);
  if(Number.isFinite(direct)&&direct>0)return direct;
  const fallback=Number(roomData?.updatedAt||roomData?.createdAt||0);
  return fallback>0?(fallback+ROOM_IDLE_KILL_MS):0;
}
function getRoomLifecycleExpiresAt(roomData){
  const status=String(roomData?.status??'');
  if(status==='finished')return getRoomResultExpiresAt(roomData);
  if(status==='lobby'||status==='starting')return getRoomWaitingExpiresAt(roomData);
  return 0;
}
function roomLifecycleTimeLeftMs(roomData,now=Date.now()){
  const expiresAt=getRoomLifecycleExpiresAt(roomData);
  if(!(expiresAt>0))return 0;
  return Math.max(0,expiresAt-now);
}
function roomLifecycleExpired(roomData,now=Date.now()){
  const expiresAt=getRoomLifecycleExpiresAt(roomData);
  return Boolean(expiresAt>0&&now>=expiresAt);
}
function roomLifecycleCountdownText(roomData,now=Date.now()){
  const remaining=roomLifecycleTimeLeftMs(roomData,now);
  return`${Math.ceil(remaining/1000)}s`;
}
function roomResultExpired(roomData,now=Date.now()){
  const expiresAt=getRoomResultExpiresAt(roomData);
  return Boolean(expiresAt>0&&now>=expiresAt);
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
const ROOM_PRESENCE_PING_MS=5000;
async function pruneRoomIfNeeded(){
  const roomDb=currentRoomDb();
  if(!state.room.id||!roomDb)return;
  try{
    const ref=roomDb.collection(FIRESTORE_ROOMS_COLLECTION).doc(state.room.id);
    let shouldDeleteDirectory=false;
    await roomDb.runTransaction(async(tx)=>{
      const snap=await tx.get(ref);
      if(!snap.exists)return;
      const data=snap.data()??{};
      if(String(data.status)!=='playing'||!data.game)return;
      const now=Date.now();
      const turnStartedAt=Number(data.game?.turnStartedAt||0);
      const turnStale=turnStartedAt>0&&(now-turnStartedAt>ROOM_PRUNE_PLAYING_MS);
      if(!turnStale)return;
      const roster=Array.isArray(data.players)?[...data.players]:[];
      const active=roster.filter((p)=>isRoomPlayerActive(p,'playing',now));
      if(active.length===roster.length)return;
      const activeHumans=active.filter((p)=>isRoomPlayerHuman(p));
      if(!activeHumans.length){
        tx.delete(ref);
        shouldDeleteDirectory=true;
        return;
      }
      let hostId=String(data.hostId??'');
      let hostName=String(data.hostName??'');
      if(hostId&&!active.some((p)=>String(p.uid)===hostId)){
        const nextHost=activeHumans[0]??active[0];
        hostId=String(nextHost?.uid??'');
        hostName=String(nextHost?.name??'');
      }
      const updatedGame=syncRoomGameRoster(data)??data.game;
      tx.update(ref,{
        game:updatedGame,
        players:active,
        playerIds:roomPlayerIds(active),
        hostId,
        hostName,
        updatedAt:now,
        gameVersion:Number(data.gameVersion||0)+1
      });
    });
    if(shouldDeleteDirectory)await deleteRoomDirectory(state.room.id);
  }catch{}
}
async function touchRoomPresence(force=false){
  await roomMutationsController.touchRoomPresence(force);
}
function startRoomPresencePing(){
  if(roomPresenceTimer||!state.room.id||!currentRoomDb())return;
  if(String(state.room.data?.status||'')!=='finished')void touchRoomPresence(true);
  roomPresenceTimer=window.setInterval(async()=>{
    if(!state.room.id||!currentRoomDb()){clearInterval(roomPresenceTimer);roomPresenceTimer=null;return;}
    if(String(state.room.data?.status||'')==='finished')return;
    await touchRoomPresence(false);
    await pruneRoomIfNeeded();
  },ROOM_PRESENCE_PING_MS);
}
function currentAuthUserUid(){
  return String(firebaseAuth?.currentUser?.uid??'').trim();
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
    await roomDb.runTransaction(async(tx)=>{
      const snap=await tx.get(ref);
      if(!snap.exists)throw new Error('room missing');
      const data=snap.data()||{};
        if(String(data.status)!=='playing')return;
        if(!data.game)return;
        const updated=cloneRoomGame(data.game)||data.game;
        const by=String(byOverride||currentRoomPlayerId()||'');
        updated.emote={id:match.id,ts:Math.trunc(now),by};
        const updates={
          game:updated,
          updatedAt:now,
          gameVersion:Number(data.gameVersion||0)+1
        };
        const actorUid=currentRoomPlayerId();
        const bumped=bumpRoomPlayerLastSeen(Array.isArray(data.players)?data.players:[],actorUid,now);
        if(bumped.changed)updates.players=bumped.players;
        tx.update(ref,updates);
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
      const selfSeat=roomSeatForPlayer(data,currentRoomPlayerId());
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
      const canAct=(selfSeat===seat)||(target&&!target.isHuman)||(timedOut&&target?.isHuman);
      if(!canAct)throw new Error('not allowed');
        const result=applyPlayToGame(game,seat,cards,now);
        if(!result.ok)throw new Error(result.reason||'invalid');
        const updates={game:result.game,updatedAt:now,gameVersion:Number(data.gameVersion||0)+1};
        const reaction=pickBotReaction(result.game,seat,'play',result);
        if(reaction){
          updates.game={...result.game,emote:{id:reaction.id,ts:Math.trunc(now),by:reaction.by}};
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
      const selfSeat=roomSeatForPlayer(data,currentRoomPlayerId());
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
        const canAct=(selfSeat===seat)||(target&&!target.isHuman)||(timedOut&&target?.isHuman);
        if(!canAct)throw new Error('not allowed');
        const result=applyPassToGame(game,seat,now);
        if(!result.ok)throw new Error(result.reason||'invalid');
        const updates={game:result.game,updatedAt:now,gameVersion:Number(data.gameVersion||0)+1};
        const reaction=pickBotReaction(result.game,seat,'pass',null);
        if(reaction){
          updates.game={...result.game,emote:{id:reaction.id,ts:Math.trunc(now),by:reaction.by}};
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
      const expired=roomLifecycleExpired(liveRoom);
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
    return{id:`account:${email}`,name:String(state.home.name||g.name||'Player').slice(0,32),email,gender};
  }
  const fallback=String(state.home.name??'').trim().slice(0,32)||'Player';
  return{id:`name:${fallback.toLowerCase()}`,name:fallback,email:'',gender};
}
function botLeaderboardIdentity(name,gender){
  const safe=String(name??'Bot').trim().slice(0,32)||'Bot';
  const g=String(gender??'male')==='female'?'female':'male';
  return{id:`bot:${safe.toLowerCase()}`,name:safe,email:'',gender:g,isBot:true,picture:'',settings:{}};
}
function identityLookupIds(identity){
  const out=[];
  const id=String(identity?.id??'').trim();
  if(id)out.push(id);
  const email=String(identity?.email??'').trim().toLowerCase();
  if(email){
    out.push(`account:${email}`);
    out.push(`google:${email}`);
  }
  const uid=String(state.home.google?.uid??'').trim();
  if(uid)out.push(`uid:${uid}`);
  if(!identity?.isBot){
    const safe=String(identity?.name??'').trim().slice(0,32);
    if(safe)out.push(`name:${safe.toLowerCase()}`);
  }
  const seen=new Set();
  return out.filter((x)=>{if(seen.has(x))return false;seen.add(x);return true;});
}
function ensureLeaderboardEntry(store,identity){
  const safe=String(identity?.name??identity??'').trim().slice(0,32);
  if(!safe)return null;
  const email=String(identity?.email??'').trim().toLowerCase().slice(0,120);
  const gender=String(identity?.gender??state.home.gender??'male')==='female'?'female':'male';
  const isBot=isBotIdentity(identity);
  const picture=isBot?'':String(identity?.picture??state.home.google?.picture??'').trim();
  const key=String(identity?.id??(email?`account:${email}`:`name:${safe.toLowerCase()}`)).trim().slice(0,180);
  if(!key)return null;
  if(!store.players[key]){
    const fallbackKey=identityLookupIds(identity).find((id)=>id!==key&&store.players[id]);
    if(fallbackKey){
      store.players[key]={...store.players[fallbackKey],id:key};
      if(fallbackKey!==key)delete store.players[fallbackKey];
    }else{
      store.players[key]={id:key,name:safe,email,gender,picture,settings:isBot?{}:collectMainSettings(),games:0,wins:0,totalScore:5000,updatedAt:Date.now()};
    }
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
    const key=email?`account:${email}`:`name:${name.toLowerCase()}`;
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
function scoreGuideText(){
  if(state.language==='en'){
    return{
      close:'Close',
      headingDesc:'At round end, each loser is deducted based on remaining cards, then multiplied by penalty conditions. The winner receives the total deductions from all losers.',
      baseTitle:'Base Scoring',
      mulTitle:'Multiplier Penalties',
      summary:'Per-loser deduction formula: Base deduction x total multiplier. The winner gains the combined deductions from all losing players.',
      tableHeaders:['Remaining Cards','Base Multiplier','Base Deduction'],
      tableRows:[
        ['1-9','x1','remaining cards x1'],
        ['10-12','x2','remaining cards x2'],
        ['13','x3','13 x3']
      ],
      mulTableHeaders:['Condition','Multiplier','Rule'],
      chaoTableHeaders:['Remaining Cards','Multiplier','Name'],
      chaoTableRows:[
        ['8-9','x2','Chao Two'],
        ['10-11','x3','Chao Three'],
        ['12','x4','Chao Four'],
        ['13','x5','Big Chao']
      ],
      anyTwo:'Holding any 2 card (♦️2/♣️2/♥️2/♠️2) applies x2.',
      topTwo:'Holding ♠️Spade 2 (top 2) applies an additional x2.',
      stack:'If multiple conditions apply, multipliers stack (multiply together).'
    };
  }
  if(state.language==='fr'){
    return{
      close:'Fermer',
      headingDesc:'En fin de manche, chaque perdant est pénalisé selon ses cartes restantes puis multiplié par les conditions. Le gagnant reçoit la somme totale.',
      baseTitle:'Score de base',
      mulTitle:'Multiplicateurs',
      summary:'Formule : déduction de base x multiplicateur total. Le gagnant reçoit la somme des déductions.',
      tableHeaders:['Cartes restantes','Multiplicateur','Déduction'],
      tableRows:[
        ['1-9','x1','cartes restantes x1'],
        ['10-12','x2','cartes restantes x2'],
        ['13','x3','13 x3']
      ],
      mulTableHeaders:['Condition','Multiplicateur','Règle'],
      chaoTableHeaders:['Cartes restantes','Multiplicateur','Nom'],
      chaoTableRows:[
        ['8-9','x2','Chao deux'],
        ['10-11','x3','Chao trois'],
        ['12','x4','Chao quatre'],
        ['13','x5','Grand chao']
      ],
      anyTwo:'Avoir un 2 (♦️2/♣️2/♥️2/♠️2) applique x2.',
      topTwo:'Avoir le ♠️2 (top 2) ajoute un x2.',
      stack:'Si plusieurs conditions s’appliquent, les multiplicateurs se cumulent.'
    };
  }
  if(state.language==='de'){
    return{
      close:'Schließen',
      headingDesc:'Am Rundenende wird jeder Verlierer nach Restkarten abgezogen und mit Bedingungen multipliziert. Der Gewinner erhält die Summe.',
      baseTitle:'Grundwertung',
      mulTitle:'Multiplikatoren',
      summary:'Formel: Grundabzug x Gesamt‑Multiplikator. Der Gewinner erhält die Summe der Abzüge.',
      tableHeaders:['Restkarten','Multiplikator','Abzug'],
      tableRows:[
        ['1-9','x1','Restkarten x1'],
        ['10-12','x2','Restkarten x2'],
        ['13','x3','13 x3']
      ],
      mulTableHeaders:['Bedingung','Multiplikator','Regel'],
      chaoTableHeaders:['Restkarten','Multiplikator','Name'],
      chaoTableRows:[
        ['8-9','x2','Doppelt'],
        ['10-11','x3','Dreifach'],
        ['12','x4','Vierfach'],
        ['13','x5','Groß']
      ],
      anyTwo:'Ein 2 (♦️2/♣️2/♥️2/♠️2) ergibt x2.',
      topTwo:'Ein ♠️2 (Top 2) gibt zusätzlich x2.',
      stack:'Mehrere Bedingungen werden multipliziert.'
    };
  }
  if(state.language==='es'){
    return{
      close:'Cerrar',
      headingDesc:'Al final de la ronda, cada perdedor pierde según cartas restantes y se multiplica por condiciones. El ganador recibe la suma.',
      baseTitle:'Puntuación base',
      mulTitle:'Multiplicadores',
      summary:'Fórmula: deducción base x multiplicador total. El ganador recibe la suma de deducciones.',
      tableHeaders:['Cartas restantes','Multiplicador','Deducción'],
      tableRows:[
        ['1-9','x1','cartas restantes x1'],
        ['10-12','x2','cartas restantes x2'],
        ['13','x3','13 x3']
      ],
      mulTableHeaders:['Condición','Multiplicador','Regla'],
      chaoTableHeaders:['Cartas restantes','Multiplicador','Nombre'],
      chaoTableRows:[
        ['8-9','x2','Chao dos'],
        ['10-11','x3','Chao tres'],
        ['12','x4','Chao cuatro'],
        ['13','x5','Chao grande']
      ],
      anyTwo:'Tener un 2 (♦️2/♣️2/♥️2/♠️2) aplica x2.',
      topTwo:'Tener el ♠️2 (top 2) añade x2.',
      stack:'Si se cumplen varias condiciones, los multiplicadores se acumulan.'
    };
  }
  if(state.language==='ja'){
    return{
      close:'閉じる',
      headingDesc:'ラウンド終了時、各敗者は残り枚数に応じた基本減点にペナルティ倍率を掛けます。勝者は全敗者の合計減点を得ます。',
      baseTitle:'基本得点',
      mulTitle:'倍率ペナルティ',
      summary:'各敗者の減点：基本減点 x 総倍率。勝者は全敗者の合計減点を獲得します。',
      tableHeaders:['残り枚数','基本倍率','基本減点'],
      tableRows:[
        ['1-9','x1','残り枚数 x1'],
        ['10-12','x2','残り枚数 x2'],
        ['13','x3','13 x3']
      ],
      mulTableHeaders:['条件','倍率','ルール'],
      chaoTableHeaders:['残り枚数','倍率','名称'],
      chaoTableRows:[
        ['8-9','x2','チャオ2'],
        ['10-11','x3','チャオ3'],
        ['12','x4','チャオ4'],
        ['13','x5','ビッグ・チャオ']
      ],
      anyTwo:'2（♦️2/♣️2/♥️2/♠️2）を所持していると x2。',
      topTwo:'♠️2（トップ2）を所持していると追加で x2。',
      stack:'複数条件が当てはまる場合、倍率は掛け合わせます。'
    };
  }
  return{
    close:'關閉',
    headingDesc:'每局結算時，先按各輸家剩餘張數計算基本扣分，再套用加乘罰則；最後由贏家獲得所有輸家扣分總和。',
    baseTitle:'基本計分',
    mulTitle:'加乘罰則',
    summary:'每位輸家扣分公式：基本扣分 x 總加乘倍數；贏家加分為所有輸家扣分總和。',
    tableHeaders:['剩餘張數','基本倍數','基本扣分'],
    tableRows:[
      ['1-9 張','x1','按剩餘張數 x1'],
      ['10-12 張','x2','按剩餘張數 x2'],
      ['13 張','x3','13 x3']
    ],
    mulTableHeaders:['條件','倍率','說明'],
    chaoTableHeaders:['剩餘張數','倍率','稱呼'],
    chaoTableRows:[
      ['8-9張','x2','雙炒'],
      ['10-11','x3','三炒'],
      ['12','x4','四炒'],
      ['13張','x5','大炒']
    ],
    anyTwo:'持有任意 2（♦️2/♣️2/♥️2/♠️2）會套用 x2。',
    topTwo:'持有 ♠️2（頂大）會額外再套用 x2。',
    stack:'同時符合多個條件時，倍率會疊乘（相乘計算）。'
  };
}
function scoreGuideModalHtml(){
  return renderScoreGuideModal({
    scoreGuideText:scoreGuideText(),
    esc,
    cardImagePath,
    colorizeSuitText,
    t
  });
}
function speakCallout(text,gender='male',meta={}){
  calloutAudioController.speakCallout(text,gender,meta);
}
function parseJwtPayload(token){try{const p=String(token??'').split('.')[1];if(!p)return null;const b=p.replace(/-/g,'+').replace(/_/g,'/');const json=decodeURIComponent(atob(b).split('').map((c)=>`%${c.charCodeAt(0).toString(16).padStart(2,'0')}`).join(''));return JSON.parse(json);}catch{return null;}}
async function handleCredentialResponse(response){
  const token=String(response?.credential??'').trim();
  if(!token)return;
  const p=parseJwtPayload(token)??{};
  initFirebaseIfReady();
  try{
    const fb=window.firebase;
    if(fb?.auth&&firebaseAuth){
      const cred=fb.auth.GoogleAuthProvider.credential(token);
      const res=await firebaseAuth.signInWithCredential(cred);
      const user=res?.user;
      if(user?.uid){
        state.home.google.uid=String(user.uid).slice(0,128);
        state.home.google.sub=String(user.uid).slice(0,64);
      }
    }
  }catch(err){
    console.warn('firebase auth credential sign-in failed',err);
  }
  const email=String(p.email??'').trim().toLowerCase().slice(0,120);
  const pic=String(p.picture??'').trim();
  const gRaw=String(p.gender??p.sex??'').trim().toLowerCase();
  const googleGender=(gRaw==='female'||gRaw==='male')?gRaw:'';
  const signedIn=Boolean(email||String(p.sub??'').trim());
  state.home.google={signedIn,provider:'google',name:String(p.name??'').slice(0,18),email,uid:String(p.sub??'').slice(0,128),sub:String(p.sub??'').slice(0,64),token,picture:pic,gender:googleGender};
  if(signedIn){
    await hydrateProfileFromCloudByIdentity(currentLeaderboardIdentity());
    if(state.home.google.name)state.home.name=state.home.google.name;
    if(googleGender)state.home.gender=googleGender;
    saveGoogleSession();
    await syncLeaderboardProfile(currentLeaderboardIdentity());
    if(state.home.showLeaderboard)refreshLeaderboard(true);
    void loadActiveRoomPointer();
  }
  render();
}
function clearGoogleInlineRetry(){if(googleInlineRetryTimer){clearTimeout(googleInlineRetryTimer);googleInlineRetryTimer=null;}}
function updateGoogleLocale(){
  const lang=state.language==='en'?'en':'zh_HK';
  const host=document.getElementById('g_id_onload');
  if(host)host.setAttribute('data-locale',lang);
}
function reloadGoogleScriptForLocale(){
  if(googleScriptReloading)return;
  googleScriptReloading=true;
  googleIdentityInitialized=false;
  updateGoogleLocale();
  try{window.google?.accounts?.id?.cancel?.();}catch{}
  const existing=document.querySelector('script[src*="accounts.google.com/gsi/client"]');
  if(existing)existing.remove();
  const lang=state.language==='en'?'en':'zh-HK';
  const script=document.createElement('script');
  script.src=`https://accounts.google.com/gsi/client?hl=${lang}`;
  script.async=true;
  script.onload=()=>{googleScriptReloading=false;renderGoogleInline();};
  script.onerror=()=>{googleScriptReloading=false;};
  document.head.appendChild(script);
}
function ensureGoogleIdentityInitialized(){
  if(googleIdentityInitialized)return true;
  const idApi=window.google?.accounts?.id;
  if(!idApi)return false;
  const clientId=String(document.getElementById('g_id_onload')?.getAttribute('data-client_id')??'').trim();
  if(!clientId)return false;
  try{
    idApi.initialize({client_id:clientId,callback:handleCredentialResponse});
    googleIdentityInitialized=true;
    return true;
  }catch{
    return false;
  }
}
function signOutCurrentProvider(){
  state.home.google={signedIn:false,provider:'',name:'',email:'',uid:'',sub:'',token:'',picture:'',gender:''};
  clearGoogleSession();
  try{window.google?.accounts?.id?.disableAutoSelect?.();}catch{}
  try{firebaseAuth?.signOut?.();}catch{}
}
function authProviderBadgeHtml(provider){
  void provider;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.31h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.15 3.58-8.65Z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.86-3A7.17 7.17 0 0 1 12 19.3c-3.12 0-5.77-2.11-6.72-4.96H1.3v3.11A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.28 14.34a7.2 7.2 0 0 1 0-4.68V6.55H1.3a12 12 0 0 0 0 10.9l3.98-3.11Z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.94 1.23 15.24 0 12 0A12 12 0 0 0 1.3 6.55l3.98 3.11C6.23 6.88 8.88 4.77 12 4.77Z"/></svg>`;
}
function queueGoogleInlineRender(){
  window.setTimeout(()=>{if(state.screen==='home')renderGoogleInline();},0);
  window.requestAnimationFrame(()=>{if(state.screen==='home')renderGoogleInline();});
}
window.onGoogleScriptLoaded=()=>{if(state.screen==='home')queueGoogleInlineRender();};
function bootFirebase(attempt=0){
  if(initFirebaseIfReady()){
    if(signedInWithEmail()){
      void hydrateProfileFromCloudByIdentity(currentLeaderboardIdentity()).then(()=>{if(state.home.showLeaderboard)refreshLeaderboard(true);render();});
    }
    refreshLeaderboard(true);
    void loadActiveRoomPointer();
    return;
  }
  if(attempt<120)window.setTimeout(()=>bootFirebase(attempt+1),250);
}
function renderGoogleInline(){
  clearGoogleInlineRetry();
  const slot=document.getElementById('google-name-inline')??document.getElementById('google-inline');
  if(!slot)return;
  const nameRow=slot.parentElement;
  if(signedInWithEmail()){
    slot.classList.add('signed-in');
    nameRow?.classList.add('signed-in-auth');
    const current=authProviderPrefix();
    const label='Google';
    slot.innerHTML=`<span class="auth-provider-badge auth-provider-${current}" role="img" aria-label="${label}" title="${label}">${authProviderBadgeHtml(current)}</span><button id="google-signout" class="auth-btn auth-btn-signout">${t('signOut')}</button>`;
    document.getElementById('google-signout')?.addEventListener('click',()=>{signOutCurrentProvider();render();});
    return;
  }
  slot.classList.remove('signed-in');
  nameRow?.classList.remove('signed-in-auth');
  const hasGsi=Boolean(window.google?.accounts?.id&&ensureGoogleIdentityInitialized());
  slot.innerHTML=`<div id="google-login-slot"></div>`;
  const gSlot=document.getElementById('google-login-slot');
  if(hasGsi){
    if(gSlot){
      try{
        window.google.accounts.id.renderButton(gSlot,{theme:'filled_blue',size:'medium',text:'signin_with',shape:'square',logo_alignment:'left',width:140});
      }catch{
        gSlot.innerHTML='';
      }
    }
  }else{
    if(gSlot)gSlot.innerHTML='';
  }
}
function isMobilePointer(){return window.matchMedia('(max-width: 860px), (pointer: coarse)').matches;}
function isCoarsePointer(){
  return window.matchMedia('(pointer: coarse) and (hover: none)').matches;
}
function isWebView(){
  const ua=String(navigator?.userAgent??'');
  return /\bwv\b/.test(ua)||/WebView/i.test(ua)||/(Android.*Version\/\d+\.\d+.*Chrome\/\d+\.\d+ Mobile)/i.test(ua);
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
function renderOrientationBlock(){
  app.innerHTML=`<section class="orientation-block"><div class="orientation-card"><div class="orientation-hero" aria-hidden="true"><span class="orientation-phone">📱</span><span class="orientation-rotate">↻</span></div><h2>${esc(t('portraitTitle'))}</h2><p>${esc(t('portraitBody'))}</p></div></section>`;
}
window.handleCredentialResponse=handleCredentialResponse;
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
  if(flush){const d=[...ranks].sort((a,b)=>b-a);const flushSuit=sorted[0].suit;return{valid:true,count,kind:'flush',power:[FIVE_KIND_POWER.flush,flushSuit,...d],sorted};}
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
    if(play.eval.kind==='flush'&&(play.eval.power?.[1]??-1)===3)score+=12;
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
  if(play.eval.kind==='flush'&&(play.eval.power?.[1]??-1)===3)score+=15;
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

function openEmotePicker(open){
  state.emote.open=Boolean(open);
  render();
}
function triggerEmoteSticker(id){
  const match=EMOTE_STICKERS.find((x)=>x.id===id);
  if(!match)return;
  const now=Date.now();
  state.emote.active={id:match.id,ts:now,source:'local'};
  state.emote.open=false;
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
  state.emote.active={id:match.id,ts:now,source:'local',by:`seat:${seat}`};
  state.emote.open=false;
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
  const raw=roomData?.game?.emote ?? roomData?.emote;
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
  state.emote.active={id,ts,source:'room',by:String(raw.by||'')};
  state.emote.open=false;
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

function formatGameLogDateTime(ts){
  const n=Number(ts)||0;
  if(!n)return'';
  try{
    const locale=state.language==='en'?'en-US':state.language==='ja'?'ja-JP':'zh-HK';
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
    const locale=state.language==='en'?'en-US':state.language==='ja'?'ja-JP':'zh-HK';
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
  const zh=state.language==='zh-HK';
  if(e.action==='pass')return zh?'本回合選擇過牌。':'Passed this turn.';
  const cards=e.cards??[];
  const kind=kindLabel(e.kind);
  const cardText=gameLogCardText(cards);
  if(zh)return`出牌：${kind}(${cards.length}張)${cardText?`(${cardText})`:''}`;
  return`Played: ${kind} (${cards.length} cards)${cardText?` (${cardText})`:''}`;
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
function roomCountdownText(roomData){
  const status=String(roomData?.status||'');
  if(status==='finished'||status==='lobby'||status==='starting')return roomLifecycleCountdownText(roomData);
  const game=roomData?.game;
  if(!game||game.gameOver)return'-';
  const startedAt=Number(game.turnStartedAt)||0;
  if(!startedAt)return'-';
  const timeout=getRoomTurnTimeout(roomData);
  const remain=Math.max(0,timeout-(Date.now()-startedAt));
  return`${Math.ceil(remain/1000)}s`;
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
function bindSoundToggle(comboId){
  document.querySelectorAll(`#${comboId} .combo-btn`).forEach((btn)=>btn.addEventListener('click',()=>{
    const v=String(btn.getAttribute('data-value')??'');
    if(v!=='on'&&v!=='off')return;
    setSoundEnabled(v==='on');
    calloutVoiceMode=v==='on'?'auto':'off';
    markComboActive(comboId,v);
    document.querySelectorAll('.runtime-diagnostic-inline').forEach((el)=>{el.textContent=runtimeDiagnosticsText();});
  }));
}
function bindCalloutDisplayToggle(comboId){
  document.querySelectorAll(`#${comboId} .combo-btn`).forEach((btn)=>btn.addEventListener('click',()=>{
    const v=String(btn.getAttribute('data-value')??'');
    if(v!=='on'&&v!=='off')return;
    calloutDisplayEnabled=v==='on';
    markComboActive(comboId,v);
  }));
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
function bindEmoteDisplayToggle(comboId){
  document.querySelectorAll(`#${comboId} .combo-btn`).forEach((btn)=>btn.addEventListener('click',()=>{
    const v=String(btn.getAttribute('data-value')??'');
    if(v!=='on'&&v!=='off')return;
    emoteDisplayEnabled=v==='on';
    markComboActive(comboId,v);
  }));
}
function difficultyIndex(value){
  if(value==='easy')return 0;
  if(value==='hard')return 2;
  return 1;
}
function renderHome(){
  const intro=introText();
  const signedIn=signedInForPlay();
  const diffIndex=difficultyIndex(state.home.aiDifficulty);
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
  const aiFieldLeft=`<label class="field field-ai field-ai-left"><span>${t('ai')}</span><div class="option-combo toggle-combo difficulty-combo" id="difficulty-combo-left" style="--difficulty-index:${diffIndex};"><div class="difficulty-pill" aria-hidden="true"></div><button class="combo-btn toggle-btn ${state.home.aiDifficulty==='easy'?'active':''}" data-value="easy">${t('easy')}</button><button class="combo-btn toggle-btn ${state.home.aiDifficulty==='normal'?'active':''}" data-value="normal">${t('normal')}</button><button class="combo-btn toggle-btn ${state.home.aiDifficulty==='hard'?'active':''}" data-value="hard">${t('hard')}</button></div></label>`;
  const aiFieldRight=`<label class="field field-ai field-ai-right"><span>${t('ai')}</span><div class="option-combo toggle-combo difficulty-combo" id="difficulty-combo-right" style="--difficulty-index:${diffIndex};"><div class="difficulty-pill" aria-hidden="true"></div><button class="combo-btn toggle-btn ${state.home.aiDifficulty==='easy'?'active':''}" data-value="easy">${t('easy')}</button><button class="combo-btn toggle-btn ${state.home.aiDifficulty==='normal'?'active':''}" data-value="normal">${t('normal')}</button><button class="combo-btn toggle-btn ${state.home.aiDifficulty==='hard'?'active':''}" data-value="hard">${t('hard')}</button></div></label>`;
  const roomErrorHtml=state.room.error?`<div class="hint room-error">${esc(state.room.error)}</div>`:'';
  const loginHint=t('loginToStart');
  const roomLobbyBtnCore=inRoom?'':`<button id="room-lobby-open" class="secondary royal-room-btn" ${signedIn?'':'disabled'}>${t('roomEnter')}</button>`;
  const roomButtonsHtml=roomLobbyBtnCore
    ?(signedIn
      ?roomLobbyBtnCore
      :`<span class="locked-btn" data-lock="${esc(loginHint)}">${roomLobbyBtnCore}<span class="lock-badge" aria-hidden="true">🔒</span><span class="locked-tip">${esc(loginHint)}</span></span>`)
    :'';
  const roomSeats=[0,1,2,3].map((seat)=>{
    const seatLabel=t('seatLabel').replace('{{n}}',String(seat+1));
    const roomEntry=roomSeatMap.get(seat)||null;
    const gameEntry=gameSeatMap?gameSeatMap.get(seat)||null:null;
    const entry=useGameRoster?(gameEntry||roomEntry):roomEntry;
    if(!entry){
      return`<div class="lobby-seat empty"><div class="lobby-seat-avatar empty">+</div><div class="lobby-seat-name">${t('roomSeatOpen')}</div><div class="lobby-seat-label">${seatLabel}</div></div>`;
    }
    const entryName=String(entry.name||'');
    const entryGender=String(entry.gender||(useGameRoster?null:roomEntry?.gender)||'male')==='female'?'female':'male';
    const entryPicture=String(useGameRoster?entry.picture:(entry.picture||roomEntry?.picture)||'').trim();
    const isBot=useGameRoster?(!entry.isHuman):(!roomEntry?false:!isRoomPlayerHuman(roomEntry));
    const avatarColor=isBot?playerColorByViewClass(seatCls[seat]||'south'):'#7aaed8';
    const avatarSrc=entryPicture?authPictureUrlFrom(entryPicture):avatarDataUri(entryName,avatarColor,entryGender,isBot);
    const isHost=String(entry.uid)===String(derivedHostId)||entry.isHost===true||String(roomEntry?.uid||'')===String(derivedHostId);
    const lastSeen=Number(roomEntry?.lastSeen)||0;
    const offline=roomData?.status==='playing'&&lastSeen>0&&(Date.now()-lastSeen>ROOM_OFFLINE_MS);
    const hostBadge=isHost?`<span class="lobby-seat-host-badge">🚩</span>`:'';
    const displayName=(roomStatus==='finished'?'':entryName);
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
    joinOpenCountdown:state.room.joinOpenCountdown,
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
    :`<span class="locked-btn" data-lock="${esc(loginHint)}">${soloBtnCore}<span class="lock-badge" aria-hidden="true">🔒</span><span class="locked-tip">${esc(loginHint)}</span></span>`;
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
  queueGoogleInlineRender();
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
function renderOpponents(){
  const seen=new Set();
  const bots=BOT_PROFILE_POOL.filter((b)=>{
    if(seen.has(b.name))return false;
    seen.add(b.name);
    return true;
  });
  const cards=bots.map((b)=>{
    const link=avatarDataUri(b.name,'#7aaed8',b.gender,true);
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
    const genderIcon=b.gender==='female'?'♀':'♂';
    const genderClass=b.gender==='female'?'gender-female':'gender-male';
    return renderOpponentCard({
      link,
      name:b.name,
      genderClass,
      genderIcon,
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
  const profile=OPPONENT_PROFILE_BY_NAME[name]??{dob:'-',hobbies:{},profile:{},zodiac:{},motto:{}};
  const hobbies=profileFieldValue(profile,'hobbies',[]);
  const hobbyText=formatHobbyList(hobbies);
  const profileText=profileFieldValue(profile,'profile','-');
  const profileHtml=profileParagraphsHtml(profileText);
  const zodiacTextRaw=profileFieldValue(profile,'zodiac','-');
  const zodiacText=PROFILE_ZODIAC_TRANSLATIONS[state.language]?.[zodiacTextRaw]??zodiacTextRaw;
  const zodiacMark=zodiacSymbol(zodiacText);
  const mottoText=profileFieldValue(profile,'motto','-');
  const gender=botGenderByName(name);
  const genderLabel=gender==='female'?t('female'):t('male');
  const genderIcon=gender==='female'?'♀':'♂';
  const genderClass=gender==='female'?'gender-female':'gender-male';
  const avatarSrc=avatarDataUri(name,'#7aaed8',gender,true);
  const closeLabel=t('close');
  return renderOpponentProfileModal({
    name,
    closeLabel,
    genderClass,
    genderIcon,
    genderLabel,
    avatarSrc,
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
    seatEmoteHtml
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
    playerColorByViewClass,
    authPictureUrlFrom,
    avatarDataUri,
    profileFieldValue,
    OPPONENT_PROFILE_BY_NAME,
    hashTextSeed,
    roundWinsChipHtml,
    seatCalloutHtml,
    seatEmoteHtml,
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
  if(state.screen==='game'&&!isPortraitMode()){
    state.showLog=true;
  }
  document.body.setAttribute('data-log-open',state.screen==='game'&&state.showLog?'1':'0');
  document.body.setAttribute('data-log-sheet',isPortraitLogSheetOpen()?'1':'0');
  syncWebViewportGuardAttrs();
  syncRoomCountdownTicker();
  if(shouldBlockLandscapeMobile()){
    renderOrientationBlock();
    return;
  }
  if(state.screen==='home'){renderHome();return;}
  if(state.screen==='config'){renderConfig();return;}
  if(state.screen==='opponents'){renderOpponents();return;}
  renderGame();
}
function syncViewport(){
  const root=document.documentElement;
  const short=Math.min(window.innerWidth,window.innerHeight);
  const viewportH=Math.max(0,Math.round(window.visualViewport?.height||window.innerHeight||0));
  const coarse=isCoarsePointer();
  const portrait=isPortraitMode();
  const scale=coarse
    ?Math.max(0.74,Math.min(1.1,short/520))
    :1;
  root.style.setProperty('--card-scale',scale.toFixed(3));
  if(viewportH){
    root.style.setProperty('--app-vh',`${viewportH}px`);
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
window.addEventListener('load',()=>{if(state.screen==='home')queueGoogleInlineRender();},{once:true});
loadGoogleSession();bootFirebase();syncViewport();render();
