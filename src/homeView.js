export function renderHomeMarkup(params){
  const {
    intro,
    allowOpponents,
    renderLangMenu,
    withBase,
    homeAvatarSrc,
    esc,
    state,
    t,
    aiFieldLeft,
    cardBackLeft,
    aiFieldRight,
    soundEnabled,
    calloutDisplayEnabled,
    emoteDisplayEnabled,
    cardBackRight,
    soloBtnHtml,
    roomButtonsHtml,
    mainPageLegalMiniHtml,
    roomLobbyHtml,
    roomJoinModal,
    introPanelHtml,
    leaderboardModalHtml,
    scoreGuideModalHtml
  }=params;

  return`<section class="home-wrap royal-home-wrap"><section class="home-panel royal-home-panel"><header class="royal-home-head"><div class="royal-head-actions"><button id="home-intro-toggle" class="secondary">${esc(intro.btnShow)}</button><button id="home-score-guide-toggle" class="secondary">${t('scoreGuide')}</button><button id="home-lb-toggle" class="secondary">${t('lb')}</button>${allowOpponents?`<button id="home-opponents-toggle" class="secondary">${t('opponents')}</button>`:''}${renderLangMenu('home-lang-menu')}</div><div class="royal-title-wrap"><div class="home-logo-block"><img class="title-logo title-logo-home" src="${withBase('title-lockup-home.png')}" alt="鋤大D TRADITIONAL BIG TWO"/></div></div></header><section class="royal-home-body"><div class="home-form-grid"><div class="home-form-col home-form-left home-section"><h3 class="home-section-title"><span class="title-icon title-icon-player" aria-hidden="true"></span>${t('playerSettings')}</h3><div class="home-profile-card"><div class="home-profile-avatar"><img id="home-avatar-img" src="${homeAvatarSrc}" alt="${esc(state.home.name||t('name'))}"/></div><div class="home-profile-fields"><label class="field field-compact"><span>${t('name')}</span><div class="name-with-google"><input id="name-input" value="${esc(state.home.name)}" maxlength="18"/><div id="google-name-inline"></div></div></label><label class="field field-compact"><div class="option-combo toggle-combo" id="gender-combo"><button class="combo-btn toggle-btn ${state.home.avatarChoice==='male'?'active':''}" data-value="male">${t('male')}</button><button class="combo-btn toggle-btn ${state.home.avatarChoice==='female'?'active':''}" data-value="female">${t('female')}</button></div></label></div></div>${aiFieldLeft}${cardBackLeft}</div><div class="home-form-col home-form-right home-section"><h3 class="home-section-title"><span class="title-icon title-icon-settings" aria-hidden="true"></span>${t('systemSettings')}</h3>${aiFieldRight}<label class="field field-sound"><span>${t('audioVoice')}</span><div class="option-combo toggle-combo" id="sound-combo"><button class="combo-btn toggle-btn sound-toggle-btn ${soundEnabled?'active':''}" data-value="on" aria-label="${t('soundOn')}"><svg class="sound-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3l4 3V7l-4 3H4z"></path><path d="M15 9c1.6 1.2 1.6 4.8 0 6"></path><path d="M17.5 7c2.8 2.4 2.8 7.6 0 10"></path></svg></button><button class="combo-btn toggle-btn sound-toggle-btn ${soundEnabled?'':'active'}" data-value="off" aria-label="${t('soundOff')}"><svg class="sound-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3l4 3V7l-4 3H4z"></path><path d="M16 8l4 8"></path><path d="M20 8l-4 8"></path></svg></button></div></label><label class="field field-callout"><span>${t('calloutDisplay')}</span><div class="option-combo toggle-combo" id="callout-display-combo"><button class="combo-btn toggle-btn ${calloutDisplayEnabled?'active':''}" data-value="on">${t('calloutDisplayOn')}</button><button class="combo-btn toggle-btn ${calloutDisplayEnabled?'':'active'}" data-value="off">${t('calloutDisplayOff')}</button></div></label><label class="field field-emote"><span>${t('emoteDisplay')}</span><div class="option-combo toggle-combo" id="emote-display-combo"><button class="combo-btn toggle-btn ${emoteDisplayEnabled?'active':''}" data-value="on">${t('calloutDisplayOn')}</button><button class="combo-btn toggle-btn ${emoteDisplayEnabled?'':'active'}" data-value="off">${t('calloutDisplayOff')}</button></div></label>${cardBackRight}</div></div><div class="action-row home-start-row">${soloBtnHtml}${roomButtonsHtml}</div></section></section>${mainPageLegalMiniHtml}${roomLobbyHtml}${roomJoinModal}${state.home.showIntro?introPanelHtml:''}${state.home.showLeaderboard?leaderboardModalHtml:''}${state.showScoreGuide?scoreGuideModalHtml:''}</section>`;
}
