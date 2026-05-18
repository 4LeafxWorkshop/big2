import test from 'node:test';
import assert from 'node:assert/strict';

import {createHomeEventsBinder} from '../src/homeEvents.js';

function makeElement({attrs={},value=''}={}){
  const listeners=new Map();
  const classSet=new Set();
  return {
    value,
    innerHTML:'',
    textContent:'',
    style:{
      values:{},
      setProperty(name,val){
        this.values[name]=val;
      }
    },
    addEventListener(type,handler){
      const bucket=listeners.get(type)??[];
      bucket.push(handler);
      listeners.set(type,bucket);
    },
    async dispatch(type,event={}){
      const bucket=listeners.get(type)??[];
      for(const handler of bucket){
        await handler({
          currentTarget:this,
          target:this,
          preventDefault(){},
          stopPropagation(){},
          ...event
        });
      }
    },
    getAttribute(name){
      return Object.hasOwn(attrs,name)?attrs[name]:null;
    },
    hasAttribute(name){
      return Object.hasOwn(attrs,name);
    },
    classList:{
      add(name){
        classSet.add(name);
      },
      remove(name){
        classSet.delete(name);
      },
      toggle(name,force){
        if(force===false){classSet.delete(name);return;}
        classSet.add(name);
      },
      contains(name){
        return classSet.has(name);
      }
    }
  };
}

function makeDocument({byId={},bySelector={}}={}){
  return {
    getElementById(id){
      return byId[id]??null;
    },
    querySelector(selector){
      const list=bySelector[selector]??[];
      return list[0]??null;
    },
    querySelectorAll(selector){
      return bySelector[selector]??[];
    }
  };
}

function bindWith(overrides={}){
  const doc=overrides.document??makeDocument();
  const win=overrides.window??{setTimeout:()=>1,clearTimeout(){}};
  const bind=createHomeEventsBinder({
    documentRef:()=>doc,
    windowRef:()=>win
  });
  const state=overrides.state??{
    home:{mode:'home',showLeaderboard:true,leaderboard:{sort:'totalDelta',period:'all'}},
    room:{
      joinOpen:false,
      error:'',
      joinOpenCountdown:15,
      pendingStart:false,
      code:'ABCD',
      data:{
        status:'lobby',
        players:[
          {uid:'uid:a',seat:0},
          {uid:'guest:b',seat:1}
        ]
      }
    },
    showScoreGuide:false,
    screen:'home',
    opponentProfileName:''
  };
  bind({
    state,
    joinOpen:false,
    render:overrides.render??(()=>{}),
    refreshLeaderboard:overrides.refreshLeaderboard??(()=>{}),
    signedInForPlay:overrides.signedInForPlay??(()=>true),
    signedInWithEmail:overrides.signedInWithEmail??(()=>false),
    markComboActive:overrides.markComboActive??(()=>{}),
    saveGoogleSession:overrides.saveGoogleSession??(()=>{}),
    difficultyIndex:overrides.difficultyIndex??(()=>0),
    backOptions:overrides.backOptions??[{value:'blue'}],
    bindBackCarousel:overrides.bindBackCarousel??(()=>{}),
    bindSoundToggle:overrides.bindSoundToggle??(()=>{}),
    bindCalloutDisplayToggle:overrides.bindCalloutDisplayToggle??(()=>{}),
    bindGestureHelpToggle:overrides.bindGestureHelpToggle??(()=>{}),
    bindEmoteDisplayToggle:overrides.bindEmoteDisplayToggle??(()=>{}),
    setRoomError:overrides.setRoomError??(()=>{}),
    t:overrides.t??((key)=>key),
    loadActiveRooms:overrides.loadActiveRooms??(async()=>{}),
    createRoom:overrides.createRoom??(async()=>{}),
    joinRoomByCode:overrides.joinRoomByCode??(async()=>{}),
    resetRoomExpiryTo60s:overrides.resetRoomExpiryTo60s??(async()=>{}),
    leaveRoom:overrides.leaveRoom??(async()=>{}),
    roomIsHost:overrides.roomIsHost??true,
    setRoomPrivacy:overrides.setRoomPrivacy??(async()=>{}),
    pendingStartTimerRef:overrides.pendingStartTimerRef??{get:()=>null,set(){}},
    runPopunderAd:overrides.runPopunderAd??(()=>{}),
    syncLeaderboardProfile:overrides.syncLeaderboardProfile??(async()=>true),
    currentLeaderboardIdentity:overrides.currentLeaderboardIdentity??(()=>({id:'u1'})),
    waitMs:overrides.waitMs??(async()=>{}),
    startRoom:overrides.startRoom??(async()=>{}),
    guardAction:overrides.guardAction??(()=>true),
    unlockAudio:overrides.unlockAudio??(()=>{}),
    initFirebaseIfReady:overrides.initFirebaseIfReady??(()=>{}),
    startSoloGame:overrides.startSoloGame??(()=>{}),
    armPopunderForGesture:overrides.armPopunderForGesture??(()=>{}),
    schedulePopunderAfterRender:overrides.schedulePopunderAfterRender??(()=>{}),
    refreshRoomInviteQrDataUrl:overrides.refreshRoomInviteQrDataUrl??(()=>{}),
    roomInviteUrlFromCode:overrides.roomInviteUrlFromCode??((code)=>`https://example.com/${code}`),
    roomInviteShareTextFromCode:overrides.roomInviteShareTextFromCode??((code)=>`Invite ${code}`),
    roomInviteWhatsappUrlFromCode:overrides.roomInviteWhatsappUrlFromCode??(()=>''), 
    legalMiniCopy:overrides.legalMiniCopy??(()=>({labels:{},content:{}}))
  });
  return {state,doc,win};
}

