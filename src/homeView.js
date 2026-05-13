import {renderGenderIconSvg} from './genderIcon.js';

function binarySliderHtml({id,value,onLabel,offLabel,ariaLabel}){
  const index=value?1:0;
  return `<div class="setting-slider-wrap" id="${id}" style="--setting-index:${index};"><input class="setting-slider" type="range" min="0" max="1" step="1" value="${index}" aria-label="${ariaLabel}"><div class="setting-slider-labels" aria-hidden="true"><span>${offLabel}</span><span>${onLabel}</span></div></div>`;
}

export function renderHomeTopActionsHtml(params){
  const {
    intro,
    allowOpponents,
    renderLangMenu,
    esc,
    t
  }=params;
  return`<div class="royal-head-actions"><button id="home-intro-toggle" class="secondary">${esc(intro.btnShow)}</button><button id="home-score-guide-toggle" class="secondary">${t('scoreGuide')}</button><button id="home-lb-toggle" class="secondary">${t('lb')}</button>${allowOpponents?`<button id="home-opponents-toggle" class="secondary">${t('opponents')}</button>`:''}${renderLangMenu('home-lang-menu')}</div>`;
}

export function renderHomeProfileCardHtml(params){
  const {
    homeAvatarSrc,
    esc,
    state,
    t,
    aiFieldLeft,
    cardBackLeft
  }=params;
  return`<div class="home-form-col home-form-left home-section"><h3 class="home-section-title"><span class="title-icon title-icon-player" aria-hidden="true"></span>${t('playerSettings')}</h3><div class="home-profile-card"><div class="home-profile-avatar"><img id="home-avatar-img" src="${homeAvatarSrc}" alt="${esc(state.home.name||t('name'))}"/></div><div class="home-profile-fields"><label class="field field-compact"><span>${t('name')}</span><div class="name-with-google"><input id="name-input" value="${esc(state.home.name)}" maxlength="18"/><div id="google-name-inline"></div></div></label><label class="field field-compact"><div class="option-combo toggle-combo" id="gender-combo"><button class="combo-btn toggle-btn ${state.home.avatarChoice==='male'?'active':''}" data-value="male">${t('male')}</button><button class="combo-btn toggle-btn ${state.home.avatarChoice==='female'?'active':''}" data-value="female">${t('female')}</button></div></label></div></div>${aiFieldLeft}${cardBackLeft}</div>`;
}

export function renderHomeSettingsCardHtml(params){
  const {
    t,
    aiFieldRight,
    soundEnabled,
    calloutDisplayEnabled,
    emoteDisplayEnabled,
    gestureHelpEnabled,
    vibrateEnabled,
    moreSettingsOpen
  }=params;
  return`<div class="home-form-col home-form-right home-section"><h3 class="home-section-title"><span class="title-icon title-icon-settings" aria-hidden="true"></span>${t('systemSettings')}</h3>${aiFieldRight}<label class="field field-sound"><span>${t('audioVoice')}</span>${binarySliderHtml({id:'sound-slider',value:soundEnabled,onLabel:t('soundOn'),offLabel:t('soundOff'),ariaLabel:t('audioVoice')})}</label>${moreSettingsOpen?'':`<button id="home-more-settings-toggle" class="home-more-settings-toggle" type="button" aria-expanded="false"><span class="more-settings-icon more-settings-icon-down" aria-hidden="true"></span><span>${t('moreSettings')}</span></button>`}</div>`;
}

export function renderHomeMoreSettingsCardHtml(params){
  const {
    t,
    calloutDisplayEnabled,
    emoteDisplayEnabled,
    gestureHelpEnabled,
    vibrateEnabled,
    moreSettingsOpen
  }=params;
  return`<div class="home-form-col home-form-more home-section">${moreSettingsOpen?`<button id="home-more-settings-toggle" class="home-more-settings-toggle" type="button" aria-expanded="true"><span class="more-settings-icon more-settings-icon-up" aria-hidden="true"></span><span>${t('moreSettings')}</span></button>`:''}<div id="home-more-settings-panel" class="more-settings-panel" ${moreSettingsOpen?'':'hidden'}><label class="field field-gesture-help"><span>${t('gestureHelp')}</span>${binarySliderHtml({id:'gesture-help-slider',value:gestureHelpEnabled,onLabel:t('calloutDisplayOn'),offLabel:t('calloutDisplayOff'),ariaLabel:t('gestureHelp')})}</label><label class="field field-callout"><span>${t('calloutDisplay')}</span>${binarySliderHtml({id:'callout-display-slider',value:calloutDisplayEnabled,onLabel:t('calloutDisplayOn'),offLabel:t('calloutDisplayOff'),ariaLabel:t('calloutDisplay')})}</label><label class="field field-emote"><span>${t('emoteDisplay')}</span>${binarySliderHtml({id:'emote-display-slider',value:emoteDisplayEnabled,onLabel:t('calloutDisplayOn'),offLabel:t('calloutDisplayOff'),ariaLabel:t('emoteDisplay')})}</label><label class="field field-vibrate"><span>${t('vibrate')}</span>${binarySliderHtml({id:'vibrate-slider',value:vibrateEnabled,onLabel:t('soundOn'),offLabel:t('soundOff'),ariaLabel:t('vibrate')})}</label></div></div>`;
}

