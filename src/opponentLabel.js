export function renderOpponentIdentityHtml(params){
  const {
    playerName,
    playerScore,
    roundWinsHtml,
    namecardBtn,
    esc
  }=params;
  return`<span class="seat-identity"><span class="seat-name-text">${esc(playerName)}</span><span class="seat-subline"><span>${playerScore}</span>${roundWinsHtml}</span>${namecardBtn}</span>`;
}

export function renderOpponentMottoHtml(params){
  const {
    pColor,
    mottoText,
    mottoClass,
    hintText,
    mottoTilt,
    mottoTailDir,
    esc
  }=params;
  if(!mottoText)return'';
  return`<span class="seat-motto-callout" style="--player-color:${pColor};--motto-tilt:${mottoTilt};"><div class="callout-box"><div class="hk-inner"><span class="${mottoClass}">${esc(mottoText)}</span>${hintText?`<span class="hk-chinese-sub">${esc(hintText)}</span>`:''}</div></div><span class="tail tail-${mottoTailDir}"></span></span>`;
}

export function renderOpponentAvatarImgHtml(params){
  const {
    pColor,
    avatarSrc,
    playerAvatarClass,
    playerName,
    botNameAttr,
    esc
  }=params;
  return`<img class="player-avatar player-avatar-opponent ${playerAvatarClass}" style="--avatar-outline:${pColor};" src="${avatarSrc}" alt="${esc(playerName)}"${botNameAttr}/>`;
}

export function renderOpponentStatusBadgesHtml(params){
  const {
    hostBadgeHtml,
    badgeHtml
  }=params;
  return`${hostBadgeHtml}${badgeHtml}`;
}

export function renderOpponentAvatarHtml(params){
  const {
    pColor,
    avatarSrc,
    playerAvatarClass,
    playerName,
    botNameAttr,
    hostBadgeHtml,
    badgeHtml,
    mottoText,
    mottoClass,
    hintText,
    mottoTilt,
    mottoTailDir,
    esc,
    renderOpponentAvatarImgHtml:renderOpponentAvatarImgHtmlFn=renderOpponentAvatarImgHtml,
    renderOpponentStatusBadgesHtml:renderOpponentStatusBadgesHtmlFn=renderOpponentStatusBadgesHtml,
    renderOpponentMottoHtml:renderOpponentMottoHtmlFn=renderOpponentMottoHtml
  }=params;
  return`<span class="player-avatar-wrap player-avatar-wrap-opponent avatar-rim" style="--avatar-rim:${pColor};">${renderOpponentAvatarImgHtmlFn({pColor,avatarSrc,playerAvatarClass,playerName,botNameAttr,esc})}${renderOpponentStatusBadgesHtmlFn({hostBadgeHtml,badgeHtml})}${renderOpponentMottoHtmlFn({pColor,mottoText,mottoClass,hintText,mottoTilt,mottoTailDir,esc})}</span>`;
}

export function renderOpponentSeatWrapperHtml(params){
  const {
    peekActive,
    opponentAttr,
    labelName,
    calloutHtml,
    emoteHtml
  }=params;
  return`<div class="seat-name-fixed${peekActive?' motto-peek':''}"${opponentAttr}>${labelName}${calloutHtml}${emoteHtml}</div>`;
}

export function renderOpponentLabelNameHtml(params){
  const {
    avatarHtml,
    identityHtml
  }=params;
  return`<div class="name">${avatarHtml}${identityHtml}</div>`;
}

export function renderOpponentLabel(params){
  const {
    pColor,
    avatarSrc,
    playerAvatarClass,
    playerName,
    botNameAttr,
    hostBadgeHtml,
    badgeHtml,
    playerScore,
    roundWinsHtml,
    namecardBtn,
    mottoText,
    mottoClass,
    hintText,
    mottoTilt,
    mottoTailDir,
    calloutHtml,
    emoteHtml,
    peekActive,
    opponentAttr,
    esc,
    renderOpponentAvatarHtml:renderOpponentAvatarHtmlFn=renderOpponentAvatarHtml,
    renderOpponentIdentityHtml:renderOpponentIdentityHtmlFn=renderOpponentIdentityHtml,
    renderOpponentSeatWrapperHtml:renderOpponentSeatWrapperHtmlFn=renderOpponentSeatWrapperHtml,
    renderOpponentLabelNameHtml:renderOpponentLabelNameHtmlFn=renderOpponentLabelNameHtml
  }=params;
  const avatarHtml=renderOpponentAvatarHtmlFn({pColor,avatarSrc,playerAvatarClass,playerName,botNameAttr,hostBadgeHtml,badgeHtml,mottoText,mottoClass,hintText,mottoTilt,mottoTailDir,esc});
  const identityHtml=renderOpponentIdentityHtmlFn({playerName,playerScore,roundWinsHtml,namecardBtn,esc});
  const labelName=renderOpponentLabelNameHtmlFn({avatarHtml,identityHtml});
  return renderOpponentSeatWrapperHtmlFn({peekActive,opponentAttr,labelName,calloutHtml,emoteHtml});
}
