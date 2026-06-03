export function createRoomMutationsController(deps){
  async function collectRestartExcludedPlayerIds(roomId,players){
    const firebaseDb=deps.getFirebaseDb?.();
    const roomIdText=String(roomId||'').trim();
    if(!firebaseDb||!roomIdText||!Array.isArray(players)||!players.length)return new Set();
    const checks=players.map(async(player)=>{
      const uid=String(player?.uid||'').trim();
      if(!uid.startsWith('uid:'))return'';
      const authUid=uid.slice(4).trim();
      if(!authUid)return'';
      try{
        const snap=await firebaseDb.collection(deps.FIRESTORE_USERS_COLLECTION).doc(authUid).get();
        const data=snap.data()??{};
        const currentRoomId=String(data.currentRoomId??'').trim();
        return currentRoomId&&currentRoomId!==roomIdText?uid:'';
      }catch{
        return'';
      }
    });
    const resolved=await Promise.all(checks);
    return new Set(resolved.filter(Boolean));
  }

  async function setRoomPrivacy(isPrivate){
    const state=deps.getState();
    const roomDb=deps.currentRoomDb();
    if(!state.room.id||!roomDb)return;
    try{
      const uid=deps.currentRoomPlayerId();
      if(!uid)return;
      const ref=roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(state.room.id);
      await roomDb.runTransaction(async(tx)=>{
        const snap=await tx.get(ref);
        if(!snap.exists)return;
        const data=snap.data()??{};
        if(String(data.status)==='playing')return;
        const hostId=String(data.hostId??'').trim();
        if(hostId&&hostId!==uid)throw new Error('not host');
        tx.update(ref,{isPrivate:Boolean(isPrivate),updatedAt:Date.now()});
      });
    }catch(err){
      console.error('privacy update failed',err);
    }
  }

  async function startRoom(){
    const state=deps.getState();
    const roomDb=deps.currentRoomDb();
    if(!state.room.id||!roomDb)return false;
    const uid=deps.currentRoomPlayerId();
    try{
      const ref=roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(state.room.id);
      await roomDb.runTransaction(async(tx)=>{
        const snap=await tx.get(ref);
        if(!snap.exists)return;
        const data=snap.data()??{};
        const players=Array.isArray(data.players)?data.players:[];
        let hostId=String(data.hostId??'').trim();
        let hostName=String(data.hostName??'').trim();
        if(!hostId){
          const fallback=players[0];
          hostId=String(fallback?.uid??'');
          hostName=String(fallback?.name??'');
        }
        if(uid){
          if(String(hostId)!==uid)throw new Error('not host');
        }else if(hostId){
          throw new Error('not host');
        }
        const humanPlayers=players.filter((p)=>String(p.uid||'').startsWith('uid:')||String(p.uid||'').startsWith('guest:'));
        if(humanPlayers.length<2)throw new Error('need players');
        const now=Date.now();
        const hostUpdate=(hostId&&String(data.hostId??'').trim()!==hostId)?{hostId,hostName}:{};
        const bumped=deps.bumpRoomPlayerLastSeen(players,uid,now);
        const nextPlayers=bumped.changed?bumped.players:players;
        tx.update(ref,{status:'starting',updatedAt:now,expiresAt:deps.nextRoomIdleExpiry(now),playerIds:deps.roomPlayerIds(nextPlayers),players:nextPlayers,...hostUpdate});
      });
        window.setTimeout(async()=>{
          try{
            await roomDb.runTransaction(async(tx)=>{
              const snap=await tx.get(ref);
              if(!snap.exists)return;
              const data=snap.data()??{};
              if(String(data.status)!=='starting')return;
              const now=Date.now();
              const game=deps.buildRoomGameState(data);
              const bumped=deps.bumpRoomPlayerLastSeen(Array.isArray(data.players)?data.players:[],String(data.hostId||''),now);
              const nextPlayers=bumped.changed?bumped.players:data.players;
              game.turnStartedAt=Date.now();
              tx.update(ref,{status:'playing',game,gameVersion:Number(data.gameVersion||0)+1,updatedAt:now,expiresAt:now+(24*60*60*1000),players:nextPlayers});
            });
          }catch(err){
            console.error('start room finalize failed',err);
          }
        },200);
      return true;
    }catch(err){
      console.error('start room failed',err);
      const msg=String(err?.message??'');
      if(msg.includes('need players'))deps.setRoomError(deps.t('roomNeedPlayers'));
      deps.clearRoomStartPending();
      return false;
    }
  }

  async function roomReset(){
    const state=deps.getState();
    const roomDb=deps.currentRoomDb();
    if(!state.room.id||!roomDb)return;
    const uid=deps.currentRoomPlayerId();
    try{
      const ref=roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(state.room.id);
      await roomDb.runTransaction(async(tx)=>{
        const snap=await tx.get(ref);
        if(!snap.exists)return;
        const data=snap.data()??{};
        if(String(data.hostId)!==uid)throw new Error('not host');
        const now=Date.now();
        const players=Array.isArray(data.players)?data.players:[];
        tx.update(ref,{status:'lobby',game:null,updatedAt:now,expiresAt:deps.nextRoomIdleExpiry(now),players});
      });
    }catch(err){
      console.error('room reset failed',err);
    }
  }

  async function restartRoomGame(){
    const state=deps.getState();
    const roomDb=deps.currentRoomDb();
    if(!state.room.id||!roomDb)return;
    const uid=deps.currentRoomPlayerId();
    try{
      const excludedPlayerIds=await collectRestartExcludedPlayerIds(state.room.id,Array.isArray(state.room.data?.players)?state.room.data.players:[]);
      const ref=roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(state.room.id);
      await roomDb.runTransaction(async(tx)=>{
        const snap=await tx.get(ref);
        if(!snap.exists)return;
        const data=snap.data()??{};
        if(String(data.hostId)!==uid)throw new Error('not host');
        if(deps.roomResultExpired(data))throw new Error('room expired');
        let players=Array.isArray(data.players)?data.players:[];
        if(excludedPlayerIds.size){
          players=players.filter((p)=>!excludedPlayerIds.has(String(p?.uid||'')));
        }
        const humanPlayers=players.filter((p)=>String(p.uid||'').startsWith('uid:')||String(p.uid||'').startsWith('guest:'));
        if(humanPlayers.length<2)throw new Error('need players');
        const now=Date.now();
        let hostId=String(data.hostId||'').trim();
        let hostName=String(data.hostName||'').trim();
        if(hostId&&!players.some((p)=>String(p?.uid||'')===hostId)){
          hostId=String(humanPlayers[0]?.uid??players[0]?.uid??'');
          hostName=String(humanPlayers[0]?.name??players[0]?.name??'');
        }
        const roomDataForRestart=players===data.players?data:{...data,players,hostId,hostName};
        const game=deps.buildRoomGameState(roomDataForRestart);
        game.turnStartedAt=Date.now();
        const bumped=deps.bumpRoomPlayerLastSeen(players,uid,now);
        const nextPlayers=bumped.changed?bumped.players:players;
        tx.update(ref,{
          status:'playing',
          game,
          updatedAt:now,
          gameVersion:Number(data.gameVersion||0)+1,
          expiresAt:now+(24*60*60*1000),
          players:nextPlayers,
          playerIds:deps.roomPlayerIds(nextPlayers),
          hostId,
          hostName
        });
      });
    }catch(err){
      console.error('restart room failed',err);
      const msg=String(err?.message??'');
      if(msg.includes('need players'))deps.setSoloStatus(deps.t('roomNeedPlayers'));
      else if(msg.includes('room expired'))deps.setSoloStatus(deps.t('roomHostSneakAway'));
    }
  }

  async function resetRoomExpiryTo60s(){
    const state=deps.getState();
    const roomId=String(state.room.id||'').trim();
    const roomDb=deps.currentRoomDb();
    if(!roomId||!roomDb)return;
    try{
      const ref=roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(roomId);
      await roomDb.runTransaction(async(tx)=>{
        const snap=await tx.get(ref);
        if(!snap.exists)return;
        const data=snap.data()??{};
        const status=String(data.status||'');
        const now=Date.now();
        if(status==='finished'){
          tx.update(ref,{updatedAt:now,expiresAt:deps.nextRoomIdleExpiry(now),resultExpiresAt:now+deps.ROOM_RESULT_IDLE_MS});
          return;
        }
        if(status==='lobby'||status==='starting'){
          tx.update(ref,{updatedAt:now,expiresAt:deps.nextRoomIdleExpiry(now)});
        }
      });
    }catch(err){
      console.error('reset room expiry failed',err);
    }
  }

  async function touchRoomPresence(force=false){
    const state=deps.getState();
    const roomDb=deps.currentRoomDb();
    if(!state.room.id||!roomDb)return;
    const uid=deps.currentRoomPlayerId();
    if(!uid)return;
    try{
      const ref=roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(state.room.id);
      await roomDb.runTransaction(async(tx)=>{
        const snap=await tx.get(ref);
        if(!snap.exists)return;
        const data=snap.data()??{};
        const players=Array.isArray(data.players)?[...data.players]:[];
        let touched=false;
        const now=Date.now();
        const next=players.map((p)=>{
          if(String(p.uid)!==uid)return p;
          const prev=Number(p.lastSeen)||0;
          if(!force&&now-prev<1000)return p;
          touched=true;
          return{...p,lastSeen:now};
        });
        if(touched)tx.update(ref,{players:next,updatedAt:now});
      });
    }catch{}
  }

  async function syncRoomSelfProfile(){
    const state=deps.getState();
    const roomDb=deps.currentRoomDb();
    if(!state.room.id||!roomDb)return;
    const uid=deps.currentRoomPlayerId();
    if(!uid)return;
    const desiredName=String(state.home.name||'Player').slice(0,32);
    const desiredEmail=String(deps.currentUserEmail?.()||'').trim().toLowerCase();
    const desiredGender=state.home.gender==='female'?'female':'male';
    const desiredPic=deps.authPictureUrl();
    try{
      const ref=roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(state.room.id);
      await roomDb.runTransaction(async(tx)=>{
        const snap=await tx.get(ref);
        if(!snap.exists)return;
        const data=snap.data()??{};
        const players=Array.isArray(data.players)?[...data.players]:[];
        let touched=false;
        const now=Date.now();
        const next=players.map((p)=>{
          const patch=deps.sanitizeRoomPlayerEntry(p);
          if(String(p.uid)!==uid)return patch;
          if(desiredEmail&&String(p.email??'').trim().toLowerCase()!==desiredEmail){patch.email=desiredEmail;touched=true;}
          if(desiredName&&String(p.name??'')!==desiredName){patch.name=desiredName;touched=true;}
          if(desiredGender&&String(p.gender??'')!==desiredGender){patch.gender=desiredGender;touched=true;}
          if(String(p.picture??'').trim()!==desiredPic){patch.picture=desiredPic;touched=true;}
          if(now-Number(p.lastSeen||0)>3000){patch.lastSeen=now;touched=true;}
          return patch;
        });
        if(touched)tx.update(ref,{players:next,updatedAt:now});
      });
    }catch{}
  }

  async function syncRoomSelfScoreIfNeeded(){
    const state=deps.getState();
    const roomDb=deps.currentRoomDb();
    const roomData=state.room.data;
    if(!state.room.id||!roomDb||!roomData)return;
    if(state.home.google?.hydrating)return;
    const status=String(roomData.status||'');
    if(status==='playing')return;
    const uid=deps.currentRoomPlayerId();
    if(!uid)return;
    const seat=deps.roomSeatForPlayer(roomData,uid);
    if(!Number.isInteger(seat)||seat<0||seat>3)return;
    const desiredScore=deps.currentHumanScoreValue();
    const currentTotals=deps.normalizeRoomTotals(roomData.totals);
    if(currentTotals[seat]===desiredScore)return;
    try{
      const ref=roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(state.room.id);
      await roomDb.runTransaction(async(tx)=>{
        const snap=await tx.get(ref);
        if(!snap.exists)return;
        const data=snap.data()??{};
        if(String(data.status||'')==='playing')return;
        const liveSeat=deps.roomSeatForPlayer(data,uid);
        if(!Number.isInteger(liveSeat)||liveSeat<0||liveSeat>3)return;
        const prevTotals=deps.normalizeRoomTotals(data.totals);
        if(prevTotals[liveSeat]===desiredScore)return;
        tx.update(ref,{totals:deps.roomTotalsWithSeatScore(prevTotals,liveSeat,desiredScore),updatedAt:Date.now()});
      });
    }catch(err){
      console.error('sync room self score failed',err);
    }
  }

  return{
    resetRoomExpiryTo60s,
    restartRoomGame,
    roomReset,
    setRoomPrivacy,
    startRoom,
    syncRoomSelfProfile,
    syncRoomSelfScoreIfNeeded,
    touchRoomPresence
  };
}
