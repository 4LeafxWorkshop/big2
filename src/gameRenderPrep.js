import {renderConfidentialStamp} from './modalViews.js';
import {resolveAvatarSrc} from './avatarProfile.js';
import {buildOpponentNamecardHtml} from './opponentNamecard.js';
import {renderOpponentIdentityHtml, renderOpponentLabel} from './opponentLabel.js';

const TURN_SEAT_CLS=['south','east','north','west'];
const TURN_COMPASS_ICON_BY_SEAT={
  north:'turn-up',
  east:'turn-right',
  south:'turn-down',
  west:'turn-left'
};

function getTurnCompassSeatCls(v){
  const seat=Number.isFinite(Number(v?.currentSeat))?Number(v.currentSeat):0;
  const selfSeat=Number.isFinite(Number(v?.selfSeat))?Number(v.selfSeat):0;
  const idx=((seat-selfSeat)%4+4)%4;
  return TURN_SEAT_CLS[idx]||'south';
}

function buildTurnCompassHtml(v,t,withBase){
  if(v?.gameOver)return'';
  const activeSeatCls=getTurnCompassSeatCls(v);
  const iconName=TURN_COMPASS_ICON_BY_SEAT[activeSeatCls]??TURN_COMPASS_ICON_BY_SEAT.south;
  return`<div class="table-turn-compass" data-active-seat="${activeSeatCls}" aria-label="${t('turn')}"><span class="table-turn-compass-ring"><img class="table-turn-pointer" src="${withBase(`turn-indicators/${iconName}.svg`)}" alt="" aria-hidden="true"/></span></div>`;
}

