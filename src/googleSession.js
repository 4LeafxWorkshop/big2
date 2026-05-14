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
  render,
  afterSuccessfulSignIn=()=>{},
  afterSessionReady=()=>{}
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
      if(!email){
        console.debug('[google-picture] session-empty',{sessionKey});
        return false;
      }
      const state=getState();
      state.home.google={...state.home.google,signedIn:true,provider:'google',email,hydrating:true,profileMissing:false};
      const cached=applyCachedGoogleProfileFromStore(email);
      console.debug('[google-picture] session-restore',{email,cached});
      const firebaseAuth=getFirebaseAuth();
      const authPicture=String(firebaseAuth?.currentUser?.photoURL??'').trim();
      if(authPicture&&!String(state.home.google.picture??'').trim()){
        mergeBrowserGoogleProfile({
          picture:authPicture,
          pictureLoaded:false
        });
        console.debug('[google-picture] session-auth-picture',{email,picture:authPicture});
        preloadGooglePicture();
      }else{
        console.debug('[google-picture] session-no-auth-picture',{email,authPicturePresent:Boolean(authPicture),existingPicture:Boolean(String(state.home.google.picture??'').trim())});
      }
      if(initFirebaseIfReady()){
        void hydrateProfileBlocking().then(()=>{
          if(state.home.showLeaderboard)refreshLeaderboard(true);
          render();
          void afterSessionReady();
        });
      }else{
        void afterSessionReady();
      }
      return true;
  }catch{
      console.debug('[google-picture] session-restore-error');
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

  function normalizePictureString(raw){
    const value=String(raw??'').trim();
    if(!value)return'';
    if(value==='null'||value==='undefined'||value==='[object Object]')return'';
    return value;
  }

  function normalizePictureValue(value){
    if(typeof value==='string')return normalizePictureString(value);
    if(value&&typeof value==='object'){
      const direct=
        normalizePictureString(value.url)||
        normalizePictureString(value.href)||
        normalizePictureString(value.src)||
        normalizePictureString(value.path)||
        normalizePictureString(value.webPath);
      if(direct)return direct;
    }
    return normalizePictureString(value);
  }

  async function completeGoogleSignIn({
    token='',
    email='',
    name='',
    picture='',
    sub='',
    gender=''
  }={}){
    const state=getState();
    token=String(token??'').trim();
    if(!token)return;
    const tokenPayload=parseJwtPayload?.(token)??{};
    let firebaseUid=String(state.home.google?.uid??'').trim();
    initFirebaseIfReady();
    try{
      const fb=getWindow().firebase;
      const firebaseAuth=getFirebaseAuth();
      if(fb?.auth&&firebaseAuth){
        const cred=fb.auth.GoogleAuthProvider.credential(token);
        const res=await firebaseAuth.signInWithCredential(cred);
        const user=res?.user;
        if(user?.uid){
          firebaseUid=String(user.uid).trim().slice(0,128);
          state.home.google.uid=firebaseUid;
          if(!sub)state.home.google.sub=String(user.uid).slice(0,64);
        }
        if(!picture){
          picture=normalizePictureValue(user?.photoURL??firebaseAuth?.currentUser?.photoURL);
        }
      }
    }catch{
    }
    email=String(email??tokenPayload.email??'').trim().toLowerCase().slice(0,120);
    picture=normalizePictureValue(picture)||normalizePictureValue(tokenPayload.picture);
    sub=String(sub??tokenPayload.sub??'').trim();
    gender=String(gender??'').trim().toLowerCase();
    const googleGender=(gender==='female'||gender==='male')?gender:'';
    const signedIn=Boolean(email||sub);
    console.debug('[google-picture] sign-in-resolved',{
      signedIn,
      email,
      hasTokenPicture:Boolean(normalizePictureValue(tokenPayload.picture)),
      hasIncomingPicture:Boolean(Boolean(picture)),
      hasUserPicture:Boolean(Boolean(normalizePictureValue((tokenPayload?.picture??'')))),
      gender:googleGender||'(none)'
    });
    mergeBrowserGoogleProfile({
      signedIn,
      provider:'google',
      name:String(name??'').slice(0,18),
      email,
      uid:String(firebaseUid||sub).slice(0,128),
      sub:String(sub).slice(0,64),
      token,
      picture,
      pictureLoaded:false,
      gender:googleGender,
      profileMissing:false,
      hydrating:signedIn
    });
    if(signedIn){
      const cached=applyCachedGoogleProfileFromStore(email);
      console.debug('[google-picture] sign-in-cached-profile',{email,cached});
      preloadGooglePicture();
      const hydrated=await hydrateProfileBlocking();
      if(state.home.google.name)state.home.name=state.home.google.name;
      if(googleGender)state.home.gender=googleGender;
      const storage=getStorage();
      if(storage){
        const emailKey=String(email).trim().toLowerCase().slice(0,120);
        if(emailKey)storage.setItem(sessionKey,JSON.stringify({email:emailKey}));
      }
      if(hydrated?.ok){
        await syncLeaderboardProfile(currentLeaderboardIdentity());
      }
      if(state.home.showLeaderboard)refreshLeaderboard(true);
      void loadActiveRoomPointer?.();
      void afterSuccessfulSignIn();
    }
    render();
  }

  async function handleCredentialResponse(response){
    const token=String(response?.credential??'').trim();
    if(!token)return;
    const p=parseJwtPayload?.(token)??{};
    const gRaw=String(p.gender??p.sex??'').trim().toLowerCase();
    await completeGoogleSignIn({
      token,
      email:String(p.email??''),
      name:String(p.name??''),
      picture:String(p.picture??''),
      sub:String(p.sub??''),
      gender:gRaw
    });
  }

  async function handleNativeGoogleUser(user){
    const token=String(user?.authentication?.idToken??user?.idToken??'').trim();
    if(!token)return;
    await completeGoogleSignIn({
      token,
      email:String(user?.email??''),
      name:String(user?.name??''),
      picture:normalizePictureValue(user?.imageUrl),
      sub:String(user?.id??'')
    });
  }

  return{
    clearGoogleSession,
    handleNativeGoogleUser,
    hydrateProfileBlocking,
    handleCredentialResponse,
    loadGoogleSession,
    saveGoogleSession,
    signedInWithEmail
  };
}
