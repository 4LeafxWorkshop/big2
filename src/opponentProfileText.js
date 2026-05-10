import {PROFILE_LINE_TRANSLATIONS_BY_ID, PROFILE_MOTTO_TRANSLATIONS_BY_ID} from './opponentProfileData.js';

export function createOpponentProfileTextHelpers(deps){
  const {esc,getLanguage}=deps;

  function profileParagraphsHtml(profileText){
    const parts=Array.isArray(profileText)?profileText:[profileText];
    const clean=parts.map((p)=>String(p??'').trim()).filter(Boolean);
    if(!clean.length)return'<p>-</p>';
    return clean.map((p)=>`<p>${esc(p)}</p>`).join('');
  }

  function getProfileLineTranslation(langKey,lineId){
    const lang=PROFILE_LINE_TRANSLATIONS_BY_ID[langKey]?langKey:'';
    if(!lang||!lineId)return '';
    return PROFILE_LINE_TRANSLATIONS_BY_ID[lang]?.[lineId]??'';
  }

  function translateProfileLines(value,langKey,profile){
    const lang=PROFILE_LINE_TRANSLATIONS_BY_ID[langKey]?langKey:'';
    if(!lang)return value;
    const lineIds=Array.isArray(profile?.profileLineIds)?profile.profileLineIds:[];
    if(Array.isArray(value))return value.map((line,index)=>getProfileLineTranslation(lang,lineIds[index])||line);
    if(typeof value==='string')return getProfileLineTranslation(lang,lineIds[0])||value;
    return value;
  }

  function translateProfileMotto(value,langKey,profile){
    const lang=PROFILE_MOTTO_TRANSLATIONS_BY_ID[langKey]?langKey:'';
    if(!lang||typeof value!=='string')return value;
    const id=String(profile?.mottoId||'');
    return id?PROFILE_MOTTO_TRANSLATIONS_BY_ID[lang]?.[id]??value:value;
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
    if(field==='profile')return translateProfileLines(value,preferred,profile);
    if(field==='motto')return translateProfileMotto(value,preferred,profile);
    return value;
  }

  return{
    profileParagraphsHtml,
    profileFieldValue
  };
}
