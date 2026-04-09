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

export function renderConfigMarkup(params){
  const {
    diffIndex,
    renderLangMenu,
    state,
    t,
    soundEnabled,
    calloutDisplayEnabled,
    emoteDisplayEnabled,
    renderBackCarousel
  }=params;

  return `<section class="home-wrap"><header class="topbar home-topbar"><div><h2>${t('config')}</h2></div><div class="topbar-right"><div class="control-row"><button id="config-back" class="secondary">${t('home')}</button>${renderLangMenu('config-lang-menu')}</div></div></header><section class="home-panel"><div class="field-grid config-audio-voice-row"><label class="field"><span>${t('ai')}</span><div class="option-combo toggle-combo difficulty-combo" id="config-difficulty-combo" style="--difficulty-index:${diffIndex};"><div class="difficulty-pill" aria-hidden="true"></div><button class="combo-btn toggle-btn ${state.home.aiDifficulty==='easy'?'active':''}" data-value="easy">${t('easy')}</button><button class="combo-btn toggle-btn ${state.home.aiDifficulty==='normal'?'active':''}" data-value="normal">${t('normal')}</button><button class="combo-btn toggle-btn ${state.home.aiDifficulty==='hard'?'active':''}" data-value="hard">${t('hard')}</button></div></label><label class="field"><span>${t('cardBack')}</span>${renderBackCarousel('config-back-combo')}</label><label class="field"><span>${t('audioVoice')}</span><div class="option-combo toggle-combo" id="config-sound-combo"><button class="combo-btn toggle-btn sound-toggle-btn ${soundEnabled?'active':''}" data-value="on" aria-label="${t('soundOn')}"><svg class="sound-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3l4 3V7l-4 3H4z"></path><path d="M15 9c1.6 1.2 1.6 4.8 0 6"></path><path d="M17.5 7c2.8 2.4 2.8 7.6 0 10"></path></svg></button><button class="combo-btn toggle-btn sound-toggle-btn ${soundEnabled?'':'active'}" data-value="off" aria-label="${t('soundOff')}"><svg class="sound-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3l4 3V7l-4 3H4z"></path><path d="M16 8l4 8"></path><path d="M20 8l-4 8"></path></svg></button></div></label><label class="field"><span>${t('calloutDisplay')}</span><div class="option-combo toggle-combo" id="config-callout-display-combo"><button class="combo-btn toggle-btn ${calloutDisplayEnabled?'active':''}" data-value="on">${t('calloutDisplayOn')}</button><button class="combo-btn toggle-btn ${calloutDisplayEnabled?'':'active'}" data-value="off">${t('calloutDisplayOff')}</button></div></label><label class="field"><span>${t('emoteDisplay')}</span><div class="option-combo toggle-combo" id="config-emote-display-combo"><button class="combo-btn toggle-btn ${emoteDisplayEnabled?'active':''}" data-value="on">${t('calloutDisplayOn')}</button><button class="combo-btn toggle-btn ${emoteDisplayEnabled?'':'active'}" data-value="off">${t('calloutDisplayOff')}</button></div></label></div></section></section>`;
}

export function renderOpponentCard(params){
  const {
    link,
    name,
    genderClass,
    genderIcon,
    genderLabel,
    zodiacLabel,
    zodiacMark,
    zodiacText,
    dobLabel,
    dob,
    hobbiesLabel,
    hobbyText,
    mottoText,
    profileLabel,
    profileHtml,
    esc
  }=params;
  return`<article class="opponent-card">
    <div class="opponent-head">
      <img class="opponent-avatar" src="${link}" alt="${esc(name)}"/>
      <div class="opponent-meta">
        <div class="opponent-name">${esc(name)}</div>
        <div class="opponent-sub"><span class="opponent-gender-symbol ${genderClass}" data-symbol="${genderIcon}" aria-label="${esc(genderLabel)}" title="${esc(genderLabel)}">${genderIcon}</span></div>
      </div>
    </div>
    <div class="opponent-info-row">
      <div class="opponent-info-item"><span class="opponent-chip-icon zodiac" aria-hidden="true"></span><span class="opponent-info-label">${zodiacLabel}</span><span class="opponent-info-value">${zodiacMark?`${zodiacMark} `:''}${esc(zodiacText)}</span></div>
      <div class="opponent-info-item"><span class="opponent-chip-icon dob" aria-hidden="true"></span><span class="opponent-info-label">${dobLabel}</span><span class="opponent-info-value">${esc(dob)}</span></div>
      <div class="opponent-info-item opponent-info-hobbies"><span class="opponent-chip-icon hobby" aria-hidden="true"></span><span class="opponent-info-label">${hobbiesLabel}</span><span class="opponent-info-value">${esc(hobbyText)}</span></div>
    </div>
    <div class="opponent-motto"><span class="opponent-chip-icon motto" aria-hidden="true"></span><div class="opponent-motto-text">${esc(mottoText)}</div></div>
    <div class="opponent-bio opponent-bio-block">
      <div class="opponent-profile-summary"><strong>${profileLabel}</strong></div>
      <div class="opponent-profile-paragraphs">${profileHtml}</div>
    </div>
  </article>`;
}

export function renderOpponentsMarkup(params){
  const {
    heading,
    homeLabel,
    renderLangMenu,
    cardsHtml
  }=params;
  return`<section class="home-wrap opponent-wrap"><header class="topbar home-topbar"><div><h2>${heading}</h2></div><div class="topbar-right"><div class="control-row"><button id="opponents-back" class="secondary">${homeLabel}</button>${renderLangMenu('opponents-lang-menu')}</div></div></header><section class="home-panel opponent-panel"><div class="opponent-grid">${cardsHtml}</div></section></section>`;
}
