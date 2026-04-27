import {renderRoomActiveCardHtml, renderRoomCreateCardHtml} from './roomLobbyCard.js';

const roomLobbyIconHtml=`<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M5.5 4.5A1.5 1.5 0 0 1 7 3h8.5A1.5 1.5 0 0 1 17 4.5V20H7a1.5 1.5 0 0 1-1.5-1.5V4.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 6.25V17.75" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 12h.01" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
const roomJoinIconHtml=`<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M4.5 10.5 12 4l7.5 6.5V20h-5.25v-5.25h-4.5V20H4.5V10.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.75 20v-4.75h4.5V20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const roomPasteIconHtml=`<svg viewBox="0 0 330 330" focusable="false" aria-hidden="true"><path d="M310 315v-95h-8.786H280h-21.213H200h-15c-8.284 0-15-6.716-15-15v-15v-58.787V110V88.787V80H95c-8.284 0-15 6.716-15 15v113.292V260v30v16.338V315c0 8.284 6.716 15 15 15h200C303.284 330 310 323.284 310 315z" fill="currentColor"/><path d="M235 10h-75.872c-2.061-5.822-7.6-10-14.128-10h-20c-6.528 0-12.066 4.178-14.128 10H35c-8.284 0-15 6.716-15 15v250c0 8.284 6.716 15 15 15h15v-30v-51.708V40h30.872c2.062 5.822 7.6 10 14.128 10h80c6.528 0 12.066-4.178 14.128-10H220v26.431c.413.369.819.749 1.214 1.144l20 20L250 96.36V25C250 16.716 243.284 10 235 10z" fill="currentColor"/><path d="M220 108.787 200 88.787v42.426V190h58.787h42.427L250 138.787z" fill="currentColor"/></svg>`;
const roomReturnIconHtml=`<svg viewBox="0 0 469.411 469.411" focusable="false" aria-hidden="true"><path d="M397.305 207.826c-67.733-59.947-161.493-61.12-194.56-59.307V74.706c0-5.867-4.8-10.667-10.667-10.667-2.453 0-4.907.853-6.827 2.453L3.918 215.826c-4.587 3.733-5.227 10.453-1.493 15.04.427.533.96.96 1.493 1.493l181.333 149.333c4.587 3.733 11.307 3.093 15.04-1.493 1.6-1.92 2.453-4.267 2.453-6.827v-77.013c34.667-8 175.147-30.507 246.613 103.36 1.813 3.52 5.44 5.653 9.387 5.653 3.413 0 6.72-1.6 8.853-4.693 1.28-1.813 1.813-4.053 1.813-6.293 0-69.626-24.214-132.346-71.999-174.799zM260.558 269.159c-41.067 0-70.72 8.427-71.467 8.64-4.587 1.28-7.68 5.44-7.68 10.24v62.72l-153.92-126.72 153.92-126.72v62.72c0 5.867 4.8 10.667 10.667 10.667.427 0 .853 0 1.28-.107 1.173-.107 115.2-12.907 189.76 53.227 35.2 31.147 56.213 75.2 62.72 130.987-43.059-34.146-119.006-49.293-174.261-49.293z" fill="currentColor"/></svg>`;

export function renderRoomLobbyOverlay(params){
  const {
    visible,
    roomTitle,
    roomCode,
    roomLobbyCountdown,
    inviteQrDataUrl,
    inviteQrLoading,
    inviteQrError,
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

  const roomCodeCopyLabel=String(t('roomCodeClickCopy'));
  const roomCodeCopyLabelOpen=roomCodeCopyLabel.replace(/[）)]$/,'');
  const roomCodeCopyLabelClose=roomCodeCopyLabel.endsWith('）')?'）':roomCodeCopyLabel.endsWith(')')?')':'';
  const qrHtml=inviteQrLoading
    ?`<div class="room-lobby-qr-placeholder">${t('roomInviteLoading')}</div>`
    :inviteQrDataUrl
      ?`<img class="room-lobby-qr" src="${inviteQrDataUrl}" alt="${t('roomInviteQr')}"/>`
      :`<div class="room-lobby-qr-placeholder">${t('roomInviteEmpty')}</div>`;
  const inviteQrNote=inviteQrError?`<div class="hint room-error">${esc(inviteQrError)}</div>`:'';
  const roomLobbyTitle=String(t('roomLobbyCodeTitle'));
  const roomLobbySubtitle=String(t('roomLobbyCodeSubtitle'));
  const roomCopyButtonLabel=String(t('roomCopyCodeBtn'));
  const roomQrCaption=String(t('roomInviteQrCaption'));

  return`<div class="room-overlay"><div class="room-card room-lobby-card room-card-icon"><div class="room-head room-lobby-head"><div class="room-lobby-head-title"><span class="room-corner-icon room-corner-icon-reception" aria-hidden="true">${roomLobbyIconHtml}</span><h3>${roomTitle}</h3></div><div class="room-expiry-row room-expiry-top"><span class="room-expiry-label"><i class="fa-solid fa-clock room-expiry-icon" aria-hidden="true"></i><span>${t('roomCountdown')}</span></span><button type="button" class="room-expiry-reset-btn" data-room-expiry-reset="1"><strong data-room-countdown-value>${esc(roomLobbyCountdown)}</strong></button></div></div><div class="room-id-center room-id-center-with-qr"><div class="room-lobby-main"><div class="room-lobby-copy-block"><div class="room-lobby-copy-title">${roomLobbyTitle}</div><strong class="room-code">${esc(roomCode)}</strong><p class="room-lobby-copy-subtitle">${roomLobbySubtitle}</p></div><div class="room-share-box"><button id="room-copy" type="button" class="secondary room-share-copy-btn" aria-label="${roomCodeCopyLabel}"><i class="fa-solid fa-copy room-share-link-icon" aria-hidden="true"></i><span>${roomCopyButtonLabel}</span></button><button id="room-share-send" type="button" class="primary room-share-link-btn room-share-action-btn"><i class="fa-solid fa-link room-share-link-icon" aria-hidden="true"></i><span>${t('roomShareLink')}</span></button></div>${inviteQrNote}</div><div class="room-id-divider" aria-hidden="true"></div><button id="room-copy-qr" type="button" class="room-lobby-qr-box" aria-label="${t('roomInviteQr')}"><div class="room-lobby-qr-box-inner">${qrHtml}<div class="room-lobby-qr-caption">${roomQrCaption}</div></div></button></div>${roomPrivacyRow}<div class="lobby-table">${roomSeats}</div><div class="room-actions">${roomStartControl}${roomPendingHint}<button id="room-leave" class="secondary" ${roomStarting?'disabled':''}>${t('roomLeave')}</button></div></div></div>`;
}

