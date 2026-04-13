export function createGoogleProfileHelpers({
  getState,
  loadLeaderboardStore,
  scoreFromStoredTotal,
  applyMainSettings,
  preloadGooglePicture
}){
  function applyRestoredGoogleProfile({
    name='',
    gender='male',
    picture='',
    totalScore=null,
    settings=null,
    updateScore=false,
    updateName=true
  }={}){
    const state=getState();
    const normalizedGender=String(gender??'male')==='female'?'female':'male';
    if(updateName&&name)state.home.name=String(name).trim().slice(0,18);
    state.home.gender=normalizedGender;
    state.home.google.gender=normalizedGender;
    if(updateScore){
      const inGame=state.screen==='game'&&Array.isArray(state.solo.players)&&state.solo.players.length>0&&!state.solo.gameOver;
      if(!inGame){
        const restoredScore=scoreFromStoredTotal(totalScore);
        state.score=restoredScore;
        state.solo.totals=[restoredScore,5000,5000,5000];
      }
    }
    const pic=String(picture??'').trim();
    if(pic){
      state.home.google.picture=pic;
      state.home.google.pictureLoaded=false;
      preloadGooglePicture();
    }
    if(settings&&typeof settings==='object'){
      applyMainSettings(settings);
    }
    state.home.google.profileMissing=false;
  }

  function mergeBrowserGoogleProfile(overrides={}){
    const state=getState();
    const next={...state.home.google,...overrides};
    if(!next.name&&state.home.name)next.name=state.home.name;
    if(!next.gender&&state.home.gender)next.gender=state.home.gender;
    if(!next.picture&&state.home.google?.picture)next.picture=state.home.google.picture;
    if(!next.email&&state.home.google?.email)next.email=state.home.google.email;
    state.home.google=next;
  }

  function applyCachedGoogleProfileFromStore(email){
    const targetEmail=String(email??'').trim().toLowerCase();
    if(!targetEmail)return false;
    const store=loadLeaderboardStore();
    const entries=store&&store.players&&typeof store.players==='object'
      ?Object.values(store.players)
      :[];
    const match=entries.find((entry)=>String(entry?.email??'').trim().toLowerCase()===targetEmail);
    if(!match)return false;
    applyRestoredGoogleProfile({
      name:String(match.name??'').trim().slice(0,18),
      gender:String(match.gender??'male')==='female'?'female':'male',
      picture:String(match.picture??'').trim(),
      totalScore:match.totalScore,
      updateScore:true
    });
    return true;
  }

  return{
    applyCachedGoogleProfileFromStore,
    applyRestoredGoogleProfile,
    mergeBrowserGoogleProfile
  };
}
