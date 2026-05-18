export function createGoogleIdentityController({
  getState,
  getWindow=()=>window,
  getDocument=()=>document,
  getFirebaseAuth=()=>null,
  getT=()=>((x)=>x),
  getRender=()=>()=>{},
  signedInWithEmail,
  clearGoogleSession,
  nativeGoogleSignIn=async()=>false,
  nativeGoogleSignOut=async()=>false,
  useNativeGoogleAuth=()=>false,
  useWebGoogleFallbackButton=()=>false,
  handleCredentialResponse,
  authProviderBadgeHtml
}){
  let googleInlineRetryTimer=null;
  let googleIdentityInitialized=false;
  let googleIdentityPrompted=false;
  let googleScriptReloading=false;

  function updateGoogleLocale(){
    const state=getState();
    const lang=state.language==='en'?'en':'zh_HK';
    const host=getDocument().getElementById('g_id_onload');
    if(host)host.setAttribute('data-locale',lang);
  }

  function reloadGoogleScriptForLocale(){
    if(googleScriptReloading)return;
    googleScriptReloading=true;
    googleIdentityInitialized=false;
    googleIdentityPrompted=false;
    updateGoogleLocale();
    try{getWindow().google?.accounts?.id?.cancel?.();}catch{}
    const existing=getDocument().querySelector('script[src*="accounts.google.com/gsi/client"]');
    if(existing)existing.remove();
    const state=getState();
    const lang=state.language==='en'?'en':'zh-HK';
    const script=getDocument().createElement('script');
    script.src=`https://accounts.google.com/gsi/client?hl=${lang}`;
    script.async=true;
    script.onload=()=>{googleScriptReloading=false;renderGoogleInline();};
    script.onerror=()=>{googleScriptReloading=false;};
    getDocument().head.appendChild(script);
  }

  function ensureGoogleIdentityInitialized(){
    if(googleIdentityInitialized)return true;
    const idApi=getWindow().google?.accounts?.id;
    if(!idApi)return false;
    const clientId=String(getDocument().getElementById('g_id_onload')?.getAttribute('data-client_id')??'').trim();
    if(!clientId)return false;
    try{
      idApi.initialize({client_id:clientId,callback:handleCredentialResponse});
      googleIdentityInitialized=true;
      return true;
    }catch{
      return false;
    }
  }

  function promptGoogleIdentityIfNeeded(){
    if(googleIdentityPrompted||signedInWithEmail())return;
    const idApi=getWindow().google?.accounts?.id;
    if(!idApi||!ensureGoogleIdentityInitialized())return;
    googleIdentityPrompted=true;
    try{
      idApi.prompt();
    }catch{
      googleIdentityPrompted=false;
    }
  }

  function signOutCurrentProvider(){
    const state=getState();
    state.home.google={signedIn:false,provider:'',name:'',email:'',uid:'',sub:'',token:'',picture:'',pictureLoaded:false,gender:'',profileMissing:false,hydrating:false};
    clearGoogleSession();
    googleIdentityPrompted=false;
    try{void nativeGoogleSignOut();}catch{}
    try{getWindow().google?.accounts?.id?.disableAutoSelect?.();}catch{}
    try{getFirebaseAuth()?.signOut?.();}catch{}
  }

  function queueGoogleInlineRender(renderGoogleInline){
    getWindow().setTimeout(()=>{if(getState().screen==='home')renderGoogleInline();},0);
    getWindow().requestAnimationFrame(()=>{if(getState().screen==='home')renderGoogleInline();});
  }

  function renderGoogleInline(){
    if(googleInlineRetryTimer){
      getWindow().clearTimeout(googleInlineRetryTimer);
      googleInlineRetryTimer=null;
    }
    const doc=getDocument();
    const state=getState();
    const slot=doc.getElementById('google-name-inline')??doc.getElementById('google-inline');
    if(!slot)return;
    const nameRow=slot.parentElement;
    if(signedInWithEmail()){
      slot.classList.add('signed-in');
      nameRow?.classList.add('signed-in-auth');
      const label='Google';
      const profileMissing=Boolean(state.home.google?.profileMissing);
      const hydrating=Boolean(state.home.google?.hydrating);
      const t=getT();
      const status=profileMissing
        ?`<span class="auth-status auth-status-warning">${t('profileMissing')}</span>`
        :(hydrating?`<span class="auth-status auth-status-loading">${t('restoringScore')}</span>`:'');
      const actionLabel=profileMissing?t('signInAgain'):t('signOut');
      const actionClass=profileMissing?'auth-btn-retry':'auth-btn-signout';
      slot.innerHTML=`<span class="auth-provider-badge auth-provider-google" role="img" aria-label="${label}" title="${label}">${authProviderBadgeHtml('google')}</span>${status}<button id="google-signout" class="auth-btn ${actionClass}">${actionLabel}</button>`;
      doc.getElementById('google-signout')?.addEventListener('click',()=>{signOutCurrentProvider();getRender()();});
      return;
    }
    slot.classList.remove('signed-in');
    nameRow?.classList.remove('signed-in-auth');
    if(useWebGoogleFallbackButton()){
      slot.innerHTML=`<button id="google-web-signin" class="auth-btn auth-btn-google">Google</button><div id="google-login-slot"></div>`;
      doc.getElementById('google-web-signin')?.addEventListener('click',()=>{
        const hasGsi=Boolean(getWindow().google?.accounts?.id&&ensureGoogleIdentityInitialized());
        if(hasGsi){
          promptGoogleIdentityIfNeeded();
          return;
        }
        reloadGoogleScriptForLocale();
      });
      return;
    }
    if(useNativeGoogleAuth()){
      slot.innerHTML=`<button id="google-native-signin" class="auth-btn auth-btn-google">Google</button>`;
      doc.getElementById('google-native-signin')?.addEventListener('click',()=>{
        void nativeGoogleSignIn().then(()=>{
          getRender()();
        }).catch(()=>{
        });
      });
      return;
    }
    const hasGsi=Boolean(getWindow().google?.accounts?.id&&ensureGoogleIdentityInitialized());
    slot.innerHTML=`<div id="google-login-slot"></div>`;
    const gSlot=doc.getElementById('google-login-slot');
    if(hasGsi){
      if(gSlot){
        try{
          getWindow().google.accounts.id.renderButton(gSlot,{theme:'filled_blue',size:'medium',text:'signin_with',shape:'square',logo_alignment:'left',width:140});
        }catch{
          gSlot.innerHTML='';
        }
      }
      promptGoogleIdentityIfNeeded();
    }else{
      if(gSlot)gSlot.innerHTML='';
    }
  }

  function onGoogleScriptLoaded(renderGoogleInline){
    if(getState().screen==='home')queueGoogleInlineRender(renderGoogleInline);
  }

  function resetGoogleIdentityState(){
    googleIdentityInitialized=false;
    googleIdentityPrompted=false;
  }

    return{
    ensureGoogleIdentityInitialized,
    onGoogleScriptLoaded,
    promptGoogleIdentityIfNeeded,
    reloadGoogleScriptForLocale,
    renderGoogleInline,
    resetGoogleIdentityState,
    signOutCurrentProvider,
    updateGoogleLocale
  };
}
