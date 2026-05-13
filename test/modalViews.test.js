import test from 'node:test';
import assert from 'node:assert/strict';

import {
  gestureGuideIconSvg,
  renderCoachMarksPanel,
  renderIntroPanel,
  renderLeaderboardModal,
  renderLeaderboardPanel,
  renderOpponentProfileModal,
  renderScoreGuideModal
} from '../src/modalViews.js';
import {formatLeaderboardDateTime, formatLeaderboardPct} from '../src/localeFormatters.js';

test('formatLeaderboardPct rounds to a percentage string', ()=>{
  assert.equal(formatLeaderboardPct(0.456),'46%');
});

test('formatLeaderboardDateTime returns dash for invalid values', ()=>{
  assert.equal(formatLeaderboardDateTime(0,'en'),'-');
});

test('renderIntroPanel includes sample cards and close controls', ()=>{
  const html=renderIntroPanel({
    intro:{
      panelTitle:'Guide',
      panelSub:'Sub',
      btnHide:'Hide',
      historyTitle:'History',
      historyBody:'Para one',
      howTitle:'How',
      howBody:'How body',
      flowTitle:'Flow',
      flowList:['Play {{3D}} first'],
      playTitle:'Play',
      playList:['Play line'],
      guideHowTitle:'Guide How',
      guideHowIntro:'Intro',
      guideHowList:['One'],
      guideHomeTitle:'Home',
      guideHomeIntro:'Intro',
      guideAndroidTitle:'Android',
      guideAndroidSteps:['A1'],
      guideIosTitle:'iOS',
      guideIosSteps:['I1'],
      guideHomeNotes:'Notes'
    },
    language:'en',
    colorizeSuitText:(value)=>value,
    esc:(value)=>String(value),
    withBase:(value)=>`base:${value}`,
    appTitle:'Big Two',
    renderStaticCard:()=>'<div class="card"></div>',
    introHandSamples:[{name:'Single',desc:'One card',cards:[{rank:0,suit:0}]}],
    showGestureGuide:true
  });
  assert.match(html,/id="intro-modal"/);
  assert.match(html,/Diamond 3/);
  assert.match(html,/class="card"/);
  assert.match(html,/Guide How/);
  assert.match(html,/title-icon-guide/);
  assert.doesNotMatch(html,/gesture-help-stage/);
  assert.doesNotMatch(html,/gesture-help-label/);
});

