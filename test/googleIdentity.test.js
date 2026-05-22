import test from 'node:test';
import assert from 'node:assert/strict';

import {createGoogleIdentityController} from '../src/googleIdentity.js';

function createState(){
  return{
    language:'zh-HK',
    screen:'home',
    home:{
      google:{
        signedIn:true,
        provider:'google',
        name:'Alice',
        email:'alice@example.com',
        uid:'u1',
        sub:'s1',
        token:'tok',
        picture:'pic',
        pictureLoaded:true,
        gender:'female',
        profileMissing:false
      }
    }
  };
}

function createDoc(){
  const gIdOnload={attrs:new Map(),setAttribute(key,value){this.attrs.set(key,value);},getAttribute(key){return this.attrs.get(key);}};
  const nodes=new Map();
  const googleNameInline={
    innerHTML:'',
    classList:{add(){},remove(){}},
    parentElement:{classList:{add(){},remove(){}}}
  };
  return{
    gIdOnload,
    googleNameInline,
    getElementById:(id)=>{
      if(id==='g_id_onload')return gIdOnload;
      if(id==='google-name-inline')return googleNameInline;
      if(id==='google-login-slot'){
        if(!nodes.has(id))nodes.set(id,{innerHTML:'',getBoundingClientRect:()=>({width:280}),parentElement:{getBoundingClientRect:()=>({width:280})}});
        return nodes.get(id);
      }
      if(id==='google-native-signin'){
        if(!nodes.has(id))nodes.set(id,{addEventListener(type,handler){this[type]=handler;}});
        return nodes.get(id);
      }
      if(id==='apple-signin'){
        if(!nodes.has(id))nodes.set(id,{addEventListener(type,handler){this[type]=handler;}});
        return nodes.get(id);
      }
      if(id==='google-signout'){
        if(!nodes.has(id))nodes.set(id,{addEventListener(type,handler){this[type]=handler;}});
        return nodes.get(id);
      }
      return null;
    },
    querySelector:()=>null,
    createElement:(tag)=>({tag,async:false,src:'',onload:null,onerror:null}),
    head:{appendChild:()=>{}}
  };
}

function createEnglishT(){
  return (key)=>({
    signInWithGoogleOrApple:'Sign in with your Google or Apple account.',
    signInWithGoogle:'Sign in with Google',
    signInWithApple:'Sign in with Apple'
  })[key] ?? key;
}

test('updateGoogleLocale syncs locale from state language', ()=>{
  const state=createState();
  const doc=createDoc();
  const controller=createGoogleIdentityController({
    getState:()=>state,
    getWindow:()=>({google:{accounts:{id:{}}}}),
    getDocument:()=>doc,
    getFirebaseAuth:()=>null,
    getT:()=>createEnglishT(),
    getRender:()=>()=>{},
    signedInWithEmail:()=>false,
    clearGoogleSession:()=>{},
    handleCredentialResponse:()=>{},
    authProviderBadgeHtml:()=>''
  });
  controller.updateGoogleLocale();
  assert.equal(doc.gIdOnload.attrs.get('data-locale'),'zh_HK');
  state.language='en';
  controller.updateGoogleLocale();
  assert.equal(doc.gIdOnload.attrs.get('data-locale'),'en');
});

test('signOutCurrentProvider clears browser google state and calls firebase signOut', ()=>{
  const state=createState();
  let signOutCalled=false;
  let disableAutoSelectCalled=false;
  const controller=createGoogleIdentityController({
    getState:()=>state,
    getWindow:()=>({google:{accounts:{id:{disableAutoSelect:()=>{disableAutoSelectCalled=true;}}}}}),
    getDocument:()=>createDoc(),
    getFirebaseAuth:()=>({signOut:()=>{signOutCalled=true;}}),
    getT:()=>createEnglishT(),
    getRender:()=>()=>{},
    signedInWithEmail:()=>false,
    clearGoogleSession:()=>{},
    handleCredentialResponse:()=>{},
    authProviderBadgeHtml:()=>''
  });
  controller.signOutCurrentProvider();
  assert.equal(state.home.google.signedIn,false);
  assert.equal(state.home.google.email,'');
  assert.equal(signOutCalled,true);
  assert.equal(disableAutoSelectCalled,true);
});

