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
      if(id==='google-native-signin'){
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

test('updateGoogleLocale syncs locale from state language', ()=>{
  const state=createState();
  const doc=createDoc();
  const controller=createGoogleIdentityController({
    getState:()=>state,
    getWindow:()=>({google:{accounts:{id:{}}}}),
    getDocument:()=>doc,
    getFirebaseAuth:()=>null,
    getT:()=>((x)=>x),
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
    getT:()=>((x)=>x),
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
  let renderCalls=0;
  const controller=createGoogleIdentityController({
    getState:()=>state,
    getWindow:()=>({}),
    getDocument:()=>doc,
    getFirebaseAuth:()=>null,
    getT:()=>((x)=>x),
    getRender:()=>()=>{renderCalls+=1;},
    signedInWithEmail:()=>false,
    clearGoogleSession:()=>{},
    nativeGoogleSignIn:async()=>{signInCalls+=1;},
    nativeGoogleSignOut:async()=>{},
    useNativeGoogleAuth:()=>true,
    handleCredentialResponse:()=>{},
    authProviderBadgeHtml:()=>''
  });
  controller.renderGoogleInline();
  assert.match(doc.googleNameInline.innerHTML,/google-native-signin/);
  await doc.getElementById('google-native-signin').click();
  assert.equal(signInCalls,1);
  assert.equal(renderCalls,1);
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
    getT:()=>((x)=>x),
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
