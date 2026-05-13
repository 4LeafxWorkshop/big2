export function createProfileSettingsHelpers(deps){
  const {
    getState,
    languageOptions,
    backOptions,
    getSoundEnabled,
    getCalloutDisplayEnabled,
    getEmoteDisplayEnabled,
    getGestureHelpEnabled=()=>false,
    getVibrateEnabled=()=>true,
    setVibrateEnabled=()=>{},
    normalizeCalloutStylePack,
    getCalloutStylePack,
    currentLeaderboardIdentity,
    ensureLeaderboardEntry,
    loadLeaderboardStore,
    botLeaderboardIdentity,
    currentRoomPlayerId
  }=deps;

  function clampScoreValue(v){
    const n=Number(v);
    if(!Number.isFinite(n))return 5000;
    return Math.max(0,Math.trunc(n));
  }

  function scoreFromStoredTotal(totalScore){
    return clampScoreValue(totalScore);
  }

  function currentScoreForIdentity(identity){
    const entry=ensureLeaderboardEntry(loadLeaderboardStore(),identity);
    if(entry)return scoreFromStoredTotal(entry.totalScore);
    return 5000;
  }

  function currentHumanScoreValue(){
    return currentScoreForIdentity(currentLeaderboardIdentity());
  }

  function botScoreValue(name,gender){
    return currentScoreForIdentity(botLeaderboardIdentity(name,gender));
  }

  function roomSeatStartingScore(player,seat,storedTotal){
    const state=getState();
    if(player?.isHuman){
      if(Number(seat)===Number(state.room.selfSeat)||String(player?.uid??'')===currentRoomPlayerId()){
        return currentHumanScoreValue();
      }
      return clampScoreValue(storedTotal);
    }
    return botScoreValue(String(player?.name||`Bot ${Number(seat)+1}`),String(player?.gender||'male'));
  }

  function soloStartingTotals(players){
    const state=getState();
    return players.map((player,seat)=>roomSeatStartingScore(player,seat,state.solo.totals?.[seat]));
  }

  function collectMainSettings(){
    const state=getState();
    const lang=languageOptions.some((opt)=>opt.value===state.language)?state.language:'zh-HK';
    return{
      language:lang,
      aiDifficulty:['easy','normal','hard'].includes(state.home.aiDifficulty)?state.home.aiDifficulty:'normal',
      backColor:backOptions.some((x)=>x.value===state.home.backColor)?state.home.backColor:'red',
      soundEnabled:Boolean(getSoundEnabled()),
      calloutDisplayEnabled:Boolean(getCalloutDisplayEnabled()),
      emoteDisplayEnabled:Boolean(getEmoteDisplayEnabled()),
      gestureHelpEnabled:Boolean(getGestureHelpEnabled()),
      vibrateEnabled:Boolean(getVibrateEnabled()),
      calloutVoiceMode:getSoundEnabled()?'auto':'off',
      calloutStylePack:normalizeCalloutStylePack(getCalloutStylePack()),
      gender:state.home.gender==='female'?'female':'male',
      avatarChoice:['male','female','google'].includes(state.home.avatarChoice)?state.home.avatarChoice:'male',
      turnTimeout:20000
    };
  }

  function applyMainSettings(settings){
    if(!settings||typeof settings!=='object')return;
    const state=getState();
    const language=String(settings.language??'');
    if(languageOptions.some((opt)=>opt.value===language))state.language=language;
    const ai=String(settings.aiDifficulty??'');
    if(['easy','normal','hard'].includes(ai))state.home.aiDifficulty=ai;
    const back=String(settings.backColor??'');
    if(backOptions.some((x)=>x.value===back))state.home.backColor=back;
    if(typeof settings.soundEnabled==='boolean')deps.setSoundEnabled(Boolean(settings.soundEnabled));
    if(typeof settings.calloutDisplayEnabled==='boolean')deps.setCalloutDisplayEnabled(Boolean(settings.calloutDisplayEnabled));
    if(typeof settings.emoteDisplayEnabled==='boolean')deps.setEmoteDisplayEnabled(Boolean(settings.emoteDisplayEnabled));
    if(typeof settings.gestureHelpEnabled==='boolean')deps.setGestureHelpEnabled(Boolean(settings.gestureHelpEnabled));
    if(typeof settings.vibrateEnabled==='boolean')setVibrateEnabled(Boolean(settings.vibrateEnabled));
    deps.setCalloutVoiceMode(getSoundEnabled()?'auto':'off');
    deps.setCalloutStylePack(normalizeCalloutStylePack(settings.calloutStylePack));
    const gender=String(settings.gender??'');
    if(gender==='male'||gender==='female')state.home.gender=gender;
    const avatarChoice=String(settings.avatarChoice??'');
    if(avatarChoice==='male'||avatarChoice==='female'||avatarChoice==='google')state.home.avatarChoice=avatarChoice;
  }

  return{
    clampScoreValue,
    scoreFromStoredTotal,
    currentScoreForIdentity,
    currentHumanScoreValue,
    botScoreValue,
    roomSeatStartingScore,
    soloStartingTotals,
    collectMainSettings,
    applyMainSettings
  };
}
