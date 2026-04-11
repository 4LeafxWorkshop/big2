export function retargetCalloutTails({
  documentRef=()=>document,
  windowRef=()=>window,
  isMobilePointer=()=>false
}={}){
  const doc=documentRef();
  const win=windowRef();
  const bubbles=[...doc.querySelectorAll('.play-type-call:not(.seat-motto-callout), .last-card-call, .emote-callout, .seat-motto-callout')];
  const visualViewport=win.visualViewport||null;
  const viewportLeft=Math.max(0,Number(visualViewport?.offsetLeft)||0);
  const viewportTop=Math.max(0,Number(visualViewport?.offsetTop)||0);
  const viewportWidth=Math.max(
    0,
    Number(visualViewport?.width)||0,
    Number(doc.documentElement?.clientWidth)||0,
    Number(win.innerWidth)||0
  );
  const viewportHeight=Math.max(
    0,
    Number(visualViewport?.height)||0,
    Number(doc.documentElement?.clientHeight)||0,
    Number(win.innerHeight)||0
  );
  const viewportRight=viewportLeft+viewportWidth;
  const viewportBottom=viewportTop+viewportHeight;
  const margin=isMobilePointer()?5:8;
  const overflowShiftFor=(rect)=>{
    let sx=0;
    let sy=0;
    if(viewportWidth&&viewportHeight){
      // Clamp horizontally and vertically inside the visible viewport:
      // too far left -> move right, too far right -> move left, too high -> move down.
      if(rect.left<viewportLeft+margin)sx=(viewportLeft+margin)-rect.left;
      if(rect.right>viewportRight-margin)sx=(viewportRight-margin)-rect.right;
      if(rect.top<viewportTop+margin)sy=(viewportTop+margin)-rect.top;
      if(rect.bottom>viewportBottom-margin)sy=(viewportBottom-margin)-rect.bottom;
    }
    return{sx,sy};
  };
  for(const bubble of bubbles){
    if(!(bubble instanceof HTMLElement))continue;
    const tail=bubble.querySelector('.tail');
    if(!(tail instanceof HTMLElement))continue;
    const isSelfBubble=bubble.classList.contains('play-type-call-self')||bubble.classList.contains('last-card-call-self');
    let avatar=null;
    let anchorTarget=null;
    if(isSelfBubble){
      avatar=doc.querySelector('.player-avatar-wrap-self')||doc.getElementById('self-avatar-img');
      anchorTarget=avatar;
    }else{
      const seat=bubble.closest('.seat');
      avatar=seat?.querySelector('.player-avatar-wrap-opponent, .player-avatar-opponent')??null;
      anchorTarget=
        avatar||
        seat?.querySelector('.seat-name-fixed[data-opponent-name]')||
        seat?.querySelector('.side-station-stack, .seat-pack')||
        null;
    }
    if(!(avatar instanceof HTMLElement)||!(anchorTarget instanceof HTMLElement))continue;
    bubble.style.removeProperty('--callout-shift-x');
    bubble.style.removeProperty('--callout-shift-y');
    bubble.style.removeProperty('--callout-box-shift-x');
    bubble.style.removeProperty('--callout-box-shift-y');
    const b=bubble.getBoundingClientRect();
    const a=anchorTarget.getBoundingClientRect();
    const bx=b.left+b.width/2;
    const by=b.top+b.height/2;
    const ax=a.left+a.width/2;
    const ay=a.top+a.height/2;
    const dx=ax-bx;
    const dy=ay-by;
    let dir='south';
    if(!isSelfBubble){
      const seat=bubble.closest('.seat');
      if(bubble.classList.contains('seat-motto-callout')){
        dir='north';
      }else if(seat?.classList.contains('north')){
        dir='north';
      }else if(seat?.classList.contains('west')||seat?.classList.contains('east')){
        dir='south';
      }else if(Math.abs(dx)>Math.abs(dy)){
        dir=dx<0?'west':'east';
      }else{
        dir=dy<0?'north':'south';
      }
    }
    tail.classList.remove('tail-north','tail-south','tail-east','tail-west');
    tail.classList.add(`tail-${dir}`);
    tail.style.removeProperty('--tail-anchor-x');
    tail.style.removeProperty('--tail-anchor-y');
    bubble.classList.remove('callout-screen-float');
    bubble.style.removeProperty('position');
    bubble.style.removeProperty('left');
    bubble.style.removeProperty('top');
    bubble.style.removeProperty('right');
    bubble.style.removeProperty('bottom');
    bubble.style.removeProperty('z-index');
    bubble.style.removeProperty('--callout-fit-scale');
    let sx=0;
    let sy=0;
    for(let i=0;i<4;i+=1){
      const rect=bubble.getBoundingClientRect();
      const extra=overflowShiftFor(rect);
      if(!extra.sx&&!extra.sy)break;
      sx+=extra.sx;
      sy+=extra.sy;
      bubble.style.setProperty('--callout-shift-x',`${sx.toFixed(1)}px`);
      bubble.style.setProperty('--callout-shift-y',`${sy.toFixed(1)}px`);
    }
    const shiftedBubbleRect=bubble.getBoundingClientRect();
    const anchorX=Math.max(10,Math.min(shiftedBubbleRect.width-10,ax-shiftedBubbleRect.left));
    const anchorY=Math.max(10,Math.min(shiftedBubbleRect.height-10,ay-shiftedBubbleRect.top));
    if(dir==='north'||dir==='south'){
      if(isSelfBubble&&dir==='south'){
        tail.style.setProperty('--tail-anchor-x','27px');
      }else{
        tail.style.setProperty('--tail-anchor-x',`${anchorX.toFixed(1)}px`);
      }
    }else{
      tail.style.setProperty('--tail-anchor-y',`${anchorY.toFixed(1)}px`);
    }
  }
}

