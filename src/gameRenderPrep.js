export function buildSelfRenderState(params){
  const {
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
  }=params;
  const selfScore=self?selfScoreValue:0;
  const selfName=self?self.name:t('name');
  const selfGender=self?.gender??state.home.gender??'male';
  const selfSeatColor=playerColorByViewClass('south');
  const selfRoundWinsHtml=roundWinsChipHtml(roundWinsBySeat[v.selfSeat]??0);
  const selfAvatarSrc=selfAvatarDataUri(selfName,selfSeatColor,selfGender);
  const authPic=authPictureUrl();
  const useGoogleSelfAvatar=Boolean(state.home.google?.signedIn&&authPic&&selfAvatarSrc===authPic);
  const selfDangerLast=Boolean(!v.gameOver&&self&&self.count===1);
  const selfActive=Boolean(!v.gameOver&&self&&v.currentSeat===self.seat);
  const selfIsHost=hostSeat!==null&&self&&hostSeat===self.seat;
  const selfHostBadgeHtml=selfIsHost?`<span class="lobby-seat-host-badge">🚩</span>`:'';
  const selfBadgeHtml=selfDangerLast
    ?`<span class="avatar-status-badge warning ${selfActive?'danger':''}" aria-label="${esc(t('lastCardCall'))}"></span>`
    :(selfActive?`<span class="avatar-status-badge turn" aria-label="${esc(t('wait'))}"></span>`:'');
  const selfAvatar=`<span class="player-avatar-wrap player-avatar-wrap-self avatar-rim" style="--avatar-rim:${selfSeatColor};"><img id="self-avatar-img" class="player-avatar player-avatar-self ${avatarGenderClass(selfGender)} ${useGoogleSelfAvatar?'player-avatar-google':''}" style="--avatar-outline:${selfSeatColor};" src="${selfAvatarSrc}" data-fallback="${selfGender==='female'?AVATAR_BASE_SRC.female:AVATAR_BASE_SRC.male}" alt="${esc(selfName)}"/>${selfHostBadgeHtml}${selfBadgeHtml}</span>`;
  let selfCalloutHtml=self?seatCalloutHtml(self.seat,'south',selfSeatColor,true):'';
  const selfEmoteHtml=self?seatEmoteHtml(self.seat,'south',selfSeatColor,true):'';
  if(selfEmoteHtml)selfCalloutHtml+=selfEmoteHtml;
  return{
    selfScore,
    selfName,
    selfRoundWinsHtml,
    selfGender,
    selfAvatar,
    selfCalloutHtml
  };
}

export function buildGameAuxRenderState(params){
  const {
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
  }=params;
  const portraitMode=isPortraitMode();
  const logSheetOpen=portraitMode&&state.showLogSheet;
  const logToggleStateText=t('log');
  const gameHistoryHtml=historyHtml(v.history,v.selfSeat,v.systemLog);
  const closeLabel=state.language==='zh-HK'?'關閉':'Close';
  const isRecPass=state.recommendHint===t('recPass');
  const isRecEmpty=state.recommendHint===t('noSuggest');
  const showRecommendHint=Boolean(state.recommendHint)&&!isRecPass;
  const isRecPlay=state.recommendation?.action==='play';
  const emotePanel=state.emote.open
    ?`<div class="emote-panel">${EMOTE_STICKERS.map((sticker)=>`<button class="emote-btn" data-emote-id="${sticker.id}" type="button"><img src="${withBase(`emotes/${sticker.file}`)}" alt="${sticker.id}"/><span class="emote-btn-label">${esc(t(`emoteLabel${sticker.id[0].toUpperCase()}${sticker.id.slice(1)}`))}</span></button>`).join('')}</div>`
    :'';
  const handHtml=v.hand.map((card,index)=>renderHandCard(
    card,
    state.selected.has(cardId(card)),
    (showMust3Highlight&&isLowestSingle(card))?'must3-highlight':'',
    index+1
  )).join('');
  return{
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
  };
}