function buildTableInventoryDecorHtml(withBase){
  return`<div class="table-inventory-decor" aria-hidden="true">
    <img class="table-inventory-item table-inventory-lemontea" src="${withBase('emotes/emote-lemontea.png')}" alt=""/>
    <img class="table-inventory-item table-inventory-eggtart" src="${withBase('emotes/emote-eggtart.png')}" alt=""/>
    <img class="table-inventory-item table-inventory-milktea" src="${withBase('emotes/emote-milktea.png')}" alt=""/>
  </div>`;
}

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
    seatEmoteHtml,
    coachMarksButtonHtml=''
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
  const selfSeatNum=Number.isFinite(Number(self?.seat))?Number(self.seat):null;
  const currentSeatNum=Number.isFinite(Number(v.currentSeat))?Number(v.currentSeat):null;
  const selfActive=Boolean(!v.gameOver&&self&&selfSeatNum!==null&&currentSeatNum!==null&&currentSeatNum===selfSeatNum);
  const selfIsHost=hostSeat!==null&&selfSeatNum!==null&&Number(hostSeat)===selfSeatNum;
  const selfHostBadgeHtml=selfIsHost?`<span class="lobby-seat-host-badge-text">${t('roomHostTag')}</span>`:'';
  const participants=Array.isArray(v?.participants)?v.participants:[];
  const nextSeat=selfSeatNum!==null?(selfSeatNum+1)%4:null;
  const nextPlayer=nextSeat!==null?participants.find((p)=>Number(p?.seat)===nextSeat):null;
  const nextPlayerHasOne=Number(nextPlayer?.count)===1;
  const selfTopTwoWarningHtml=selfActive&&nextPlayerHasOne?`<span class="seat-top-two-warning">${esc(t('playBigWarning'))}</span>`:'';
  const selfBadgeHtml=selfDangerLast
    ?`<span class="avatar-status-badge warning ${selfActive?'danger':''}" aria-label="${esc(t('lastCardCall'))}"></span>`
    :(selfActive?`<span class="avatar-status-badge turn" aria-label="${esc(t('wait'))}"></span>`:'');
  const selfAvatar=`<span class="player-avatar-wrap player-avatar-wrap-self avatar-rim${selfActive?' is-active':''}" style="--avatar-rim:${selfSeatColor};"><img id="self-avatar-img" class="player-avatar player-avatar-self ${avatarGenderClass(selfGender)} ${useGoogleSelfAvatar?'player-avatar-google':''}" style="--avatar-outline:${selfSeatColor};" src="${selfAvatarSrc}" data-fallback="${selfGender==='female'?AVATAR_BASE_SRC.female:AVATAR_BASE_SRC.male}" alt="${esc(selfName)}"/>${selfHostBadgeHtml}${selfBadgeHtml}${coachMarksButtonHtml}</span>`;
  let selfCalloutHtml=self?seatCalloutHtml(self.seat,'south',selfSeatColor,true):'';
  const selfEmoteHtml=self?seatEmoteHtml(self.seat,'south',selfSeatColor,true):'';
  if(selfTopTwoWarningHtml)selfCalloutHtml+=selfTopTwoWarningHtml;
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
  const gameHistoryHtml=historyHtml(v.history,v.selfSeat,v.participants,v.systemLog);
  const closeLabel=t('close');
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
    handHtml,
    discardSwipeHintHtml:''
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
  }=params;
  return renderOpponentSeats(arr.filter((player)=>player.viewIndex!==0).map((player)=>{
    const active=v.currentSeat===player.seat&&!v.gameOver;
    const playerColor=playerColorByViewClass(player.cls);
    const useFlowOpponentStation=true;
    const dangerLast=Boolean(!v.gameOver&&player.count===1);
    const isHostSeat=hostSeat!==null&&hostSeat===player.seat;
    const hostBadgeHtml=isHostSeat?`<span class="lobby-seat-host-badge-text">${t('roomHostTag')}</span>`:'';
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
    const openAnchorStyle='position:relative !important;z-index:11000 !important;justify-self:center !important;';
    const openPlayContent=opponentLastAction
      ?seatLastActionHtml(opponentLastAction,TABLE_PLAY_SCALE)
      :'';
    const opponentOpenPlayHtml=`<div class="seat-open-play" style="${openAnchorStyle}"><div class="opponent-open-scale">${openPlayContent}</div></div>`;
    const closedCountHtml=!v.gameOver&&player.count>0?`<span class="closed-count-pill">x${player.count}</span>`:'';
    const avatarSrc=resolveAvatarSrc({
      picture:player.picture,
      name:player.name,
      color:playerColor,
      gender:player.gender,
      isBot:player.isBot,
      authPictureUrlFrom,
      avatarDataUri
    });
    const botNameAttr=player.isBot?` data-bot-name="${esc(player.name)}"`:'';
    const opponentName=player.rawName||player.name;
    const opponentAttr=` data-opponent-name="${esc(opponentName)}"`;
    const profile=OPPONENT_PROFILE_BY_NAME[opponentName];
    const mottoText=profileFieldValue(profile,'motto','');
    const hintText='';
    const mottoClass=state.language==='en'?'hk-power-motto motto-en':'hk-power-motto';
    const seed=hashTextSeed(`${opponentName}|motto`);
    const mottoTilt=`${(seed%11)-5}deg`;
    const mottoTailDir='north';
    const roundWinsHtml=roundWinsChipHtml(roundWinsBySeat[player.seat]??0);
    const namecardBtn=buildOpponentNamecardHtml({
      isBot:player.isBot,
      opponentName,
      t,
      esc
    });
    const calloutHtml=seatCalloutHtml(player.seat,player.cls,playerColor,false);
    const emoteHtml=seatEmoteHtml(player.seat,player.cls,playerColor,false);
    const foodCalloutHtml=seatFoodCalloutHtml(player.seat,player.cls,playerColor,false);
    const calloutActive=Boolean(calloutHtml||emoteHtml||foodCalloutHtml);
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
      mottoTailDir,
      calloutHtml,
      emoteHtml,
      foodCalloutHtml,
      calloutActive,
      peekActive,
      opponentAttr,
      esc,
      renderOpponentIdentityHtml
    });
    const shellStyle=`--player-color:${playerColor};position:relative !important;border:0 !important;box-shadow:none !important;background:transparent !important;border-radius:0 !important;`;
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
      closedPileCount:player.count,
      closedCountHtml,
      opponentOpenPlayHtml,
      calloutActive
    });
    return renderOpponentSeat({
      cls:player.cls,
      active,
      seatAttrs,
      shellStyle,
      outerLabelHtml,
      sectionStyle,
      calloutActive,
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
    const explicitSeat=Number(activeEmote?.seat);
    if(Number.isInteger(explicitSeat)&&explicitSeat>=0&&explicitSeat<=3)return explicitSeat;
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
  const allowSeatEmotes=Boolean(emoteDisplayEnabled||v.mode==='room');
  const hasSeatCallout=(seat)=>Boolean(calloutDisplayEnabled&&activeCallout&&activeCallout.seat===seat);
  const seatCalloutHtml=(seat,viewCls,color,isSelf=false)=>{
    const seatClass=isSelf?'play-type-call-self':'play-type-call-seat';
    const lastClass=isSelf?'last-card-call-self':'last-card-call-seat';
    const tailDir=isSelf?'south':viewCls==='north'?'north':viewCls==='east'?'east':viewCls==='west'?'west':'south';
    const textClass=String(activeCallout?.text??'').length>10?'hk-medium':'hk-text';
    const renderCalloutText=(text)=>esc(String(text??'')).replace(/\n/g,'<br>');
    const shouldMergeEmote=Boolean(!isSelf&&emoteSticker&&emoteSeat===seat&&hasSeatCallout(seat));
    const emoteInlineHtml=shouldMergeEmote?`<span class="emote-icon">${emoteImageHtml}</span>`:'';
    const calloutClass=shouldMergeEmote?' callout-with-emote':'';
    if(!calloutDisplayEnabled)return'';
    if(!activeCallout||activeCallout.seat!==seat)return'';
    if(activeCallout.kind==='pass'){
      const jitter=calloutJitterStyle(viewCls,`pass|${seat}|${activeCallout.nonce}|${activeCallout.text}`);
      return`<div class="play-type-call ${seatClass} pass-call${calloutClass}" style="--player-color:${color};${jitter}"><div class="callout-box"><div class="hk-inner">${emoteInlineHtml}<span class="${textClass}">${renderCalloutText(activeCallout.text)}</span></div></div><div class="tail tail-${tailDir}"></div></div>`;
    }
    if(activeCallout.kind==='play'){
      const fresh=activeCallout.fresh?' play-type-call-fresh':'';
      const jitter=calloutJitterStyle(viewCls,`play|${seat}|${activeCallout.nonce}|${activeCallout.text}`);
      return`<div class="play-type-call ${seatClass}${fresh}${calloutClass}" style="--player-color:${color};${jitter}"><div class="callout-box"><div class="hk-inner">${emoteInlineHtml}<span class="${textClass}">${renderCalloutText(activeCallout.text)}</span></div></div><div class="tail tail-${tailDir}"></div></div>`;
    }
    if(activeCallout.kind==='must3'){
      const fresh=activeCallout.fresh?' play-type-call-fresh':'';
      const jitter=calloutJitterStyle(viewCls,`must3|${seat}|${activeCallout.nonce}|${activeCallout.text}`);
      return`<div class="play-type-call must3-call ${seatClass}${fresh}${calloutClass}" style="--player-color:${color};${jitter}"><div class="callout-box"><div class="hk-inner">${emoteInlineHtml}<span class="${textClass}">${renderCalloutText(activeCallout.text)}</span></div></div><div class="tail tail-${tailDir}"></div></div>`;
    }
    if(activeCallout.kind==='last'){
      const fresh=activeCallout.fresh?' last-card-call-fresh':'';
      const jitter=calloutJitterStyle(viewCls,`last|${seat}|${activeCallout.nonce}`);
      return`<div class="last-card-call ${lastClass}${fresh}${calloutClass}" style="--player-color:${color};${jitter}"><div class="callout-box"><div class="hk-inner">${emoteInlineHtml}<span class="${textClass}">${renderCalloutText(activeCallout.text)}</span></div></div><div class="tail tail-${tailDir}"></div></div>`;
    }
    return'';
  };
  const seatEmoteHtml=(seat,viewCls,color,isSelf=false)=>{
    if(!allowSeatEmotes)return'';
    if(!emoteSticker||emoteSeat===null||emoteSeat!==seat)return'';
    if(isSelf)return'';
    if(activeCallout&&activeCallout.seat===seat)return'';
    const tailDir=viewCls==='north'?'north':viewCls==='east'?'east':viewCls==='west'?'west':'south';
    const jitter=calloutJitterStyle(viewCls,`emote|${seat}|${activeEmote?.ts||0}|${emoteSticker.id}`);
    return`<div class="emote-callout play-type-call-seat" data-emote-seat="${seat}" style="--player-color:${color};${jitter}"><div class="callout-box"><div class="hk-inner"><span class="emote-icon">${emoteImageHtml}</span></div></div><div class="tail tail-${tailDir}"></div></div>`;
  };
  const seatFoodCalloutHtml=(seat,viewCls,color,isSelf=false)=>{
    const foodCallout=state.serviceBell?.foodCallout;
    if(!foodCallout||!Number.isInteger(foodCallout.seat)||foodCallout.seat!==seat)return'';
    if(isSelf)return'';
    const tailDir=viewCls==='north'?'north':viewCls==='east'?'east':viewCls==='west'?'west':'south';
    const foodSrc=withBase(`foods/${foodCallout.file}`);
    const foodWidth=Number(foodCallout.width)||64;
    return`<div class="emote-callout food-callout food-callout-seat" data-food-seat="${seat}" style="--player-color:${color};--food-callout-w:${foodWidth}px;"><div class="callout-box"><div class="hk-inner"><span class="emote-icon food-icon"><img src="${foodSrc}" alt="${esc(foodCallout.foodId||'food')}"/></span></div></div><div class="tail tail-${tailDir}"></div></div>`;
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
    seatEmoteHtml,
    seatFoodCalloutHtml
  };
}

export function buildRoomMetaTableHtml(params){
  const {
    v,
    state,
    t,
    esc,
    roomCountdownText
  }=params;
  if(v.mode!=='room'||!state.room.data)return'';
  const baseRound=Number(state.room.data.roundCount||0);
  const status=String(state.room.data.status||'');
  const round=baseRound+(status==='playing'||status==='starting'?1:0);
  const countdown=roomCountdownText(state.room.data);
  return`<div class="room-top-meta-table"><div class="room-top-meta room-top-meta-inline">
      <span class="room-top-item"><span class="room-top-label">${t('roomRound')}</span><strong>${Number.isFinite(round)?round:'-'}</strong></span>
      <span class="room-top-item"><span class="room-top-label">${t('roomCountdown')}</span><strong data-room-countdown-value>${esc(countdown)}</strong></span>
    </div></div>`;
}

export function buildGameShellMarkup(params){
  const {
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
    withBase=(path)=>String(path??''),
    congratsOverlayHtml,
    revealHtml,
    resultScreenHtml,
    opponentProfileModalHtml,
    scoreGuideModalHtml,
    introPanelHtml,
    leaderboardModalHtml,
    coachMarksButtonHtml,
    coachMarksLabel,
    coachMarksHtml
  }=params;
  const gameTableHtml=renderGameTable({
    roomTopMetaTable,
    seatHtml,
    mobileNamesHtml:'',
    mobileDiscardHtml:'',
    centerMovesHtml:centerMovesHtml(v),
    centerLastMovesHtml:centerLastMovesHtml(lastActions,v.selfSeat),
    turnCompassHtml:buildTurnCompassHtml(v,t,withBase),
    inventoryDecorHtml:buildTableInventoryDecorHtml(withBase),
    coachMarksButtonHtml,
    coachMarksLabel,
    showWinCelebrate:!v.gameOver&&youWin,
    t
  });
  let shellHtml=renderGameShell({
    gameOver:v.gameOver,
    showLog:state.showLog,
    gameTopbarHtml,
    gameTableHtml,
    gameActionZoneHtml,
    selfTableEmoteHtml,
    congratsOverlayHtml:v.gameOver?'':congratsOverlayHtml(v,youWin),
    revealHtml:revealHtml(v),
    sideZoneHtml,
    resultScreenHtml:v.gameOver?resultScreenHtml(v):'',
    opponentProfileModalHtml:state.opponentProfileName?opponentProfileModalHtml(state.opponentProfileName):'',
    scoreGuideModalHtml:state.showScoreGuide?scoreGuideModalHtml():'',
    introPanelHtml:state.home.showIntro?introPanelHtml():'',
    leaderboardModalHtml:state.home.showLeaderboard?leaderboardModalHtml():'',
    coachMarksHtml:state.showCoachMarks?coachMarksHtml:''
  });
  if(!v.gameOver&&youWin){
    shellHtml=shellHtml.replace('<div class="win-celebrate"><div class="confetti-layer"></div>','<div class="win-celebrate"><canvas class="confetti-canvas" data-confetti="win" aria-hidden="true"></canvas>');
  }
  return shellHtml;
}

export function buildResultScreenHtml(params){
  const {
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
  }=params;
  const isRoom=state.home.mode==='room';
  const isHost=isRoom&&roomIsHost();
  const roomExpired=isRoom&&roomResultExpired(state.room.data);
  const roomCountdown=isRoom&&state.room.data?roomCountdownText(state.room.data):'';
  const roomHumanCount=isRoom&&state.room.data
    ?(Array.isArray(state.room.data.players)?state.room.data.players.filter((p)=>String(p.uid||'').startsWith('uid:')||String(p.uid||'').startsWith('guest:')).length:0)
    :0;
  const needsPlayers=isRoom&&roomHumanCount<2;
  const canRoomAgain=isRoom&&!needsPlayers&&isHost&&!roomExpired;
  const statusHint=uiStatus(v.status,v.statusMeta);
  const footerHint=roomExpired
    ?t('roomHostSneakAway')
    :needsPlayers
      ?t('roomNeedPlayers')
      :(!canRoomAgain&&isRoom?t('roomWaitingHost'):'');
  const topHint=footerHint&&statusHint===footerHint?'':statusHint;
  const roomExitHint=isRoom?t('roomExitHint'):'';
  const roomPictureBySeat=(()=>{
    const list=isRoom&&state.room.data?Array.isArray(state.room.data.players)?state.room.data.players:[]:[];
    const entries=list.map((p)=>[Number.isFinite(Number(p?.seat))?Number(p.seat):-1,String(p?.picture||'').trim()]);
    return new Map(entries.filter((entry)=>entry[0]!==-1&&entry[1]));
  })();
  const hostSeat=(()=>{
    if(!isRoom||!state.room.data)return null;
    const hostId=String(state.room.data.hostId||'').trim();
    if(!hostId)return null;
    const players=Array.isArray(state.room.data.players)?state.room.data.players:[];
    const host=players.find((p)=>String(p?.uid||'')===hostId);
    const seat=Number(host?.seat);
    return Number.isFinite(seat)?seat:null;
  })();
  const resultSnapshot=Array.isArray(state.room.lastResultPlayers)?state.room.lastResultPlayers:null;
  const snapshotBySeat=resultSnapshot?new Map(resultSnapshot.map((p)=>[Number.isFinite(Number(p?.seat))?Number(p.seat):-1,p])):null;
  const winner=arr.find((p)=>p.count===0)??arr[0];
  const winnerLastPlay=(v.history??[]).slice().reverse().find((e)=>e.action==='play'&&e.seat===winner.seat&&Array.isArray(e.cards)&&e.cards.length);
  const winnerLastDiscardCards=winnerLastPlay?.cards??[];
  const selfSeatNum=Number.isFinite(Number(v.selfSeat))?Number(v.selfSeat):null;
  const showConfetti=selfSeatNum!==null&&winner.seat===selfSeatNum;
  const deductions=v.roundSummary?.deductions??arr.map((p)=>p.seat===winner.seat?0:calcPenaltyDetail(v.revealedHands?.[p.seat]??[]).deduction);
  const winnerGain=Number(v.roundSummary?.winnerGain??deductions.reduce((sum,vv)=>sum+vv,0));
  const detailBySeat=v.roundSummary?.details??arr.map((p)=>p.seat===winner.seat?{remain:0,base:0,multiplier:1,deduction:0,anyTwo:false,twoPenalty:false,chaoMultiplier:1,chaoKey:''}:calcPenaltyDetail(v.revealedHands?.[p.seat]??[]));
  const rows=arr.map((p)=>{
    const isWinner=p.seat===winner.seat;
    const isSelf=p.seat===v.selfSeat;
    const color=playerColorByViewClass(p.cls);
    const isHostSeat=hostSeat!==null&&hostSeat===p.seat;
    const hostBadgeHtml=isHostSeat?`<span class="lobby-seat-host-badge-text">${t('roomHostTag')}</span>`:'';
    const snapshot=snapshotBySeat?snapshotBySeat.get(p.seat)||null:null;
    const snapName=String(snapshot?.name||p.name||'');
    const snapGender=String(snapshot?.gender||p.gender||'male')==='female'?'female':'male';
    const snapPicture=String(snapshot?.picture||'').trim();
    const remain=(v.revealedHands?.[p.seat]??[]);
    const detail=detailBySeat[p.seat]??{remain:remain.length,base:0,multiplier:1,deduction:Number(deductions[p.seat])||0,anyTwo:false,twoPenalty:false,chaoMultiplier:1,chaoKey:''};
    const actualDeduction=Number(deductions[p.seat])||0;
    const delta=isWinner?winnerGain:-actualDeduction;
    const total=p.score??0;
    const remainCards=remain.length?remain.map((c)=>renderStaticCard(c,true)).join(''):`<span class="hint">-</span>`;
    const mulTags=[
      detail.anyTwo?`<span class="result-score-chip penalty">${t('scoreAnyTwo')} x2</span>`:'',
      detail.twoPenalty?`<span class="result-score-chip penalty">${t('scoreTwoPenalty')} x2</span>`:'',
      detail.chaoMultiplier>1&&detail.chaoKey?`<span class="result-score-chip penalty">${t(detail.chaoKey)} x${detail.chaoMultiplier}</span>`:''
    ].filter(Boolean).join('');
    const deltaText=delta>0?`+${delta}`:`${delta}`;
    const detailLine=isWinner
      ?`<div class="result-score-detail">${t('resultDetail')}: ${t('scoreGain')} +${winnerGain}</div>`
      :`<div class="result-score-detail">${t('resultDetail')}: ${t('scoreBase')} ${detail.base} x ${detail.multiplier} · ${t('scoreDeduct')} ${actualDeduction}${mulTags?` · ${t('scorePenaltyBoost')}: ${mulTags}`:''}</div>`;
    const selfPic=isSelf?authPictureUrl():'';
    const fallbackPicture=snapPicture||roomPictureBySeat.get(p.seat)||String(p.picture||'').trim();
    const avatarSrc=resolveAvatarSrc({
      picture:selfPic||fallbackPicture,
      name:snapName,
      color,
      gender:snapGender,
      isBot:Boolean(p.isBot),
      authPictureUrlFrom,
      avatarDataUri
    });
    const botNameAttr=p.isBot?` data-bot-name="${esc(p.name)}"`:'';
    const confidentialStampHtml=(isRoom&&!p.isBot&&!snapshot)
      ?renderConfidentialStamp({text:t('confidential'),esc})
      :'';
    const winnerLastDiscardHtml=isWinner
      ?`<div class="result-card-block"><div class="result-block-title">${t('resultLastDiscard')}</div><div class="result-cards" aria-label="${t('resultLastDiscard')}">${winnerLastDiscardCards.length?winnerLastDiscardCards.map((c)=>renderStaticCard(c,true)).join(''):`<span class="hint">-</span>`}</div></div>`
      :'';
    const remainBlockHtml=!isWinner
      ?`<div class="result-card-block"><div class="result-block-title">${t('resultRemain')}</div><div class="result-cards" aria-label="${t('resultRemain')}">${remainCards}</div></div>`
      :'';
    const rightColHtml=`<div class="result-side">${winnerLastDiscardHtml}${remainBlockHtml}</div>`;
    return`<div class="result-row ${isWinner?'winner':''}" style="--winner-color:${color};">
      <div class="result-main">
        ${confidentialStampHtml}
        <div class="result-head"><span class="player-color-chip" style="--player-color:${color};"></span><span class="result-avatar-wrap" style="--avatar-seat-color:${color};"><img class="result-avatar" src="${avatarSrc}" alt="${esc(p.name)}"${botNameAttr}/>${hostBadgeHtml}</span><span class="result-player-name"><strong>${esc(p.name)}</strong>${isWinner?`<span class="result-winner-medal" aria-hidden="true">🏅</span>`:''}</span>${isWinner?`<span class="result-winner-tag">${t('resultWinner')}</span>`:''}</div>
        <div class="result-meta">${t('resultDelta')}: ${deltaText} · ${t('score')}: ${total}</div>
        ${detailLine}
      </div>
      ${rightColHtml}
    </div>`;
  }).join('');
  return`<section class="result-screen">
    ${showConfetti?`<canvas class="confetti-canvas result-confetti-canvas" data-confetti="result" aria-hidden="true"></canvas>`:''}
    <div class="result-card">
      <h2 class="title-with-icon"><span class="title-icon title-icon-result" aria-hidden="true"></span><span>${t('resultTitle')}</span></h2>
      ${topHint?`<div class="hint">${esc(topHint)}</div>`:''}
      ${isRoom?`<div class="room-expiry-row room-expiry-top"><span class="room-expiry-label"><i class="fa-solid fa-clock room-expiry-icon" aria-hidden="true"></i><span>${t('roomCountdown')}</span></span><button type="button" class="room-expiry-reset-btn" data-room-expiry-reset="1"><strong data-room-countdown-value>${esc(roomCountdown)}</strong></button></div>`:''}
      <div class="result-list">${rows}</div>
      <div class="control-row">
        <button id="result-home" class="secondary">${isRoom?t('roomLeave'):t('home')}</button>
        ${(!isRoom||canRoomAgain)
    ?`<button id="result-again" class="primary" ${canRoomAgain||!isRoom?'':'disabled'}>${t('again')}</button>`
    :(!isRoom?'':footerHint?``:`<span class="hint">${t('roomWaitingHost')}</span>`)}
        ${footerHint?`<span class="hint">${footerHint}</span>`:''}
      </div>
      ${roomExitHint?`<div class="room-action-note hint">${esc(roomExitHint)}</div>`:''}
    </div>
  </section>`;
}

export function buildCongratsOverlayHtml(params){
  const {
    v,
    youWin,
    state,
    t,
    esc,
    roomIsHost,
    roomResultExpired,
    roomCountdownText,
    uiStatus
  }=params;
  if(!youWin)return'';
  const isRoom=state.home.mode==='room';
  const isHost=isRoom&&roomIsHost();
  const roomExpired=isRoom&&roomResultExpired(state.room.data);
  const roomCountdown=isRoom&&state.room.data?roomCountdownText(state.room.data):'';
  const roomExitHint=isRoom?t('roomExitHint'):'';
  const againHtml=(!isRoom||(isHost&&!roomExpired))
    ?`<button id="congrats-again" class="primary">${t('again')}</button>`
    :`<span class="hint">${roomExpired?t('roomHostSneakAway'):t('roomWaitingHost')}</span>`;
  return`<div class="congrats-screen"><div class="congrats-card"><h3 class="title-with-icon"><span class="title-icon title-icon-congrats" aria-hidden="true"></span><span>${t('congrats')}</span></h3><div class="hint">${esc(uiStatus(v.status,v.statusMeta))}</div>${isRoom?`<div class="room-expiry-row room-expiry-top"><span class="room-expiry-label"><i class="fa-solid fa-clock room-expiry-icon" aria-hidden="true"></i><span>${t('roomCountdown')}</span></span><button type="button" class="room-expiry-reset-btn" data-room-expiry-reset="1"><strong data-room-countdown-value>${esc(roomCountdown)}</strong></button></div>`:''}<div class="control-row"><button id="congrats-home" class="secondary">${t('home')}</button>${againHtml}</div>${roomExitHint?`<div class="room-action-note hint">${esc(roomExitHint)}</div>`:''}</div></div>`;
}