test('home binder blocks lobby open when sign-in is required', async()=>{
  const roomLobbyOpen=makeElement();
  let roomError='';
  bindWith({
    document:makeDocument({byId:{'room-lobby-open':roomLobbyOpen}}),
    signedInForPlay:()=>false,
    setRoomError:(value)=>{roomError=value;}
  });
  await roomLobbyOpen.dispatch('click');
  assert.equal(roomError,'roomLoginRequired');
});

test('home binder ignores room privacy toggles for non-hosts', async()=>{
  const publicBtn=makeElement({attrs:{'data-private':'0'}});
  const privateBtn=makeElement({attrs:{'data-private':'1'}});
  let privacyCalls=0;
  bindWith({
    document:makeDocument({bySelector:{'#room-privacy-toggle [data-private]':[publicBtn,privateBtn]}}),
    roomIsHost:false,
    setRoomPrivacy:async()=>{privacyCalls+=1;}
  });
  await publicBtn.dispatch('click');
  await privateBtn.dispatch('click');
  assert.equal(privacyCalls,0);
});

test('home binder arms room start pending flow', async()=>{
  const roomStart=makeElement();
  let timerValue=null;
  let renderCount=0;
  let startRoomCalls=0;
  const state={
    home:{
      mode:'home',
      showLeaderboard:true,
      google:{
        signedIn:true,
        email:'user@example.com',
        hydrating:true,
        profileMissing:false
      },
      leaderboard:{sort:'totalDelta',period:'all'}
    },
    room:{
      joinOpen:false,
      error:'',
      joinOpenCountdown:15,
      pendingStart:false,
      code:'ABCD',
      data:{
        status:'lobby',
        players:[
          {uid:'uid:a',seat:0},
          {uid:'guest:b',seat:1}
        ]
      }
    },
    showScoreGuide:false,
    screen:'home',
    opponentProfileName:''
  };
  let waitCalls=0;
  bindWith({
    document:makeDocument({byId:{'room-start':roomStart}}),
    state,
    pendingStartTimerRef:{
      get:()=>timerValue,
      set:(value)=>{timerValue=value;}
    },
    signedInWithEmail:()=>true,
    waitMs:async()=>{
      waitCalls+=1;
      state.home.google.hydrating=false;
    },
    window:{
      setTimeout:()=>{
        return 2;
      },
      clearTimeout(){}
    },
    render:()=>{renderCount+=1;},
    startRoom:async()=>{startRoomCalls+=1;}
  });
  await roomStart.dispatch('click');
  assert.equal(renderCount,0);
  assert.equal(startRoomCalls,1);
  assert.equal(timerValue,2);
  assert.equal(waitCalls,1);
});

