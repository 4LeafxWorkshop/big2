import {PROFILE_LINE_TRANSLATIONS_RAW, PROFILE_MOTTO_TRANSLATIONS} from './opponentProfileData.js';

export function createOpponentProfileTextHelpers(deps){
  const {esc,getLanguage}=deps;

  function profileParagraphsHtml(profileText){
    const parts=Array.isArray(profileText)?profileText:[profileText];
    const clean=parts.map((p)=>String(p??'').trim()).filter(Boolean);
    if(!clean.length)return'<p>-</p>';
    return clean.map((p)=>`<p>${esc(p)}</p>`).join('');
  }

  const PROFILE_LINE_TRANSLATIONS_CACHE={};

  function normalizeProfileKey(value=''){
    return String(value??'')
      .replace(/[“”]/g,'"')
      .replace(/[‘’]/g,"'")
      .replace(/[\u2010-\u2015\u2212]/g,'-')
      .replace(/\u00a0/g,' ')
      .replace(/\s+/g,' ')
      .trim()
      .toLowerCase();
  }

  function getProfileLineTranslation(langKey,line){
    const lang=PROFILE_LINE_TRANSLATIONS_RAW[langKey]?langKey:'';
    if(!lang)return '';
    let cache=PROFILE_LINE_TRANSLATIONS_CACHE[lang];
    if(!cache){
      cache={};
      const src=PROFILE_LINE_TRANSLATIONS_RAW[lang]??{};
      Object.entries(src).forEach(([k,v])=>{
        const nk=normalizeProfileKey(k);
        if(nk)cache[nk]=v;
      });
      PROFILE_LINE_TRANSLATIONS_CACHE[lang]=cache;
    }
    const key=normalizeProfileKey(line);
    return key?cache[key]??'':'';
  }

  function translateProfileLines(value,langKey){
    const lang=PROFILE_LINE_TRANSLATIONS_RAW[langKey]?langKey:'';
    if(!lang)return value;
    if(Array.isArray(value))return value.map((line)=>getProfileLineTranslation(lang,line)||line);
    if(typeof value==='string')return getProfileLineTranslation(lang,value)||value;
    return value;
  }

  function translateProfileMotto(value,langKey){
    const lang=PROFILE_MOTTO_TRANSLATIONS[langKey]?langKey:'';
    if(!lang||typeof value!=='string')return value;
    const map=PROFILE_MOTTO_TRANSLATIONS[lang];
    return map[value]??value;
  }

  function pickProfileLangKey(bank){
    if(!bank||typeof bank!=='object')return 'en';
    const preferred=String(getLanguage()||'').trim();
    if(preferred&&bank[preferred])return preferred;
    if(bank.en)return 'en';
    if(bank['zh-HK'])return 'zh-HK';
    const keys=Object.keys(bank);
    return keys[0]||'en';
  }

  function profileFieldValue(profile,field,emptyValue){
    const bank=profile?.[field]??{};
    const key=pickProfileLangKey(bank);
    const fallback=bank.en??bank['zh-HK']??emptyValue;
    const value=bank?.[key]??fallback??emptyValue;
    const preferred=String(getLanguage()||'').trim();
    if(field==='profile')return translateProfileLines(value,preferred);
    if(field==='motto')return translateProfileMotto(value,preferred);
    return value;
  }

  return{
    profileParagraphsHtml,
    profileFieldValue
  };
}