export function buildOpponentSeatsHtml(params){
  const {
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
  }=params;
  return renderOpponentSeats(arr.filter((player)=>player.viewIndex!==0).map((player)=>{
    const active=v.currentSeat===player.seat&&!v.gameOver;
    const playerColor=playerColorByViewClass(player.cls);
    const useFlowOpponentStation=true;
    const dangerLast=Boolean(!v.gameOver&&player.count===1);
    const isHostSeat=hostSeat!==null&&hostSeat===player.seat;
    const hostBadgeHtml=isHostSeat?`<span class="lobby-seat-host-badge">🚩</span>`:'';
    const badgeHtml=dangerLast
      ?`<span class="avatar-status-badge warning ${active?'danger':''}" aria-label="${esc(t('lastCardCall'))}"></span>`
      :(active?`<span class="avatar-status-badge turn" aria-label="${esc(t('wait'))}"></span>`:'');
    const fan=v.gameOver&&v.revealedHands
      ?(v.revealedHands[player.seat]??[]).map((card)=>renderStaticCard(card,true,'flip-in')).join('')
      :renderBackCards(player.count,`${player.rawName||player.name}-${player.seat}`);
    const isSideSeat=player.cls==='west'||player.cls==='east';
    const fanAnchorStyle=player.cls==='north'
      ?'justify-self:center !important;align-self:start !important;margin-left:0 !important;margin-right:0 !important;'
      :'';
    const opponentLastAction=lastActions.get(player.seat);
    const openAnchorStyle=isSideSeat?'':'justify-self:center !important;';
    const opponentOpenPlayHtml=opponentLastAction
      ?`<div class="seat-open-play" style="${openAnchorStyle}"><div class="opponent-open-scale">${seatLastActionHtml(opponentLastAction,TABLE_PLAY_SCALE)}</div></div>`
      :'';
    const closedCountHtml=!v.gameOver&&player.count>0?`<span class="closed-count-pill">x${player.count}</span>`:'';
    const avatarSrc=player.picture?authPictureUrlFrom(player.picture):avatarDataUri(player.name,playerColor,player.gender,player.isBot);
    const botNameAttr=player.isBot?` data-bot-name="${esc(player.name)}"`:'';
    const opponentName=player.rawName||player.name;
    const opponentAttr=` data-opponent-name="${esc(opponentName)}"`;
    const profile=OPPONENT_PROFILE_BY_NAME[opponentName];
    const mottoText=profileFieldValue(profile,'motto','');
    const hintText='';
    const mottoClass=state.language==='en'?'hk-power-motto motto-en':'hk-power-motto';
    const seed=hashTextSeed(`${opponentName}|motto`);
    const mottoTilt=`${(seed%11)-5}deg`;
    const roundWinsHtml=roundWinsChipHtml(roundWinsBySeat[player.seat]??0);
    const namecardBtn=player.isBot?`<button type="button" class="seat-namecard" data-opponent-name="${esc(opponentName)}" aria-label="${esc(t('profile'))}">🪪</button>`:'';
    const calloutHtml=seatCalloutHtml(player.seat,player.cls,playerColor,false);
    const emoteHtml=seatEmoteHtml(player.seat,player.cls,playerColor,false);
    const peekActive=isMobilePointer()&&state.mottoPeekName===String(opponentName);
    const outerLabel=renderOpponentLabel({
      pColor:playerColor,
      avatarSrc,
      playerAvatarClass:avatarGenderClass(player.gender),
      playerName:player.name,
      botNameAttr,
      hostBadgeHtml,
      badgeHtml,
      playerScore:player.score??0,
      roundWinsHtml,
      namecardBtn,
      mottoText,
      mottoClass,
      hintText,
      mottoTilt,
      calloutHtml,
      emoteHtml,
      peekActive,
      opponentAttr,
      esc
    });
    const shellStyle=`--player-color:${playerColor};border:0 !important;box-shadow:none !important;background:transparent !important;border-radius:0 !important;`;
    const innerNoOutline='border:0 !important;box-shadow:none !important;background:transparent !important;';
    const seatPackAnchorStyle=useFlowOpponentStation
      ?'position:relative !important;width:100% !important;height:100% !important;display:grid !important;align-content:start !important;justify-items:center !important;'
      :isSideSeat
      ?'position:absolute !important;inset:0 !important;width:100% !important;height:100% !important;min-height:100% !important;display:grid !important;align-content:start !important;justify-items:center !important;'
      :(player.cls==='north'?'position:relative !important;width:100% !important;display:grid !important;align-content:start !important;justify-items:center !important;':'');
    const sectionStyle=`${innerNoOutline}${seatPackAnchorStyle}`;
    const seatAttrs=emoteSeat===player.seat?' data-seat-emote-active="1"':'';
    const outerLabelHtml=useFlowOpponentStation?'':outerLabel;
    const innerLabelHtml=useFlowOpponentStation?outerLabel:'';
    const sideStationFlowHtml=renderOpponentStationFlow({
      useFlowOpponentStation,
      isSideSeat,
      innerLabelHtml,
      fan,
      fanClassName:opponentFanStyleByName(opponentName),
      fanAnchorStyle,
      closedCountHtml,
      opponentOpenPlayHtml
    });
    return renderOpponentSeat({
      cls:player.cls,
      active,
      seatAttrs,
      shellStyle,
      outerLabelHtml,
      sectionStyle,
      sideStationFlowHtml
    });
  }));
}