test('home binder arms popunder during solo start gesture', async()=>{
  const soloStart=makeElement();
  let armed=0;
  let started=0;
  const state={
    home:{
      mode:'home',
      showLeaderboard:false,
      google:{
        signedIn:true,
        email:'user@example.com',
        hydrating:true,
        profileMissing:false
      },
      leaderboard:{sort:'totalDelta',period:'all'}
    },
    room:{
      joinOpen:false,
      error:'',
      joinOpenCountdown:15,
      pendingStart:false,
      code:'ABCD',
      data:{
        status:'lobby',
        players:[
          {uid:'uid:a',seat:0},
          {uid:'guest:b',seat:1}
        ]
      }
    },
    showScoreGuide:false,
    screen:'home',
    opponentProfileName:''
  };
  let waitCalls=0;
  bindWith({
    document:makeDocument({byId:{'solo-start':soloStart}}),
    state,
    armPopunderForGesture:()=>{armed+=1;},
    signedInWithEmail:()=>true,
    waitMs:async()=>{
      waitCalls+=1;
      state.home.google.hydrating=false;
    },
    startSoloGame:()=>{started+=1;}
  });
  await soloStart.dispatch('pointerdown');
  await new Promise((resolve)=>setImmediate(resolve));
  assert.equal(armed,1);
  assert.equal(started,1);
  assert.equal(waitCalls,1);
});

test('home binder waits for google hydration before room create', async()=>{
  const roomCreate=makeElement();
  const state={
    home:{
      mode:'home',
      showLeaderboard:false,
      google:{
        signedIn:true,
        email:'user@example.com',
        hydrating:true,
        profileMissing:false
      },
      leaderboard:{sort:'totalDelta',period:'all'}
    },
    room:{
      joinOpen:false,
      error:'',
      joinOpenCountdown:15,
      pendingStart:false,
      code:'ABCD',
      data:{
        status:'lobby',
        players:[
          {uid:'uid:a',seat:0},
          {uid:'guest:b',seat:1}
        ]
      }
    },
    showScoreGuide:false,
    screen:'home',
    opponentProfileName:''
  };
  let waitCalls=0;
  let createCalls=0;
  bindWith({
    document:makeDocument({byId:{'room-create':roomCreate}}),
    state,
    signedInWithEmail:()=>true,
    waitMs:async()=>{
      waitCalls+=1;
      state.home.google.hydrating=false;
    },
    createRoom:async()=>{createCalls+=1;}
  });
  await roomCreate.dispatch('click');
  assert.equal(waitCalls,1);
  assert.equal(createCalls,1);
});

test('home binder waits for hydrated login before solo and room start', async()=>{
  const soloStart=makeElement();
  const roomStart=makeElement();
  const state={
    home:{
      mode:'home',
      showLeaderboard:false,
      google:{
        signedIn:true,
        email:'user@example.com',
        hydrating:true,
        profileMissing:false
      },
      leaderboard:{sort:'totalDelta',period:'all'}
    },
    room:{
      joinOpen:false,
      error:'',
      joinOpenCountdown:15,
      pendingStart:false,
      code:'ABCD',
      data:{
        status:'lobby',
        players:[
          {uid:'uid:a',seat:0},
          {uid:'guest:b',seat:1}
        ]
      }
    },
    showScoreGuide:false,
    screen:'home',
    opponentProfileName:''
  };
  let waitCalls=0;
  let soloCalls=0;
  let roomCalls=0;
  let resolveWait;
  const waitPromise=new Promise((resolve)=>{
    resolveWait=resolve;
  });
  bindWith({
    document:makeDocument({byId:{'solo-start':soloStart,'room-start':roomStart}}),
    state,
    signedInWithEmail:()=>true,
    waitMs:async()=>{
      waitCalls+=1;
      await waitPromise;
      state.home.google.hydrating=false;
    },
    startSoloGame:()=>{soloCalls+=1;},
    startRoom:async()=>{roomCalls+=1;}
  });
  const soloFlow=soloStart.dispatch('pointerdown');
  const roomFlow=roomStart.dispatch('click');
  await Promise.resolve();
  assert.equal(waitCalls,2);
  resolveWait();
  await Promise.all([soloFlow,roomFlow]);
  await new Promise((resolve)=>setImmediate(resolve));
  assert.equal(soloCalls,1);
  assert.equal(roomCalls,1);
  assert.equal(state.home.google.hydrating,false);
});

