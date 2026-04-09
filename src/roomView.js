function maskRoomCode(code){
  const raw=String(code||'');
  if(!raw)return'';
  if(raw.length<=2)return raw;
  const chars=raw.split('');
  const len=chars.length;
  const maskCount=len<=4?Math.max(1,len-2):3;
  const start=Math.floor((len-maskCount)/2);
  for(let i=start;i<start+maskCount;i+=1){
    chars[i]='*';
  }
  return chars.join('');
}

export function renderRoomLobbyOverlay(params){
  const {
    visible,
    roomTitle,
    roomCode,
    roomLobbyCountdown,
    roomPrivacyRow,
    roomSeats,
    roomErrorHtml,
    roomStartControl,
    roomPendingHint,
    roomStarting,
    t,
    esc
  }=params;
  if(!visible)return'';
  return`<div class="room-overlay"><div class="room-card room-lobby-card room-card-icon"><div class="room-head"><span class="room-corner-icon room-corner-icon-reception" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M4 17.5a1 1 0 0 1-1-1V15a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v1.5a1 1 0 1 1-2 0V15a2 2 0 0 0-2-2h-1v3a1 1 0 0 1-2 0v-3h-4v3a1 1 0 0 1-2 0v-3H7a2 2 0 0 0-2 2v1.5a1 1 0 0 1-1 1Z"/><path d="M7 10a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm10 0a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z"/><path d="M2 20a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Z"/></svg></span><h3>${roomTitle}</h3></div><div class="room-id-center"><span class="room-code">${esc(roomCode)}</span><button id="room-copy" class="secondary">${t('roomCopy')}</button></div><div class="room-expiry-row"><span>${t('roomCountdown')}</span><button type="button" class="room-expiry-reset-btn" data-room-expiry-reset="1"><strong data-room-countdown-value>${esc(roomLobbyCountdown)}</strong></button></div>${roomPrivacyRow}<div class="lobby-table">${roomSeats}</div>${roomErrorHtml}<div class="room-actions">${roomStartControl}${roomPendingHint}<button id="room-leave" class="secondary" ${roomStarting?'disabled':''}>${t('roomLeave')}</button></div></div></div>`;
}

