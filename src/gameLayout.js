export function retargetCalloutTails({
  documentRef=()=>document,
  windowRef=()=>window,
  isMobilePointer=()=>false
}={}){
  const doc=documentRef();
  const win=windowRef();
  const bubbles=[...doc.querySelectorAll('.play-type-call, .last-card-call, .emote-callout')];
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
  const rectArea=(rect)=>Math.max(0,rect.width)*Math.max(0,rect.height);
  const overlapArea=(a,b)=>{
    const left=Math.max(a.left,b.left);
    const top=Math.max(a.top,b.top);
    const right=Math.min(a.right,b.right);
    const bottom=Math.min(a.bottom,b.bottom);
    return Math.max(0,right-left)*Math.max(0,bottom-top);
  };
  const clampRectToViewport=(left,top,width,height)=>({
    left: Math.max(viewportLeft+margin, Math.min(left, viewportRight-width-margin)),
    top: Math.max(viewportTop+margin, Math.min(top, viewportBottom-height-margin)),
    width,
    height,
    right: 0,
    bottom: 0
  });
  const finalizeRect=(rect)=>({
    ...rect,
    right: rect.left+rect.width,
    bottom: rect.top+rect.height
  });
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
    if(isSelfBubble){
      avatar=doc.querySelector('.player-avatar-wrap-self')||doc.getElementById('self-avatar-img');
    }else{
      const seat=bubble.closest('.seat');
      avatar=seat?.querySelector('.player-avatar-wrap-opponent, .player-avatar-opponent')??null;
    }
    if(!(avatar instanceof HTMLElement))continue;
    const b=bubble.getBoundingClientRect();
    const a=avatar.getBoundingClientRect();
    const bx=b.left+b.width/2;
    const by=b.top+b.height/2;
    const ax=a.left+a.width/2;
    const ay=a.top+a.height/2;
    const dx=ax-bx;
    const dy=ay-by;
    let dir='south';
    if(!isSelfBubble){
      if(Math.abs(dx)>Math.abs(dy)){
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
    if(viewportWidth){
      const availableWidth=Math.max(0,viewportWidth-(margin*2));
      if(availableWidth>0&&b.width>availableWidth){
        const fitScale=Math.max(0.4,Math.min(1,availableWidth/b.width));
        bubble.style.setProperty('--callout-fit-scale',fitScale.toFixed(4));
      }
    }
    const scaledRect=bubble.getBoundingClientRect();
    let {sx,sy}=overflowShiftFor(scaledRect);
    if(sx||sy){
      bubble.style.setProperty('--callout-shift-x',`${sx.toFixed(1)}px`);
      bubble.style.setProperty('--callout-shift-y',`${sy.toFixed(1)}px`);
      bubble.style.removeProperty('--callout-box-shift-x');
      bubble.style.removeProperty('--callout-box-shift-y');
      const secondPass=bubble.getBoundingClientRect();
      const extra=overflowShiftFor(secondPass);
      if(extra.sx||extra.sy){
        sx+=extra.sx;
        sy+=extra.sy;
        bubble.style.setProperty('--callout-shift-x',`${sx.toFixed(1)}px`);
        bubble.style.setProperty('--callout-shift-y',`${sy.toFixed(1)}px`);
      }
    }else{
      bubble.style.removeProperty('--callout-shift-x');
      bubble.style.removeProperty('--callout-shift-y');
      bubble.style.removeProperty('--callout-box-shift-x');
      bubble.style.removeProperty('--callout-box-shift-y');
    }
    let shiftedBubbleRect=bubble.getBoundingClientRect();
    const stillOverflowing=(
      shiftedBubbleRect.left<viewportLeft+margin||
      shiftedBubbleRect.right>viewportRight-margin||
      shiftedBubbleRect.top<viewportTop+margin||
      shiftedBubbleRect.bottom>viewportBottom-margin
    );
    const seat=bubble.closest('.seat');
    const blockerElements=isSelfBubble
      ?[
          doc.querySelector('.action-strip .seat-name-fixed.player-tag'),
          doc.querySelector('.action-strip .hand')
        ]
      :[
          seat?.querySelector('.seat-name-fixed[data-opponent-name], .seat-name-fixed'),
          seat?.querySelector('.player-avatar-wrap-opponent, .player-avatar-opponent'),
          seat?.querySelector('.opponent-fan, .opponent-fan-wrap'),
          seat?.querySelector('.seat-open-play')
        ];
    const blockerRects=blockerElements
      .filter((el)=>el instanceof HTMLElement)
      .map((el)=>el.getBoundingClientRect())
      .filter((rect)=>rectArea(rect)>0);
    const overlapsBlockers=blockerRects.some((rect)=>overlapArea(shiftedBubbleRect,rect)>0);
    if((stillOverflowing||overlapsBlockers)&&viewportWidth&&viewportHeight){
      const availableWidth=Math.max(0,viewportWidth-(margin*2));
      if(availableWidth>0&&shiftedBubbleRect.width>availableWidth){
        const fitScale=Math.max(0.4,Math.min(1,availableWidth/shiftedBubbleRect.width));
        bubble.style.setProperty('--callout-fit-scale',fitScale.toFixed(4));
        shiftedBubbleRect=bubble.getBoundingClientRect();
      }
      const gap=12;
      const anchorRect=(avatar instanceof HTMLElement?avatar.getBoundingClientRect():shiftedBubbleRect);
      const candidates=[
        finalizeRect(clampRectToViewport(anchorRect.right+gap, anchorRect.top+(anchorRect.height-shiftedBubbleRect.height)/2, shiftedBubbleRect.width, shiftedBubbleRect.height)),
        finalizeRect(clampRectToViewport(anchorRect.left-gap-shiftedBubbleRect.width, anchorRect.top+(anchorRect.height-shiftedBubbleRect.height)/2, shiftedBubbleRect.width, shiftedBubbleRect.height)),
        finalizeRect(clampRectToViewport(anchorRect.left+(anchorRect.width-shiftedBubbleRect.width)/2, anchorRect.top-gap-shiftedBubbleRect.height, shiftedBubbleRect.width, shiftedBubbleRect.height)),
        finalizeRect(clampRectToViewport(anchorRect.left+(anchorRect.width-shiftedBubbleRect.width)/2, anchorRect.bottom+gap, shiftedBubbleRect.width, shiftedBubbleRect.height))
      ];
      const scoreCandidate=(rect)=>{
        const overlapPenalty=blockerRects.reduce((sum,blocker)=>sum+overlapArea(rect,blocker),0);
        const overflowPenalty=
          Math.max(0,viewportLeft+margin-rect.left)+
          Math.max(0,rect.right-(viewportRight-margin))+
          Math.max(0,viewportTop+margin-rect.top)+
          Math.max(0,rect.bottom-(viewportBottom-margin));
        const cx=rect.left+rect.width/2;
        const cy=rect.top+rect.height/2;
        const distancePenalty=Math.abs(cx-ax)+Math.abs(cy-ay);
        return overlapPenalty*1000+overflowPenalty*1000+distancePenalty;
      };
      const bestRect=candidates.slice().sort((r1,r2)=>scoreCandidate(r1)-scoreCandidate(r2))[0];
      bubble.classList.add('callout-screen-float');
      bubble.style.setProperty('position','fixed','important');
      bubble.style.setProperty('left',`${bestRect.left.toFixed(1)}px`,'important');
      bubble.style.setProperty('top',`${bestRect.top.toFixed(1)}px`,'important');
      bubble.style.setProperty('right','auto','important');
      bubble.style.setProperty('bottom','auto','important');
      bubble.style.setProperty('z-index','2147483647','important');
      bubble.style.setProperty('--callout-base-x','0px');
      bubble.style.setProperty('--callout-base-y','0px');
      bubble.style.removeProperty('--callout-shift-x');
      bubble.style.removeProperty('--callout-shift-y');
      shiftedBubbleRect=bubble.getBoundingClientRect();
      const fbx=shiftedBubbleRect.left+shiftedBubbleRect.width/2;
      const fby=shiftedBubbleRect.top+shiftedBubbleRect.height/2;
      const fdx=ax-fbx;
      const fdy=ay-fby;
      if(Math.abs(fdx)>Math.abs(fdy)){
        dir=fdx<0?'west':'east';
      }else{
        dir=fdy<0?'north':'south';
      }
      tail.classList.remove('tail-north','tail-south','tail-east','tail-west');
      tail.classList.add(`tail-${dir}`);
    }
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
  const rect=handCard.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const root=doc.documentElement;
  const widthPx=`${rect.width.toFixed(2)}px`;
  const heightPx=`${rect.height.toFixed(2)}px`;
  root.style.setProperty('--discard-card-w',widthPx);
  root.style.setProperty('--discard-card-h',heightPx);
  doc.querySelectorAll('.seat-played .card.mini, .center-last .card.mini').forEach((card)=>{
    if(!(card instanceof HTMLElement))return;
    card.style.setProperty('width',widthPx,'important');
    card.style.setProperty('height',heightPx,'important');
  });
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
