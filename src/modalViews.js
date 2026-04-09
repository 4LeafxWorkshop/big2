export function formatLeaderboardDateTime(ts,language){
  const n=Number(ts)||0;
  if(!n)return'-';
  const localeMap={
    en:'en-US',
    'zh-HK':'zh-HK',
    fr:'fr-FR',
    de:'de-DE',
    es:'es-ES',
    ja:'ja-JP'
  };
  const locale=localeMap[language]||'en-US';
  try{return new Date(n).toLocaleString(locale,{hour12:false});}catch{return'-';}
}

export function formatLeaderboardPct(n){
  return `${Math.round((Number(n)||0)*100)}%`;
}

export function renderIntroPanel(params){
  const {
    intro,
    language,
    colorizeSuitText,
    esc,
    withBase,
    renderStaticCard,
    introHandSamples
  }=params;
  const formatIntroLine=(text)=>{
    const token='{{3D}}';
    const card3d=language==='en'?'♦️Diamond 3':'♦️3';
    return colorizeSuitText(String(text??'').replaceAll(token,card3d));
  };
  const rows=introHandSamples.map((row)=>`<div class="intro-hand-row"><div class="intro-hand-meta"><strong>${esc(row.name)}</strong><span>${esc(row.desc)}</span></div><div class="intro-hand-cards">${row.cards.map((c)=>renderStaticCard(c,true)).join('')}</div></div>`).join('');
  const howList=(intro.guideHowList??[]).map((x)=>`<li>${esc(x)}</li>`).join('');
  const androidList=(intro.guideAndroidSteps??[]).map((x)=>`<li>${esc(x)}</li>`).join('');
  const iosList=(intro.guideIosSteps??[]).map((x)=>`<li>${esc(x)}</li>`).join('');
  const historyBlocks=String(intro.historyBody??'')
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((p)=>`<p>${colorizeSuitText(p)}</p>`)
    .join('');
  const installPreview=`<div class="intro-home-preview"><img class="intro-home-icon" src="${withBase('icons/icon-192.png')}" alt="${esc(intro.guideHomeTitle)}"/><div class="intro-home-meta"><strong>${esc(intro.guideHomeTitle)}</strong><span>Big Two</span></div></div>`;
  return`<div class="intro-modal" id="intro-modal"><button class="intro-backdrop" id="intro-backdrop" aria-label="${esc(intro.btnHide)}"></button><section class="intro-sheet"><header class="intro-head"><div><h3 class="title-with-icon"><span class="title-icon title-icon-guide" aria-hidden="true"></span><span>${esc(intro.panelTitle)}</span></h3>${intro.panelSub?`<p>${colorizeSuitText(intro.panelSub)}</p>`:''}</div><button id="intro-close" class="secondary">${esc(intro.btnHide)}</button></header><div class="intro-grid"><article class="intro-block"><h4>${esc(intro.historyTitle)}</h4>${historyBlocks}</article><article class="intro-block"><h4>${esc(intro.howTitle)}</h4><p>${colorizeSuitText(intro.howBody)}</p><div class="intro-hand-list">${rows}</div></article><article class="intro-block"><h4>${esc(intro.flowTitle)}</h4><ul>${(intro.flowList??[]).map((x)=>`<li>${formatIntroLine(x)}</li>`).join('')}</ul></article><article class="intro-block"><h4>${esc(intro.playTitle)}</h4><ul>${(intro.playList??[]).map((x)=>`<li>${formatIntroLine(x)}</li>`).join('')}</ul></article><article class="intro-block"><h4>${esc(intro.guideHowTitle)}</h4><p>${esc(intro.guideHowIntro)}</p><ul>${howList}</ul></article><article class="intro-block"><h4>${esc(intro.guideHomeTitle)}</h4>${installPreview}<p>${esc(intro.guideHomeIntro)}</p><p><strong>${esc(intro.guideAndroidTitle)}</strong></p><ol>${androidList}</ol><p><strong>${esc(intro.guideIosTitle)}</strong></p><ol>${iosList}</ol><p>${esc(intro.guideHomeNotes)}</p></article></div></section></div>`;
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
    const isBotRow=String(r.id??'').startsWith('bot:');
    const avatarSrc=r.picture?authPictureUrlFrom(r.picture):avatarDataUri(r.name,'#7aaed8',r.gender??'male',isBotRow);
    const botNameAttr=isBotRow?` data-bot-name="${esc(r.name)}"`:'';
    return`<div class="lb-row"><div class="lb-rank">${medal?`<span class="lb-badge ${medalClass}" aria-hidden="true">${medal}</span>`:`#${r.rank??'-'}`}</div><div class="lb-main"><div class="lb-name-line"><div class="lb-name-pack"><span class="${avatarClass}"><img src="${avatarSrc}" alt="${esc(r.name)}"${botNameAttr}/></span><div class="lb-name">${esc(r.name)}</div></div><div class="lb-stat">${r.totalScore}</div></div><div class="lb-subline"><span>${t('score')}: ${r.totalScore} · ${t('lbWins')}: ${r.wins} · ${r.games} ${t('games')} · ${t('lbWR')} ${formatLeaderboardPct(r.winRate)}</span><span>${t('lbUpdated')}: ${formatLeaderboardDateTime(r.updatedAt,language)}</span></div></div></div>`;
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
  const tableRows=scoreGuideText.tableRows.map((row)=>`<tr><td>${esc(row[0])}</td><td>${esc(row[1])}</td><td>${esc(row[2])}</td></tr>`).join('');
  const chaoTableRows=scoreGuideText.chaoTableRows.map((row)=>`<tr><td>${esc(row[0])}</td><td>${esc(row[1])}</td><td>${esc(row[2])}</td></tr>`).join('');
  const anyTwoCards=twoCards.map((c)=>`<img src="${cardImagePath(c)}" alt="2" class="score-guide-card-art"/>`).join('');
  const topTwoCard=`<img src="${cardImagePath({rank:12,suit:3})}" alt="♠️Spade 2" class="score-guide-card-art"/>`;
  const mulTableRows=`<tr><td><div class="score-guide-cards">${anyTwoCards}</div></td><td>x2</td><td>${colorizeSuitText(scoreGuideText.anyTwo)}</td></tr><tr><td><div class="score-guide-cards">${topTwoCard}</div></td><td>x2</td><td>${colorizeSuitText(scoreGuideText.topTwo)}</td></tr>`;
  return`<div class="intro-modal" id="score-guide-modal"><button class="intro-backdrop" id="score-guide-backdrop" aria-label="${scoreGuideText.close}"></button><section class="intro-sheet"><header class="intro-head"><div><h3 class="title-with-icon"><span class="title-icon title-icon-score" aria-hidden="true"></span><span>${t('scoreGuideTitle')}</span></h3><p class="score-guide-heading">${esc(scoreGuideText.headingDesc)}</p></div><button id="score-guide-close" class="secondary">${scoreGuideText.close}</button></header><div class="intro-grid"><article class="intro-block"><h4>${scoreGuideText.baseTitle}</h4><div class="score-guide-table-wrap"><table class="score-guide-table"><thead><tr><th>${esc(scoreGuideText.tableHeaders[0])}</th><th>${esc(scoreGuideText.tableHeaders[1])}</th><th>${esc(scoreGuideText.tableHeaders[2])}</th></tr></thead><tbody>${tableRows}</tbody></table></div></article><article class="intro-block"><h4>${scoreGuideText.mulTitle}</h4><div class="score-guide-table-wrap"><table class="score-guide-table"><thead><tr><th>${esc(scoreGuideText.mulTableHeaders[0])}</th><th>${esc(scoreGuideText.mulTableHeaders[1])}</th><th>${esc(scoreGuideText.mulTableHeaders[2])}</th></tr></thead><tbody>${mulTableRows}</tbody></table></div><div class="score-guide-table-wrap"><table class="score-guide-table"><thead><tr><th>${esc(scoreGuideText.chaoTableHeaders[0])}</th><th>${esc(scoreGuideText.chaoTableHeaders[1])}</th><th>${esc(scoreGuideText.chaoTableHeaders[2])}</th></tr></thead><tbody>${chaoTableRows}</tbody></table></div><p class="score-guide-stack">${esc(scoreGuideText.stack)}</p></article><article class="intro-block"><p class="score-guide-summary">${esc(scoreGuideText.summary)}</p></article></div></section></div>`;
}

