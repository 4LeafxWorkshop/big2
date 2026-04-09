export function createCardUiHelpers(deps){
  const {
    RANKS,
    SUITS,
    withBase,
    isMobilePointer,
    cardId,
    backAssetFile,
    getBackColor,
    getCardBackAlt
  }=deps;

  const EMOTE_STICKERS=[
    {id:'cool',file:'emote-cool.png'},
    {id:'throw',file:'emote-throw.png'},
    {id:'rude',file:'emote-rude.png'},
    {id:'sweat',file:'emote-sweat.png'},
    {id:'rage',file:'emote-rage.png'},
    {id:'smash',file:'emote-smash.png'},
    {id:'fire',file:'emote-fire.png'},
    {id:'think',file:'emote-think.png'},
    {id:'cry',file:'emote-cry.png'},
    {id:'cheers',file:'emote-cheers.png'},
    {id:'thumbs',file:'emote-thumbs.png'},
    {id:'crack',file:'emote-crack.png'},
    {id:'sleep',file:'emote-sleep.png'},
    {id:'love',file:'emote-love.png'},
    {id:'champagne',file:'emote-champagne.png'},
    {id:'shock',file:'emote-shock.png'}
  ];

  const suitName=(s)=>['diamond','club','heart','spade'][s]??'club';
  const cardImagePath=(card)=>withBase(`card-assets/${suitName(card.suit)}-${RANKS[card.rank]}.png`);
  const faceRankClass=(card)=>(card.rank>=8&&card.rank<=10)?'face-jqk':'';

  function renderStaticCard(card,mini=false,extra='',inlineStyle=''){
    return`<div class="card face ${mini?'mini':''} ${faceRankClass(card)} ${extra}"${inlineStyle?` style="${inlineStyle}"`:''}><img class="card-art" src="${cardImagePath(card)}" alt="${RANKS[card.rank]} ${SUITS[card.suit].symbol}"/></div>`;
  }

  function renderHandCard(card,selected,extraClass='',zIndex=0){
    const draggable=isMobilePointer()?'false':'true';
    return`<button class="card face hand-card ${faceRankClass(card)} ${selected?'selected':''} ${extraClass}" draggable="${draggable}" data-card-id="${cardId(card)}" style="z-index:${zIndex};"><img class="card-art" src="${cardImagePath(card)}" alt="${RANKS[card.rank]} ${SUITS[card.suit].symbol}"/></button>`;
  }

  function fanNoise(seed,i,salt=''){
    const s=`${seed}|${i}|${salt}`;
    let h=2166136261;
    for(let k=0;k<s.length;k++){
      h^=s.charCodeAt(k);
      h=Math.imul(h,16777619);
    }
    return((h>>>0)%1000)/1000;
  }

  function fanJitterDeg(seed,i){return((fanNoise(seed,i,'deg')*2)-1)*0.75;}
  function fanGap(seed,i){return fanNoise(seed,i,'gap');}
  function fanLift(seed,i){return fanNoise(seed,i,'lift');}

  function renderBackCards(count,seed=''){
    const shown=Math.max(0,Number(count)||0);
    const backFile=backAssetFile(getBackColor());
    const backAlt=String(getCardBackAlt?.()||'').trim()||'back';
    return Array.from({length:shown},(_,i)=>`<span class="card back mini closed-back" style="--i:${i};--n:${shown};--fan-jitter:${fanJitterDeg(seed,i).toFixed(3)}deg;--fan-gap:${fanGap(seed,i).toFixed(3)};--fan-lift:${fanLift(seed,i).toFixed(3)};"><img class="card-art" src="${withBase(`card-assets/${backFile}`)}" alt="${backAlt}"/></span>`).join('');
  }

  function calloutJitterStyle(viewCls,key=''){
    const seed=`${viewCls}|${key}`;
    const r=(salt)=>fanNoise(seed,0,salt);
    const xr=12;
    const yr=6;
    const size=0.64;
    const x=Math.round((r('jx')*2-1)*xr);
    const yBase=viewCls==='north'?4:2;
    const y=Math.round((r('jy')*2-1)*yr+yBase);
    const tilt=((r('tilt')*2)-1)*2.6;
    const floatDur=2.2+(r('fdur')*0.9);
    const glowDur=1.5+(r('gdur')*0.7);
    const floatAmp=4.8;
    return`--callout-jx:${x}px;--callout-jy:${y}px;--callout-size:${size.toFixed(3)};--callout-tilt:${tilt.toFixed(2)}deg;--callout-float-dur:${floatDur.toFixed(2)}s;--callout-glow-dur:${glowDur.toFixed(2)}s;--callout-float-amp:${floatAmp.toFixed(2)}px;`;
  }

  return{
    EMOTE_STICKERS,
    cardImagePath,
    fanNoise,
    renderStaticCard,
    renderHandCard,
    renderBackCards,
    calloutJitterStyle
  };
}
