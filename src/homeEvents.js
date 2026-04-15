export function createHomeEventsBinder({documentRef=()=>document,windowRef=()=>window}={}){
  return function bindHomeEvents({
    state,
    joinOpen,
    render,
    refreshLeaderboard,
    signedInForPlay,
    signedInWithEmail,
    markComboActive,
    saveGoogleSession,
    difficultyIndex,
    backOptions,
    bindBackCarousel,
    bindSoundToggle,
    bindCalloutDisplayToggle,
    bindEmoteDisplayToggle,
    bindVibrateToggle=()=>{},
    setRoomError,
    t,
    loadActiveRooms,
    createRoom,
    joinRoomByCode,
    resetRoomExpiryTo60s,
    leaveRoom,
    roomIsHost,
    setRoomPrivacy,
    pendingStartTimerRef,
    runPopunderAd,
    syncLeaderboardProfile,
    currentLeaderboardIdentity,
    waitMs,
    startRoom,
    guardAction,
    unlockAudio,
    initFirebaseIfReady,
    startSoloGame,
    armPopunderForGesture=()=>{},
    schedulePopunderAfterRender,
    legalMiniCopy
  }){
    const doc=documentRef();
    const win=windowRef();
    const closeOpponentProfile=()=>{
      state.opponentProfileName='';
      render();
    };
    const closeLeaderboard=()=>{
      state.home.showLeaderboard=false;
      render();
    };
    const closeLegal=()=>{
      const legalModal=doc.getElementById('legal-modal');
      legalModal?.classList.remove('open');
      doc.querySelectorAll('.legal-mini-link').forEach((btn)=>btn.classList.remove('active'));
    };

    doc.getElementById('home-intro-toggle')?.addEventListener('click',()=>{
      state.home.showIntro=!state.home.showIntro;
      render();
    });
    doc.getElementById('home-score-guide-toggle')?.addEventListener('click',()=>{
      state.showScoreGuide=true;
      render();
    });
    doc.getElementById('home-lb-toggle')?.addEventListener('click',()=>{
      state.home.showLeaderboard=!state.home.showLeaderboard;
      if(state.home.showLeaderboard)refreshLeaderboard(true);
      render();
    });
    doc.getElementById('home-opponents-toggle')?.addEventListener('click',()=>{
      state.screen='opponents';
      render();
    });
    doc.getElementById('intro-close')?.addEventListener('click',()=>{
      state.home.showIntro=false;
      render();
    });
    doc.getElementById('intro-backdrop')?.addEventListener('click',()=>{
      state.home.showIntro=false;
      render();
    });
    doc.getElementById('score-guide-close')?.addEventListener('click',()=>{
      state.showScoreGuide=false;
      render();
    });
    doc.getElementById('score-guide-backdrop')?.addEventListener('click',()=>{
      state.showScoreGuide=false;
      render();
    });
    doc.getElementById('opponent-profile-close')?.addEventListener('click',closeOpponentProfile);
    doc.getElementById('opponent-profile-backdrop')?.addEventListener('click',closeOpponentProfile);
    doc.getElementById('lb-close')?.addEventListener('click',closeLeaderboard);
    doc.getElementById('lb-backdrop')?.addEventListener('click',closeLeaderboard);
    doc.getElementById('lb-sort')?.addEventListener('change',(e)=>{
      state.home.leaderboard.sort=e.target.value;
      refreshLeaderboard();
      render();
    });
    doc.getElementById('lb-period')?.addEventListener('change',(e)=>{
      state.home.leaderboard.period=e.target.value;
      refreshLeaderboard();
      render();
    });
    doc.getElementById('name-input')?.addEventListener('input',(e)=>{
      state.home.name=e.target.value;
      if(signedInWithEmail()&&!state.home.google?.profileMissing){
        void syncLeaderboardProfile(currentLeaderboardIdentity());
      }
    });
    doc.querySelectorAll('#gender-combo .combo-btn').forEach((btn)=>btn.addEventListener('click',()=>{
      const value=String(btn.getAttribute('data-value')??'');
      if(value!=='male'&&value!=='female')return;
      state.home.avatarChoice=value;
      state.home.gender=value;
      markComboActive('gender-combo',state.home.avatarChoice);
      saveGoogleSession();
      if(signedInWithEmail()&&!state.home.google?.profileMissing){
        void syncLeaderboardProfile(currentLeaderboardIdentity());
      }
      render();
    }));
    const valueFromIndex=(index)=>{
      if(index<=0)return'easy';
      if(index>=2)return'hard';
      return'normal';
    };
    const syncDifficultySlider=(value)=>{
      const index=difficultyIndex(value);
      state.home.aiDifficulty=value;
      doc.getElementById('difficulty-slider-left')?.style.setProperty('--difficulty-index',`${index}`);
      doc.getElementById('difficulty-slider-right')?.style.setProperty('--difficulty-index',`${index}`);
      const left=doc.querySelector('#difficulty-slider-left .difficulty-slider');
      const right=doc.querySelector('#difficulty-slider-right .difficulty-slider');
      if(left&&typeof left==='object'&&'value' in left)left.value=String(index);
      if(right&&typeof right==='object'&&'value' in right)right.value=String(index);
    };
    doc.querySelectorAll('#difficulty-slider-left .difficulty-slider, #difficulty-slider-right .difficulty-slider').forEach((slider)=>slider.addEventListener('input',()=>{
      const value=valueFromIndex(Number(slider.value));
      syncDifficultySlider(value);
    }));
    const toggleMoreSettings=()=>{
      state.home.showMoreSettings=!state.home.showMoreSettings;
      render();
    };
    doc.getElementById('home-more-settings-toggle')?.addEventListener('click',toggleMoreSettings);
    doc.getElementById('home-more-settings-toggle')?.addEventListener('keydown',(e)=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      e.preventDefault();
      toggleMoreSettings();
    });
    doc.querySelectorAll('.back-combo-home .combo-btn').forEach((btn)=>btn.addEventListener('click',()=>{
      const value=btn.getAttribute('data-value');
      if(!value||!backOptions.some((option)=>option.value===value))return;
      state.home.backColor=value;
      markComboActive('back-combo-left',state.home.backColor);
      markComboActive('back-combo-right',state.home.backColor);
    }));
    bindBackCarousel('back-combo-left');
    bindBackCarousel('back-combo-right');
    bindSoundToggle('sound-slider');
    bindCalloutDisplayToggle('callout-display-slider');
    bindEmoteDisplayToggle('emote-display-slider');
    bindVibrateToggle('vibrate-slider');

    const handleSoloStart=async()=>{
      if(!signedInForPlay())return;
      unlockAudio();
      state.home.mode='solo';
      state.home.showLeaderboard=false;
      initFirebaseIfReady();
      let synced=false;
      for(let i=0;i<4&&!synced;i++){
        synced=await syncLeaderboardProfile(currentLeaderboardIdentity());
        if(!synced)await waitMs(250);
      }
      if(!synced)console.warn('profile sync failed on start; continuing to game');
      startSoloGame({preserveOpponents:false,resetTotals:true});
      schedulePopunderAfterRender(350);
    };

    const soloStartBtn=doc.getElementById('solo-start');
    soloStartBtn?.addEventListener('pointerdown',(e)=>{
      if(!guardAction('solo-start'))return;
      armPopunderForGesture();
      e.preventDefault();
      e.stopPropagation();
      void handleSoloStart();
    },true);
    soloStartBtn?.addEventListener('click',()=>{
      if(!guardAction('solo-start'))return;
      armPopunderForGesture();
      void handleSoloStart();
    });

    doc.getElementById('room-lobby-open')?.addEventListener('click',()=>{
      if(!signedInForPlay()){
        setRoomError(t('roomLoginRequired'));
        return;
      }
      state.room.joinOpen=true;
      state.room.error='';
      render();
      void loadActiveRooms();
    });
    doc.getElementById('room-create')?.addEventListener('click',async()=>{
      await createRoom();
    });
    doc.getElementById('room-create-card')?.addEventListener('click',async()=>{
      await createRoom();
    });
    doc.getElementById('room-join-cancel')?.addEventListener('click',()=>{
      state.room.joinOpen=false;
      state.room.error='';
      render();
    });
    doc.getElementById('room-join-confirm')?.addEventListener('click',async()=>{
      const code=doc.getElementById('room-code-input')?.value??'';
      await joinRoomByCode(code);
    });
    doc.getElementById('room-active-refresh')?.addEventListener('click',async()=>{
      await loadActiveRooms();
    });
    doc.querySelectorAll('.room-active-card').forEach((card)=>card.addEventListener('click',()=>{
      if(card.hasAttribute('disabled')||card.getAttribute('data-private')==='1')return;
      const code=String(card.getAttribute('data-code')||'');
      if(!code)return;
      const input=doc.getElementById('room-code-input');
      if(input)input.value=code;
      doc.querySelectorAll('.room-active-card').forEach((el)=>el.classList.toggle('active',el===card));
    }));
    doc.querySelectorAll('.room-card-join-btn').forEach((btn)=>btn.addEventListener('click',async(e)=>{
      e.stopPropagation();
      const code=String(btn.getAttribute('data-code')||'');
      if(!code||btn.hasAttribute('disabled'))return;
      const input=doc.getElementById('room-code-input');
      if(input)input.value=code;
      await joinRoomByCode(code);
    }));
    doc.getElementById('room-code-input')?.addEventListener('keydown',async(e)=>{
      if(e.key!=='Enter')return;
      const code=doc.getElementById('room-code-input')?.value??'';
      await joinRoomByCode(code);
    });

    doc.getElementById('room-copy')?.addEventListener('click',async()=>{
      try{await navigator.clipboard?.writeText?.(String(state.room.code||''));}catch{}
    });
    doc.querySelectorAll('[data-room-expiry-reset]').forEach((btn)=>btn.addEventListener('click',async()=>{
      await resetRoomExpiryTo60s();
    }));
    doc.getElementById('room-leave')?.addEventListener('click',async()=>{
      await leaveRoom(true);
    });
    doc.querySelectorAll('#room-privacy-toggle [data-private]').forEach((btn)=>btn.addEventListener('click',async()=>{
      if(!roomIsHost)return;
      const desired=btn.getAttribute('data-private')==='1';
      await setRoomPrivacy(desired);
    }));
    doc.getElementById('room-start')?.addEventListener('click',async()=>{
      if(state.room.pendingStart)return;
      state.room.pendingStart=true;
      const activeTimer=pendingStartTimerRef.get?.();
      if(activeTimer){win.clearTimeout(activeTimer);}
      pendingStartTimerRef.set?.(win.setTimeout(()=>{
        pendingStartTimerRef.set?.(null);
        state.room.pendingStart=false;
        setRoomError(t('roomSendTimeout'));
      },5000));
      win.setTimeout(runPopunderAd,0);
      render();
      let synced=false;
      for(let i=0;i<4&&!synced;i++){
        synced=await syncLeaderboardProfile(currentLeaderboardIdentity());
        if(!synced)await waitMs(250);
      }
      await startRoom();
    });

    const legal=legalMiniCopy();
    const legalModal=doc.getElementById('legal-modal');
    const legalModalTitle=doc.getElementById('legal-modal-title');
    const legalModalBody=doc.getElementById('legal-modal-body');
    doc.getElementById('legal-close')?.addEventListener('click',closeLegal);
    doc.getElementById('legal-backdrop')?.addEventListener('click',closeLegal);
    doc.querySelectorAll('.legal-mini-link').forEach((btn)=>btn.addEventListener('click',()=>{
      const key=btn.getAttribute('data-legal');
      const content=key?legal.content[key]:'';
      if(!key||!content||!legalModal||!legalModalTitle||!legalModalBody)return;
      legalModalTitle.textContent=legal.labels[key]||'';
      legalModalBody.innerHTML=content;
      legalModal.classList.add('open');
      doc.querySelectorAll('.legal-mini-link').forEach((el)=>el.classList.remove('active'));
      btn.classList.add('active');
    }));
  };
}