export function renderOpponentProfileModal(params){
  const {
    name,
    closeLabel,
    genderClass,
    genderIcon,
    genderLabel,
    avatarSrc,
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
          <h3 class="title-with-icon"><span class="title-icon-emoji" aria-hidden="true">👤</span><span>${esc(name)}</span><span class="opponent-gender-icon ${genderClass}" data-symbol="${genderIcon}" aria-label="${esc(genderLabel)}" title="${esc(genderLabel)}">${genderIcon}</span></h3>
        </div>
        <button id="opponent-profile-close" class="secondary">${closeLabel}</button>
      </header>
      <div class="opponent-profile-body">
        <div class="opponent-profile-header">
          <img class="opponent-profile-avatar" src="${avatarSrc}" alt="${esc(name)}"/>
          <div class="opponent-profile-header-text">
            <div class="opponent-profile-chips">
              <span class="opponent-chip"><span class="opponent-chip-icon zodiac" aria-hidden="true"></span><span>${zodiacLabel} ${zodiacMark?`${zodiacMark} `:''}${esc(zodiacText)}</span></span>
              <span class="opponent-chip"><span class="opponent-chip-icon dob" aria-hidden="true"></span><span>${dobLabel} ${esc(dob)}</span></span>
              <span class="opponent-chip"><span class="opponent-chip-icon hobby" aria-hidden="true"></span><span>${hobbiesLabel} ${esc(hobbyText)}</span></span>
            </div>
            <div class="opponent-profile-motto">
              <span class="opponent-chip-icon motto" aria-hidden="true"></span>
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
