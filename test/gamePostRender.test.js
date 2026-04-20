import test from 'node:test';
import assert from 'node:assert/strict';

import {runGamePostRender} from '../src/gamePostRender.js';

test('runGamePostRender mounts log sheet, creates log fab, and runs callbacks', ()=>{
  const makeStyle=()=>({
    values:{},
    setProperty(name,value){this.values[name]=value;},
    removeProperty(name){delete this.values[name];}
  });
  const actionStrip={
    children:[],
    appendChild(node){
      this.children.push(node);
      node.parentElement=this;
    }
  };
  const existingSheet={removed:false,remove(){this.removed=true;}};
  const app={
    children:[],
    querySelector(selector){
      if(selector==='.action-strip')return actionStrip;
      if(selector==='#game-log-fab')return null;
      if(selector==='#log-sheet')return existingSheet;
      return null;
    },
    appendChild(node){
      this.children.push(node);
      node.parentElement=this;
    },
    insertAdjacentHTML(position,html){
      this.lastInsert={position,html};
    }
  };
  const bodyAttrs={};
  const removals={overlay:0,debug:0};
  const avatarImg={
    listeners:[],
    addEventListener(type,handler,opts){
      this.listeners.push({type,handler,opts});
    }
  };
  const createdNodes=[];
  const documentStub={
    body:{
      dataset:{tapDebugBound:'1'},
      setAttribute(name,value){bodyAttrs[name]=value;},
      removeAttribute(name){delete bodyAttrs[name];}
    },
    createElement(tag){
      const node={
        tag,
        style:makeStyle(),
        attrs:{},
        parentElement:null,
        offsetWidth:40,
        offsetHeight:24,
        setAttribute(name,value){this.attrs[name]=value;},
        appendChild(){},
        className:'',
        id:'',
        type:'',
        innerHTML:''
      };
      createdNodes.push(node);
      return node;
    },
    getElementById(id){
      if(id==='self-avatar-img')return avatarImg;
      if(id==='web-too-small-overlay')return{remove(){removals.overlay+=1;}};
      if(id==='tap-debug')return{remove(){removals.debug+=1;}};
      return null;
    }
  };
  const rafCalls=[];
  const timeoutCalls=[];
  let roomAiCalls=0;
  let gameEventArgs=null;
  let positioned=0;
  let bound=0;
  let observed=0;
  let confetti=0;
  let discardSync=0;
  let handSync=0;
  let retargets=0;
  const originalDocument=globalThis.document;
  const originalWindow=globalThis.window;
  const originalRaf=globalThis.requestAnimationFrame;
  const originalTimeout=globalThis.setTimeout;
  const originalHTMLElement=globalThis.HTMLElement;
  const originalHTMLImageElement=globalThis.HTMLImageElement;
  globalThis.document=documentStub;
  globalThis.window={innerWidth:1000,innerHeight:700};
  globalThis.HTMLElement=Object;
  globalThis.HTMLImageElement=Object;
  globalThis.requestAnimationFrame=(fn)=>{rafCalls.push(fn);fn();return 1;};
  globalThis.setTimeout=(fn,delay)=>{timeoutCalls.push(delay);fn();return 1;};
  try{
    runGamePostRender({
      app,
      state:{logFab:{x:20,y:30,vw:1000,vh:700}},
      t:(key)=>key,
      v:{mode:'room',gameOver:false},
      arr:[{name:'A'}],
      portraitMode:true,
      logSheetOpen:true,
      logSheetHtml:'<div id="log-sheet"></div>',
      bindGameEvents:(vArg,arrArg)=>{gameEventArgs={vArg,arrArg};},
      positionRoomTopMeta:()=>{positioned+=1;},
      bindRoomTopMetaLayout:()=>{bound+=1;},
      observeDiscardSize:()=>{observed+=1;},
      syncConfettiCanvases:()=>{confetti+=1;},
      syncLandscapeGameHandSizing:()=>{},
      syncDiscardSizeFromHand:()=>{discardSync+=1;},
      syncHandStackMode:()=>{handSync+=1;},
      retargetCalloutTails:()=>{retargets+=1;},
      maybeRunRoomAi:()=>{roomAiCalls+=1;}
    });
  }finally{
    globalThis.document=originalDocument;
    globalThis.window=originalWindow;
    globalThis.requestAnimationFrame=originalRaf;
    globalThis.setTimeout=originalTimeout;
    globalThis.HTMLElement=originalHTMLElement;
    globalThis.HTMLImageElement=originalHTMLImageElement;
  }
  assert.equal(createdNodes.length,1);
  assert.equal(createdNodes[0].id,'game-log-fab');
  assert.equal(actionStrip.children.length,1);
  assert.equal(existingSheet.removed,true);
  assert.equal(app.lastInsert.html,'<div id="log-sheet"></div>');
  assert.equal(bodyAttrs['data-web-too-small'],'0');
  assert.equal(removals.overlay,1);
  assert.equal(removals.debug,1);
  assert.equal('tapDebugBound' in documentStub.body.dataset,false);
  assert.equal(avatarImg.listeners.length,1);
  assert.equal(positioned,3);
  assert.equal(bound,1);
  assert.equal(observed,1);
  assert.equal(confetti,1);
  assert.equal(discardSync,1);
  assert.equal(handSync,1);
  assert.equal(retargets,2);
  assert.deepEqual(timeoutCalls,[80]);
  assert.equal(roomAiCalls,1);
  assert.deepEqual(gameEventArgs,{vArg:{mode:'room',gameOver:false},arrArg:[{name:'A'}]});
});
