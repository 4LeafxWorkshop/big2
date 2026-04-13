export function buildOpponentNamecardHtml(params){
  const {
    isBot,
    opponentName,
    t,
    esc
  }=params;
  return isBot?`<button type="button" class="seat-namecard" data-opponent-name="${esc(opponentName)}" aria-label="${esc(t('profile'))}">🪪</button>`:'';
}
