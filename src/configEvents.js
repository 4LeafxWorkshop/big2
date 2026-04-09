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
    doc.querySelectorAll('#config-difficulty-combo .combo-btn').forEach((btn)=>btn.addEventListener('click',()=>{
      const value=btn.getAttribute('data-value');
      if(!value)return;
      state.home.aiDifficulty=value;
      markComboActive('config-difficulty-combo',value);
      doc.getElementById('config-difficulty-combo')?.style.setProperty('--difficulty-index',`${difficultyIndex(value)}`);
    }));
    doc.querySelectorAll('#config-back-combo .combo-btn').forEach((btn)=>btn.addEventListener('click',()=>{
      const value=btn.getAttribute('data-value');
      if(!value||!backOptions.some((option)=>option.value===value))return;
      state.home.backColor=value;
      markComboActive('config-back-combo',state.home.backColor);
    }));
    bindBackCarousel('config-back-combo');
    bindSoundToggle('config-sound-combo');
    bindCalloutDisplayToggle('config-callout-display-combo');
    bindEmoteDisplayToggle('config-emote-display-combo');
  };
}