export function renderHomeActionRowHtml(params){
  const {
    soloBtnHtml,
    roomButtonsHtml
  }=params;
  return`<div class="action-row home-start-row">${soloBtnHtml}${roomButtonsHtml}</div>`;
}

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
    gestureHelpEnabled,
    vibrateEnabled,
    moreSettingsOpen,
    soloBtnHtml,
    roomButtonsHtml,
    mainPageLegalMiniHtml,
    roomLobbyHtml,
    roomJoinModal,
    introPanelHtml,
    leaderboardModalHtml,
    scoreGuideModalHtml,
    buildVersionLabel=''
  }=params;
  const versionHtml=buildVersionLabel?`<div class="home-build-version">${esc(buildVersionLabel)}</div>`:'';
  const moreSettingsClass=moreSettingsOpen?' home-more-settings-open':'';

  return`<section class="home-wrap royal-home-wrap${moreSettingsClass}"><section class="home-panel royal-home-panel"><header class="royal-home-head">${renderHomeTopActionsHtml({intro,allowOpponents,renderLangMenu,esc,t})}<div class="royal-title-wrap"><div class="home-logo-block"><img class="title-logo title-logo-home" src="${withBase('title-lockup-home.png')}" alt="鋤大D TRADITIONAL BIG TWO"/></div></div></header><section class="royal-home-body${moreSettingsClass}"><div class="home-form-grid">${renderHomeProfileCardHtml({homeAvatarSrc,esc,state,t,aiFieldLeft,cardBackLeft})}${renderHomeSettingsCardHtml({t,aiFieldRight,soundEnabled,calloutDisplayEnabled,emoteDisplayEnabled,gestureHelpEnabled,vibrateEnabled,moreSettingsOpen})}${renderHomeMoreSettingsCardHtml({t,calloutDisplayEnabled,emoteDisplayEnabled,gestureHelpEnabled,vibrateEnabled,moreSettingsOpen})}</div>${renderHomeActionRowHtml({soloBtnHtml,roomButtonsHtml})}</section></section>${mainPageLegalMiniHtml}${versionHtml}${roomLobbyHtml}${roomJoinModal}${state.home.showIntro?introPanelHtml:''}${state.home.showLeaderboard?leaderboardModalHtml:''}${state.showScoreGuide?scoreGuideModalHtml:''}</section>`;
}

export function renderConfigMarkup(params){
  const {
    diffIndex,
    renderLangMenu,
    t,
    soundEnabled,
    calloutDisplayEnabled,
    emoteDisplayEnabled,
    renderBackCarousel
  }=params;

  return `<section class="home-wrap"><header class="topbar home-topbar"><div><h2>${t('config')}</h2></div><div class="topbar-right"><div class="control-row"><button id="config-back" class="secondary">${t('home')}</button>${renderLangMenu('config-lang-menu')}</div></div></header><section class="home-panel"><div class="field-grid config-audio-voice-row"><label class="field"><span>${t('ai')}</span><div class="difficulty-slider-wrap" id="config-difficulty-slider" style="--difficulty-index:${diffIndex};"><input class="difficulty-slider" type="range" min="0" max="2" step="1" value="${diffIndex}" aria-label="${t('ai')}"><div class="difficulty-slider-labels" aria-hidden="true"><span>${t('easy')}</span><span>${t('normal')}</span><span>${t('hard')}</span></div></div></label><label class="field"><span>${t('cardBack')}</span>${renderBackCarousel('config-back-combo')}</label><label class="field"><span>${t('audioVoice')}</span>${binarySliderHtml({id:'config-sound-slider',value:soundEnabled,onLabel:t('soundOn'),offLabel:t('soundOff'),ariaLabel:t('audioVoice')})}</label><label class="field"><span>${t('calloutDisplay')}</span>${binarySliderHtml({id:'config-callout-display-slider',value:calloutDisplayEnabled,onLabel:t('calloutDisplayOn'),offLabel:t('calloutDisplayOff'),ariaLabel:t('calloutDisplay')})}</label><label class="field"><span>${t('emoteDisplay')}</span>${binarySliderHtml({id:'config-emote-display-slider',value:emoteDisplayEnabled,onLabel:t('calloutDisplayOn'),offLabel:t('calloutDisplayOff'),ariaLabel:t('emoteDisplay')})}</label></div></section></section>`;
}

export function renderOpponentCard(params){
  const {
    link,
    name,
    genderClass,
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
        <div class="opponent-sub"><span class="opponent-gender-symbol ${genderClass}" aria-label="${esc(genderLabel)}" title="${esc(genderLabel)}">${renderGenderIconSvg(genderClass)}</span></div>
      </div>
    </div>
    <div class="opponent-info-row">
      <div class="opponent-info-item"><span class="opponent-chip-icon zodiac" aria-hidden="true"></span><span class="opponent-info-label">${zodiacLabel}</span><span class="opponent-info-value">${zodiacMark?`${zodiacMark} `:''}${esc(zodiacText)}</span></div>
      <div class="opponent-info-item"><span class="opponent-chip-icon dob" aria-hidden="true"></span><span class="opponent-info-label">${dobLabel}</span><span class="opponent-info-value">${esc(dob)}</span></div>
      <div class="opponent-info-item opponent-info-hobbies"><span class="opponent-chip-icon hobby" aria-hidden="true"></span><span class="opponent-info-label">${hobbiesLabel}</span><span class="opponent-info-value">${esc(hobbyText)}</span></div>
    </div>
    <div class="opponent-motto"><span class="opponent-chip-icon motto" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M6.5 5.5h11A3.5 3.5 0 0 1 21 9v4a3.5 3.5 0 0 1-3.5 3.5H9.4l-3.8 3.2V16H6.5A3.5 3.5 0 0 1 3 13V9a3.5 3.5 0 0 1 3.5-3.5Z"/><path d="M8 10h8M8 13h5"/></svg></span><div class="opponent-motto-text">${esc(mottoText)}</div></div>
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
