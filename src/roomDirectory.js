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

function resolveHostInfo(roomData){
  const players=Array.isArray(roomData?.players)?roomData.players:[];
  let hostId=String(roomData?.hostId||'').trim();
  let hostName=String(roomData?.hostName||'').trim();
  const hostEntry=hostId?players.find((entry)=>String(entry?.uid||'').trim()===hostId):null;
  if(!hostEntry){
    const fallback=players[0]||null;
    hostId=String(fallback?.uid||'').trim();
    hostName=String(fallback?.name||'').trim();
  }else if(!hostName){
    hostName=String(hostEntry?.name||'').trim();
  }
  return{hostId,hostName};
}

export function buildRoomDirectoryDoc({roomId,roomData,firebaseInstanceId}){
  const safeRoomId=String(roomId||'').trim();
  const safeInstanceId=String(firebaseInstanceId||'').trim();
  if(!safeRoomId||!roomData||!safeInstanceId)return null;
  const code=String(roomData.code||'').trim().toUpperCase();
  const createdAt=Math.max(0,Number(roomData.createdAt)||0);
  const updatedAt=Math.max(0,Number(roomData.updatedAt)||createdAt);
  const status=String(roomData.status||'').trim();
  const maxPlayers=Math.max(2,Math.min(4,Number(roomData.maxPlayers)||4));
  const playerCount=Math.max(0,Math.min(maxPlayers,Array.isArray(roomData.players)?roomData.players.length:0));
  const roundCount=Math.max(0,Number(roomData.roundCount)||0);
  const roster=normalizedRoster(roomData);
  const {hostId,hostName}=resolveHostInfo(roomData);
  if(!code||!createdAt||!hostId||!hostName||!status)return null;
  return{
    roomId:safeRoomId,
    code,
    createdAt,
    hostId,
    hostName,
    firebaseInstanceId:safeInstanceId,
    status,
    updatedAt,
    isPrivate:Boolean(roomData.isPrivate),
    maxPlayers,
    playerCount,
    roundCount,
    roster
  };
}

export function roomDirectoryDocToActiveRoom(doc){
  if(!doc)return null;
  const roomId=String(doc.roomId||'').trim();
  const code=String(doc.code||'').trim().toUpperCase();
  const firebaseInstanceId=String(doc.firebaseInstanceId||'').trim();
  const status=String(doc.status||'').trim();
  if(!roomId||!code||!firebaseInstanceId||!status)return null;
  const roster=Array.isArray(doc.roster)
    ?doc.roster
      .filter((entry)=>Number.isFinite(Number(entry?.seat)))
      .map((entry)=>normalizeRosterEntry(entry,entry.seat))
      .sort((a,b)=>a.seat-b.seat)
    :[];
  const maxPlayers=Math.max(2,Math.min(4,Number(doc.maxPlayers)||4));
  const playerCount=Math.max(0,Math.min(maxPlayers,Number(doc.playerCount)||roster.length||0));
  return{
    id:roomId,
    code,
    hostName:String(doc.hostName||'').trim(),
    hostId:String(doc.hostId||'').trim(),
    isPrivate:Boolean(doc.isPrivate),
    status,
    roundCount:Math.max(0,Number(doc.roundCount)||0),
    players:playerCount,
    displayPlayers:Math.max(playerCount,roster.length),
    maxPlayers,
    roster,
    firebaseInstanceId,
    updatedAt:Math.max(0,Number(doc.updatedAt)||Number(doc.createdAt)||0),
    createdAt:Math.max(0,Number(doc.createdAt)||0)
  };
}