test('renderCoachMarksPanel uses the gesture guide icon', ()=>{
  const html=renderCoachMarksPanel({
    intro:{
      btnHide:'Hide',
      guideGestureTitle:'Gesture Controls',
      guideGestureIntro:'Mobile game gestures:',
      guideGestureList:[
        'Swipe up on the table to open the game log.',
        'Swipe right to request a recommendation.',
        'Swipe down to trigger the food callout.',
        'Swipe left to open the emote picker.',
        'Swipe up on selected cards to play them.'
      ]
    },
    language:'zh-HK',
    esc:(value)=>String(value)
  });
  assert.match(html,/id="coach-marks-modal"/);
  assert.match(html,/coach-marks-close/);
  assert.match(html,/gesture-icons\/hand-up\.png/);
  assert.match(html,/遊戲紀錄/);
  assert.match(html,/建議/);
  assert.match(html,/上餐/);
  assert.match(html,/表情/);
  assert.match(html,/出牌/);
  assert.match(html,/gesture-help-action-btn/);
  assert.match(html,/gesture-help-title-row/);
  assert.match(html,/title-icon-log/);
  assert.match(html,/🛎️/);
  assert.match(html,/😆/);
  assert.match(html,/gesture-help-action-btn-handDown/);
  assert.match(html,/gesture-help-action-btn-handLeft/);
  assert.match(html,/gesture-help-action-btn-handDown" type="button"><span class="gesture-help-action-icon" aria-hidden="true"><span aria-hidden="true">🛎️<\/span><\/span><\/button>/);
  assert.match(html,/gesture-help-action-btn-handLeft" type="button"><span class="gesture-help-action-icon" aria-hidden="true"><span aria-hidden="true">😆<\/span><\/span><\/button>/);
  assert.match(html,/gesture-help-stage/);
  assert.doesNotMatch(html,/coach-close-icon/);
});

test('gestureHelpLabel uses Game Log for English hand-up', ()=>{
  const html=renderCoachMarksPanel({
    intro:{
      btnHide:'Hide',
      guideGestureTitle:'Gesture Controls',
      guideGestureIntro:'Mobile game gestures:',
      guideGestureList:['Swipe up on the table to open the game log.']
    },
    language:'en',
    esc:(value)=>String(value)
  });
  assert.match(html,/Game Log/);
  assert.doesNotMatch(html,/>Log<\/span>/);
});

test('gestureGuideIconSvg uses the tap badge icon', ()=>{
  assert.match(gestureGuideIconSvg(),/gesture-icons\/tap\.png/);
});

test('renderLeaderboardPanel renders rows and controls', ()=>{
  const html=renderLeaderboardPanel({
    leaderboard:{
      rows:[{id:'u1',name:'Alice',gender:'female',picture:'',games:4,wins:3,winRate:0.75,totalScore:5300,updatedAt:1710000000000}],
      sort:'totalDelta',
      period:'all'
    },
    botProfiles:[{name:'Bot A',gender:'male'}],
    authPictureUrlFrom:(value)=>`pic:${value}`,
    avatarDataUri:(name)=>`avatar:${name}`,
    esc:(value)=>String(value),
    t:(key)=>key,
    language:'en'
  });
  assert.match(html,/id="lb-sort"/);
  assert.match(html,/Alice/);
  assert.match(html,/Bot A/);
});

test('renderLeaderboardPanel ignores stale bot picture and uses bot asset', ()=>{
  const html=renderLeaderboardPanel({
    leaderboard:{
      rows:[{id:'bot:bot-a:0',name:'Bot A',gender:'male',picture:'https://example.com/old.png',games:4,wins:3,winRate:0.75,totalScore:5300,updatedAt:1710000000000}],
      sort:'totalDelta',
      period:'all'
    },
    botProfiles:[],
    authPictureUrlFrom:(value)=>`pic:${value}`,
    avatarDataUri:(name,_color,_gender,isBot)=>`avatar:${name}:${isBot}`,
    esc:(value)=>String(value),
    t:(key)=>key,
    language:'en'
  });
  assert.match(html,/src="avatar:Bot A:true"/);
  assert.doesNotMatch(html,/old\.png/);
});

test('renderLeaderboardPanel treats bot names as bots even without a bot id prefix', ()=>{
  const html=renderLeaderboardPanel({
    leaderboard:{
      rows:[{id:'axel',name:'Axel',gender:'male',picture:'https://example.com/old.png',games:4,wins:3,winRate:0.75,totalScore:5300,updatedAt:1710000000000}],
      sort:'totalDelta',
      period:'all'
    },
    botProfiles:[{name:'Axel',gender:'male'}],
    authPictureUrlFrom:(value)=>`pic:${value}`,
    avatarDataUri:(name,_color,_gender,isBot)=>`avatar:${name}:${isBot}`,
    esc:(value)=>String(value),
    t:(key)=>key,
    language:'en'
  });
  assert.match(html,/src="avatar:Axel:true"/);
  assert.doesNotMatch(html,/old\.png/);
});

test('renderLeaderboardPanel adds fallback source for bot avatars', ()=>{
  const html=renderLeaderboardPanel({
    leaderboard:{
      rows:[{id:'bot:bot-a:0',name:'Bot A',gender:'male',picture:'',games:4,wins:3,winRate:0.75,totalScore:5300,updatedAt:1710000000000}],
      sort:'totalDelta',
      period:'all'
    },
    botProfiles:[],
    authPictureUrlFrom:(value)=>`pic:${value}`,
    avatarDataUri:(name,_color,_gender,isBot)=>isBot?`bot:${name}`:`fallback:${name}`,
    esc:(value)=>String(value),
    t:(key)=>key,
    language:'en'
  });
  assert.match(html,/data-fallback-src="fallback:Bot A"/);
  assert.match(html,/onerror="this.onerror=null;this.src=this.dataset.fallbackSrc"/);
});

test('renderLeaderboardModal wraps panel content', ()=>{
  const html=renderLeaderboardModal({
    t:(key)=>key,
    esc:(value)=>String(value),
    leaderboardPanelHtml:'<div id="panel"></div>'
  });
  assert.match(html,/id="lb-modal"/);
  assert.match(html,/id="panel"/);
});

test('renderScoreGuideModal renders tables and special 2-card rows', ()=>{
  const html=renderScoreGuideModal({
    scoreGuideText:{
      close:'Close',
      headingDesc:'Heading',
      baseTitle:'Base',
      mulTitle:'Multiplier',
      summary:'Summary',
      tableHeaders:['A','B','C'],
      tableRows:[['1-9','x1','desc']],
      mulTableHeaders:['Cond','Mul','Rule'],
      chaoTableHeaders:['Rem','Mul','Name'],
      chaoTableRows:[['8-9','x2','Chao']],
      anyTwo:'Any 2',
      topTwo:'Top 2',
      stack:'Stack'
    },
    esc:(value)=>String(value),
    cardImagePath:({rank,suit})=>`/cards/${rank}-${suit}.png`,
    colorizeSuitText:(value)=>value,
    t:(key)=>key
  });
  assert.match(html,/id="score-guide-modal"/);
  assert.match(html,/\/cards\/12-0\.png/);
  assert.match(html,/\/cards\/12-3\.png/);
  assert.match(html,/scoreGuideTitle/);
});

test('renderOpponentProfileModal renders avatar, chips, and translated close label', ()=>{
  const html=renderOpponentProfileModal({
    name:'Luna',
    closeLabel:'Close',
    genderClass:'gender-female',
    genderLabel:'Female',
    avatarSrc:'/avatar.png',
    avatarStampHtml:'<span class="result-confidential-stamp opponent-profile-confidential-stamp">CONFIDENTIAL</span>',
    zodiacLabel:'Zodiac',
    zodiacMark:'♍',
    zodiacText:'Virgo',
    dobLabel:'DOB',
    dob:'1999-09-09',
    hobbiesLabel:'Hobbies',
    hobbyText:'Music, Travel',
    mottoLabel:'Motto',
    mottoText:'Stay cool.',
    profileLabel:'Profile',
    profileHtml:'<p>Bio</p>',
    esc:(value)=>String(value)
  });
  assert.match(html,/id="opponent-profile-modal"/);
  assert.match(html,/\/avatar\.png/);
  assert.match(html,/opponent-profile-confidential-stamp/);
  assert.match(html,/opponent-profile-motto/);
  assert.match(html,/aria-label="Close"/);
  assert.match(html,/<p>Bio<\/p>/);
});
