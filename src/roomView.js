import {renderRoomActiveCardHtml, renderRoomCreateCardHtml} from './roomLobbyCard.js';

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
  return`<div class="room-overlay"><div class="room-card room-lobby-card room-card-icon"><div class="room-head room-lobby-head"><div class="room-lobby-head-title"><span class="room-corner-icon room-corner-icon-reception" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><rect x="5.2" y="4.8" width="13.6" height="14.4" rx="2.1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 8.1h6.2M9 11.2h6.2M9 14.3h6.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M6.9 7.1h1.1v1.1H6.9zM6.9 10.2h1.1v1.1H6.9zM6.9 13.3h1.1v1.1H6.9zM16.1 7.1h1.1v1.1h-1.1zM16.1 10.2h1.1v1.1h-1.1zM16.1 13.3h1.1v1.1h-1.1z" fill="currentColor"/></svg></span><h3>${roomTitle}</h3></div><div class="room-expiry-row room-expiry-top"><span>${t('roomCountdown')}</span><button type="button" class="room-expiry-reset-btn" data-room-expiry-reset="1"><strong data-room-countdown-value>${esc(roomLobbyCountdown)}</strong></button></div></div><div class="room-id-center"><button id="room-copy" type="button" class="room-code-copy" aria-label="${t('roomCodeClickCopy')}"><span class="room-code-copy-label">${t('roomCodeClickCopy')}</span><strong class="room-code">${esc(roomCode)}</strong></button><button id="room-share-invite" type="button" class="secondary room-icon-btn room-share-link-btn"><svg class="room-inline-icon room-share-icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.8" fill="currentColor"/><circle cx="18" cy="6" r="1.8" fill="currentColor"/><circle cx="18" cy="18" r="1.8" fill="currentColor"/><path d="M7.9 11.2L16 7.2M7.9 12.8L16 16.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg><span>${t('roomShareLink')}</span></button></div>${roomPrivacyRow}<div class="lobby-table">${roomSeats}</div>${roomErrorHtml}<div class="room-actions">${roomStartControl}${roomPendingHint}<button id="room-leave" class="secondary" ${roomStarting?'disabled':''}>${t('roomLeave')}</button></div></div></div>`;
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
  const activeRoomsBlock=`<div class="room-active-block"><div class="room-create-section">${renderRoomCreateCardHtml({t})}</div><div class="room-active-head"><span>${t('roomActiveList')}</span>${hiddenNote}<button id="room-active-refresh" class="secondary room-icon-btn"><span class="room-inline-icon room-active-refresh-icon" aria-hidden="true"></span><span class="room-active-refresh-label">${t('roomActiveRefresh')}</span></button></div><div class="room-active-grid">${cards}${empty}</div></div>`;
  return`<div class="room-overlay"><div class="room-card room-join-card room-card-icon"><div class="room-head"><span class="room-corner-icon room-corner-icon-reception" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><rect x="5.2" y="4.8" width="13.6" height="14.4" rx="2.1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 8.1h6.2M9 11.2h6.2M9 14.3h6.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M6.9 7.1h1.1v1.1H6.9zM6.9 10.2h1.1v1.1H6.9zM6.9 13.3h1.1v1.1H6.9zM16.1 7.1h1.1v1.1h-1.1zM16.1 10.2h1.1v1.1h-1.1zM16.1 13.3h1.1v1.1h-1.1z" fill="currentColor"/></svg></span><h3>${t('roomLobby')}</h3></div><label class="field"><span>${t('roomCode')}</span><div class="room-code-row"><input id="room-code-input" class="room-input" maxlength="8" value="${esc(roomCodeValue||'')}" placeholder="${t('roomCodeExample')}"/><button id="room-join-confirm" class="secondary room-icon-btn room-join-top-btn"><svg class="room-inline-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M10 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0 10c4.418 0 8 1.79 8 4v1H2v-1c0-2.21 3.582-4 8-4m10-8h-2V6h-2v2h-2v2h2v2h2v-2h2z"/></svg><span>${t('roomJoin')}</span></button></div></label>${activeRoomsBlock}${roomErrorHtml}<div class="room-actions"><button id="room-join-cancel" class="secondary room-icon-btn"><span>${t('home')}</span></button></div></div></div>`;
}
