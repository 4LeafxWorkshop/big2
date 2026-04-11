export function createConfigEventsBinder({documentRef=()=>document}={}){
  return function bindConfigEvents({
    state,
    render,
    markComboActive,
    difficultyIndex,
    backOptions,
    bindBackCarousel,
    bindSoundToggle,
    bindCalloutDisplayToggle,
    bindEmoteDisplayToggle
  }){
    const doc=documentRef();
    doc.getElementById('config-back')?.addEventListener('click',()=>{
      const target=state.screenBeforeConfig||'home';
      state.screen=target;
      render();
    });
    const valueFromIndex=(index)=>{
      if(index<=0)return'easy';
      if(index>=2)return'hard';
      return'normal';
    };
    const syncDifficultySlider=(value)=>{
      const index=difficultyIndex(value);
      state.home.aiDifficulty=value;
      doc.getElementById('config-difficulty-slider')?.style.setProperty('--difficulty-index',`${index}`);
      const slider=doc.querySelector('#config-difficulty-slider .difficulty-slider');
      if(slider&&typeof slider==='object'&&'value' in slider)slider.value=String(index);
    };
    doc.querySelector('#config-difficulty-slider .difficulty-slider')?.addEventListener('input',(e)=>{
      const target=e.currentTarget;
      if(!target||typeof target!=='object'||!('value' in target))return;
      syncDifficultySlider(valueFromIndex(Number(target.value)));
    });
    doc.querySelectorAll('#config-back-combo .combo-btn').forEach((btn)=>btn.addEventListener('click',()=>{
      const value=btn.getAttribute('data-value');
      if(!value||!backOptions.some((option)=>option.value===value))return;
      state.home.backColor=value;
      markComboActive('config-back-combo',state.home.backColor);
    }));
    bindBackCarousel('config-back-combo');
    bindSoundToggle('config-sound-slider');
    bindCalloutDisplayToggle('config-callout-display-slider');
    bindEmoteDisplayToggle('config-emote-display-slider');
  };
}
