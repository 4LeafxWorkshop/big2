import {renderGenderIconSvg} from './genderIcon.js';
import {resolveAvatarSrc} from './avatarProfile.js';
import {formatLeaderboardDateTime, formatLeaderboardPct} from './localeFormatters.js';

export function renderConfidentialStamp({text,esc,classes=''}) {
  const className=['result-confidential-stamp',classes].filter(Boolean).join(' ');
  return `<span class="${className}" aria-hidden="true">${esc(text)}</span>`;
}

export function gestureGuideIconSvg(){
  return gestureIconMarkup('tap');
}

function gestureIconBaseSrc(name){
  const base=String(import.meta.env?.BASE_URL??'/').trim()||'/';
  const normalized=base.endsWith('/')?base:`${base}/`;
  return `${normalized}gesture-icons/${name}.png`;
}

function gestureIconMarkup(kind){
  const srcMap={
    tap:'tap',
    hand:'hand-up',
    up:'hand-up',
    right:'hand-right',
    down:'hand-down',
    left:'hand-left',
    card:'card-up',
    handUp:'hand-up',
    handRight:'hand-right',
    handDown:'hand-down',
    handLeft:'hand-left',
    cardUp:'card-up'
  };
  const key=srcMap[kind]??'hand-up';
  return `<img class="gesture-icon-image" src="${gestureIconBaseSrc(key)}" alt="" aria-hidden="true"/>`;
}

function gestureHelpLabel(kind,language){
  const labels={
    'zh-HK':{
      handUp:'遊戲紀錄',
      handRight:'建議',
      handDown:'上餐',
      handLeft:'表情',
      cardUp:'出牌'
    },
    en:{
      handUp:'Game Log',
      handRight:'Suggest',
      handDown:'Food',
      handLeft:'Emote',
      cardUp:'Discard'
    },
    fr:{
      handUp:'Journal',
      handRight:'Conseil',
      handDown:'Service',
      handLeft:'Émote',
      cardUp:'Défausser'
    },
    de:{
      handUp:'Log',
      handRight:'Tipp',
      handDown:'Essen',
      handLeft:'Emote',
      cardUp:'Ablegen'
    },
    es:{
      handUp:'Registro',
      handRight:'Sugerir',
      handDown:'Comida',
      handLeft:'Emote',
      cardUp:'Descartar'
    },
    ja:{
      handUp:'ログ',
      handRight:'おすすめ',
      handDown:'フード',
      handLeft:'エモート',
      cardUp:'捨て札'
    }
  };
  return(labels[language]??labels.en)[kind]??labels.en[kind]??kind;
}

function gestureHelpFooterText(language){
  const map={
    'zh-HK':'提示：可在設定中開啟或關閉手勢提示。',
    en:'Tip: You can turn gesture help on or off in settings.',
    fr:'Astuce : vous pouvez activer ou désactiver l’aide par gestes dans les réglages.',
    de:'Tipp: Du kannst die Gestenhilfe in den Einstellungen ein- oder ausschalten.',
    es:'Consejo: puedes activar o desactivar la ayuda por gestos en ajustes.',
    ja:'ヒント: 設定でジェスチャー案内をオン/オフできます。'
  };
  return map[language]??map.en;
}

