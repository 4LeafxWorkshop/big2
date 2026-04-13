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
  return{
    gIdOnload,
    getElementById:(id)=>id==='g_id_onload'?gIdOnload:null,
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
