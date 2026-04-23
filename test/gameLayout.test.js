import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createDiscardSizeObserver,
  createRoomTopMetaLayoutBinder,
  positionRoomTopMeta,
  retargetCalloutTails,
  syncDiscardSizeFromHand,
  syncHandStackMode
} from '../src/gameLayout.js';

function makeStyle(){
  return {
    values:{},
    setProperty(name,value){
      this.values[name]=value;
    },
    removeProperty(name){
      delete this.values[name];
    }
  };
}

function makeClassList(initial=[]){
  const set=new Set(initial);
  return {
    add(name){set.add(name);},
    remove(...names){for(const name of names)set.delete(name);},
    contains(name){return set.has(name);}
  };
}

test('retargetCalloutTails retargets self bubble tail and sets anchor', ()=>{
  const tail={classList:makeClassList(['tail','tail-north']),style:makeStyle()};
  const bubbleRect={left:20,top:20,width:80,height:30,right:100,bottom:50};
  const avatarRect={left:40,top:70,width:20,height:20,right:60,bottom:90};
  const bubble={
    classList:makeClassList(['play-type-call-self']),
    style:makeStyle(),
    querySelector(selector){return selector==='.tail'?tail:null;},
    getBoundingClientRect(){return bubbleRect;}
  };
  const avatar={getBoundingClientRect(){return avatarRect;}};
  const documentStub={
    querySelectorAll(){return [bubble];},
    querySelector(selector){return selector==='.player-avatar-wrap-self'?avatar:null;},
    getElementById(){return null;}
  };
  const originalHTMLElement=globalThis.HTMLElement;
  globalThis.HTMLElement=Object;
  try{
    retargetCalloutTails({
      documentRef:()=>documentStub,
      windowRef:()=>({innerWidth:200,innerHeight:200}),
      isMobilePointer:()=>false
    });
  }finally{
    globalThis.HTMLElement=originalHTMLElement;
  }
  assert.equal(tail.classList.contains('tail-south'),true);
  assert.equal(tail.style.values['--tail-anchor-x'],'27px');
});

test('retargetCalloutTails centers food callout tails', ()=>{
  const tail={classList:makeClassList(['tail','tail-north']),style:makeStyle()};
  const bubbleRect={left:20,top:20,width:80,height:30,right:100,bottom:50};
  const avatarRect={left:30,top:70,width:20,height:20,right:50,bottom:90};
  const seat={classList:makeClassList(['north']),querySelector(){return avatar;}};
  const bubble={
    classList:makeClassList(['food-callout-seat']),
    style:makeStyle(),
    querySelector(selector){return selector==='.tail'?tail:null;},
    getBoundingClientRect(){return bubbleRect;},
    closest(selector){return selector==='.seat'?seat:null;}
  };
  const avatar={getBoundingClientRect(){return avatarRect;}};
  const documentStub={
    querySelectorAll(){return [bubble];},
    querySelector(selector){return selector==='.player-avatar-wrap-opponent'?avatar:null;},
    getElementById(){return null;}
  };
  const originalHTMLElement=globalThis.HTMLElement;
  globalThis.HTMLElement=Object;
  try{
    retargetCalloutTails({
      documentRef:()=>documentStub,
      windowRef:()=>({innerWidth:200,innerHeight:200}),
      isMobilePointer:()=>false
    });
  }finally{
    globalThis.HTMLElement=originalHTMLElement;
  }
  assert.equal(tail.classList.contains('tail-north'),true);
  assert.equal(tail.style.values['--tail-anchor-x'],'50%');
});

test('syncHandStackMode applies stacked overlap when cards exceed width', ()=>{
  const firstRect={left:0,right:50,width:50};
  const lastRect={left:70,right:120,width:50};
  const handRect={left:0,right:100,width:100};
  const first={getBoundingClientRect(){return firstRect;}};
  const last={getBoundingClientRect(){return lastRect;}};
  const cards=[first,last];
  const hand={
    classList:makeClassList(),
    style:makeStyle(),
    clientWidth:100,
    getBoundingClientRect(){return handRect;},
    querySelectorAll(){return cards;}
  };
  const documentStub={
    querySelector(selector){return selector==='.action-strip .hand'?hand:null;}
  };
  const originalHTMLElement=globalThis.HTMLElement;
  globalThis.HTMLElement=Object;
  try{
    syncHandStackMode({
      documentRef:()=>documentStub,
      windowRef:()=>({
        getComputedStyle:()=>({columnGap:'10px',gap:'10px'})
      })
    });
  }finally{
    globalThis.HTMLElement=originalHTMLElement;
  }
  assert.equal(hand.classList.contains('hand-stacked'),true);
  assert.ok(hand.style.values['--hand-overlap-px']);
});

