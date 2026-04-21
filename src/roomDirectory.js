function isRoomPlayerHumanByUid(uid){
  const value=String(uid||'').trim();
  return value.startsWith('uid:')||value.startsWith('guest:');
}

function normalizeRosterEntry(entry,seat){
  const safeSeat=Number.isFinite(Number(seat))?Number(seat):0;
  const name=String(entry?.name||'').trim();
  const gender=String(entry?.gender||'male')==='female'?'female':'male';
  const picture=String(entry?.picture||'').trim();
  const uid=String(entry?.uid||'').trim();
  const lastSeen=Math.max(0,Number(entry?.lastSeen)||0);
  return{
    seat:safeSeat,
    name,
    gender,
    picture,
    uid,
    lastSeen,
    isBot:!isRoomPlayerHumanByUid(uid)
  };
}

function normalizedRoster(roomData){
  const status=String(roomData?.status||'').trim();
  const roomPlayers=Array.isArray(roomData?.players)?roomData.players:[];
  if(status!=='lobby'&&Array.isArray(roomData?.game?.players)){
    return roomData.game.players.map((entry,index)=>{
      const seatValue=Number.isFinite(Number(entry?.seat))?Number(entry.seat):index;
      return normalizeRosterEntry({
        seat:seatValue,
        name:String(entry?.name||`Bot ${seatValue+1}`),
        gender:entry?.gender,
        picture:entry?.picture,
        uid:String(entry?.uid||`bot:${seatValue}`),
        lastSeen:0
      },seatValue);
    }).sort((a,b)=>a.seat-b.seat);
  }
  return roomPlayers
    .filter((entry)=>Number.isFinite(Number(entry?.seat))&&Number(entry.seat)>=0&&Number(entry.seat)<=3)
    .map((entry)=>normalizeRosterEntry(entry,entry.seat))
    .sort((a,b)=>a.seat-b.seat);
}

function resolveHostInfo(roomData,roster){
  const players=Array.isArray(roomData?.players)?roomData.players:[];
  const hostId=String(roomData?.hostId||'').trim();
  const hostPlayer=hostId?players.find((entry)=>String(entry?.uid||'').trim()===hostId):null;
  const fallback=hostPlayer||players[0]||null;
  const fallbackUid=String(fallback?.uid||'').trim();
  const rosterHost=hostId?roster.find((entry)=>String(entry?.uid||'').trim()===hostId):null;
  return{
    hostId:hostId||fallbackUid,
    hostName:String(rosterHost?.name||fallback?.name||'').trim()
  };
}

export function buildRoomDirectoryDoc({roomId,roomData,firebaseInstanceId}){
  const safeRoomId=String(roomId||'').trim();
  const safeInstanceId=String(firebaseInstanceId||'').trim();
  if(!safeRoomId||!roomData||!safeInstanceId)return null;
  const code=String(roomData.code||'').trim().toUpperCase();
  const createdAt=Math.max(0,Number(roomData.createdAt)||0);
  const updatedAt=Math.max(0,Number(roomData.updatedAt)||createdAt);
  if(!code||!createdAt)return null;
  return{
    roomId:safeRoomId,
    code,
    createdAt,
    updatedAt,
    firebaseInstanceId:safeInstanceId
  };
}

export function buildActiveRoomRow({roomId,roomData,firebaseInstanceId}){
  const safeRoomId=String(roomId||'').trim();
  const safeInstanceId=String(firebaseInstanceId||'').trim();
  if(!safeRoomId||!roomData||!safeInstanceId)return null;
  const code=String(roomData.code||'').trim().toUpperCase();
  const status=String(roomData.status||'').trim();
  if(!code||!status)return null;
  const roster=normalizedRoster(roomData);
  const {hostId,hostName}=resolveHostInfo(roomData,roster);
  const maxPlayers=Math.max(2,Math.min(4,Number(roomData.maxPlayers)||4));
  const playerCount=Math.max(0,Math.min(maxPlayers,Array.isArray(roomData.players)?roomData.players.length:0));
  return{
    id:safeRoomId,
    code,
    hostName,
    hostId,
    isPrivate:Boolean(roomData.isPrivate),
    status,
    roundCount:Math.max(0,Number(roomData.roundCount)||0),
    players:playerCount,
    displayPlayers:Math.max(playerCount,roster.length),
    maxPlayers,
    roster,
    firebaseInstanceId:safeInstanceId,
    updatedAt:Math.max(0,Number(roomData.updatedAt)||Number(roomData.createdAt)||0),
    createdAt:Math.max(0,Number(roomData.createdAt)||0)
  };
}