function gestureListItemHtml(text,kind,esc,language){
  const iconMap={
    handUp:['hand','up'],
    handRight:['hand','right'],
    handDown:['hand','down'],
    handLeft:['hand','left'],
    cardUp:['card','up']
  };
  const [primaryKind,secondaryKind]=iconMap[kind]??iconMap.handUp;
  const iconKind=primaryKind==='card'&&secondaryKind==='up'?'cardUp':`hand${secondaryKind[0].toUpperCase()}${secondaryKind.slice(1)}`;
  const label=gestureHelpLabel(kind,language);
  const actionIconHtml=kind==='handUp'
    ?'<span class="title-icon title-icon-log" aria-hidden="true"></span>'
      :kind==='handRight'
      ?'<span aria-hidden="true">💡</span>'
      :kind==='handDown'
        ?'<svg class="ui-icon ui-icon-bell" width="21" height="21" aria-hidden="true" viewBox="0 0 24 24"><g transform="translate(0 .1) scale(1.08)"><rect x="10.3" y="4.8" width="3.4" height="1.4" rx=".5" fill="#c8973b"/><path d="M6 16h12l-.7-1c-.4-.5-.6-1.1-.6-1.7 0-2.8-1.8-5-4.7-5s-4.7 2.2-4.7 5c0 .6-.2 1.2-.6 1.7l-.7 1Z" fill="#f3d28a"/><rect x="6" y="17" width="12" height="1.8" rx=".7" fill="#d7a85a"/></g></svg>'
        :kind==='handLeft'
          ?'<svg class="ui-icon ui-icon-emote" width="20" height="20" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#ffd84d" stroke="#111827" stroke-width="1.6"/><circle cx="9" cy="10" r="1.15" fill="#111827"/><circle cx="15" cy="10" r="1.15" fill="#111827"/><path d="M8.3 14.4c1.1 1.4 2.5 2.1 3.7 2.1s2.6-.7 3.7-2.1" fill="none" stroke="#111827" stroke-width="1.9" stroke-linecap="round"/><circle cx="7.4" cy="13.1" r="0.9" fill="#ff8ba7"/><circle cx="16.6" cy="13.1" r="0.9" fill="#ff8ba7"/></svg>'
          :'<span aria-hidden="true">▶</span>';
  const buttonClass=kind==='handUp'
    ?'secondary gesture-help-action-btn gesture-help-action-btn-handUp'
    :kind==='handRight'
      ?'secondary game-cta-btn gesture-help-action-btn gesture-help-action-btn-handRight'
      :kind==='handDown'
        ?'secondary game-cta-btn game-icon-btn gesture-help-action-btn gesture-help-action-btn-handDown'
        :kind==='handLeft'
          ?'secondary game-cta-btn game-icon-btn gesture-help-action-btn gesture-help-action-btn-handLeft'
          :'primary game-cta-btn gesture-help-action-btn gesture-help-action-btn-cardUp';
  const buttonText=(kind==='handDown'||kind==='handLeft')?'':`<span class="gesture-help-action-text">${esc(label)}</span>`;
  return `<li class="coach-gesture-item gesture-help-item gesture-help-item-${kind}" data-gesture-kind="${kind}"><span class="coach-gesture-icon gesture-help-icon" aria-hidden="true">${gestureIconMarkup(iconKind)}</span><div class="gesture-help-body"><div class="gesture-help-title-row"><span class="gesture-help-label">${esc(label)}</span></div><div class="gesture-help-action-row"><button class="${buttonClass}" type="button"><span class="gesture-help-action-icon" aria-hidden="true">${actionIconHtml}</span>${buttonText}</button></div><span class="gesture-help-copy">${esc(text)}</span></div></li>`;
}

function renderGestureHelpStage({gestureListHtml,language}) {
  return `<ul class="gesture-help-stage gesture-help-list">${gestureListHtml}</ul><footer class="gesture-help-footer"><span class="gesture-help-footer-icon" aria-hidden="true">💡</span><span>${gestureHelpFooterText(language)}</span></footer>`;
}