export function renderRoomJoinOverlay(params){
  const {
    visible,
    activeRooms,
    activeRoomsLoading,
    hiddenCount,
    roomErrorHtml,
    roomCodeValue,
    t,
    esc,
    isRoomPlayerHuman,
    authPictureUrlFrom,
    avatarDataUri
  }=params;
  if(!visible)return'';

  const cards=activeRooms.length
    ?activeRooms.map((room)=>renderRoomActiveCardHtml({
        room,
        t,
        esc,
        isRoomPlayerHuman,
        authPictureUrlFrom,
        avatarDataUri
      })).join('')
    :'';
  const empty=activeRooms.length
    ?''
    :`<div class="room-active-card room-active-empty" aria-disabled="true"><div class="room-active-code">${t('roomActiveEmpty')}</div></div>`;
  const hiddenNote=hiddenCount?`<span class="room-active-hidden">${t('roomActiveHidden')}: ${hiddenCount}</span>`:'';
  const createRoomSection=`<div class="room-create-section">${renderRoomCreateCardHtml({t})}</div>`;
  const activeRoomsBlock=`<div class="room-active-block"><div class="room-active-head"><span>${t('roomActiveList')}</span>${hiddenNote}<button id="room-active-refresh" class="secondary room-icon-btn"><span class="room-inline-icon room-active-refresh-icon" aria-hidden="true"></span><span class="room-active-refresh-label">${t('roomActiveRefresh')}</span></button></div><div class="room-active-grid">${cards}${empty}</div></div>`;
  const roomCodeValueSafe=String(roomCodeValue||'').toUpperCase().slice(0,6);
  const roomCodeBoxes=Array.from({length:6},(_,i)=>{
    const ch=roomCodeValueSafe[i]||'';
    const filled=Boolean(ch);
    return`<span class="room-code-box ${filled?'filled':''}" data-room-code-box="${i}">${filled?esc(ch):''}</span>`;
  }).join('');
  return`<div class="room-overlay"><div class="room-card room-join-card room-card-icon"><div class="room-head"><span class="room-corner-icon room-corner-icon-reception" aria-hidden="true">${roomJoinIconHtml}</span><h3>${t('roomLobby')}</h3></div><div class="field room-code-field"><div class="room-code-field-head"><span>${t('roomEnterCode')}</span><button id="room-paste-code" type="button" class="secondary room-icon-btn room-paste-btn" aria-label="Paste">${roomPasteIconHtml}</button></div><div class="room-code-row room-code-row-segmented"><div class="room-code-segments" data-room-code-focus="1">${roomCodeBoxes}</div><input id="room-code-input" class="room-input room-code-input-overlay" maxlength="6" value="${esc(roomCodeValueSafe)}" placeholder="${t('roomCodeExample')}" autocapitalize="characters" spellcheck="false" inputmode="text" autocomplete="one-time-code"/><button id="room-join-confirm" class="secondary room-icon-btn room-join-top-btn"><svg class="room-inline-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M10 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 10c4.418 0 8 1.79 8 4v1H2v-1c0-2.21 3.582-4 8-4m10-8h-2V6h-2v2h-2v2h2v2h2v-2h2z"/></svg><span>${t('roomJoin')}</span></button></div><div class="room-code-extra"><div class="room-join-divider" aria-hidden="true"><span>${t('roomOr')}</span></div>${createRoomSection}</div></div>${activeRoomsBlock}${roomErrorHtml}<div class="room-actions"><button id="room-join-cancel" class="secondary room-icon-btn"><span>${t('home')}</span></button></div></div></div>`;
}
