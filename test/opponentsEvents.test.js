import test from 'node:test';
import assert from 'node:assert/strict';

import {createOpponentsEventsBinder} from '../src/opponentsEvents.js';

function makeElement(){
  const listeners=new Map();
  return {
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
    }
  };
}

test('opponents binder returns to home screen', async()=>{
  const back=makeElement();
  const state={screen:'opponents'};
  let renderCount=0;
  const bind=createOpponentsEventsBinder({
    documentRef:()=>({
      getElementById(id){
        return id==='opponents-back'?back:null;
      }
    })
  });
  bind({
    state,
    render:()=>{renderCount+=1;}
  });
  await back.dispatch('click');
  assert.equal(state.screen,'home');
  assert.equal(renderCount,1);
});
