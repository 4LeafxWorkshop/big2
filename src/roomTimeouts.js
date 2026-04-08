export function createRoomTimeoutController(deps){
  function buildReplacementBotEntry(seat){
    const bot=deps.botProfileForSeat(seat);
    return{
      uid:`bot:${seat}:${bot.name}`,
      name:String(bot.name||`Bot ${Number(seat)+1}`),
      gender:String(bot.gender??'male')==='female'?'female':'male',
      picture:'',
      isHuman:false,
      seat,
      lastSeen:0,
      timeoutStrikes:0
    };
  }

  function replaceTimedOutPlayerWithBot(players,seat){
    const next=Array.isArray(players)?players.map((p)=>({...p})):[];
    const idx=next.findIndex((p)=>Number(p?.seat)===seat);
    const replacement=buildReplacementBotEntry(seat);
    if(idx>=0)next[idx]={...next[idx],...replacement};
    else next.push(replacement);
    return next;
  }

  function applyTimeoutStrikeToRoomState(players,game,seat,_now=Date.now()){
    const roster=Array.isArray(players)?players.map((p)=>({...p})):[];
    const idx=roster.findIndex((p)=>Number(p?.seat)===seat);
    if(idx<0)return{players:roster,game,changed:false,kicked:false};
    const current=roster[idx]||{};
    const strikes=(Number(current.timeoutStrikes)||0)+1;
    let nextGame=game;
    if(strikes<deps.ROOM_TIMEOUT_STRIKES_MAX){
      roster[idx]={...current,timeoutStrikes:strikes};
      return{players:roster,game:nextGame,changed:true,kicked:false,strikes};
    }
    const kickedName=String(current.name||'Player');
    const replaced=replaceTimedOutPlayerWithBot(roster,seat);
    const replacement=replaced.find((p)=>Number(p?.seat)===seat)||buildReplacementBotEntry(seat);
    nextGame=deps.cloneRoomGame(game);
    if(nextGame?.players?.[seat]){
      nextGame.players[seat].isHuman=false;
      nextGame.players[seat].uid=String(replacement.uid||`bot:${seat}:${replacement.name}`);
      nextGame.players[seat].name=String(replacement.name||nextGame.players[seat].name||`Bot ${seat+1}`);
      nextGame.players[seat].gender=String(replacement.gender??'male')==='female'?'female':'male';
      nextGame.players[seat].picture='';
    }
    deps.addRoomSystemLog(nextGame,`${kickedName} ${deps.t('roomKickedTimeout')}`);
    return{players:replaced,game:nextGame,changed:true,kicked:true,strikes,playerName:kickedName};
  }

  function resetTimeoutStrikeForSeat(players,seat){
    const roster=Array.isArray(players)?players.map((p)=>({...p})):[];
    const idx=roster.findIndex((p)=>Number(p?.seat)===seat);
    if(idx<0)return{players:roster,changed:false};
    const current=roster[idx]||{};
    if(!Number(current.timeoutStrikes))return{players:roster,changed:false};
    roster[idx]={...current,timeoutStrikes:0};
    return{players:roster,changed:true};
  }

  return{
    applyTimeoutStrikeToRoomState,
    buildReplacementBotEntry,
    replaceTimedOutPlayerWithBot,
    resetTimeoutStrikeForSeat
  };
}