export function renderRoomJoinOverlay(params){
  const {
    visible,
    activeRooms,
    activeRoomsLoading,
    hiddenCount,
    joinOpenCountdown,
    roomErrorHtml,
    t,
    esc,
    isRoomPlayerHuman,
    authPictureUrlFrom,
    avatarDataUri
  }=params;
  if(!visible)return'';

  const createTableCard=`<button class="secondary room-card-join-btn room-icon-btn" id="room-create-card" type="button" aria-label="${t('roomCreate')}"><svg class="room-inline-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H15a1 1 0 1 1 0 2H6v14h9a1 1 0 1 1 0 2H5.5A1.5 1.5 0 0 1 4 19.5v-15Z"/><path d="M15 8a1 1 0 0 1 1-1h3v-3a1 1 0 1 1 2 0v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0V9h-3a1 1 0 0 1-1-1Z"/><path d="M12 12.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"/></svg><span>${t('roomCreate')}</span></button>`;
  const cards=activeRooms.length
    ?activeRooms.map((r)=>{
        const roster=Array.isArray(r.roster)?r.roster:[];
        const isPrivate=Boolean(r.isPrivate);
        const displayCode=isPrivate?maskRoomCode(r.code):String(r.code||'').toUpperCase();
        let statusLabel='';
        if(r.status==='playing'){
          const round=Number(r.roundCount||0)+1;
          const roundText=Number.isFinite(round)?round:'-';
          statusLabel=`<div class="room-active-status">⚔️ ${t('roomStatusPlaying')} · ${t('roomRound')} ${roundText}</div>`;
        }
        const displayPlayers=Number.isFinite(Number(r.displayPlayers))?Number(r.displayPlayers):Number(r.players||0);
        const totalSeats=Number.isFinite(Number(r.maxPlayers))?Number(r.maxPlayers):4;
        const joinDisabled=isPrivate||r.status==='playing';
        const bottomHint=isPrivate&&r.status!=='playing'
          ?t('roomEnterCodeHint')
          :'';
        const statusText=(()=>{
          if(r.status==='playing')return statusLabel.replace(/<[^>]+>/g,'');
          if(isPrivate&&r.status!=='playing')return bottomHint;
          return statusLabel?statusLabel.replace(/<[^>]+>/g,''):'';
        })();
        const seatSlots=Array.from({length:totalSeats},(_,idx)=>{
          const entry=roster[idx];
          if(!entry)return`<span class="room-seat-mini vacant" title="${t('roomSeatOpen')}">+</span>`;
          const fallbackSeatName=t('seatLabel').replace('{{n}}',String(idx+1));
          const name=String(entry.name||entry.displayName||fallbackSeatName);
          const gender=String(entry.gender||'male')==='female'?'female':'male';
          const picture=String(entry.picture||'').trim();
          const isBot=!isRoomPlayerHuman(entry);
          const src=picture?authPictureUrlFrom(picture):avatarDataUri(name,'#7aaed8',gender,isBot);
          return`<span class="room-seat-mini filled" title="${esc(name)}"><img src="${src}" alt="${esc(name)}"/></span>`;
        }).join('');
        const statusLine=statusText?`<div class="room-active-status-line">${esc(statusText)}</div>`:'';
        const joinInlineBtn=!isPrivate?`<button class="secondary room-card-join-btn room-card-join-inline room-icon-btn" data-code="${esc(r.code)}" ${joinDisabled?'disabled':''}><svg class="room-inline-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M10 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 10c4.418 0 8 1.79 8 4v1H2v-1c0-2.21 3.582-4 8-4m10-8h-2V6h-2v2h-2v2h2v2h2v-2h2z"/></svg><span>${t('roomJoin')}</span></button>`:'';
        return`<div class="room-active-card room-active-list-item${isPrivate?' room-active-card-private':''}" data-code="${esc(r.code)}" data-private="${isPrivate?'1':'0'}"${joinDisabled?' disabled':''}><div class="room-card-top"><div class="room-active-code"><span class="room-active-code-text">${esc(displayCode)}</span></div><div class="room-active-count"><svg class="room-active-count-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7m8 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6M2 20c0-2.761 3.134-5 7-5s7 2.239 7 5v1H2zm15.5-6c2.66.178 4.5 1.79 4.5 3.95V21h-4v-1c0-1.985-.95-3.72-2.5-4.92"/></svg><span>${displayPlayers}/${totalSeats}</span></div></div>${statusLine}<div class="room-seat-strip">${seatSlots}${joinInlineBtn}</div></div>`;
      }).join('')
    :'';
  const empty=activeRooms.length?'':`<div class="room-active-card room-active-empty" aria-disabled="true"><div class="room-active-code">${t('roomActiveEmpty')}</div></div>`;
  const hiddenNote=hiddenCount?`<span class="room-active-hidden">${t('roomActiveHidden')}: ${hiddenCount}</span>`:'';
  const refreshCountdownText=joinOpenCountdown&&joinOpenCountdown>0
    ?`<span class="room-active-refresh-countdown">${joinOpenCountdown}${t('secondsShort')}</span>`
    :'';
  const activeRoomsBlock=`<div class="room-active-block"><div class="room-create-section">${createTableCard}</div><div class="room-active-head"><span>${t('roomActiveList')}</span>${hiddenNote}<button id="room-active-refresh" class="secondary"><span class="room-active-refresh-label">${t('roomActiveRefresh')}</span>${refreshCountdownText}</button></div><div class="room-active-grid">${cards}${empty}</div></div>`;
  return`<div class="room-overlay"><div class="room-card room-join-card room-card-icon"><div class="room-head"><span class="room-corner-icon room-corner-icon-reception" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M4 17.5a1 1 0 0 1-1-1V15a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v1.5a1 1 0 1 1-2 0V15a2 2 0 0 0-2-2h-1v3a1 1 0 0 1-2 0v-3h-4v3a1 1 0 0 1-2 0v-3H7a2 2 0 0 0-2 2v1.5a1 1 0 0 1-1 1Z"/><path d="M7 10a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm10 0a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z"/><path d="M2 20a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Z"/></svg></span><h3>${t('roomLobby')}</h3></div><label class="field"><span>${t('roomCode')}</span><div class="room-code-row"><input id="room-code-input" class="room-input" maxlength="8" placeholder="${t('roomCodeExample')}"/><button id="room-join-confirm" class="secondary room-icon-btn room-join-top-btn"><svg class="room-inline-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M10 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 10c4.418 0 8 1.79 8 4v1H2v-1c0-2.21 3.582-4 8-4m10-8h-2V6h-2v2h-2v2h2v2h2v-2h2z"/></svg><span>${t('roomJoin')}</span></button></div></label>${activeRoomsLoading?`<div class="hint">...</div>`:activeRoomsBlock}${roomErrorHtml}<div class="room-actions"><button id="room-join-cancel" class="secondary room-icon-btn"><span>${t('home')}</span></button></div></div></div>`;
}
