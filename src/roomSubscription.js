export function createRoomSubscriptionController(deps){
  function normalizeEmail(value){
    return String(value??'').trim().toLowerCase();
  }
  function sameJsonValue(a,b){
    return JSON.stringify(a)===JSON.stringify(b);
  }
  function buildLobbyRenderKey(roomData){
    const players=Array.isArray(roomData?.players)?roomData.players:[];
    const playerKey=players.map((player)=>[
      String(player?.uid||''),
      String(player?.name||''),
      String(player?.gender||''),
      String(player?.picture||''),
      Number(player?.seat??-1),
      Number(Boolean(player?.isHost))
    ].join('|')).join(';');
    return[
      String(roomData?.status||''),
      String(roomData?.code||''),
      String(roomData?.hostId||''),
      String(roomData?.hostName||''),
      Number(Boolean(roomData?.isPrivate)),
      Number(roomData?.maxPlayers||0),
      String(roomData?.playerIds?.join?.(',')||''),
      playerKey
    ].join('::');
  }
  function roomPlayerMatchesCurrentUser(entry){
    const currentEmail=normalizeEmail(deps.currentUserEmail?.());
    const entryEmail=normalizeEmail(entry?.email);
    if(currentEmail&&entryEmail&&entryEmail===currentEmail)return true;
    return String(entry?.uid||'')===String(deps.baseRoomPlayerId());
  }
  async function resolveRoomDocByDirectory(roomId='',code=''){
    const roomIdText=String(roomId||'').trim();
    const codeText=String(code||'').trim().toUpperCase();
    const directory=roomIdText
      ?await deps.readRoomDirectory(roomIdText)
      :(codeText?await deps.findRoomDirectoryByCode(codeText):null);
    if(!directory){
      const firebaseDb=deps.getFirebaseDb();
      if(!firebaseDb)return null;
      try{
        const primaryRef=roomIdText
          ?firebaseDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(roomIdText)
          :null;
        let primarySnap=primaryRef?await primaryRef.get():null;
        if((!primarySnap||!primarySnap.exists)&&codeText){
          const primaryByCode=await firebaseDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).where('code','==',codeText).limit(1).get();
          primarySnap=primaryByCode.docs?.[0]??null;
        }
        if(!primarySnap||!primarySnap.exists)return null;
        const docId=String(primarySnap.id||roomIdText||'').trim();
        return{
          doc:primarySnap,
          ref:primarySnap.ref,
          db:firebaseDb,
          instanceId:deps.primaryFirebaseInstanceId(),
          directory:null,
          legacy:true,
          roomId:docId
        };
      }catch{
        return null;
      }
    }
    const dirData=directory.data()??{};
    const liveRoomId=String(dirData.roomId||directory.id||'').trim();
    const instanceId=String(dirData.firebaseInstanceId||deps.primaryFirebaseInstanceId()).trim()||deps.primaryFirebaseInstanceId();
    const db=await deps.getFirebaseDbForInstanceId(instanceId);
    if(!db||!liveRoomId)return null;
    const ref=db.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(liveRoomId);
    const snap=await ref.get();
    if(!snap.exists){
      await deps.deleteRoomDirectory(directory.id);
      return null;
    }
    return{doc:snap,ref,db,instanceId,directory,roomId:liveRoomId};
  }

  async function connectToRoom(roomId,code='',instanceId=''){
    const targetRoomId=String(roomId||'').trim();
    if(!targetRoomId)return false;
    let shardDb=null;
    let resolvedInstanceId=String(instanceId||'').trim();
    if(resolvedInstanceId){
      shardDb=await deps.getFirebaseDbForInstanceId(resolvedInstanceId);
    }
    if(!shardDb){
      const resolved=await resolveRoomDocByDirectory(targetRoomId,code);
      if(!resolved)return false;
      shardDb=resolved.db;
      resolvedInstanceId=resolved.instanceId;
    }
    subscribeRoom(targetRoomId,code,resolvedInstanceId,shardDb);
    return true;
  }

  function resolveRoomHostInfo(roomData){
    const players=Array.isArray(roomData?.players)?roomData.players:[];
    let hostId=String(roomData?.hostId??'').trim();
    let hostName=String(roomData?.hostName??'').trim();
    const hostExists=hostId&&players.some((p)=>String(p.uid)===hostId);
    if(!hostExists){
      const fallback=players[0];
      hostId=String(fallback?.uid??'');
      hostName=String(fallback?.name??'');
    }else if(hostId&&!hostName){
      const entry=players.find((p)=>String(p.uid)===hostId);
      hostName=String(entry?.name??'');
    }
    return{hostId,hostName};
  }

  async function syncRoomHostIfNeeded(ref,roomData){
    const status=String(roomData?.status??'');
    if(status==='playing')return;
    const next=resolveRoomHostInfo(roomData);
    const currentId=String(roomData?.hostId??'').trim();
    const currentName=String(roomData?.hostName??'').trim();
    if(!next.hostId)return;
    if(next.hostId===currentId&&next.hostName===currentName)return;
    const firebaseDb=deps.getFirebaseDb();
    if(!firebaseDb)return;
    try{
      await firebaseDb.runTransaction(async(tx)=>{
        const snap=await tx.get(ref);
        if(!snap.exists)return;
        const data=snap.data()??{};
        if(String(data.status??'')==='playing')return;
        const latest=resolveRoomHostInfo(data);
        if(!latest.hostId)return;
        const latestId=String(data.hostId??'').trim();
        const latestName=String(data.hostName??'').trim();
        if(latest.hostId===latestId&&latest.hostName===latestName)return;
        tx.update(ref,{hostId:latest.hostId,hostName:latest.hostName,updatedAt:Date.now()});
      });
    }catch{}
  }

  function subscribeRoom(roomId,code,firebaseInstanceId='',roomDbOverride=null){
    const state=deps.getState();
    if(state.room.unsub){try{state.room.unsub();}catch{}}
    const roomDb=roomDbOverride||deps.currentRoomDb()||deps.getFirebaseDb();
    if(!roomDb)return;
    const resolvedInstanceId=String(firebaseInstanceId||state.room.firebaseInstanceId||deps.primaryFirebaseInstanceId()).trim()||deps.primaryFirebaseInstanceId();
    const ref=roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(roomId);
    const unsub=ref.onSnapshot((snap)=>{
      const liveState=deps.getState();
      if(!snap.exists){deps.abandonRoomLocally(deps.t('roomDisconnected'),true);return;}
      const data=snap.data()??{};
      const now=Date.now();
      const reconnectMsg=deps.t('roomReconnecting');
      const staleMsg=deps.t('roomStale');
      const updatedAt=Number(data.updatedAt)||0;
      const isStale=updatedAt>0&&(now-updatedAt>deps.ROOM_STALE_MS);
      if(isStale){
        deps.setRoomError(staleMsg);
      }else if(liveState.room.error===reconnectMsg||liveState.room.error===staleMsg){
        deps.setRoomError('');
      }
      void syncRoomHostIfNeeded(ref,data);
      const prevRoomData=liveState.room.data;
      let resolvedId=String(liveState.room.playerId||'').trim();
      const matchedCurrent=Array.isArray(data.players)?data.players.find((p)=>roomPlayerMatchesCurrentUser(p))||null:null;
      const startedLocally=String(data.status||'')==='starting'&&Boolean(liveState.room.pendingStart);
      if(!resolvedId||!Array.isArray(data.players)||!data.players.some((p)=>String(p?.uid||'')===resolvedId)){
        const guestMatch=deps.matchGuestPlayerId(data);
        resolvedId=String(matchedCurrent?.uid||'').trim()||guestMatch||deps.baseRoomPlayerId();
      }
      liveState.room.playerId=resolvedId;
      liveState.home.mode='room';
      liveState.room={...liveState.room,id:roomId,code:code||String(data.code??''),firebaseInstanceId:resolvedInstanceId,data,unsub,joinOpen:false,selfSeat:deps.roomSelfSeat(data)};
      if((String(data.status||'')==='lobby'||String(data.status||'')==='starting')&&deps.refreshRoomInviteQrDataUrl){
        void deps.refreshRoomInviteQrDataUrl(false);
      }
      const selfEntry=matchedCurrent||(Array.isArray(data.players)
        ?data.players.find((p)=>String(p?.uid||'')===String(resolvedId))
        :null);
      deps.setRoomResultExpiryReached(deps.roomResultExpired(data));
      if(deps.roomLifecycleExpired(data,now)){
        void roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(roomId).delete().catch(()=>{});
        void deps.deleteRoomDirectory(roomId);
        deps.abandonRoomLocally(staleMsg,true);
        return;
      }
      if(prevRoomData&&!selfEntry){
        deps.setRoomError(reconnectMsg);
        void (async()=>{
          const freshResolved=await resolveRoomDocByDirectory(roomId,code);
          const freshData=freshResolved?.doc?.data?.()??null;
          const freshPlayers=Array.isArray(freshData?.players)?freshData.players:[];
          const freshResolvedId=String(freshResolved?.doc?.data?.()?.players?.find?.((p)=>roomPlayerMatchesCurrentUser(p))?.uid||'').trim();
          const freshSelfEntry=freshPlayers.find((p)=>roomPlayerMatchesCurrentUser(p))
            ||(freshResolvedId?freshPlayers.find((p)=>String(p?.uid||'')===freshResolvedId):null)
            ||null;
          if(freshSelfEntry)return;
          if(String(deps.getState()?.room?.id||'')!==String(roomId||''))return;
          deps.abandonRoomLocally(deps.t('roomKickedTimeout'),true);
        })();
        return;
      }
      deps.startRoomPresencePing();
      deps.syncRoomSelfProfile?.();
      deps.syncRoomSelfScoreIfNeeded();
      const prevStatus=String(prevRoomData?.status||'');
      const roomStatus=String(data.status);
      if(roomStatus==='playing'&&prevStatus!=='playing'){
        const roomStartKey=`${String(roomId||'').trim()}:${String(data.gameVersion??'').trim()}`;
        if(roomStartKey&&liveState.room.adPromptGameKey!==roomStartKey){
          liveState.room.adPromptGameKey=roomStartKey;
          deps.schedulePopunderAfterRender?.(350);
        }
      }
      if(liveState.room.pendingStart&&(roomStatus==='starting'||roomStatus==='playing')){
        deps.clearRoomStartPending();
      }
      const rosterAll=Array.isArray(data.players)?data.players:[];
      const hasHuman=rosterAll.some((p)=>String(p.uid||'').startsWith('uid:')||String(p.uid||'').startsWith('guest:'));
      if((roomStatus==='lobby'||roomStatus==='starting')&&!hasHuman){
        void roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(roomId).delete().catch(()=>{});
        void deps.deleteRoomDirectory(roomId);
        deps.abandonRoomLocally(deps.t('roomDisconnected'),true);
        return;
      }
      if(roomStatus==='lobby'||roomStatus==='starting'){
        const prevLobbyKey=String(liveState.room.lobbyRenderKey||'');
        const nextLobbyKey=buildLobbyRenderKey(data);
        const active=rosterAll.filter((p)=>deps.isRoomPlayerActive(p,roomStatus,now));
        const expectedIds=deps.roomPlayerIds(rosterAll);
        const existingIds=Array.isArray(data.playerIds)?data.playerIds.map((v)=>String(v)):null;
        const idsMatch=Array.isArray(existingIds)
          && existingIds.length===expectedIds.length
          && expectedIds.every((id)=>existingIds.includes(id));
        const hostId=String(data.hostId||'').trim();
        const hostEntry=rosterAll.find((p)=>String(p?.uid||'')===hostId)||null;
        const hostLastSeen=Number(hostEntry?.lastSeen||0);
        const hostStale=!hostEntry||(hostLastSeen>0&&now-hostLastSeen>deps.ROOM_HOST_TAKEOVER_MS);
        const hostInfo=resolveRoomHostInfo({...data,players:active});
        let nextHostId=hostInfo.hostId;
        let nextHostName=hostInfo.hostName;
        if(hostStale){
          const candidate=deps.selectRoomHostCandidate(active,now);
          if(candidate){
            nextHostId=String(candidate.uid||nextHostId||'');
            nextHostName=String(candidate.name||nextHostName||'');
          }
        }
        if(active.length!==rosterAll.length){
          const activeHumans=active.filter((p)=>String(p.uid||'').startsWith('uid:')||String(p.uid||'').startsWith('guest:'));
          if(!activeHumans.length){
            void roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(roomId).delete().catch(()=>{});
            void deps.deleteRoomDirectory(roomId);
            deps.abandonRoomLocally(deps.t('roomDisconnected'),true);
            return;
          }
          const nextPlayerIds=deps.roomPlayerIds(active);
          const hostMatches=String(data.hostId||'').trim()===nextHostId&&String(data.hostName||'').trim()===nextHostName;
          const playersMatch=sameJsonValue(Array.isArray(data.players)?data.players:[],active);
          if(!playersMatch||!idsMatch||!hostMatches){
            void roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(roomId).update({
              players:active,
              playerIds:nextPlayerIds,
              hostId:nextHostId,
              hostName:nextHostName,
              updatedAt:now
            }).catch(()=>{});
          }
        }else if(!idsMatch){
          void roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(roomId).update({
            playerIds:expectedIds,
            updatedAt:now
          }).catch(()=>{});
        }
        if(hostStale&&active.length===rosterAll.length){
          const hostMatches=String(data.hostId||'').trim()===nextHostId&&String(data.hostName||'').trim()===nextHostName;
          if(!hostMatches&&nextHostId){
            void roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(roomId).update({
              hostId:nextHostId,
              hostName:nextHostName,
              updatedAt:now
            }).catch(()=>{});
          }
        }
        liveState.room.lobbyRenderKey=nextLobbyKey;
        if(startedLocally){
          deps.syncRoomLobbySeatPanel?.(data);
          return;
        }
        if(prevLobbyKey===nextLobbyKey)return;
        if(deps.syncRoomLobbySeatPanel?.(data))return;
      }
      if(roomStatus==='playing'||roomStatus==='finished'){
        const presenceOnly=deps.isRoomPresenceOnlyUpdate(prevRoomData,data);
        liveState.room.started=true;
        if(data.game){
          const updated=deps.syncRoomGameRoster(data);
          if(updated){
            void roomDb.runTransaction(async(tx)=>{
              const fresh=await tx.get(ref);
              if(!fresh.exists)return;
              const latest=fresh.data()??{};
              if(String(latest.status)!=='playing'||!latest.game)return;
              const txNow=Date.now();
              const roster=Array.isArray(latest.players)?[...latest.players]:[];
              const active=roster.filter((p)=>deps.isRoomPlayerActive(p,latest.status,txNow));
              const activeHumans=active.filter((p)=>String(p.uid||'').startsWith('uid:')||String(p.uid||'').startsWith('guest:'));
              if(!activeHumans.length){
                tx.delete(ref);
                return;
              }
              let hostId=String(latest.hostId??'');
              let hostName=String(latest.hostName??'');
              if(hostId&&!active.some((p)=>String(p.uid)===hostId)){
                const nextHost=active[0];
                hostId=String(nextHost?.uid??'');
                hostName=String(nextHost?.name??'');
              }
              tx.update(ref,{game:updated,players:active,hostId,hostName,updatedAt:txNow,gameVersion:Number(latest.gameVersion||0)+1});
            });
          }
        }
        if(!presenceOnly){
          deps.applyRoomGameSnapshot(data);
        }else{
          deps.maybeRunRoomAi();
        }
        return;
      }
      deps.render();
    });
    state.room={...state.room,id:roomId,code,firebaseInstanceId:resolvedInstanceId,unsub,started:false};
  }

  async function loadActiveRoomPointer(){
    const uid=deps.currentAuthUserUid();
    const state=deps.getState();
    if(!uid){
      try{
        const local=String(localStorage.getItem(deps.LOCAL_ROOM_KEY)||'').trim();
        if(local&&!state.room.id){
          const resolved=await resolveRoomDocByDirectory(local,'');
          const players=Array.isArray(resolved?.doc?.data?.()?.players)?resolved.doc.data().players:[];
          if(resolved&&players.some((p)=>roomPlayerMatchesCurrentUser(p))){
            void connectToRoom(local,'');
          }else{
            try{localStorage.removeItem(deps.LOCAL_ROOM_KEY);}catch{}
          }
        }
      }catch{}
      return;
    }
    const firebaseDb=deps.getFirebaseDb();
    if(!firebaseDb)return;
    if(state.room.id)return;
    try{
      const ref=firebaseDb.collection(deps.FIRESTORE_USERS_COLLECTION).doc(uid);
      const snap=await ref.get();
      if(!snap.exists)return;
      const data=snap.data()??{};
      const roomId=String(data.currentRoomId??'').trim();
      if(!roomId)return;
      const resolved=await resolveRoomDocByDirectory(roomId,'');
      const players=Array.isArray(resolved?.doc?.data?.()?.players)?resolved.doc.data().players:[];
      if(resolved&&players.some((p)=>roomPlayerMatchesCurrentUser(p))){
        void connectToRoom(roomId,'');
      }else{
        await ref.set({currentRoomId:'',updatedAt:Date.now()},{merge:true});
      }
    }catch{}
  }

  return{
    connectToRoom,
    resolveRoomDocByDirectory,
    resolveRoomHostInfo,
    loadActiveRoomPointer,
    subscribeRoom
  };
}