test('home binder ignores room start clicks when the room is not ready', async()=>{
  const roomStart=makeElement();
  let startRoomCalls=0;
  const state={
    home:{
      mode:'home',
      showLeaderboard:false,
      google:{
        signedIn:true,
        email:'user@example.com',
        hydrating:false,
        profileMissing:false
      },
      leaderboard:{sort:'totalDelta',period:'all'}
    },
    room:{
      joinOpen:false,
      error:'',
      joinOpenCountdown:15,
      pendingStart:false,
      code:'ABCD',
      data:{
        status:'lobby',
        players:[
          {uid:'uid:a',seat:0}
        ]
      }
    },
    showScoreGuide:false,
    screen:'home',
    opponentProfileName:''
  };
  bindWith({
    document:makeDocument({byId:{'room-start':roomStart}}),
    state,
    signedInWithEmail:()=>true,
    startRoom:async()=>{startRoomCalls+=1;}
  });
  await roomStart.dispatch('click');
  assert.equal(state.room.pendingStart,false);
  assert.equal(startRoomCalls,0);
});

test('home binder rerenders gender toggle when not signed in', async()=>{
  const genderButton=makeElement({attrs:{'data-value':'female'}});
  let renderCount=0;
  const {state}=bindWith({
    document:makeDocument({bySelector:{'#gender-combo .combo-btn':[genderButton]}}),
    state:{
      home:{mode:'home',showLeaderboard:false,avatarChoice:'male',gender:'male',leaderboard:{sort:'totalDelta',period:'all'}},
      room:{joinOpen:false,error:'',joinOpenCountdown:15,pendingStart:false,code:'ABCD'},
      showScoreGuide:false,
      screen:'home',
      opponentProfileName:''
    },
    render:()=>{renderCount+=1;}
  });
  await genderButton.dispatch('click');
  assert.equal(state.home.avatarChoice,'female');
  assert.equal(state.home.gender,'female');
  assert.equal(renderCount,1);
});

test('home binder toggles leaderboard and refreshes on open', async()=>{
  const homeLeaderboard=makeElement();
  let refreshForce=null;
  let renderCount=0;
  const {state}=bindWith({
    document:makeDocument({byId:{'home-lb-toggle':homeLeaderboard}}),
    state:{
      home:{mode:'home',showLeaderboard:false,leaderboard:{sort:'totalDelta',period:'all'}},
      room:{joinOpen:false,error:'',joinOpenCountdown:15,pendingStart:false,code:'ABCD'},
      showScoreGuide:false,
      screen:'home',
      opponentProfileName:''
    },
    refreshLeaderboard:(force)=>{refreshForce=force;},
    render:()=>{renderCount+=1;}
  });
  await homeLeaderboard.dispatch('click');
  assert.equal(state.home.showLeaderboard,true);
  assert.equal(refreshForce,true);
  assert.equal(renderCount,1);
});

test('home binder opens legal modal content and marks active link', async()=>{
  const legalLink=makeElement({attrs:{'data-legal':'privacy'}});
  const legalModal=makeElement();
  const legalTitle=makeElement();
  const legalBody=makeElement();
  bindWith({
    document:makeDocument({
      byId:{
        'legal-modal':legalModal,
        'legal-modal-title':legalTitle,
        'legal-modal-body':legalBody
      },
      bySelector:{
        '.legal-mini-link':[legalLink]
      }
    }),
    legalMiniCopy:()=>({
      labels:{privacy:'Privacy'},
      content:{privacy:'<p>Policy</p>'}
    })
  });
  await legalLink.dispatch('click');
  assert.equal(legalTitle.textContent,'Privacy');
  assert.equal(legalBody.innerHTML,'<p>Policy</p>');
  assert.equal(legalModal.classList.contains('open'),true);
  assert.equal(legalLink.classList.contains('active'),true);
});

