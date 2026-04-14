export function createGoogleSessionHelpers({
  getState,
  getWindow=()=>window,
  getStorage,
  sessionKey,
  getFirebaseAuth=()=>null,
  mergeBrowserGoogleProfile,
  applyCachedGoogleProfileFromStore,
  preloadGooglePicture,
  initFirebaseIfReady,
  hydrateProfileFromCloudByIdentity,
  currentLeaderboardIdentity,
  syncLeaderboardProfile,
  loadActiveRoomPointer,
  refreshLeaderboard,
  render
}){
  const HYDRATE_TIMEOUT_MS=5000;
  const HYDRATE_RETRY_MAX=3;
  const HYDRATE_RETRY_DELAY_MS=320;

  function wait(ms){
    return new Promise((resolve)=>setTimeout(resolve,ms));
  }

  function withTimeout(task,ms){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{
        reject(new Error('hydrate-timeout'));
      },ms);
      Promise.resolve(task)
        .then((value)=>{
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err)=>{
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  function normalizeHydrateResult(result){
    if(result&&typeof result==='object'&&typeof result.status==='string'){
      return result.status;
    }
    if(result===true)return'found';
    if(result===false)return'not_found';
    return'error';
  }

  function setHydrationBlocking(active){
    const state=getState();
    state.home.google={...state.home.google,hydrating:Boolean(active)};
  }

  async function hydrateProfileBlocking(){
    const state=getState();
    setHydrationBlocking(true);
    state.home.google.profileMissing=false;
    render();
    let lastStatus='error';
    for(let i=0;i<HYDRATE_RETRY_MAX;i+=1){
      try{
        const result=await withTimeout(
          hydrateProfileFromCloudByIdentity(currentLeaderboardIdentity()),
          HYDRATE_TIMEOUT_MS
        );
        const status=normalizeHydrateResult(result);
        lastStatus=status;
        if(status==='found'){
          setHydrationBlocking(false);
          state.home.google.profileMissing=false;
          return{ok:true,status:'found'};
        }
        if(status==='not_found'){
          setHydrationBlocking(false);
          state.home.google.profileMissing=false;
          state.score=5000;
          state.solo.totals=[5000,5000,5000,5000];
          return{ok:true,status:'not_found'};
        }
      }catch{
        lastStatus='error';
      }
      if(i<HYDRATE_RETRY_MAX-1)await wait(HYDRATE_RETRY_DELAY_MS);
    }
    setHydrationBlocking(false);
    state.home.google.profileMissing=true;
    return{ok:false,status:lastStatus||'error'};
  }

  function parseJwtPayload(token){
    try{
      const p=String(token??'').split('.')[1];
      if(!p)return null;
      const b=p.replace(/-/g,'+').replace(/_/g,'/');
      const json=decodeURIComponent(atob(b).split('').map((c)=>`%${c.charCodeAt(0).toString(16).padStart(2,'0')}`).join(''));
      return JSON.parse(json);
    }catch{
      return null;
    }
  }

  function loadGoogleSession(){
    try{
      const storage=getStorage();
      if(!storage)return false;
      const raw=storage.getItem(sessionKey);
      const parsed=raw?JSON.parse(raw):null;
      const email=String(parsed?.email??'').trim().toLowerCase().slice(0,120);
      if(!email)return false;
      const state=getState();
      state.home.google={...state.home.google,signedIn:true,provider:'google',email,hydrating:true,profileMissing:false};
      applyCachedGoogleProfileFromStore(email);
      if(initFirebaseIfReady()){
        void hydrateProfileBlocking().then(()=>{
          if(state.home.showLeaderboard)refreshLeaderboard(true);
          render();
        });
      }
      return true;
    }catch{
      return false;
    }
  }

  function saveGoogleSession(){
    try{
      const storage=getStorage();
      if(!storage)return;
      const state=getState();
      const email=String(state.home.google.email??'').trim().toLowerCase().slice(0,120);
      if(!email){
        storage.removeItem(sessionKey);
        return;
      }
      storage.setItem(sessionKey,JSON.stringify({email}));
    }catch{}
  }

  function clearGoogleSession(){
    try{
      const storage=getStorage();
      storage?.removeItem(sessionKey);
    }catch{}
  }

  function signedInWithEmail(){
    const state=getState();
    return Boolean(state.home.google.signedIn&&state.home.google.email);
  }

  async function handleCredentialResponse(response){
    const state=getState();
    const token=String(response?.credential??'').trim();
    if(!token)return;
    const p=parseJwtPayload?.(token)??{};
    initFirebaseIfReady();
    try{
      const fb=getWindow().firebase;
      const firebaseAuth=getFirebaseAuth();
      if(fb?.auth&&firebaseAuth){
        const cred=fb.auth.GoogleAuthProvider.credential(token);
        const res=await firebaseAuth.signInWithCredential(cred);
        const user=res?.user;
        if(user?.uid){
          state.home.google.uid=String(user.uid).slice(0,128);
          state.home.google.sub=String(user.uid).slice(0,64);
        }
      }
    }catch{
    }
    const email=String(p.email??'').trim().toLowerCase().slice(0,120);
    const pic=String(p.picture??'').trim();
    const gRaw=String(p.gender??p.sex??'').trim().toLowerCase();
    const googleGender=(gRaw==='female'||gRaw==='male')?gRaw:'';
    const signedIn=Boolean(email||String(p.sub??'').trim());
    mergeBrowserGoogleProfile({
      signedIn,
      provider:'google',
      name:String(p.name??'').slice(0,18),
      email,
      uid:String(p.sub??'').slice(0,128),
      sub:String(p.sub??'').slice(0,64),
      token,
      picture:pic,
      pictureLoaded:false,
      gender:googleGender,
      profileMissing:false,
      hydrating:signedIn
    });
    if(signedIn){
      applyCachedGoogleProfileFromStore(email);
      preloadGooglePicture();
      const hydrated=await hydrateProfileBlocking();
      if(state.home.google.name)state.home.name=state.home.google.name;
      if(googleGender)state.home.gender=googleGender;
      const storage=getStorage();
      if(storage){
        const emailKey=String(email).trim().toLowerCase().slice(0,120);
        if(emailKey)storage.setItem(sessionKey,JSON.stringify({email:emailKey}));
      }
      if(hydrated?.ok&&hydrated.status==='found'){
        await syncLeaderboardProfile(currentLeaderboardIdentity());
      }
      if(state.home.showLeaderboard)refreshLeaderboard(true);
      void loadActiveRoomPointer?.();
    }
    render();
  }

  return{
    clearGoogleSession,
    hydrateProfileBlocking,
    handleCredentialResponse,
    loadGoogleSession,
    saveGoogleSession,
    signedInWithEmail
  };
}
