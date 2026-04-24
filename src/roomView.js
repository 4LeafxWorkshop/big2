import {renderRoomActiveCardHtml, renderRoomCreateCardHtml} from './roomLobbyCard.js';

const roomLobbyIconHtml=`<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M12 3 4 9.8V20a1 1 0 0 0 1 1h5.5v-5.2h3V21H19a1 1 0 0 0 1-1V9.8L12 3Z" fill="currentColor"/><path d="M10.7 7.7h2.6L12 6.6l-1.3 1.1Z" fill="#fff" opacity=".95"/><path d="M11 16.8h2V21h-2z" fill="#fff" opacity=".92"/></svg>`;

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
  const roomCodeCopyLabel=String(t('roomCodeClickCopy'));
  const roomCodeCopyLabelOpen=roomCodeCopyLabel.replace(/[）)]$/,'');
  const roomCodeCopyLabelClose=roomCodeCopyLabel.endsWith('）')?'）':roomCodeCopyLabel.endsWith(')')?')':'';
  return`<div class="room-overlay"><div class="room-card room-lobby-card room-card-icon"><div class="room-head room-lobby-head"><div class="room-lobby-head-title"><span class="room-corner-icon room-corner-icon-reception" aria-hidden="true">${roomLobbyIconHtml}</span><h3>${roomTitle}</h3></div><div class="room-expiry-row room-expiry-top"><span class="room-expiry-label"><i class="fa-solid fa-clock room-expiry-icon" aria-hidden="true"></i><span>${t('roomCountdown')}</span></span><button type="button" class="room-expiry-reset-btn" data-room-expiry-reset="1"><strong data-room-countdown-value>${esc(roomLobbyCountdown)}</strong></button></div></div><div class="room-id-center"><button id="room-copy" type="button" class="room-code-copy" aria-label="${roomCodeCopyLabel}"><span class="room-code-copy-label"><span>${esc(roomCodeCopyLabelOpen)}</span><i class="fa-solid fa-copy room-code-copy-icon" aria-hidden="true"></i><span>${esc(roomCodeCopyLabelClose)}</span></span><strong class="room-code">${esc(roomCode)}</strong></button><button id="room-share-invite" type="button" class="secondary room-icon-btn room-share-link-btn"><i class="fa-solid fa-share-nodes room-share-icon" aria-hidden="true"></i><span>${t('roomShareLink')}</span></button></div>${roomPrivacyRow}<div class="lobby-table">${roomSeats}</div>${roomErrorHtml}<div class="room-actions">${roomStartControl}${roomPendingHint}<button id="room-leave" class="secondary" ${roomStarting?'disabled':''}>${t('roomLeave')}</button></div></div></div>`;
}

export function renderRoomInviteOverlay(params){
  const {visible,invitePanelHtml=''}=params;
  if(!visible)return'';
  return`<div class="room-overlay room-invite-overlay"><div id="room-invite-backdrop" class="room-backdrop"></div><div class="room-card room-invite-card room-card-icon">${invitePanelHtml}</div></div>`;
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
  return`<div class="room-overlay"><div class="room-card room-join-card room-card-icon"><div class="room-head"><span class="room-corner-icon room-corner-icon-reception" aria-hidden="true">${roomLobbyIconHtml}</span><h3>${t('roomLobby')}</h3></div><label class="field"><span>${t('roomEnterCode')}</span><div class="room-code-row"><input id="room-code-input" class="room-input" maxlength="8" value="${esc(roomCodeValue||'')}" placeholder="${t('roomCodeExample')}" autocapitalize="characters" spellcheck="false" inputmode="latin"/><button id="room-join-confirm" class="secondary room-icon-btn room-join-top-btn"><svg class="room-inline-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M10 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 10c4.418 0 8 1.79 8 4v1H2v-1c0-2.21 3.582-4 8-4m10-8h-2V6h-2v2h-2v2h2v2h2v-2h2z"/></svg><span>${t('roomJoin')}</span></button></div></label><div class="room-join-divider" aria-hidden="true"><span>${t('roomOr')}</span></div>${createRoomSection}${activeRoomsBlock}${roomErrorHtml}<div class="room-actions"><button id="room-join-cancel" class="secondary room-icon-btn"><span>${t('home')}</span></button></div></div></div>`;
}
