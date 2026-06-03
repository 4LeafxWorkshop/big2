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
  const HYDRATE_RETRY_DELAY_MS=320;

  function wait(ms){
    return new Promise((resolve)=>setTimeout(resolve,ms));
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
    while(true){
      try{
        const result=await hydrateProfileFromCloudByIdentity(currentLeaderboardIdentity());
        const status=normalizeHydrateResult(result);
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
        // Keep waiting until Firebase responds.
      }
      await wait(HYDRATE_RETRY_DELAY_MS);
    }
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
      const provider=String(parsed?.provider??'google').trim().toLowerCase()==='apple'?'apple':'google';
      if(!email){
        console.debug('[google-picture] session-empty',{sessionKey});
        return false;
      }
      const state=getState();
      state.home.google={...state.home.google,signedIn:true,provider,email,hydrating:true,profileMissing:false};
      const cached=applyCachedGoogleProfileFromStore(email);
      console.debug('[google-picture] session-restore',{email,cached});
      const firebaseAuth=getFirebaseAuth();
      const authPicture=resolveAuthUserPicture(firebaseAuth?.currentUser);
      if(authPicture){
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
      const provider=String(state.home.google.provider??'google').trim().toLowerCase()==='apple'?'apple':'google';
      if(!email){
        storage.removeItem(sessionKey);
        return;
      }
      storage.setItem(sessionKey,JSON.stringify({email,provider}));
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

  function resolveAuthUserPicture(user){
    if(!user)return'';
    const providerPicture=Array.isArray(user?.providerData)
      ?user.providerData.map((provider)=>normalizePictureValue(provider?.photoURL)).find(Boolean)
      :'';
    return normalizePictureValue(user?.photoURL??providerPicture??user?.reloadUserInfo?.photoUrl);
  }

  async function completeProviderSignIn({
    provider='google',
    token='',
    email='',
    name='',
    picture='',
    sub='',
    gender='',
    user=null
  }={}){
    const state=getState();
    provider=String(provider??'google').trim().toLowerCase()==='apple'?'apple':'google';
    token=String(token??'').trim();
    const tokenPayload=parseJwtPayload?.(token)??{};
    let firebaseUid=String(state.home.google?.uid??'').trim();
    initFirebaseIfReady();
    try{
      const fb=getWindow().firebase;
      const firebaseAuth=getFirebaseAuth();
      if(user?.uid){
        firebaseUid=String(user.uid).trim().slice(0,128);
        state.home.google.uid=firebaseUid;
        if(!sub)sub=String(user.uid).slice(0,64);
      }
      if(fb?.auth&&firebaseAuth){
        if(provider==='google'&&token){
          const cred=fb.auth.GoogleAuthProvider.credential(token);
          const res=await firebaseAuth.signInWithCredential(cred);
          user=res?.user??user;
          if(user?.uid){
            firebaseUid=String(user.uid).trim().slice(0,128);
            state.home.google.uid=firebaseUid;
            if(!sub)sub=String(user.uid).slice(0,64);
          }
        }
        if(!picture){
          picture=resolveAuthUserPicture(user??firebaseAuth?.currentUser);
        }
      }
    }catch{
    }
    const providedEmail=String(email??'').trim().toLowerCase();
    email=(providedEmail||String(tokenPayload.email??user?.email??'').trim().toLowerCase()).slice(0,120);
    picture=normalizePictureValue(picture)||normalizePictureValue(tokenPayload.picture);
    const providedSub=String(sub??'').trim();
    sub=(providedSub||String(tokenPayload.sub??user?.uid??'').trim()).slice(0,64);
    const providedName=String(name??'').trim();
    name=(providedName||String(user?.displayName??tokenPayload.name??'').trim()).slice(0,18);
    gender=String(gender??'').trim().toLowerCase();
    const googleGender=(gender==='female'||gender==='male')?gender:'';
    const signedIn=Boolean(email||sub||firebaseUid);
    console.debug('[google-picture] sign-in-resolved',{
      provider,
      signedIn,
      email,
      hasTokenPicture:Boolean(normalizePictureValue(tokenPayload.picture)),
      hasIncomingPicture:Boolean(Boolean(picture)),
      hasUserPicture:Boolean(Boolean(normalizePictureValue((tokenPayload?.picture??'')))),
      gender:googleGender||'(none)'
    });
    mergeBrowserGoogleProfile({
      signedIn,
      provider,
      name,
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
      const livePicture=resolveAuthUserPicture(user??getFirebaseAuth()?.currentUser)
        ||normalizePictureValue(tokenPayload.picture)
        ||normalizePictureValue(picture);
      if(livePicture){
        mergeBrowserGoogleProfile({
          picture:livePicture,
          pictureLoaded:false
        });
      }
      preloadGooglePicture();
      const hydrated=await hydrateProfileBlocking();
      if(state.home.google.name)state.home.name=state.home.google.name;
      if(googleGender)state.home.gender=googleGender;
      const storage=getStorage();
      if(storage){
        const emailKey=String(email).trim().toLowerCase().slice(0,120);
        if(emailKey)storage.setItem(sessionKey,JSON.stringify({email:emailKey,provider}));
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
    await completeProviderSignIn({
      provider:'google',
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
    await completeProviderSignIn({
      provider:'google',
      token,
      email:String(user?.email??''),
      name:String(user?.name??''),
      picture:normalizePictureValue(user?.imageUrl),
      sub:String(user?.id??''),
      user
    });
  }

  async function handleFirebaseOAuthUser({provider='google',user=null,email='',name='',picture='',sub='',gender=''}={}){
    await completeProviderSignIn({
      provider,
      email,
      name,
      picture,
      sub,
      gender,
      user
    });
  }

  return{
    clearGoogleSession,
    handleFirebaseOAuthUser,
    handleNativeGoogleUser,
    hydrateProfileBlocking,
    handleCredentialResponse,
    loadGoogleSession,
    saveGoogleSession,
    signedInWithEmail
  };
}