export function syncHandStackMode({
  documentRef=()=>document,
  windowRef=()=>window
}={}){
  const doc=documentRef();
  const win=windowRef();
  const hand=doc.querySelector('.action-strip .hand');
  if(!(hand instanceof HTMLElement))return;
  const cards=[...hand.querySelectorAll('.hand-card')];
  hand.classList.remove('hand-stacked');
  hand.style.removeProperty('--hand-overlap-px');
  hand.style.setProperty('overflow-x','hidden','important');
  if(cards.length<2)return;
  const first=cards[0];
  const last=cards[cards.length-1];
  if(!(first instanceof HTMLElement)||!(last instanceof HTMLElement))return;
  const count=cards.length;
  const cardW=first.getBoundingClientRect().width;
  const hs=win.getComputedStyle(hand);
  const gap=Number.parseFloat(hs.columnGap||hs.gap||'0')||0;
  const available=hand.clientWidth||hand.getBoundingClientRect().width;
  const natural=(cardW*count)+(gap*Math.max(0,count-1));
  if(!(natural>available+0.5))return;

  let overlap=(natural-available)/(count-1);
  const maxOverlap=Math.max(0,(cardW+gap)-1);
  overlap=Math.max(0,Math.min(overlap,maxOverlap));

  const comfortLimit=Math.max(0,cardW*0.82);
  if(overlap>comfortLimit){
    hand.style.setProperty('overflow-x','auto','important');
    hand.style.setProperty('-webkit-overflow-scrolling','touch');
    return;
  }

  hand.classList.add('hand-stacked');
  hand.style.setProperty('--hand-overlap-px',`${overlap.toFixed(2)}px`);

  const handRect=hand.getBoundingClientRect();
  const firstRect=first.getBoundingClientRect();
  const lastRect=last.getBoundingClientRect();
  const used=Math.max(0,lastRect.right-firstRect.left);
  const delta=used-handRect.width;
  if(Math.abs(delta)>0.75){
    overlap+=delta/(count-1);
    overlap=Math.max(0,Math.min(overlap,maxOverlap));
    hand.style.setProperty('--hand-overlap-px',`${overlap.toFixed(2)}px`);
  }
  const overflowRight=last.getBoundingClientRect().right-handRect.right;
  if(overflowRight>0.5){
    overlap+=((overflowRight+0.5)/(count-1));
    overlap=Math.max(0,Math.min(overlap,maxOverlap));
    hand.style.setProperty('--hand-overlap-px',`${overlap.toFixed(2)}px`);
  }
}