test('home binder updates gender and saves session', async()=>{
  const genderButton=makeElement({attrs:{'data-value':'female'}});
  let saved=0;
  let synced=0;
  const comboMarks=[];
  const {state}=bindWith({
    document:makeDocument({
      bySelector:{
        '#gender-combo .combo-btn':[genderButton]
      }
    }),
    saveGoogleSession:()=>{saved+=1;},
    signedInWithEmail:()=>true,
    syncLeaderboardProfile:async()=>{synced+=1;},
    markComboActive:(id,value)=>{comboMarks.push([id,value]);}
  });
  await genderButton.dispatch('click');
  assert.equal(state.home.avatarChoice,'female');
  assert.equal(state.home.gender,'female');
  assert.equal(saved,1);
  assert.equal(synced,1);
  assert.deepEqual(comboMarks,[['gender-combo','female']]);
});

test('home binder toggles more settings panel', async()=>{
  const moreSettings=makeElement();
  let renderCount=0;
  const {state}=bindWith({
    document:makeDocument({byId:{'home-more-settings-toggle':moreSettings}}),
    render:()=>{renderCount+=1;}
  });
  await moreSettings.dispatch('click');
  assert.equal(state.home.showMoreSettings,true);
  assert.equal(renderCount,1);
});

test('home binder updates difficulty styles and binds toggles', async()=>{
  const difficultySliderLeft=makeElement({value:'2'});
  const difficultySliderRight=makeElement({value:'2'});
  const difficultyLeft=makeElement();
  const difficultyRight=makeElement();
  const backLeftCalls=[];
  const soundCalls=[];
  const calloutCalls=[];
  const emoteCalls=[];
  const comboMarks=[];
  const {state}=bindWith({
    document:makeDocument({
      byId:{
        'difficulty-slider-left':difficultyLeft,
        'difficulty-slider-right':difficultyRight
      },
      bySelector:{
        '#difficulty-slider-left .difficulty-slider, #difficulty-slider-right .difficulty-slider':[difficultySliderLeft,difficultySliderRight]
      }
    }),
    bindBackCarousel:(id)=>{backLeftCalls.push(id);},
    bindSoundToggle:(id)=>{soundCalls.push(id);},
    bindCalloutDisplayToggle:(id)=>{calloutCalls.push(id);},
    bindEmoteDisplayToggle:(id)=>{emoteCalls.push(id);},
    difficultyIndex:(value)=>value==='hard'?2:0,
    markComboActive:(id,value)=>{comboMarks.push([id,value]);}
  });
  await difficultySliderLeft.dispatch('input');
  assert.equal(state.home.aiDifficulty,'hard');
  assert.equal(difficultyLeft.style.values['--difficulty-index'],'2');
  assert.equal(difficultyRight.style.values['--difficulty-index'],'2');
  assert.deepEqual(comboMarks,[]);
  assert.deepEqual(backLeftCalls,['back-combo-left','back-combo-right']);
  assert.deepEqual(soundCalls,['sound-slider']);
  assert.deepEqual(calloutCalls,['callout-display-slider']);
  assert.deepEqual(emoteCalls,['emote-display-slider']);
});

test('home binder copies invite content as text only from download button', async()=>{
  const downloadBtn=makeElement();
  const clipboardWrites=[];
  const previousNavigator=globalThis.navigator;
  Object.defineProperty(globalThis,'navigator',{
    configurable:true,
    value:{
      clipboard:{
        async writeText(value){
          clipboardWrites.push(value);
        }
      }
    }
  });
  try{
    bindWith({
      document:makeDocument({byId:{'room-share-download':downloadBtn}}),
      state:{
        home:{mode:'home',showLeaderboard:false,leaderboard:{sort:'totalDelta',period:'all'}},
        room:{joinOpen:false,error:'',joinOpenCountdown:15,pendingStart:false,code:'ABCD'},
        showScoreGuide:false,
        screen:'home',
        opponentProfileName:''
      },
      roomInviteShareTextFromCode:(code)=>`Invite for ${code}`
    });
    await downloadBtn.dispatch('click');
    assert.deepEqual(clipboardWrites,['Invite for ABCD']);
  }finally{
    if(previousNavigator===undefined){
      delete globalThis.navigator;
    }else{
      Object.defineProperty(globalThis,'navigator',{
        configurable:true,
        value:previousNavigator
      });
    }
  }
});
