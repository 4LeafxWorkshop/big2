import {resolveAvatarSrc} from './avatarProfile.js';

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

export function renderRoomCreateCardHtml({t,isCreating=false}){
  const label=isCreating?t('roomCreating'):t('roomCreate');
  return`<button class="secondary room-card-join-btn room-icon-btn" id="room-create-card" type="button" aria-label="${label}" ${isCreating?'disabled':''}><svg class="room-inline-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M4.5 4.5A1.5 1.5 0 0 1 6 3h10a1 1 0 1 1 0 2H6v14h10a1 1 0 1 1 0 2H6A1.5 1.5 0 0 1 4.5 19.5z"/><path d="M15 8a1 1 0 0 1 1-1h2V5a1 1 0 1 1 2 0v2h2a1 1 0 1 1 0 2h-2v2h-2v2h-2V9h-2a1 1 0 0 1-1-1Z"/><path d="M12 12.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"/></svg><span>${label}</span></button>`;
}

export function renderRoomSeatMiniHtml(params){
  const {
    entry,
    idx,
    t,
    esc,
    isRoomPlayerHuman,
    authPictureUrlFrom,
    avatarDataUri,
    currentRoomPlayerId='',
    currentUserEmail='',
    currentAuthPicture=''
  }=params;
  if(!entry)return`<span class="room-seat-mini vacant" title="${t('roomSeatOpen')}">+</span>`;
  const fallbackSeatName=t('seatLabel').replace('{{n}}',String(idx+1));
  const name=String(entry.name||entry.displayName||fallbackSeatName);
  const gender=String(entry.gender||'male')==='female'?'female':'male';
  const entryEmail=String(entry.email||'').trim().toLowerCase();
  const isSelfEntry=String(entry.uid||'').trim()===String(currentRoomPlayerId||'').trim()
    ||(String(currentUserEmail||'').trim()&&entryEmail===String(currentUserEmail||'').trim().toLowerCase());
  const pictureRaw=String(entry.picture||'').trim();
  const picture=pictureRaw|| (isSelfEntry?String(currentAuthPicture||'').trim():'');
  const isBot=!isRoomPlayerHuman(entry);
  const fallbackSrc=avatarDataUri(name,'#7aaed8',gender,isBot);
  const src=resolveAvatarSrc({
    picture,
    name,
    color:'#7aaed8',
    gender,
    isBot,
    authPictureUrlFrom,
    avatarDataUri
  });
  return`<span class="room-seat-mini filled" title="${esc(name)}"><img src="${src}" alt="${esc(name)}" data-fallback-src="${esc(fallbackSrc)}" onerror="this.onerror=null;this.src=this.dataset.fallbackSrc"/></span>`;
}

export function renderRoomActiveCardHtml(params){
  const {
    room,
    t,
    esc,
    isRoomPlayerHuman,
    authPictureUrlFrom,
    avatarDataUri,
    currentRoomPlayerId='',
    currentUserEmail='',
    currentAuthPicture=''
  }=params;
  const roster=Array.isArray(room.roster)?room.roster:[];
  const isPrivate=Boolean(room.isPrivate);
  const displayCode=isPrivate?maskRoomCode(room.code):String(room.code||'').toUpperCase();
  let statusLabel='';
  if(room.status==='playing'){
    const round=Number(room.roundCount||0)+1;
    const roundText=Number.isFinite(round)?round:'-';
    statusLabel=`<div class="room-active-status room-active-status-playing"><span class="room-active-status-icon" aria-hidden="true">⚔️</span><span>${t('roomStatusPlaying')} · ${t('roomRound')} ${roundText}</span></div>`;
  }else if(room.status==='starting'){
    statusLabel=`<div class="room-active-status room-active-status-starting"><span class="room-active-status-icon" aria-hidden="true">⏳</span><span>${esc(String(t('roomStarting')).replace(/\.\.\.$/,''))}</span></div>`;
  }else if(isPrivate){
    statusLabel=`<div class="room-active-status room-active-status-private"><span class="room-active-status-icon" aria-hidden="true">🔒</span><span>${t('roomPrivate')}</span></div>`;
  }
  const displayPlayers=Number.isFinite(Number(room.displayPlayers))?Number(room.displayPlayers):Number(room.players||0);
  const totalSeats=Number.isFinite(Number(room.maxPlayers))?Number(room.maxPlayers):4;
  const joinDisabled=isPrivate||room.status==='playing';
  const bottomHint=isPrivate&&room.status!=='playing'?t('roomEnterCodeHint'):'';
  const statusText=(()=>{
    if(room.status==='playing')return statusLabel.replace(/<[^>]+>/g,'');
    if(isPrivate&&room.status!=='playing')return bottomHint;
    return statusLabel?statusLabel.replace(/<[^>]+>/g,''):'';
  })();
  const seatSlots=Array.from({length:totalSeats},(_,idx)=>renderRoomSeatMiniHtml({
    entry:roster[idx],
    idx,
    t,
    esc,
    isRoomPlayerHuman,
    authPictureUrlFrom,
    avatarDataUri,
    currentRoomPlayerId,
    currentUserEmail,
    currentAuthPicture
  })).join('');
  const statusLine=statusText?`<div class="room-active-status-line">${esc(statusText)}</div>`:'';
  const topStatusTag=statusLabel;
  const joinInlineBtn=!isPrivate&&room.status!=='playing'
    ?`<button class="secondary room-card-join-btn room-card-join-inline room-icon-btn" data-code="${esc(room.code)}" ${joinDisabled?'disabled':''}><svg class="room-inline-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M10 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 10c4.418 0 8 1.79 8 4v1H2v-1c0-2.21 3.582-4 8-4m10-8h-2V6h-2v2h-2v2h2v2h2v-2h2z"/></svg><span>${t('roomJoin')}</span></button>`
    :'';
  return`<div class="room-active-card room-active-list-item${isPrivate?' room-active-card-private':''}" data-code="${esc(room.code)}" data-private="${isPrivate?'1':'0'}"${joinDisabled?' disabled':''}><div class="room-card-top"><div class="room-active-code"><span class="room-active-code-text">${esc(displayCode)}</span></div>${topStatusTag}<div class="room-active-count"><svg class="room-active-count-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 11a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7m8 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6M2 20c0-2.761 3.134-5 7-5s7 2.239 7 5v1H2zm15.5-6c2.66.178 4.5 1.79 4.5 3.95V21h-4v-1c0-1.985-.95-3.72-2.5-4.92"/></svg><span>${displayPlayers}/${totalSeats}</span></div></div>${statusLine&&!topStatusTag?statusLine:''}<div class="room-seat-strip">${seatSlots}${joinInlineBtn}</div></div>`;
}
