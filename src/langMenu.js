export function createLangMenuController(deps){
  let langMenuDocBound=false;
  let openLangMenu=null;
  const langMenuPortals=new WeakMap();
  let langMenuTouchSelectionUntil=0;

  function renderLangMenu(id){
    const items=deps.LANGUAGE_OPTIONS.map((opt)=>{
      const label=deps.LANGUAGE_NATIVE_LABEL[opt.value]??deps.getI18nLabel(opt.labelKey)??opt.value;
      const selected=deps.getLanguage()===opt.value;
      return `<button class="lang-menu-item" type="button" role="option" data-lang="${opt.value}" aria-selected="${selected?'true':'false'}">${label}</button>`;
    }).join('');
    const language=deps.getLanguage();
    const shortLabel=language==='zh-HK'?'中':language==='fr'?'FR':language==='de'?'DE':language==='es'?'ES':language==='ja'?'JA':'EN';
    const globeSvg=`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm7.7 9h-3.2a15.8 15.8 0 0 0-1.1-5.1 8.03 8.03 0 0 1 4.3 5.1Zm-7.7-7a13.6 13.6 0 0 1 1.8 6H10.2a13.6 13.6 0 0 1 1.8-6Zm-5.4 7h-3.2a8.03 8.03 0 0 1 4.3-5.1 15.8 15.8 0 0 0-1.1 5.1Zm0 2a15.8 15.8 0 0 0 1.1 5.1A8.03 8.03 0 0 1 3.4 13h3.2Zm5.4 7a13.6 13.6 0 0 1-1.8-6h3.6a13.6 13.6 0 0 1-1.8 6Zm3.6-7h3.2a8.03 8.03 0 0 1-4.3 5.1 15.8 15.8 0 0 0 1.1-5.1Z"/></svg>`;
    return `<div class="lang-menu" data-lang-menu="1" data-lang-menu-id="${id}"><button id="${id}" class="lang-menu-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="${deps.getLangAriaLabel()}"><span class="lang-icon" aria-hidden="true">${globeSvg}</span><span class="lang-short">${shortLabel}</span></button><div class="lang-menu-pop" role="listbox" aria-label="${deps.getLangAriaLabel()}" data-lang-menu-owner="${id}">${items}</div></div>`;
  }

  function positionLangMenuPop(trigger,pop){
    const rect=trigger.getBoundingClientRect();
    const padding=8;
    pop.style.display='grid';
    const popRect=pop.getBoundingClientRect();
    let left=rect.right-popRect.width;
    left=Math.max(padding,Math.min(left,window.innerWidth-popRect.width-padding));
    let top=rect.bottom+6;
    if(top+popRect.height>window.innerHeight-padding){
      top=rect.top-popRect.height-6;
    }
    top=Math.max(padding,top);
    pop.style.left=`${left}px`;
    pop.style.top=`${top}px`;
    pop.style.right='auto';
    pop.style.bottom='auto';
  }

  function openLangMenuPop(menu,trigger,pop){
    if(!langMenuPortals.has(pop)){
      langMenuPortals.set(pop,{parent:pop.parentElement,next:pop.nextSibling});
    }
    document.body.appendChild(pop);
    pop.style.display='';
    pop.style.position='fixed';
    pop.style.zIndex='20000';
    positionLangMenuPop(trigger,pop);
  }

  function closeLangMenuPop(menu){
    const owner=menu?.dataset?.langMenuId;
    const pop=menu?.querySelector?.('.lang-menu-pop')||document.querySelector(`.lang-menu-pop[data-lang-menu-owner="${owner}"]`);
    if(!(pop instanceof HTMLElement))return;
    pop.style.display='none';
    pop.style.left='';
    pop.style.top='';
    pop.style.right='';
    pop.style.bottom='';
    pop.style.position='';
    pop.style.zIndex='';
    const portal=langMenuPortals.get(pop);
    if(portal?.parent){
      if(portal.next&&portal.next.parentElement===portal.parent){
        portal.parent.insertBefore(pop,portal.next);
      }else{
        portal.parent.appendChild(pop);
      }
    }
  }

  function forceCloseAllLangMenus(){
    document.querySelectorAll('.lang-menu').forEach((menu)=>{
      if(!(menu instanceof HTMLElement))return;
      menu.classList.remove('open');
      const trigger=menu.querySelector('.lang-menu-trigger');
      if(trigger instanceof HTMLElement)trigger.setAttribute('aria-expanded','false');
      closeLangMenuPop(menu);
    });
    openLangMenu=null;
  }

  function closeLangMenu(){
    if(!openLangMenu)return;
    openLangMenu.classList.remove('open');
    const trigger=openLangMenu.querySelector('.lang-menu-trigger');
    if(trigger)trigger.setAttribute('aria-expanded','false');
    closeLangMenuPop(openLangMenu);
    openLangMenu=null;
  }

  function applyLanguage(value,{reloadGoogle=false}={}){
    if(!deps.isValidLanguage(value))return;
    forceCloseAllLangMenus();
    deps.onBeforeLanguageChange(value,{reloadGoogle});
    deps.setLanguageState(value,{reloadGoogle});
    deps.onAfterLanguageChange(value,{reloadGoogle});
    requestAnimationFrame(()=>{forceCloseAllLangMenus();});
    setTimeout(()=>{forceCloseAllLangMenus();},120);
  }

  function bindLangMenu(root,{reloadGoogle=false}={}){
    if(!root)return;
    const menus=root.matches?.('.lang-menu')?[root]:[...root.querySelectorAll('.lang-menu')];
    menus.forEach((menu)=>{
      if(menu.dataset.langBound)return;
      menu.dataset.langBound='1';
      const trigger=menu.querySelector('.lang-menu-trigger');
      const pop=menu.querySelector('.lang-menu-pop');
      if(!(trigger instanceof HTMLElement)||!(pop instanceof HTMLElement))return;
      trigger.addEventListener('click',(ev)=>{
        if(Date.now()<langMenuTouchSelectionUntil){
          ev.preventDefault();
          ev.stopPropagation();
          return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        if(openLangMenu&&openLangMenu!==menu)closeLangMenu();
        const isOpen=menu.classList.toggle('open');
        trigger.setAttribute('aria-expanded',isOpen?'true':'false');
        openLangMenu=isOpen?menu:null;
        if(isOpen){
          openLangMenuPop(menu,trigger,pop);
        }else{
          closeLangMenuPop(menu);
        }
      });
      const selectLang=(ev,item)=>{
        ev.preventDefault();
        ev.stopPropagation();
        langMenuTouchSelectionUntil=Date.now()+700;
        const value=String(item.getAttribute('data-lang')||'');
        menu.classList.remove('open');
        trigger.setAttribute('aria-expanded','false');
        closeLangMenuPop(menu);
        if(openLangMenu===menu)openLangMenu=null;
        applyLanguage(value,{reloadGoogle});
      };
      pop.querySelectorAll('.lang-menu-item').forEach((item)=>{
        item.addEventListener('pointerdown',(ev)=>{
          if(ev.pointerType==='mouse')return;
          langMenuTouchSelectionUntil=Date.now()+600;
          selectLang(ev,item);
        });
        item.addEventListener('click',(ev)=>{
          if(Date.now()<langMenuTouchSelectionUntil){
            ev.preventDefault();
            ev.stopPropagation();
            return;
          }
          selectLang(ev,item);
        });
      });
    });
    if(langMenuDocBound)return;
    langMenuDocBound=true;
    document.addEventListener('click',()=>{closeLangMenu();});
    document.addEventListener('keydown',(ev)=>{if(ev.key==='Escape')closeLangMenu();});
  }

  return{
    bindLangMenu,
    closeLangMenu,
    forceCloseAllLangMenus,
    renderLangMenu
  };
}
