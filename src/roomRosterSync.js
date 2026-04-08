export function createRoomRosterSyncController(deps){
  function isBotRoomEntry(entry){
    if(!entry||typeof entry!=='object')return false;
    if(entry.isHuman===false)return true;
    const uid=String(entry.uid??'').trim().toLowerCase();
    return uid.startsWith('bot:')||uid.startsWith('ai:');
  }

  function syncRoomGameRoster(roomData){
    const base=roomData?.game;
    if(!base||!Array.isArray(base.players))return null;
    const game=deps.cloneRoomGame(base);
    const roster=Array.isArray(roomData?.players)?roomData.players:[];
    const now=Date.now();
    const status=String(roomData?.status??'');
    const turnStartedAt=Number(roomData?.game?.turnStartedAt||0);
    const turnStale=turnStartedAt>0&&(now-turnStartedAt>deps.ROOM_PRUNE_PLAYING_MS);
    const activeRoster=roster.filter((p)=>{
      if(status!=='playing')return true;
      if(!turnStale)return true;
      return deps.isRoomPlayerActive(p,status,now);
    });
    const seatMap=new Map();
    activeRoster.forEach((p)=>{
      const seat=Number(p?.seat);
      if(Number.isFinite(seat)&&seat>=0&&seat<4)seatMap.set(seat,p);
    });
    let changed=false;
    for(let seat=0;seat<game.players.length;seat++){
      const player=game.players[seat];
      if(!player)continue;
      const entry=seatMap.get(seat);
      if(entry){
        const entryIsBot=isBotRoomEntry(entry);
        const fallbackBot=deps.botProfileForSeat(seat);
        const entryNameRaw=String(entry.name??'').trim();
        const entryName=entryNameRaw||fallbackBot.name||`Bot ${seat+1}`;
        const entryGender=String(entry.gender??fallbackBot.gender??'male')==='female'?'female':'male';
        const entryUid=String(entry.uid??(entryIsBot?`bot:${seat}:${entryName}`:'')).trim();
        const entryPic=entryIsBot?'':String(entry.picture??'').trim();
        if(entryIsBot){
          if(player.isHuman||String(player.uid??'')!==entryUid||player.name!==entryName||player.gender!==entryGender){
            player.isHuman=false;
            player.uid=entryUid||`bot:${seat}:${entryName}`;
            player.name=entryName;
            player.gender=entryGender;
            player.picture='';
            changed=true;
          }
        }else if(!player.isHuman||String(player.uid??'')!==entryUid||player.name!==entryName||player.gender!==entryGender||String(player.picture??'').trim()!==entryPic){
          player.isHuman=true;
          player.uid=entryUid;
          player.name=entryName;
          player.gender=entryGender;
          player.picture=entryPic;
          changed=true;
        }
        continue;
      }
      const bot=deps.botProfileForSeat(seat);
      const botUid=`bot:${seat}:${bot.name}`;
      const botName=String(bot.name||`Bot ${seat+1}`);
      const botGender=String(bot.gender??'male')==='female'?'female':'male';
      if(player.isHuman||String(player.uid??'')!==botUid||player.name!==botName||player.gender!==botGender||String(player.picture??'').trim()){
        player.isHuman=false;
        player.uid=botUid;
        player.name=botName;
        player.gender=botGender;
        player.picture='';
        changed=true;
      }
    }
    return changed?game:null;
  }

  return{
    isBotRoomEntry,
    syncRoomGameRoster
  };
}