export function buildCalloutRenderState(params){
  const {
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
  }=params;
  const playTypeCall=currentPlayTypeCall(v);
  const playTypeFresh=Boolean(playTypeCallState.startedAt&&Date.now()-playTypeCallState.startedAt<260);
  const passCall=currentPassCall(v);
  const passCallFresh=Boolean(passCallState.startedAt&&Date.now()-passCallState.startedAt<260);
  const must3Call=currentMust3Call(v);
  const must3Fresh=Boolean(must3CallState.startedAt&&Date.now()-must3CallState.startedAt<260);
  const lastCardSeat=currentLastCardSeat(v);
  const lastCardFresh=Boolean(lastCardCallState.startedAt&&Date.now()-lastCardCallState.startedAt<260);
  const calloutCandidates=[];
  if(passCall)calloutCandidates.push({kind:'pass',seat:passCall.seat,text:passCall.text,fresh:passCallFresh,nonce:passCallState.nonce||passCallState.startedAt,startedAt:passCallState.startedAt});
  if(playTypeCall)calloutCandidates.push({kind:'play',seat:playTypeCall.seat,text:playTypeCall.text,fresh:playTypeFresh,nonce:playTypeCallState.nonce||playTypeCallState.startedAt,startedAt:playTypeCallState.startedAt});
  if(must3Call)calloutCandidates.push({kind:'must3',seat:must3Call.seat,text:must3Call.text,fresh:must3Fresh,nonce:must3CallState.nonce||must3CallState.startedAt,startedAt:must3CallState.startedAt});
  if(lastCardSeat!==null)calloutCandidates.push({kind:'last',seat:lastCardSeat,text:lastCardCallState.text||t('lastCardCall'),fresh:lastCardFresh,nonce:lastCardCallState.nonce||lastCardCallState.startedAt,startedAt:lastCardCallState.startedAt});
  const calloutPriority={must3:4,pass:3,play:2,last:1};
  const activeCallout=calloutCandidates.sort((a,b)=>(Number(b.startedAt)||0)-(Number(a.startedAt)||0)||(calloutPriority[b.kind]-calloutPriority[a.kind]))[0]??null;
  const activeEmote=state.emote.active;
  const emoteSticker=activeEmote?EMOTE_STICKERS.find((entry)=>entry.id===activeEmote.id):null;
  const emoteSeat=(()=>{
    if(!emoteSticker)return null;
    const activeBy=String(activeEmote?.by||'');
    if(activeBy.startsWith('seat:')){
      const seat=Number(activeBy.slice(5));
      if(Number.isFinite(seat))return seat;
    }
    if(v.mode==='room'&&activeBy){
      const players=Array.isArray(state.solo.players)?state.solo.players:[];
      const idx=players.findIndex((player)=>String(player?.uid||'')===activeBy);
      if(idx>=0)return idx;
      const roster=Array.isArray(state.room.data?.players)?state.room.data.players:[];
      const entry=roster.find((player)=>String(player?.uid||'')===activeBy);
      const seat=Number(entry?.seat);
      if(Number.isFinite(seat))return seat;
    }
    return Number.isInteger(v.selfSeat)?v.selfSeat:0;
  })();
  const emoteImageHtml=emoteSticker
    ?`<img src="${withBase(`emotes/${emoteSticker.file}`)}" alt="${emoteSticker.id}"/>`
    :'';
  const hasSeatCallout=(seat)=>Boolean(calloutDisplayEnabled&&activeCallout&&activeCallout.seat===seat);
  if(emoteSticker&&emoteSeat!==null&&hasSeatCallout(emoteSeat)){
    if(state.emote.active&&!state.emote.active.suppressCallout){
      state.emote.active={...state.emote.active,suppressCallout:true};
    }
  }
  const seatCalloutHtml=(seat,viewCls,color,isSelf=false)=>{
    const seatClass=isSelf?'play-type-call-self':'play-type-call-seat';
    const lastClass=isSelf?'last-card-call-self':'last-card-call-seat';
    const tailDir=isSelf?'south':viewCls==='north'?'north':viewCls==='east'?'east':viewCls==='west'?'west':'south';
    const textClass=String(activeCallout?.text??'').length>10?'hk-medium':'hk-text';
    const shouldMergeEmote=Boolean(!isSelf&&emoteSticker&&emoteSeat===seat&&hasSeatCallout(seat));
    const emoteInlineHtml=shouldMergeEmote?`<span class="emote-icon">${emoteImageHtml}</span>`:'';
    const calloutClass=shouldMergeEmote?' callout-with-emote':'';
    if(!calloutDisplayEnabled)return'';
    if(!activeCallout||activeCallout.seat!==seat)return'';
    if(activeCallout.kind==='pass'){
      const jitter=calloutJitterStyle(viewCls,`pass|${seat}|${activeCallout.nonce}|${activeCallout.text}`);
      return`<div class="play-type-call ${seatClass} pass-call${calloutClass}" style="--player-color:${color};${jitter}"><div class="callout-box"><div class="hk-inner">${emoteInlineHtml}<span class="${textClass}">${esc(activeCallout.text)}</span></div></div><div class="tail tail-${tailDir}"></div></div>`;
    }
    if(activeCallout.kind==='play'){
      const fresh=activeCallout.fresh?' play-type-call-fresh':'';
      const jitter=calloutJitterStyle(viewCls,`play|${seat}|${activeCallout.nonce}|${activeCallout.text}`);
      return`<div class="play-type-call ${seatClass}${fresh}${calloutClass}" style="--player-color:${color};${jitter}"><div class="callout-box"><div class="hk-inner">${emoteInlineHtml}<span class="${textClass}">${esc(activeCallout.text)}</span></div></div><div class="tail tail-${tailDir}"></div></div>`;
    }
    if(activeCallout.kind==='must3'){
      const fresh=activeCallout.fresh?' play-type-call-fresh':'';
      const jitter=calloutJitterStyle(viewCls,`must3|${seat}|${activeCallout.nonce}|${activeCallout.text}`);
      return`<div class="play-type-call ${seatClass}${fresh}${calloutClass}" style="--player-color:${color};${jitter}"><div class="callout-box"><div class="hk-inner">${emoteInlineHtml}<span class="${textClass}">${esc(activeCallout.text)}</span></div></div><div class="tail tail-${tailDir}"></div></div>`;
    }
    if(activeCallout.kind==='last'){
      const fresh=activeCallout.fresh?' last-card-call-fresh':'';
      const jitter=calloutJitterStyle(viewCls,`last|${seat}|${activeCallout.nonce}`);
      return`<div class="last-card-call ${lastClass}${fresh}${calloutClass}" style="--player-color:${color};${jitter}"><div class="callout-box"><div class="hk-inner">${emoteInlineHtml}<span class="${textClass}">${esc(activeCallout.text)}</span></div></div><div class="tail tail-${tailDir}"></div></div>`;
    }
    return'';
  };
  const seatEmoteHtml=(seat,viewCls,color,isSelf=false)=>{
    if(!emoteDisplayEnabled)return'';
    if(!emoteSticker||emoteSeat===null||emoteSeat!==seat)return'';
    if(isSelf)return'';
    if(state.emote.active?.suppressCallout)return'';
    const tailDir=viewCls==='north'?'north':viewCls==='east'?'east':viewCls==='west'?'west':'south';
    const jitter=calloutJitterStyle(viewCls,`emote|${seat}|${activeEmote?.ts||0}|${emoteSticker.id}`);
    return`<div class="emote-callout play-type-call-seat" data-emote-seat="${seat}" style="--player-color:${color};${jitter}"><div class="callout-box"><div class="hk-inner"><span class="emote-icon">${emoteImageHtml}</span></div></div><div class="tail tail-${tailDir}"></div></div>`;
  };
  const selfTableEmoteHtml=(emoteDisplayEnabled&&emoteSticker&&Number.isInteger(v.selfSeat)&&emoteSeat===v.selfSeat)
    ?(emoteSticker.id==='rude'
      ?`<div class="self-table-emote emote-rude"><span class="emote-rude-hit emote-rude-hit-1">${emoteImageHtml}</span><span class="emote-rude-hit emote-rude-hit-2">${emoteImageHtml}</span><span class="emote-rude-hit emote-rude-hit-3">${emoteImageHtml}</span></div>`
      :`<div class="self-table-emote emote-${emoteSticker.id}">${emoteImageHtml}</div>`)
    :'';
  return{
    emoteSeat,
    selfTableEmoteHtml,
    seatCalloutHtml,
    seatEmoteHtml
  };
}
