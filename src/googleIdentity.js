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
  appleSignIn=async()=>false,
  useNativeGoogleAuth=()=>false,
  useWebGoogleFallbackButton=()=>false,
  handleCredentialResponse,
  authProviderBadgeHtml
}){
  let googleInlineRetryTimer=null;
  let googleIdentityInitialized=false;
  let googleIdentityPrompted=false;
  let googleScriptReloading=false;
  let googlePromptAfterLoad=false;

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
    script.onload=()=>{
      googleScriptReloading=false;
      renderGoogleInline();
    };
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
    const currentProvider=String(state.home.google?.provider??'').trim().toLowerCase();
    state.home.google={signedIn:false,provider:'',name:'',email:'',uid:'',sub:'',token:'',picture:'',pictureLoaded:false,gender:'',profileMissing:false,hydrating:false};
    clearGoogleSession();
    googleIdentityPrompted=false;
    if(currentProvider==='google'){
      try{void nativeGoogleSignOut();}catch{}
    }
    try{getWindow().google?.accounts?.id?.disableAutoSelect?.();}catch{}
    try{getFirebaseAuth()?.signOut?.();}catch{}
  }

  function renderAppleSignInButton(doc,afterClick){
    const appleButton=doc.getElementById('apple-signin');
    appleButton?.addEventListener('click',()=>{
      void appleSignIn().then(()=>{
        afterClick?.();
      }).catch(()=>{
      });
    });
    return appleButton;
  }

  function appleButtonIconHtml(){
    return `<span class="auth-btn-icon auth-btn-icon-apple" aria-hidden="true"></span>`;
  }

  function googleButtonIconHtml(){
    return `<span class="auth-btn-icon auth-btn-icon-google" aria-hidden="true"><span class="auth-btn-icon-google-tile">${authProviderBadgeHtml('google')}</span></span>`;
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
      const provider=String(state.home.google?.provider??'google').trim().toLowerCase()==='apple'?'apple':'google';
      const label=provider==='apple'?'Apple':'Google';
      const profileMissing=Boolean(state.home.google?.profileMissing);
      const hydrating=Boolean(state.home.google?.hydrating);
      const t=getT();
      const status=profileMissing
        ?`<span class="auth-status auth-status-warning">${t('profileMissing')}</span>`
        :(hydrating?`<span class="auth-status auth-status-loading">${t('restoringScore')}</span>`:'');
      const actionLabel=profileMissing?t('signInAgain'):t('signOut');
      const actionClass=profileMissing?'auth-btn-retry':'auth-btn-signout';
      const providerMarkup=`<span class="auth-provider-badge auth-provider-${provider}" role="img" aria-label="${label}" title="${label}">${authProviderBadgeHtml(provider)}</span>`;
      slot.innerHTML=`<div class="auth-inline-row">${providerMarkup}${status}<button id="google-signout" class="auth-btn ${actionClass}">${actionLabel}</button></div>`;
      doc.getElementById('google-signout')?.addEventListener('click',()=>{signOutCurrentProvider();getRender()();});
      googlePromptAfterLoad=false;
      return;
    }
    slot.classList.remove('signed-in');
    nameRow?.classList.remove('signed-in-auth');
    const t=getT();
    const googleLabel=t('signInWithGoogle');
    const appleLabel=t('signInWithApple');
    if(useWebGoogleFallbackButton()){
      slot.innerHTML=`<div class="login-row"><button id="google-web-signin" class="auth-btn login-btn auth-btn-google">${googleButtonIconHtml()}<span>${googleLabel}</span></button><button id="apple-signin" class="auth-btn login-btn auth-btn-apple">${appleButtonIconHtml()}<span>${appleLabel}</span></button></div><div id="google-login-slot"></div>`;
      doc.getElementById('google-web-signin')?.addEventListener('click',()=>{
        const hasGsi=Boolean(getWindow().google?.accounts?.id&&ensureGoogleIdentityInitialized());
        if(hasGsi){
          promptGoogleIdentityIfNeeded();
          return;
        }
        googlePromptAfterLoad=true;
        reloadGoogleScriptForLocale();
      });
      renderAppleSignInButton(doc,()=>getRender()());
      return;
    }
    if(useNativeGoogleAuth()){
      slot.innerHTML=`<div class="login-row"><button id="google-native-signin" class="auth-btn login-btn auth-btn-google">${googleButtonIconHtml()}<span>${googleLabel}</span></button><button id="apple-signin" class="auth-btn login-btn auth-btn-apple">${appleButtonIconHtml()}<span>${appleLabel}</span></button></div>`;
      doc.getElementById('google-native-signin')?.addEventListener('click',()=>{
        void nativeGoogleSignIn().then(()=>{
          getRender()();
        }).catch(()=>{
        });
      });
      renderAppleSignInButton(doc,()=>getRender()());
      return;
    }
    const hasGsi=Boolean(getWindow().google?.accounts?.id&&ensureGoogleIdentityInitialized());
    slot.innerHTML=`<div class="login-row"><div id="google-login-slot" class="google-login-slot"></div><button id="apple-signin" class="auth-btn login-btn auth-btn-apple">${appleButtonIconHtml()}<span>${appleLabel}</span></button></div>`;
    const gSlot=doc.getElementById('google-login-slot');
    const fallbackGoogleButton=()=>{
      if(!gSlot)return;
      gSlot.innerHTML=`<button id="google-web-signin" class="auth-btn login-btn auth-btn-google">${googleButtonIconHtml()}<span>${googleLabel}</span></button>`;
      doc.getElementById('google-web-signin')?.addEventListener('click',()=>{
        googlePromptAfterLoad=true;
        reloadGoogleScriptForLocale();
      });
    };
    if(hasGsi&&gSlot){
      try{
        const width=Math.max(140,Math.floor((gSlot.parentElement?.getBoundingClientRect?.()?.width??gSlot.getBoundingClientRect?.()?.width??0)));
        getWindow().google.accounts.id.renderButton(gSlot,{theme:'filled_blue',size:'large',text:'signin_with',shape:'square',logo_alignment:'left',width});
        googlePromptAfterLoad=false;
        promptGoogleIdentityIfNeeded();
      }catch{
        fallbackGoogleButton();
      }
    }else{
      fallbackGoogleButton();
    }
    renderAppleSignInButton(doc,()=>getRender()());
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
