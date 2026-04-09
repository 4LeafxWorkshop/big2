import test from 'node:test';
import assert from 'node:assert/strict';

import {createConfigEventsBinder} from '../src/configEvents.js';

function makeElement({attrs={}}={}){
  const listeners=new Map();
  return {
    style:{
      values:{},
      setProperty(name,val){
        this.values[name]=val;
      }
    },
    addEventListener(type,handler){
      const bucket=listeners.get(type)??[];
      bucket.push(handler);
      listeners.set(type,bucket);
    },
    async dispatch(type,event={}){
      const bucket=listeners.get(type)??[];
      for(const handler of bucket){
        await handler({
          preventDefault(){},
          stopPropagation(){},
          ...event
        });
      }
    },
    getAttribute(name){
      return Object.hasOwn(attrs,name)?attrs[name]:null;
    }
  };
}

function makeDocument({byId={},bySelector={}}={}){
  return {
    getElementById(id){
      return byId[id]??null;
    },
    querySelectorAll(selector){
      return bySelector[selector]??[];
    }
  };
}

function bindWith(overrides={}){
  const doc=overrides.document??makeDocument();
  const bind=createConfigEventsBinder({documentRef:()=>doc});
  const state=overrides.state??{
    screen:'config',
    screenBeforeConfig:'home',
    home:{aiDifficulty:'normal',backColor:'blue'}
  };
  bind({
    state,
    render:overrides.render??(()=>{}),
    markComboActive:overrides.markComboActive??(()=>{}),
    difficultyIndex:overrides.difficultyIndex??(()=>0),
    backOptions:overrides.backOptions??[{value:'blue'},{value:'red'}],
    bindBackCarousel:overrides.bindBackCarousel??(()=>{}),
    bindSoundToggle:overrides.bindSoundToggle??(()=>{}),
    bindCalloutDisplayToggle:overrides.bindCalloutDisplayToggle??(()=>{}),
    bindEmoteDisplayToggle:overrides.bindEmoteDisplayToggle??(()=>{})
  });
  return {state,doc};
}

test('config binder returns to previous screen', async()=>{
  const back=makeElement();
  let renderCount=0;
  const {state}=bindWith({
    document:makeDocument({byId:{'config-back':back}}),
    state:{screen:'config',screenBeforeConfig:'game',home:{aiDifficulty:'normal',backColor:'blue'}},
    render:()=>{renderCount+=1;}
  });
  await back.dispatch('click');
  assert.equal(state.screen,'game');
  assert.equal(renderCount,1);
});

test('config binder updates difficulty and toggle bindings', async()=>{
  const difficultyButton=makeElement({attrs:{'data-value':'hard'}});
  const combo=makeElement();
  const marks=[];
  const backCarouselCalls=[];
  const soundCalls=[];
  const calloutCalls=[];
  const emoteCalls=[];
  const {state}=bindWith({
    document:makeDocument({
      byId:{'config-difficulty-combo':combo},
      bySelector:{'#config-difficulty-combo .combo-btn':[difficultyButton]}
    }),
    difficultyIndex:(value)=>value==='hard'?2:0,
    markComboActive:(id,value)=>{marks.push([id,value]);},
    bindBackCarousel:(id)=>{backCarouselCalls.push(id);},
    bindSoundToggle:(id)=>{soundCalls.push(id);},
    bindCalloutDisplayToggle:(id)=>{calloutCalls.push(id);},
    bindEmoteDisplayToggle:(id)=>{emoteCalls.push(id);}
  });
  await difficultyButton.dispatch('click');
  assert.equal(state.home.aiDifficulty,'hard');
  assert.equal(combo.style.values['--difficulty-index'],'2');
  assert.deepEqual(marks,[['config-difficulty-combo','hard']]);
  assert.deepEqual(backCarouselCalls,['config-back-combo']);
  assert.deepEqual(soundCalls,['config-sound-combo']);
  assert.deepEqual(calloutCalls,['config-callout-display-combo']);
  assert.deepEqual(emoteCalls,['config-emote-display-combo']);
});

test('config binder updates card back selection when option is valid', async()=>{
  const backButton=makeElement({attrs:{'data-value':'red'}});
  const marks=[];
  const {state}=bindWith({
    document:makeDocument({
      bySelector:{'#config-back-combo .combo-btn':[backButton]}
    }),
    markComboActive:(id,value)=>{marks.push([id,value]);}
  });
  await backButton.dispatch('click');
  assert.equal(state.home.backColor,'red');
  assert.deepEqual(marks,[['config-back-combo','red']]);
});
