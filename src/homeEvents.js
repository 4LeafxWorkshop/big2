export function createHomeEventsBinder({documentRef=()=>document,windowRef=()=>window}={}){
  let clipboardModulePromise=null;
  const loadClipboard=async()=>{
    clipboardModulePromise??=import('@capacitor/clipboard');
    const mod=await clipboardModulePromise;
    return mod.Clipboard;
  };
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
    bindGestureHelpToggle,
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
    refreshRoomInviteQrDataUrl=()=>{},
    roomInviteUrlFromCode,
    roomInviteShareTextFromCode,
    roomInviteWhatsappUrlFromCode,
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
    const normalizeRoomCodePaste=(raw)=>{
      const text=String(raw??'').trim();
      if(!text)return'';
      const urlMatch=text.match(/(?:join\/|room\/|code=)([a-z0-9]+)/i);
      if(urlMatch?.[1])return String(urlMatch[1]).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
      return text.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
    };
    const readClipboardText=async()=>{
      try{
        const value=String(await navigator.clipboard?.readText?.()??'').trim();
        if(value)return value;
      }catch{
      }
      try{
        const Clipboard=await loadClipboard();
        const res=await Clipboard.read();
        return String(res?.value??res?.text??'').trim();
      }catch{
        return'';
      }
    };
    const writeClipboardText=async(value)=>{
      const text=String(value??'').trim();
      if(!text)return false;
      try{
        await navigator.clipboard?.writeText?.(text);
        return true;
      }catch{
      }
      try{
        const Clipboard=await loadClipboard();
        await Clipboard.write({string:text});
        return true;
      }catch{
        return false;
      }
    };
    const LAST_ROOM_CODE_COPY_KEY='big2:lastRoomCodeCopy';
    const cacheLastRoomCodeCopy=(code)=>{
      const text=String(code??'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
      if(!text)return;
      try{
        window.localStorage?.setItem(LAST_ROOM_CODE_COPY_KEY,text);
        return;
      }catch{}
      try{
        window.sessionStorage?.setItem(LAST_ROOM_CODE_COPY_KEY,text);
      }catch{}
    };
    const readLastRoomCodeCopy=()=>{
      try{
        const value=String(window.localStorage?.getItem(LAST_ROOM_CODE_COPY_KEY)??'').trim();
        if(value)return value;
      }catch{}
      try{
        return String(window.sessionStorage?.getItem(LAST_ROOM_CODE_COPY_KEY)??'').trim();
      }catch{
        return'';
      }
    };
    const applyRoomCodeToInput=(code)=>{
      const normalized=normalizeRoomCodePaste(code);
      if(!normalized)return false;
      const input=doc.getElementById('room-code-input');
      if(!input)return false;
      input.value=normalized;
      state.room.pendingInviteCode=normalized;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.focus?.();
      input.setSelectionRange?.(normalized.length,normalized.length);
      state.room.error='';
      return true;
    };
    const getRoomCodeFromBoxes=()=>{
      return String(doc.getElementById('room-code-input')?.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
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
    doc.getElementById('home-avatar-img')?.addEventListener('error',(e)=>{
      const img=e?.target;
      if(!(img instanceof HTMLImageElement))return;
      const fallback=String(img.dataset.fallback??'').trim();
      if(!fallback||img.src===fallback)return;
      img.src=fallback;
    },{once:true});
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
    bindGestureHelpToggle('gesture-help-slider');
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
      startSoloGame({preserveOpponents:false});
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
      const code=getRoomCodeFromBoxes();
      await joinRoomByCode(code);
    });
    const handleRoomPasteCode=async(e)=>{
      e?.preventDefault?.();
      e?.stopPropagation?.();
      const raw=await readClipboardText();
      if(applyRoomCodeToInput(raw))return;
      applyRoomCodeToInput(readLastRoomCodeCopy());
    };
    doc.getElementById('room-paste-code')?.addEventListener('pointerdown',handleRoomPasteCode,true);
    doc.getElementById('room-paste-code')?.addEventListener('click',handleRoomPasteCode);
    const roomCodeInput=doc.getElementById('room-code-input');
    const syncRoomCodeDisplay=()=>{
      const next=String(roomCodeInput?.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
      if(roomCodeInput&&roomCodeInput.value!==next)roomCodeInput.value=next;
      doc.querySelectorAll('[data-room-code-box]').forEach((box,idx)=>{
        const ch=next[idx]||'';
        box.textContent=ch;
        box.classList.toggle('filled',Boolean(ch));
      });
    };
    roomCodeInput?.addEventListener('input',()=>{
      syncRoomCodeDisplay();
      state.room.pendingInviteCode=String(roomCodeInput.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
      state.room.error='';
    });
    roomCodeInput?.addEventListener('paste',(e)=>{
      const pasted=String(e.clipboardData?.getData('text')||'').trim();
      if(!pasted)return;
      e.preventDefault();
      applyRoomCodeToInput(pasted);
    });
    const focusRoomCodeInput=()=>{
      roomCodeInput?.focus?.({preventScroll:true});
      roomCodeInput?.select?.();
    };
    doc.querySelectorAll('[data-room-code-focus], [data-room-code-box]').forEach((el)=>el.addEventListener('pointerdown',(e)=>{
      e.preventDefault();
      focusRoomCodeInput();
    }));
    doc.querySelectorAll('[data-room-code-focus], [data-room-code-box]').forEach((el)=>el.addEventListener('click',()=>{
      focusRoomCodeInput();
    }));
    doc.getElementById('room-active-refresh')?.addEventListener('click',async()=>{
      await loadActiveRooms();
    });
    doc.querySelectorAll('.room-active-card').forEach((card)=>card.addEventListener('click',()=>{
      if(card.hasAttribute('disabled')||card.getAttribute('data-private')==='1')return;
      const code=String(card.getAttribute('data-code')||'');
      if(!code)return;
      applyRoomCodeToInput(code);
      doc.querySelectorAll('.room-active-card').forEach((el)=>el.classList.toggle('active',el===card));
    }));
    doc.querySelectorAll('.room-card-join-btn').forEach((btn)=>btn.addEventListener('click',async(e)=>{
      e.stopPropagation();
      const code=String(btn.getAttribute('data-code')||'');
      if(!code||btn.hasAttribute('disabled'))return;
      applyRoomCodeToInput(code);
      await joinRoomByCode(code);
    }));

    const shareRoomInviteWithQr=async(code)=>{
      if(!navigator.share)return false;
      try{
        await navigator.share({
          text:roomInviteShareTextFromCode(code)
        });
        return true;
      }catch{}
      return false;
    };
    const copyRoomInviteQr=async()=>{
      const dataUrl=String(state.room.inviteQrDataUrl||'').trim();
      const inviteUrl=String(state.room.inviteUrl||roomInviteUrlFromCode(String(state.room.code||state.room.pendingInviteCode||'').trim())||'').trim();
      if(!dataUrl){
        if(inviteUrl){
          await writeClipboardText(inviteUrl);
        }
        return;
      }
      try{
        const blob=await (await fetch(dataUrl)).blob();
        if(globalThis.ClipboardItem&&navigator.clipboard?.write){
          await navigator.clipboard.write([new ClipboardItem({[blob.type||'image/png']:blob})]);
          return;
        }
      }catch{}
      if(inviteUrl){
        await writeClipboardText(inviteUrl);
      }
    };
    let roomInviteQrZoomCleanup=null;
    let roomInviteQrTouchTimer=0;
    let roomInviteQrLastTapAt=0;
    let roomInviteQrTouchPending=false;
    const clearRoomInviteQrTouchTimer=()=>{
      if(roomInviteQrTouchTimer){
        win.clearTimeout(roomInviteQrTouchTimer);
        roomInviteQrTouchTimer=0;
      }
    };
    const clearRoomInviteQrZoom=()=>{
      clearRoomInviteQrTouchTimer();
      roomInviteQrTouchPending=false;
      const cleanup=roomInviteQrZoomCleanup;
      roomInviteQrZoomCleanup=null;
      if(typeof cleanup==='function')cleanup();
    };
    const showRoomInviteQrZoom=()=>{
      const dataUrl=String(state.room.inviteQrDataUrl||'').trim();
      if(!dataUrl)return;
      clearRoomInviteQrZoom();
      const backdrop=doc.createElement('button');
      backdrop.type='button';
      backdrop.className='room-invite-qr-zoom-backdrop';
      backdrop.setAttribute('aria-label',t('close'));
      const ghost=doc.createElement('img');
      ghost.className='room-invite-qr-zoom-ghost';
      ghost.src=dataUrl;
      ghost.alt=t('roomInviteQr');
      ghost.decoding='async';
      doc.body.append(backdrop,ghost);
      requestAnimationFrame(()=>{
        doc.body.classList.add('room-invite-qr-zoom-open');
        backdrop.classList.add('active');
        ghost.classList.add('active');
      });
      const dismiss=()=>{
        backdrop.removeEventListener('click',dismiss);
        ghost.removeEventListener('click',dismiss);
        doc.removeEventListener('keydown',handleEsc,true);
        backdrop.classList.remove('active');
        ghost.classList.remove('active');
        win.setTimeout(()=>{
          backdrop.remove();
          ghost.remove();
          doc.body.classList.remove('room-invite-qr-zoom-open');
        },120);
        roomInviteQrZoomCleanup=null;
      };
      const handleEsc=(e)=>{
        if(e.key==='Escape')dismiss();
      };
      backdrop.addEventListener('click',dismiss);
      ghost.addEventListener('click',dismiss);
      doc.addEventListener('keydown',handleEsc,true);
      roomInviteQrZoomCleanup=dismiss;
    };
    const openRoomInviteQrZoom=()=>{
      clearRoomInviteQrTouchTimer();
      roomInviteQrTouchPending=false;
      showRoomInviteQrZoom();
    };
    doc.getElementById('room-copy')?.addEventListener('click',async()=>{
      const code=String(state.room.code||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
      if(!code)return;
      cacheLastRoomCodeCopy(code);
      await writeClipboardText(code);
    });
    const shareRoomInvite=async()=>{
      const code=String(state.room.code||state.room.pendingInviteCode||'').trim();
      if(!code)return;
      if(await shareRoomInviteWithQr(code))return;
      const inviteMessage=roomInviteShareTextFromCode(code);
      await writeClipboardText(inviteMessage);
    };
    doc.getElementById('room-share-send')?.addEventListener('click',shareRoomInvite);
    doc.querySelectorAll('[data-room-share-send]').forEach((btn)=>btn.addEventListener('click',shareRoomInvite));
    const copyRoomInviteCode=async()=>{
      const code=String(state.room.code||state.room.pendingInviteCode||'').trim();
      if(!code)return;
      cacheLastRoomCodeCopy(code);
      await writeClipboardText(code);
    };
    const roomCopyQrBtn=doc.getElementById('room-copy-qr');
    roomCopyQrBtn?.addEventListener('click',async(e)=>{
      if(roomInviteQrTouchPending)return;
      if(roomCopyQrBtn.getAttribute('data-ignore-click')==='1'){
        roomCopyQrBtn.setAttribute('data-ignore-click','0');
        return;
      }
      if((e.detail||0)>=2){
        e.preventDefault();
        openRoomInviteQrZoom();
        return;
      }
      await copyRoomInviteQr();
    });
    roomCopyQrBtn?.addEventListener('dblclick',(e)=>{
      e.preventDefault();
      openRoomInviteQrZoom();
    });
    roomCopyQrBtn?.addEventListener('touchend',(e)=>{
      if(!(roomCopyQrBtn instanceof HTMLElement))return;
      e.preventDefault();
      roomCopyQrBtn.setAttribute('data-ignore-click','1');
      const now=Date.now();
      if(roomInviteQrLastTapAt&&now-roomInviteQrLastTapAt<320){
        roomInviteQrLastTapAt=0;
        roomInviteQrTouchPending=false;
        clearRoomInviteQrTouchTimer();
        openRoomInviteQrZoom();
        roomCopyQrBtn.setAttribute('data-ignore-click','0');
        return;
      }
      roomInviteQrLastTapAt=now;
      roomInviteQrTouchPending=true;
      clearRoomInviteQrTouchTimer();
      roomInviteQrTouchTimer=win.setTimeout(async()=>{
        roomInviteQrTouchTimer=0;
        roomInviteQrTouchPending=false;
        roomCopyQrBtn.setAttribute('data-ignore-click','0');
        await copyRoomInviteQr();
      },280);
    },{passive:false});
    doc.getElementById('room-share-code-copy')?.addEventListener('click',copyRoomInviteCode);
    doc.getElementById('room-share-code-copy')?.addEventListener('keydown',async(e)=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      e.preventDefault();
      await copyRoomInviteCode();
    });
    doc.getElementById('room-share-whatsapp')?.addEventListener('click',async()=>{
      const code=String(state.room.code||state.room.pendingInviteCode||'').trim();
      if(!code)return;
      const inviteMessage=roomInviteShareTextFromCode(code);
      const whatsappUrl=roomInviteWhatsappUrlFromCode?.(code)||'';
      if(whatsappUrl){
        try{
          win.open(whatsappUrl,'_blank','noopener,noreferrer');
          return;
        }catch{}
      }
      await writeClipboardText(inviteMessage);
    });
    doc.getElementById('room-share-wechat')?.addEventListener('click',async()=>{
      const code=String(state.room.code||state.room.pendingInviteCode||'').trim();
      if(!code)return;
      if(navigator.share){
        try{
          await navigator.share({
            text:roomInviteShareTextFromCode(code)
          });
          return;
        }catch{}
      }
      await writeClipboardText(roomInviteShareTextFromCode(code));
    });
    doc.getElementById('room-share-download')?.addEventListener('click',async()=>{
      const code=String(state.room.code||state.room.pendingInviteCode||'').trim();
      if(!code)return;
      const inviteMessage=roomInviteShareTextFromCode(code);
      await writeClipboardText(inviteMessage);
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
    const handleRoomStart=async()=>{
      if(state.room.pendingStart)return;
      state.room.pendingStart=true;
      const activeTimer=pendingStartTimerRef.get?.();
      if(activeTimer){win.clearTimeout(activeTimer);}
      pendingStartTimerRef.set?.(win.setTimeout(()=>{
        pendingStartTimerRef.set?.(null);
        state.room.pendingStart=false;
        setRoomError(t('roomSendTimeout'));
      },5000));
      render();
      let synced=false;
      for(let i=0;i<4&&!synced;i++){
        synced=await syncLeaderboardProfile(currentLeaderboardIdentity());
        if(!synced)await waitMs(250);
      }
      const started=await startRoom();
      if(started)schedulePopunderAfterRender(350);
    };
    const roomStartBtn=doc.getElementById('room-start');
    roomStartBtn?.addEventListener('click',handleRoomStart);
    roomStartBtn?.addEventListener('touchend',(ev)=>{
      if(state.room.pendingStart)return;
      ev.preventDefault();
      void handleRoomStart();
    },{passive:false});

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