export function syncLandscapeGameHandSizing({
  documentRef=()=>document,
  windowRef=()=>window
}={}){
  const doc=documentRef();
  const win=windowRef();
  const body=doc.body;
  const hand=doc.querySelector('.action-strip .hand');
  if(!(body instanceof HTMLElement)||!(hand instanceof HTMLElement))return;
  const cards=[...hand.querySelectorAll('.hand-card')].filter((card)=>card instanceof HTMLElement);
  const coarse=win.matchMedia?.('(pointer: coarse) and (hover: none)')?.matches ?? false;
  const landscape=(win.innerWidth||0)>(win.innerHeight||0);
  const applyWebHandSize=
    body.dataset.screen==='game'&&
    body.dataset.ios!=='1'&&
    !coarse&&
    landscape;

  if(!applyWebHandSize){
    hand.style.removeProperty('--hand-card-scale');
    hand.style.removeProperty('min-height');
    cards.forEach((card)=>{
      card.style.removeProperty('width');
      card.style.removeProperty('height');
    });
    return;
  }

  const availableW=hand.clientWidth||Math.round(hand.getBoundingClientRect().width)||0;
  const handCardW=Math.max(80,Math.min(96,availableW*0.085));
  const handCardH=handCardW*1.392857;

  hand.style.setProperty('--hand-card-scale','1.34');
  hand.style.setProperty('min-height',`${(handCardH+18).toFixed(2)}px`,'important');
  cards.forEach((card)=>{
    card.style.setProperty('width',`${handCardW.toFixed(2)}px`,'important');
    card.style.setProperty('height',`${handCardH.toFixed(2)}px`,'important');
  });
}

export function positionRoomTopMeta({documentRef=()=>document}={}){
  const doc=documentRef();
  const meta=doc.querySelector('.room-top-meta.room-top-meta-inline');
  if(!meta)return;
  const tableOverlay=meta.closest('.room-top-meta-table');
  if(tableOverlay){
    tableOverlay.classList.remove('room-top-meta-center','room-top-meta-panel');
  }
  meta.classList.remove('room-top-meta-center','room-top-meta-panel');
  meta.classList.add('room-top-meta-inline');
}

export function positionLandscapeSideStations({
  documentRef=()=>document,
  windowRef=()=>window
}={}){
  const doc=documentRef();
  const win=windowRef();
  const body=doc.body;
  const stacks=[...doc.querySelectorAll('.seat.west .side-station-stack, .seat.east .side-station-stack')];
  if(!stacks.length)return;
  const landscape=(win.innerWidth||0)>(win.innerHeight||0);
  const desktop=(win.innerWidth||0)>=861;
  const active=body?.dataset?.screen==='game'&&landscape&&desktop;
  if(!active){
    stacks.forEach((stack)=>{
      if(!(stack instanceof HTMLElement))return;
      stack.style.removeProperty('left');
      stack.style.removeProperty('right');
      stack.style.removeProperty('transform');
    });
    return;
  }
  const table=doc.querySelector('.table');
  if(!(table instanceof HTMLElement))return;
  const tableRect=table.getBoundingClientRect();
  if(!(tableRect.width>0&&tableRect.height>0))return;
  const centerX=tableRect.left+(tableRect.width/2);
  for(const cls of ['west','east']){
    const seat=doc.querySelector(`.seat.${cls}`);
    if(!(seat instanceof HTMLElement))continue;
    const stack=seat.querySelector('.side-station-stack');
    if(!(stack instanceof HTMLElement))continue;
    const seatRect=seat.getBoundingClientRect();
    if(!(seatRect.width>0))continue;
    const edgeX=cls==='west'?tableRect.left:tableRect.right;
    const targetX=(edgeX+centerX)/2;
    const leftPx=targetX-seatRect.left;
    stack.style.setProperty('left',`${leftPx.toFixed(2)}px`,'important');
    stack.style.setProperty('right','auto','important');
    stack.style.setProperty('transform','translateX(-50%)','important');
  }
}

export function createRoomTopMetaLayoutBinder({windowRef=()=>window}={}){
  let bound=false;
  return function bindRoomTopMetaLayout(positioner){
    if(bound)return;
    bound=true;
    const win=windowRef();
    win.addEventListener('resize',positioner);
    win.addEventListener('orientationchange',positioner);
  };
}

export function syncDiscardSizeFromHand({
  state,
  documentRef=()=>document
}){
  if(state.screen!=='game')return;
  const doc=documentRef();
  const handCard=doc.querySelector('.action-strip .hand .hand-card');
  if(!(handCard instanceof HTMLElement))return;
  const root=doc.documentElement;
  const rect=handCard.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const widthPx=`${rect.width.toFixed(2)}px`;
  const heightPx=`${rect.height.toFixed(2)}px`;
  root.style.setProperty('--discard-card-w',widthPx);
  root.style.setProperty('--discard-card-h',heightPx);
}

export function createDiscardSizeObserver({
  windowRef=()=>window
}={}){
  let observer=null;
  return{
    observe(hand,onResize){
      const win=windowRef();
      if(!observer){
        if(!('ResizeObserver' in win))return;
        observer=new win.ResizeObserver(()=>{onResize();});
      }
      observer.observe(hand);
    }
  };
}
