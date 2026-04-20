export function isRoomPresenceOnlyUpdate(prev,next){
  if(!prev||!next)return false;
  const prevStatus=String(prev.status||'');
  const nextStatus=String(next.status||'');
  if(prevStatus!==nextStatus)return false;
  if(prevStatus!=='playing'&&prevStatus!=='finished')return false;
  if(Number(prev.gameVersion||0)!==Number(next.gameVersion||0))return false;
  if(String(prev.code||'')!==String(next.code||''))return false;
  if(String(prev.hostId||'')!==String(next.hostId||''))return false;
  if(String(prev.hostName||'')!==String(next.hostName||''))return false;
  if(Boolean(prev.isPrivate)!==Boolean(next.isPrivate))return false;
  if(Number(prev.maxPlayers||0)!==Number(next.maxPlayers||0))return false;
  if(Number(prev.roundCount||0)!==Number(next.roundCount||0))return false;
  const prevEmote=prev?.game?.emote??null;
  const nextEmote=next?.game?.emote??null;
  if(String(prevEmote?.id||'')!==String(nextEmote?.id||''))return false;
  if(Number(prevEmote?.ts||0)!==Number(nextEmote?.ts||0))return false;
  if(String(prevEmote?.by||'')!==String(nextEmote?.by||''))return false;
  if(Number(prevEmote?.seat??-1)!==Number(nextEmote?.seat??-1))return false;
  const prevRootEmote=prev?.emote??null;
  const nextRootEmote=next?.emote??null;
  if(String(prevRootEmote?.id||'')!==String(nextRootEmote?.id||''))return false;
  if(Number(prevRootEmote?.ts||0)!==Number(nextRootEmote?.ts||0))return false;
  if(String(prevRootEmote?.by||'')!==String(nextRootEmote?.by||''))return false;
  if(Number(prevRootEmote?.seat??-1)!==Number(nextRootEmote?.seat??-1))return false;
  const prevPlayers=Array.isArray(prev.players)?prev.players:[];
  const nextPlayers=Array.isArray(next.players)?next.players:[];
  if(prevPlayers.length!==nextPlayers.length)return false;
  const prevMap=new Map(prevPlayers.map((p)=>[String(p?.uid??''),p]));
  for(const p of nextPlayers){
    const uid=String(p?.uid??'');
    const before=prevMap.get(uid);
    if(!before)return false;
    if(String(before.name||'')!==String(p.name||''))return false;
    if(String(before.gender||'')!==String(p.gender||''))return false;
    if(String(before.picture||'')!==String(p.picture||''))return false;
    if(Boolean(before.isHost)!==Boolean(p.isHost))return false;
    if(Number(before.seat)!==Number(p.seat))return false;
  }
  return true;
}
