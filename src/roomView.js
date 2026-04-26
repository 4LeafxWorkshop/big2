import {renderRoomActiveCardHtml, renderRoomCreateCardHtml} from './roomLobbyCard.js';

const roomLobbyIconHtml=`<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M12 3 4 9.8V20a1 1 0 0 0 1 1h5.5v-5.2h3V21H19a1 1 0 0 0 1-1V9.8L12 3Z" fill="currentColor"/><path d="M10.7 7.7h2.6L12 6.6l-1.3 1.1Z" fill="#fff" opacity=".95"/><path d="M11 16.8h2V21h-2z" fill="#fff" opacity=".92"/></svg>`;

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
    return`<span class="room-code-box ${filled?'filled':''}">${filled?esc(ch):''}</span>`;
  }).join('');
  return`<div class="room-overlay"><div class="room-card room-join-card room-card-icon"><div class="room-head"><span class="room-corner-icon room-corner-icon-reception" aria-hidden="true">${roomLobbyIconHtml}</span><h3>${t('roomLobby')}</h3></div><div class="field room-code-field"><span>${t('roomEnterCode')}</span><div class="room-code-row room-code-row-segmented"><div class="room-code-segments" aria-hidden="true">${roomCodeBoxes}</div><input id="room-code-input" class="room-input room-code-input-overlay" maxlength="6" value="${esc(roomCodeValueSafe)}" placeholder="${t('roomCodeExample')}" autocapitalize="characters" spellcheck="false" inputmode="latin"/><button id="room-join-confirm" class="secondary room-icon-btn room-join-top-btn"><svg class="room-inline-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M10 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 10c4.418 0 8 1.79 8 4v1H2v-1c0-2.21 3.582-4 8-4m10-8h-2V6h-2v2h-2v2h2v2h2v-2h2z"/></svg><span>${t('roomJoin')}</span></button></div><div class="room-code-extra"><div class="room-join-divider" aria-hidden="true"><span>${t('roomOr')}</span></div>${createRoomSection}</div></div>${activeRoomsBlock}${roomErrorHtml}<div class="room-actions"><button id="room-join-cancel" class="secondary room-icon-btn"><span>${t('home')}</span></button></div></div></div>`;
}