export function renderIntroPanel(params){
  const {
    intro,
    language,
    colorizeSuitText,
    esc,
    renderStaticCard,
    introHandSamples,
    showGestureGuide=false
  }=params;
  const formatIntroLine=(text)=>{
    const token='{{3D}}';
    const card3d=language==='en'?'♦️Diamond 3':'♦️3';
    return colorizeSuitText(String(text??'').replaceAll(token,card3d));
  };
  const rows=introHandSamples.map((row)=>`<div class="intro-hand-row"><div class="intro-hand-meta"><strong>${esc(row.name)}</strong><span>${esc(row.desc)}</span></div>${row.note?`<p class="intro-hand-note">${formatIntroLine(row.note)}</p>`:''}<div class="intro-hand-cards">${row.cards.map((c)=>renderStaticCard(c,true)).join('')}</div></div>`).join('');
  const guideItem=(item)=>{
    if(typeof item==='string')return`<li>${esc(item)}</li>`;
    const sub=Array.isArray(item?.sub)&&item.sub.length?`<ul class="intro-sub-list">${item.sub.map((x)=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
    return`<li>${esc(item?.text??'')}${sub}</li>`;
  };
  const howList=(intro.guideHowList??[]).map(guideItem).join('');
  const historyBlocks=String(intro.historyBody??'')
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p)=>`<p>${colorizeSuitText(p)}</p>`)
    .join('');
  return`<div class="intro-modal" id="intro-modal"><button class="intro-backdrop" id="intro-backdrop" aria-label="${esc(intro.btnHide)}"></button><section class="intro-sheet"><header class="intro-head"><div><h3 class="title-with-icon"><span class="title-icon title-icon-guide" aria-hidden="true"></span><span>${esc(intro.panelTitle)}</span></h3>${intro.panelSub?`<p>${colorizeSuitText(intro.panelSub)}</p>`:''}</div><button id="intro-close" class="secondary">${esc(intro.btnHide)}</button></header><div class="intro-grid"><article class="intro-block"><h4>${esc(intro.historyTitle)}</h4>${historyBlocks}</article><article class="intro-block"><h4>${esc(intro.howTitle)}</h4><p>${colorizeSuitText(intro.howBody)}</p><div class="intro-hand-list">${rows}</div></article><article class="intro-block"><h4>${esc(intro.flowTitle)}</h4><ul>${(intro.flowList??[]).map((x)=>`<li>${formatIntroLine(x)}</li>`).join('')}</ul></article><article class="intro-block"><h4>${esc(intro.playTitle)}</h4><ul>${(intro.playList??[]).map((x)=>`<li>${formatIntroLine(x)}</li>`).join('')}</ul></article><article class="intro-block"><h4>${esc(intro.guideHowTitle)}</h4><p>${esc(intro.guideHowIntro)}</p><ul>${howList}</ul></article></div></section></div>`;
}

export function renderCoachMarksPanel(params){
  const {
    intro,
    language='en',
    esc
  }=params;
  const gestureKinds=['handUp','handRight','handDown','handLeft','cardUp'];
  const gestureList=(intro.guideGestureList??[]).map((x,i)=>gestureListItemHtml(x,gestureKinds[i]??gestureKinds[0],esc,language)).join('');
  return`<div class="intro-modal coach-marks-modal" id="coach-marks-modal"><button class="intro-backdrop" id="coach-marks-backdrop" aria-label="${esc(intro.btnHide)}"></button><section class="intro-sheet coach-marks-sheet"><header class="intro-head"><div><h3>${esc(intro.guideGestureTitle)}</h3><p>${esc(intro.guideGestureIntro)}</p></div><button id="coach-marks-close" class="secondary coach-marks-close-btn">${esc(intro.btnHide)}</button></header><div class="intro-grid"><article class="intro-block coach-marks-block">${renderGestureHelpStage({gestureListHtml:gestureList,language})}</article></div></section></div>`;
}

export function renderLeaderboardPanel(params){
  const {
    leaderboard,
    botProfiles,
    authPictureUrlFrom,
    avatarDataUri,
    esc,
    t,
    language
  }=params;
  const rows=leaderboard.rows??[];
  const botUnique=[];
  const botSeen=new Set();
  botProfiles.forEach((b)=>{
    const key=`${b.name}|${b.gender||'male'}`;
    if(botSeen.has(key))return;
    botSeen.add(key);
    botUnique.push(b);
  });
  const botNameSet=new Set(botUnique.map((b)=>String(b.name??'').trim()).filter(Boolean));
  const botRows=botUnique.map((b,i)=>({
    id:`bot:${b.name}:${i}`,
    name:b.name,
    gender:b.gender,
    picture:'',
    games:0,
    wins:0,
    winRate:0,
    totalScore:5000,
    updatedAt:0
  }));
  const hasBotRows=rows.some((r)=>String(r.id??'').startsWith('bot:'));
  const combinedRows=(hasBotRows?rows:[...rows,...botRows]).sort((a,b)=>{
    if(leaderboard.sort==='wins')return b.wins-a.wins||b.totalScore-a.totalScore||a.name.localeCompare(b.name);
    if(leaderboard.sort==='games')return b.games-a.games||b.wins-a.wins||a.name.localeCompare(b.name);
    if(leaderboard.sort==='winRate')return b.winRate-a.winRate||b.wins-a.wins||a.name.localeCompare(b.name);
    return b.totalScore-a.totalScore||b.wins-a.wins||a.name.localeCompare(b.name);
  }).map((r,i)=>({...r,rank:i+1})).slice(0,20);
  const rowHtml=combinedRows.length?combinedRows.map((r)=>{
    const rank=Number(r.rank);
    const medal=rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':'';
    const medalClass=rank===1?'gold':rank===2?'silver':rank===3?'bronze':'';
    const avatarClass=`lb-avatar ${rank===1?'gold':rank===2?'silver':rank===3?'bronze':''}`.trim();
    const isBotRow=Boolean(r.isBot)||String(r.id??'').startsWith('bot:')||botNameSet.has(String(r.name??'').trim());
    const avatarPicture=isBotRow?'':r.picture;
    const avatarFallbackSrc=isBotRow?avatarDataUri(r.name,'#7aaed8',r.gender??'male',false):'';
    const avatarSrc=resolveAvatarSrc({
      picture:avatarPicture,
      name:r.name,
      color:'#7aaed8',
      gender:r.gender??'male',
      isBot:isBotRow,
      authPictureUrlFrom,
      avatarDataUri
    });
    const botNameAttr=isBotRow?` data-bot-name="${esc(r.name)}"`:'';
    const avatarFallbackAttr=isBotRow?` data-fallback-src="${esc(avatarFallbackSrc)}" onerror="this.onerror=null;this.src=this.dataset.fallbackSrc"`:'';
    return`<div class="lb-row"><div class="lb-rank">${medal?`<span class="lb-badge ${medalClass}" aria-hidden="true">${medal}</span>`:`#${r.rank??'-'}`}</div><div class="lb-main"><div class="lb-name-line"><div class="lb-name-pack"><span class="${avatarClass}"><img src="${avatarSrc}" alt="${esc(r.name)}"${botNameAttr}${avatarFallbackAttr}/></span><div class="lb-name">${esc(r.name)}</div></div><div class="lb-stat">${r.totalScore}</div></div><div class="lb-subline"><span>${t('score')}: ${r.totalScore} · ${t('lbWins')}: ${r.wins} · ${r.games} ${t('games')} · ${t('lbWR')} ${formatLeaderboardPct(r.winRate)}</span><span>${t('lbUpdated')}: ${formatLeaderboardDateTime(r.updatedAt,language)}</span></div></div></div>`;
  }).join(''):`<div class="hint">${t('lbNoData')}</div>`;
  return`<section class="lobby-panel leaderboard-panel"><div class="control-row lb-head"><label class="field"><span>${t('lbSort')}</span><select id="lb-sort"><option value="totalDelta" ${leaderboard.sort==='totalDelta'?'selected':''}>${t('lbTotalDelta')}</option><option value="wins" ${leaderboard.sort==='wins'?'selected':''}>${t('lbWins')}</option><option value="games" ${leaderboard.sort==='games'?'selected':''}>${t('lbGames')}</option><option value="winRate" ${leaderboard.sort==='winRate'?'selected':''}>${t('lbWinRate')}</option><option value="avgDelta" ${leaderboard.sort==='avgDelta'?'selected':''}>${t('lbAvgDelta')}</option></select></label><label class="field"><span>${t('lbPeriod')}</span><select id="lb-period"><option value="all" ${leaderboard.period==='all'?'selected':''}>${t('lbAll')}</option><option value="7d" ${leaderboard.period==='7d'?'selected':''}>${t('lb7d')}</option><option value="30d" ${leaderboard.period==='30d'?'selected':''}>${t('lb30d')}</option></select></label></div><div class="lb-list">${rowHtml}</div></section>`;
}

export function renderLeaderboardModal(params){
  const {t,esc,leaderboardPanelHtml}=params;
  return`<div class="intro-modal lb-modal" id="lb-modal"><button class="intro-backdrop" id="lb-backdrop" aria-label="${t('close')}"></button><section class="intro-sheet lb-sheet"><header class="intro-head"><div><h3 class="title-with-icon"><span class="title-icon title-icon-leaderboard" aria-hidden="true"></span><span>${t('lb')}</span></h3><p>${esc(t('lbHeadingDesc'))}</p></div><button id="lb-close" class="secondary">${t('close')}</button></header>${leaderboardPanelHtml}</section></div>`;
}

export function renderScoreGuideModal(params){
  const {
    scoreGuideText,
    esc,
    cardImagePath,
    colorizeSuitText,
    t
  }=params;
  const twoCards=[
    {rank:12,suit:0},
    {rank:12,suit:1},
    {rank:12,suit:2},
    {rank:12,suit:3}
  ];
  const scoreChip=(label,multiplier)=>`<span class="result-score-chip penalty score-guide-chip">${colorizeSuitText(label)} ${esc(multiplier)}</span>`;
  const scoreBadge=(label)=>`<span class="result-score-chip penalty score-guide-chip">${colorizeSuitText(label)}</span>`;
  const tableRows=scoreGuideText.tableRows.map((row)=>`<tr><td>${esc(row[0])}</td><td>${esc(row[1])}</td><td>${esc(row[2])}</td></tr>`).join('');
  const chaoTableRows=scoreGuideText.chaoTableRows.map((row)=>`<tr><td>${esc(row[0])}</td><td>${esc(row[1])}</td><td>${scoreChip(row[2],row[1])}</td></tr>`).join('');
  const anyTwoCards=twoCards.map((c)=>`<img src="${cardImagePath(c)}" alt="2" class="score-guide-card-art"/>`).join('');
  const topTwoCard=`<img src="${cardImagePath({rank:12,suit:3})}" alt="♠️Spade 2" class="score-guide-card-art"/>`;
  const mulTableRows=`<tr><td><div class="score-guide-cards">${anyTwoCards}</div></td><td>x2</td><td><div class="score-guide-rule-with-chip">${scoreChip(t('scoreAnyTwo'),'x2')}<span>${colorizeSuitText(scoreGuideText.anyTwo)}</span></div></td></tr><tr><td><div class="score-guide-cards">${topTwoCard}</div></td><td>x2</td><td><div class="score-guide-rule-with-chip">${scoreChip(t('scoreTwoPenalty'),'x2')}<span>${colorizeSuitText(scoreGuideText.twoPenalty)}</span></div></td></tr>`;
  const playBigTableRows=scoreGuideText.playBigBadgeNote?`<tr><td>${esc(scoreGuideText.playBigTransfer||'Transfer')}</td><td>-</td><td><div class="score-guide-rule-with-chip">${scoreBadge(scoreGuideText.playBigBadge||t('playBigPenalty'))}<span>${colorizeSuitText(scoreGuideText.playBigBadgeNote)}</span></div></td></tr>`:'';
  const scoringOrderItems=(scoreGuideText.scoringOrder||[scoreGuideText.summary,scoreGuideText.playBigRule].filter(Boolean)).map((item)=>`<li>${colorizeSuitText(item)}</li>`).join('');
  const playBigTable=playBigTableRows?`<div class="score-guide-table-wrap"><table class="score-guide-table"><thead><tr><th>${esc(scoreGuideText.mulTableHeaders[0])}</th><th>${esc(scoreGuideText.mulTableHeaders[1])}</th><th>${esc(scoreGuideText.mulTableHeaders[2])}</th></tr></thead><tbody>${playBigTableRows}</tbody></table></div>`:'';
  const playBigExample=scoreGuideText.playBigExample?`<p class="score-guide-summary">${colorizeSuitText(scoreGuideText.playBigExample)}</p>`:'';
  return`<div class="intro-modal" id="score-guide-modal"><button class="intro-backdrop" id="score-guide-backdrop" aria-label="${scoreGuideText.close}"></button><section class="intro-sheet"><header class="intro-head"><div><h3 class="title-with-icon"><span class="title-icon title-icon-score" aria-hidden="true"></span><span>${t('scoreGuideTitle')}</span></h3><p class="score-guide-heading">${esc(scoreGuideText.headingDesc)}</p></div><button id="score-guide-close" class="secondary">${scoreGuideText.close}</button></header><div class="intro-grid"><article class="intro-block"><h4>${scoreGuideText.baseTitle}</h4><div class="score-guide-table-wrap"><table class="score-guide-table"><thead><tr><th>${esc(scoreGuideText.tableHeaders[0])}</th><th>${esc(scoreGuideText.tableHeaders[1])}</th><th>${esc(scoreGuideText.tableHeaders[2])}</th></tr></thead><tbody>${tableRows}</tbody></table></div></article><article class="intro-block"><h4>${scoreGuideText.mulTitle}</h4><div class="score-guide-table-wrap"><table class="score-guide-table"><thead><tr><th>${esc(scoreGuideText.mulTableHeaders[0])}</th><th>${esc(scoreGuideText.mulTableHeaders[1])}</th><th>${esc(scoreGuideText.mulTableHeaders[2])}</th></tr></thead><tbody>${mulTableRows}</tbody></table></div><div class="score-guide-table-wrap"><table class="score-guide-table"><thead><tr><th>${esc(scoreGuideText.chaoTableHeaders[0])}</th><th>${esc(scoreGuideText.chaoTableHeaders[1])}</th><th>${esc(scoreGuideText.chaoTableHeaders[2])}</th></tr></thead><tbody>${chaoTableRows}</tbody></table></div>${playBigTable}<p class="score-guide-stack">${esc(scoreGuideText.stack)}</p></article><article class="intro-block score-guide-flow"><h4>${esc(scoreGuideText.scoringOrderTitle||scoreGuideText.summary)}</h4><ol class="score-guide-order">${scoringOrderItems}</ol>${playBigExample}</article></div></section></div>`;
}

export function renderOpponentProfileModal(params){
  const {
    name,
    closeLabel,
    genderClass,
    genderLabel,
    avatarSrc,
    avatarStampHtml,
    zodiacLabel,
    zodiacMark,
    zodiacText,
    dobLabel,
    dob,
    hobbiesLabel,
    hobbyText,
    mottoLabel,
    mottoText,
    profileLabel,
    profileHtml,
    esc
  }=params;
  return`<div class="intro-modal opponent-profile-modal" id="opponent-profile-modal">
    <button class="intro-backdrop" id="opponent-profile-backdrop" aria-label="${esc(closeLabel)}"></button>
    <section class="intro-sheet opponent-profile-sheet">
      <header class="intro-head">
        <div>
          <h3 class="title-with-icon"><span class="title-icon title-icon-namecard" aria-hidden="true"></span><span>${esc(name)}</span><span class="opponent-gender-icon ${genderClass}" aria-label="${esc(genderLabel)}" title="${esc(genderLabel)}">${renderGenderIconSvg(genderClass)}</span></h3>
        </div>
        <button id="opponent-profile-close" class="secondary">${closeLabel}</button>
      </header>
      ${avatarStampHtml??''}
      <div class="opponent-profile-body">
        <div class="opponent-profile-header">
          <div class="opponent-profile-avatar-wrap">
            <img class="opponent-profile-avatar" src="${avatarSrc}" alt="${esc(name)}"/>
          </div>
          <div class="opponent-profile-header-text">
            <div class="opponent-profile-chips">
              <span class="opponent-chip"><span class="opponent-chip-icon zodiac" aria-hidden="true"></span><span>${zodiacLabel} ${zodiacMark?`${zodiacMark} `:''}${esc(zodiacText)}</span></span>
              <span class="opponent-chip"><span class="opponent-chip-icon dob" aria-hidden="true"></span><span>${dobLabel} ${esc(dob)}</span></span>
              <span class="opponent-chip"><span class="opponent-chip-icon hobby" aria-hidden="true"></span><span>${hobbiesLabel} ${esc(hobbyText)}</span></span>
            </div>
            <div class="opponent-profile-motto">
              <span class="opponent-chip-icon motto" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path d="M6.5 5.5h11A3.5 3.5 0 0 1 21 9v4a3.5 3.5 0 0 1-3.5 3.5H9.4l-3.8 3.2V16H6.5A3.5 3.5 0 0 1 3 13V9a3.5 3.5 0 0 1 3.5-3.5Z"/>
                  <path d="M8 10h8M8 13h5"/>
                </svg>
              </span>
              <div>
                <div class="opponent-motto-label">${mottoLabel}</div>
                <div class="opponent-motto-text">${esc(mottoText)}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="opponent-profile-details">
          <div class="opponent-profile-summary"><strong>${profileLabel}</strong></div>
          <div class="opponent-profile-paragraphs">${profileHtml}</div>
        </div>
      </div>
    </section>
  </div>`;
}
