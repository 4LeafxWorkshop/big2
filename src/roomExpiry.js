export function createRoomExpiryHelpers({
  DEFAULT_TURN_TIMEOUT_MS,
  ROOM_IDLE_KILL_MS,
  ROOM_RESULT_IDLE_MS,
  ROOM_TIMEOUT_GRACE_MS
}){
  function nextRoomIdleExpiry(now=Date.now()){
    return now+ROOM_IDLE_KILL_MS;
  }

  function getRoomTurnTimeout(roomData){
    const v=Number(roomData?.settings?.turnTimeout);
    if(Number.isFinite(v)&&v>=5000&&v<=60000)return Math.trunc(v);
    return DEFAULT_TURN_TIMEOUT_MS;
  }

  function getRoomTurnTimeoutWithGrace(roomData){
    return getRoomTurnTimeout(roomData)+ROOM_TIMEOUT_GRACE_MS;
  }

  function getRoomResultExpiresAt(roomData){
    const status=String(roomData?.status??'');
    if(status!=='finished')return 0;
    const direct=Number(roomData?.resultExpiresAt||roomData?.game?.resultExpiresAt||0);
    if(Number.isFinite(direct)&&direct>0)return direct;
    const fallback=Number(roomData?.updatedAt||0);
    return fallback>0?(fallback+ROOM_RESULT_IDLE_MS):0;
  }

  function getRoomWaitingExpiresAt(roomData){
    const status=String(roomData?.status??'');
    if(status!=='lobby'&&status!=='starting')return 0;
    const direct=Number(roomData?.expiresAt||0);
    if(Number.isFinite(direct)&&direct>0)return direct;
    const fallback=Number(roomData?.updatedAt||roomData?.createdAt||0);
    return fallback>0?(fallback+ROOM_IDLE_KILL_MS):0;
  }

  function getRoomLifecycleExpiresAt(roomData){
    const status=String(roomData?.status??'').trim();
    const inferredStatus=status||((Array.isArray(roomData?.players)&&roomData.players.length&&(!roomData?.game||roomData.game.gameOver))?'lobby':'');
    if(inferredStatus==='finished')return getRoomResultExpiresAt(roomData);
    if(inferredStatus==='lobby'||inferredStatus==='starting')return getRoomWaitingExpiresAt(roomData);
    return 0;
  }

  function formatCountdownMs(ms){
    const totalSeconds=Math.max(0,Math.ceil(ms/1000));
    const minutes=Math.floor(totalSeconds/60);
    const seconds=String(totalSeconds%60).padStart(2,'0');
    return `${minutes}:${seconds}`;
  }

  function roomLifecycleExpired(roomData,now=Date.now()){
    const expiresAt=getRoomLifecycleExpiresAt(roomData);
    return Boolean(expiresAt>0&&now>=expiresAt);
  }

  function roomResultExpired(roomData,now=Date.now()){
    const expiresAt=getRoomResultExpiresAt(roomData);
    return Boolean(expiresAt>0&&now>=expiresAt);
  }

  function roomCountdownText(roomData){
    const status=String(roomData?.status||'').trim();
    const inferredStatus=status||((Array.isArray(roomData?.players)&&roomData.players.length&&(!roomData?.game||roomData.game.gameOver))?'lobby':'');
    const now=Date.now();
    if(inferredStatus==='finished'||inferredStatus==='lobby'||inferredStatus==='starting'){
      const expiresAt=getRoomLifecycleExpiresAt(roomData);
      return formatCountdownMs(expiresAt>0?Math.max(0,expiresAt-now):0);
    }
    const game=roomData?.game;
    if(!game||game.gameOver)return'-';
    const startedAt=Number(game.turnStartedAt)||0;
    if(!startedAt)return'-';
    const timeout=getRoomTurnTimeout(roomData);
    const remain=Math.max(0,timeout-(now-startedAt));
    return formatCountdownMs(remain);
  }

  return{
    formatCountdownMs,
    getRoomLifecycleExpiresAt,
    getRoomResultExpiresAt,
    getRoomTurnTimeout,
    getRoomTurnTimeoutWithGrace,
    getRoomWaitingExpiresAt,
    nextRoomIdleExpiry,
    roomCountdownText,
    roomLifecycleExpired,
    roomResultExpired
  };
}
