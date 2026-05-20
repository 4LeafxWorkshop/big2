export function buildOpponentNamecardHtml(params){
  const {
    isBot,
    isHuman,
    opponentName,
    t,
    esc
  }=params;
  if(isBot){
    return `<button type="button" class="seat-namecard" data-opponent-name="${esc(opponentName)}" data-opponent-profile-kind="profile" aria-label="${esc(t('profile'))}"><span class="seat-namecard-emoji" aria-hidden="true">🪪</span></button>`;
  }
  if(isHuman){
    return `<button type="button" class="seat-starcard" data-opponent-name="${esc(opponentName)}" data-opponent-profile-kind="chart" aria-label="${esc(t('starChart'))}"><svg viewBox="0 0 28 20" focusable="false" aria-hidden="true"><rect x="2.4" y="2.2" width="23.2" height="15.6" rx="2.4" fill="#f6f0ef"/><rect x="5.1" y="10.2" width="4.2" height="5.2" rx="1" fill="#ef6c5b"/><rect x="10.7" y="5.2" width="4.6" height="10.2" rx="1" fill="#fa7b32"/><rect x="16.7" y="7.3" width="4.6" height="8.1" rx="1" fill="#f8b340"/><rect x="21.2" y="4.2" width="1.8" height="1.8" rx=".5" fill="#f8b340"/><rect x="22.8" y="3.4" width="1.2" height="1.2" rx=".4" fill="#f8b340"/><rect x="5.1" y="16.1" width="17.9" height=".9" rx=".45" fill="#ffcf8a"/></svg></button>`;
  }
  return '';
}
