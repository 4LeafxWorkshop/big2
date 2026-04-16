import test from 'node:test';
import assert from 'node:assert/strict';

import {createServiceBellController} from '../src/serviceBell.js';

class MockElement {
  constructor(tagName,doc){
    this.tagName=tagName.toUpperCase();
    this.doc=doc;
    this.children=[];
    this.parentElement=null;
    this.attributes=new Map();
    this.dataset={};
    this.style={setProperty:()=>{},removeProperty:()=>{}};
    this.classList={
      values:new Set(),
      add:(...tokens)=>tokens.forEach((token)=>this.classList.values.add(token)),
      remove:(...tokens)=>tokens.forEach((token)=>this.classList.values.delete(token)),
      contains:(token)=>this.classList.values.has(token)
    };
    this._innerHTML='';
    this.id='';
  }

  set innerHTML(value){
    this._innerHTML=String(value??'');
    this.children=[];
    if(this._innerHTML.includes('service-bell-hero')&&this._innerHTML.includes('service-bell-food-layer')){
      const hero=new MockElement('img',this.doc);
      hero.classList.add('service-bell-hero');
      const layer=new MockElement('div',this.doc);
      layer.classList.add('service-bell-food-layer');
      this.appendChild(hero);
      this.appendChild(layer);
    }
  }

  get innerHTML(){
    return this._innerHTML;
  }

  setAttribute(name,value){
    const text=String(value??'');
    this.attributes.set(name,text);
    if(name==='id')this.id=text;
  }

  getAttribute(name){
    return this.attributes.get(name)??null;
  }

  appendChild(node){
    node.parentElement=this;
    this.children.push(node);
    if(node.id)this.doc.index.set(node.id,node);
    return node;
  }

  remove(){
    const parent=this.parentElement;
    if(parent){
      parent.children=parent.children.filter((child)=>child!==this);
    }
    if(this.id)this.doc.index.delete(this.id);
    this.parentElement=null;
  }

  querySelector(selector){
    if(selector==='.service-bell-food-layer')return this.children.find((child)=>child.classList.contains('service-bell-food-layer'))??null;
    if(selector==='.service-bell-hero')return this.children.find((child)=>child.classList.contains('service-bell-hero'))??null;
    if(selector==='.service-bell-food')return this.children.find((child)=>child.classList.contains('service-bell-food'))??null;
    return null;
  }
}

function createMockDoc(){
  const doc={
    index:new Map(),
    body:null,
    createElement:(tag)=>new MockElement(tag,doc),
    getElementById:(id)=>doc.index.get(id)??null
  };
  doc.body=new MockElement('body',doc);
  return doc;
}

function createMockWindow(){
  const timers=new Map();
  let nextId=1;
  return{
    timers,
    setTimeout:(fn)=>{const id=nextId++;timers.set(id,fn);return id;},
    clearTimeout:(id)=>{timers.delete(id);},
    requestAnimationFrame:(fn)=>{fn();return 1;},
    cancelAnimationFrame:()=>{}
  };
}

test('service bell triggers sound, spawn, and cleanup', ()=>{
  const doc=createMockDoc();
  const win=createMockWindow();
  const audioLog=[];
  let unlockCount=0;
  const controller=createServiceBellController({
    documentRef:()=>doc,
    windowRef:()=>win,
    withBase:(path)=>`/base/${path}`,
    unlockAudio:()=>{unlockCount+=1;},
    getSoundEnabled:()=>true,
    createAudio:(src)=>({
      src,
      preload:'',
      playsInline:false,
      volume:1,
      currentTime:0,
      play(){audioLog.push(src);return Promise.resolve();}
    }),
    random:()=>{
      const values=[0.0,0.0,0.25];
      return values[audioLog.length]??0.0;
    }
  });

  controller.sync({active:true,portraitMode:true});
  const host=doc.getElementById('service-bell-layer');
  assert.ok(host);
  assert.equal(host.dataset.orientation,'portrait');
  assert.ok(doc.body.children.includes(host));
  assert.equal(host.classList.contains('is-ready'),false);

  const spawned=controller.trigger();
  assert.equal(spawned,true);
  assert.equal(unlockCount>0,true);
  assert.match(audioLog[0],/audio\/foods\/bell\.mp3$/);
  assert.equal(host.classList.contains('is-ready'),true);
  const layer=host.querySelector('.service-bell-food-layer');
  assert.equal(layer.children.length,1);
  assert.match(layer.children[0].dataset.slot,/tl|tr|ml|mr/);

  for(const timer of win.timers.values())timer?.();
  assert.match(audioLog[1],/audio\/foods\/.*_voice\.mp3$/);

  controller.sync({active:false,portraitMode:true});
  assert.equal(doc.body.children.length,0);
});