test('syncHandStackMode leaves fit-to-width hands unstacked', ()=>{
  const firstRect={left:0,right:50,width:50};
  const lastRect={left:80,right:130,width:50};
  const handRect={left:0,right:240,width:240};
  const first={getBoundingClientRect(){return firstRect;}};
  const last={getBoundingClientRect(){return lastRect;}};
  const cards=[first,last];
  const hand={
    classList:makeClassList(),
    style:makeStyle(),
    clientWidth:240,
    getBoundingClientRect(){return handRect;},
    querySelectorAll(){return cards;}
  };
  const documentStub={
    querySelector(selector){return selector==='.action-strip .hand'?hand:null;}
  };
  const originalHTMLElement=globalThis.HTMLElement;
  globalThis.HTMLElement=Object;
  try{
    syncHandStackMode({
      documentRef:()=>documentStub,
      windowRef:()=>({
        getComputedStyle:()=>({columnGap:'10px',gap:'10px'})
      })
    });
  }finally{
    globalThis.HTMLElement=originalHTMLElement;
  }
  assert.equal(hand.classList.contains('hand-stacked'),false);
  assert.equal(hand.style.values['--hand-overlap-px'],undefined);
});

test('syncHandStackMode keeps dense hands stacked instead of enabling horizontal scroll', ()=>{
  const cards=[];
  for(let i=0;i<5;i+=1){
    cards.push({
      getBoundingClientRect(){return {left:i*40,right:i*40+50,width:50};}
    });
  }
  const handRect={left:0,right:100,width:100};
  const hand={
    classList:makeClassList(),
    style:makeStyle(),
    clientWidth:100,
    getBoundingClientRect(){return handRect;},
    querySelectorAll(){return cards;}
  };
  const documentStub={
    querySelector(selector){return selector==='.action-strip .hand'?hand:null;}
  };
  const originalHTMLElement=globalThis.HTMLElement;
  globalThis.HTMLElement=Object;
  try{
    syncHandStackMode({
      documentRef:()=>documentStub,
      windowRef:()=>({
        getComputedStyle:()=>({columnGap:'10px',gap:'10px'})
      })
    });
  }finally{
    globalThis.HTMLElement=originalHTMLElement;
  }
  assert.equal(hand.classList.contains('hand-stacked'),true);
  assert.notEqual(hand.style.values['overflow-x'],'auto');
});

test('positionRoomTopMeta forces inline meta classes', ()=>{
  const tableOverlay={classList:makeClassList(['room-top-meta-center'])};
  const meta={
    classList:makeClassList(['room-top-meta-inline','room-top-meta-panel']),
    closest(selector){return selector==='.room-top-meta-table'?tableOverlay:null;}
  };
  const documentStub={
    querySelector(selector){return selector==='.room-top-meta.room-top-meta-inline'?meta:null;}
  };
  positionRoomTopMeta({documentRef:()=>documentStub});
  assert.equal(tableOverlay.classList.contains('room-top-meta-center'),false);
  assert.equal(meta.classList.contains('room-top-meta-panel'),false);
  assert.equal(meta.classList.contains('room-top-meta-inline'),true);
});

test('createRoomTopMetaLayoutBinder binds resize listeners once', ()=>{
  const events=[];
  const bindRoomTopMetaLayout=createRoomTopMetaLayoutBinder({
    windowRef:()=>({
      addEventListener(type,handler){
        events.push([type,handler]);
      }
    })
  });
  const positioner=()=>{};
  bindRoomTopMetaLayout(positioner);
  bindRoomTopMetaLayout(positioner);
  assert.deepEqual(events.map(([type])=>type),['resize','orientationchange']);
});

test('syncDiscardSizeFromHand mirrors hand card size to discard cards', ()=>{
  const handCard={getBoundingClientRect(){return {width:42.5,height:60.75};}};
  const rootStyle=makeStyle();
  const documentStub={
    documentElement:{style:rootStyle},
    querySelector(selector){return selector==='.action-strip .hand .hand-card'?handCard:null;},
    querySelectorAll(){return[];}
  };
  const originalHTMLElement=globalThis.HTMLElement;
  globalThis.HTMLElement=Object;
  try{
    syncDiscardSizeFromHand({
      state:{screen:'game'},
      documentRef:()=>documentStub
    });
  }finally{
    globalThis.HTMLElement=originalHTMLElement;
  }
  assert.equal(rootStyle.values['--discard-card-w'],'42.50px');
  assert.equal(rootStyle.values['--discard-card-h'],'60.75px');
});

test('createDiscardSizeObserver reuses one resize observer', ()=>{
  const observed=[];
  let constructions=0;
  class ResizeObserverStub{
    constructor(callback){
      constructions+=1;
      this.callback=callback;
    }
    observe(node){
      observed.push(node);
    }
  }
  const controller=createDiscardSizeObserver({
    windowRef:()=>({ResizeObserver:ResizeObserverStub})
  });
  const handA={id:'a'};
  const handB={id:'b'};
  const onResize=()=>{};
  controller.observe(handA,onResize);
  controller.observe(handB,onResize);
  assert.equal(constructions,1);
  assert.deepEqual(observed,[handA,handB]);
});
