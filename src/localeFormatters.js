const LEADERBOARD_LOCALE_MAP={
  en:'en-US',
  'zh-HK':'zh-HK',
  fr:'fr-FR',
  de:'de-DE',
  es:'es-ES',
  ja:'ja-JP'
};

export function formatLeaderboardDateTime(ts,language){
  const n=Number(ts)||0;
  if(!n)return'-';
  const locale=LEADERBOARD_LOCALE_MAP[language]||'en-US';
  try{return new Date(n).toLocaleString(locale,{hour12:false});}catch{return'-';}
}

export function formatLeaderboardPct(n){
  return `${Math.round((Number(n)||0)*100)}%`;
}