test('renderGoogleInline uses native Android button when native auth is enabled', async()=>{
  const state=createState();
  state.home.google.signedIn=false;
  state.home.google.email='';
  const doc=createDoc();
  let signInCalls=0;
  let appleSignInCalls=0;
  let renderCalls=0;
  const controller=createGoogleIdentityController({
    getState:()=>state,
    getWindow:()=>({}),
    getDocument:()=>doc,
    getFirebaseAuth:()=>null,
    getT:()=>createEnglishT(),
    getRender:()=>()=>{renderCalls+=1;},
    signedInWithEmail:()=>false,
    clearGoogleSession:()=>{},
    nativeGoogleSignIn:async()=>{signInCalls+=1;},
    nativeGoogleSignOut:async()=>{},
    appleSignIn:async()=>{appleSignInCalls+=1;},
    useNativeGoogleAuth:()=>true,
    handleCredentialResponse:()=>{},
    authProviderBadgeHtml:()=>''
  });
  controller.renderGoogleInline();
  assert.match(doc.googleNameInline.innerHTML,/google-native-signin/);
  assert.match(doc.googleNameInline.innerHTML,/apple-signin/);
  assert.match(doc.googleNameInline.innerHTML,/auth-btn-icon-apple/);
  assert.match(doc.googleNameInline.innerHTML,/Sign in with Google/);
  assert.match(doc.googleNameInline.innerHTML,/Sign in with Apple/);
  await doc.getElementById('google-native-signin').click();
  await doc.getElementById('apple-signin').click();
  assert.equal(signInCalls,1);
  assert.equal(appleSignInCalls,1);
  assert.equal(renderCalls,2);
});

test('renderGoogleInline renders google button slot on web when GSI is available', ()=>{
  const state=createState();
  state.home.google.signedIn=false;
  state.home.google.email='';
  const doc=createDoc();
  doc.gIdOnload.setAttribute('data-client_id','client-id');
  let renderButtonArgs=null;
  const controller=createGoogleIdentityController({
    getState:()=>state,
    getWindow:()=>({google:{accounts:{id:{initialize:()=>{},renderButton:(slot,opts)=>{renderButtonArgs={slot,opts};slot.innerHTML='rendered-google';}}}}}),
    getDocument:()=>doc,
    getFirebaseAuth:()=>null,
    getT:()=>createEnglishT(),
    getRender:()=>()=>{},
    signedInWithEmail:()=>false,
    clearGoogleSession:()=>{},
    appleSignIn:async()=>{},
    useNativeGoogleAuth:()=>false,
    handleCredentialResponse:()=>{},
    authProviderBadgeHtml:()=>'google-icon'
  });
  controller.renderGoogleInline();
  assert.match(doc.googleNameInline.innerHTML,/google-login-slot/);
  assert.match(doc.googleNameInline.innerHTML,/apple-signin/);
  assert.equal(renderButtonArgs?.slot?.innerHTML,'rendered-google');
  assert.ok(renderButtonArgs?.opts?.width>=140);
});

test('renderGoogleInline shows apple badge when signed in with apple', ()=>{
  const state=createState();
  state.home.google.provider='apple';
  const doc=createDoc();
  const controller=createGoogleIdentityController({
    getState:()=>state,
    getWindow:()=>({}),
    getDocument:()=>doc,
    getFirebaseAuth:()=>null,
    getT:()=>createEnglishT(),
    getRender:()=>()=>{},
    signedInWithEmail:()=>true,
    clearGoogleSession:()=>{},
    nativeGoogleSignIn:async()=>{},
    nativeGoogleSignOut:async()=>{},
    appleSignIn:async()=>{},
    useNativeGoogleAuth:()=>false,
    handleCredentialResponse:()=>{},
    authProviderBadgeHtml:()=>'badge'
  });
  controller.renderGoogleInline();
  assert.match(doc.googleNameInline.innerHTML,/auth-provider-apple/);
  assert.match(doc.googleNameInline.innerHTML,/badge/);
});

test('renderGoogleInline shows google badge when signed in with google', ()=>{
  const state=createState();
  state.home.google.provider='google';
  const doc=createDoc();
  const controller=createGoogleIdentityController({
    getState:()=>state,
    getWindow:()=>({}),
    getDocument:()=>doc,
    getFirebaseAuth:()=>null,
    getT:()=>createEnglishT(),
    getRender:()=>()=>{},
    signedInWithEmail:()=>true,
    clearGoogleSession:()=>{},
    handleCredentialResponse:()=>{},
    authProviderBadgeHtml:()=>'badge'
  });
  controller.renderGoogleInline();
  assert.match(doc.googleNameInline.innerHTML,/auth-provider-badge auth-provider-google/);
  assert.match(doc.googleNameInline.innerHTML,/badge/);
  assert.doesNotMatch(doc.googleNameInline.innerHTML,/auth-provider-label/);
});

test('renderGoogleInline shows restoring score status while hydrating', ()=>{
  const state=createState();
  state.home.google.hydrating=true;
  const doc=createDoc();
  const controller=createGoogleIdentityController({
    getState:()=>state,
    getWindow:()=>({}),
    getDocument:()=>doc,
    getFirebaseAuth:()=>null,
    getT:()=>createEnglishT(),
    getRender:()=>()=>{},
    signedInWithEmail:()=>true,
    clearGoogleSession:()=>{},
    handleCredentialResponse:()=>{},
    authProviderBadgeHtml:()=>''
  });
  controller.renderGoogleInline();
  assert.match(doc.googleNameInline.innerHTML,/auth-status-loading/);
  assert.match(doc.googleNameInline.innerHTML,/restoringScore/);
});
