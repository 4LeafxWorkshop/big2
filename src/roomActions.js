export function createRoomActionsController(deps){
  async function createRoom(){
    if(!deps.initFirebaseIfReady()){
      deps.setRoomError(deps.t('roomCreateFail'));
      return;
    }
    if(!deps.signedInForPlay()){
      deps.setRoomError(deps.t('roomLoginRequired'));
      return;
    }
    deps.setRoomError('');
    try{
      const state=deps.getState();
      if(state.room.id){
        deps.setRoomError(deps.t('roomAlreadyIn'));
        return;
      }
      const membership=await deps.ensureSingleRoomMembership('');
      if(!membership.ok){
        if(membership.roomId){
          void deps.connectToRoom(membership.roomId,membership.code||'',membership.instanceId||'');
          void deps.updateActiveRoomPointer(membership.roomId,membership.instanceId||'');
        }
        deps.setRoomError(deps.t('roomAlreadyIn'));
        return;
      }
      const gate=await deps.gateUserRoomAccess('');
      const gateGuest=await deps.gateGuestRoomAccess('');
      if(!gateGuest.ok||!gate.ok){
        deps.setRoomError(deps.t('roomAlreadyIn'));
        return;
      }
      let code='';
      for(let i=0;i<5;i+=1){
        const candidate=deps.generateRoomCode();
        const exists=await deps.findRoomByCode(candidate);
        if(!exists){
          code=candidate;
          break;
        }
      }
      if(!code){
        deps.setRoomError(deps.t('roomCreateFail'));
        return;
      }
      const uid=deps.baseRoomPlayerId();
      state.room.playerId=uid;
      state.room.code=code;
      state.room.pendingInviteCode='';
      state.room.inviteOpen=false;
      const name=String(state.home.name||'Player').slice(0,32);
      const triedInstanceIds=new Set();
      let firstInstanceId='';
      let created=false;
      let lastError=null;
      while(true){
        const firebaseInstanceId=await deps.chooseNextRoomFirebaseInstanceId();
        if(!firebaseInstanceId)break;
        if(!firstInstanceId){
          firstInstanceId=firebaseInstanceId;
        }else if(firebaseInstanceId===firstInstanceId||triedInstanceIds.has(firebaseInstanceId)){
          break;
        }
        triedInstanceIds.add(firebaseInstanceId);
        const roomDb=await deps.getFirebaseDbForInstanceId(firebaseInstanceId);
        if(!roomDb)continue;
        const now=Date.now();
        const ref=roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc();
        const data={
          hostId:uid,
          hostName:name,
          code,
          status:'lobby',
          createdAt:now,
          updatedAt:now,
          expiresAt:deps.nextRoomIdleExpiry(now),
          maxPlayers:4,
          isPrivate:false,
          players:[{uid,name,gender:state.home.gender==='female'?'female':'male',picture:deps.authPictureUrl(),isHost:true,seat:0,lastSeen:now}],
          playerIds:[uid],
          settings:deps.collectMainSettings(),
          totals:[deps.currentHumanScoreValue(),5000,5000,5000],
          roundCount:0,
          gameVersion:0
        };
        try{
          await ref.set(data);
          try{
            await deps.syncRoomDirectory(ref.id,data,firebaseInstanceId);
          }catch(err){
            await ref.delete().catch(()=>{});
            throw err;
          }
          deps.subscribeRoom(ref.id,code,firebaseInstanceId,roomDb);
          void deps.refreshRoomInviteQrDataUrl?.(true);
          void deps.updateActiveRoomPointer(ref.id,firebaseInstanceId);
          created=true;
          break;
        }catch(err){
          lastError=err;
          console.error('create room shard attempt failed',firebaseInstanceId,err);
        }
      }
      if(!created){
        if(lastError)throw lastError;
        deps.setRoomError(deps.t('roomCreateFail'));
      }
    }catch(err){
      console.error('create room failed',err);
      deps.setRoomError(deps.t('roomCreateFail'));
    }
  }

  async function joinRoomByCode(codeRaw){
    if(!deps.initFirebaseIfReady()){
      deps.setRoomError(deps.t('roomJoinFail'));
      return;
    }
    if(!deps.signedInForPlay()){
      deps.setRoomError(deps.t('roomLoginRequired'));
      return;
    }
    const code=String(codeRaw??'').trim().toUpperCase();
    if(!code)return;
    deps.setRoomError('');
    try{
      const doc=await deps.findRoomByCode(code);
      if(!doc){
        deps.setRoomError(deps.t('roomNotFound'));
        return;
      }
      const data=doc.data()??{};
      const roomDb=(doc.ref?.firestore)||await deps.getFirebaseDbForInstanceId(doc.instanceId);
      if(!roomDb){
        deps.setRoomError(deps.t('roomJoinFail'));
        return;
      }
      const status=String(data.status||'');
      if(status==='playing'){
        deps.setRoomError(deps.t('roomStatusPlaying'));
        return;
      }
      if(status&&status!=='lobby'&&status!=='starting'&&status!=='finished'){
        deps.setRoomError(deps.t('roomClosed'));
        return;
      }
      const state=deps.getState();
        if(state.room.id){
          const same=String(state.room.id)===String(doc.id);
          if(same){
            state.room.code=code;
            state.room.pendingInviteCode='';
            state.room.inviteOpen=false;
            deps.subscribeRoom(doc.id,code,doc.instanceId,roomDb);
          void deps.updateActiveRoomPointer(doc.id,doc.instanceId||'');
            state.room.joinOpen=false;
            deps.render();
            return;
        }
        deps.setRoomError(deps.t('roomAlreadyIn'));
        return;
      }
      const membership=await deps.ensureSingleRoomMembership(doc.id);
      if(!membership.ok){
        if(membership.roomId){
          void deps.connectToRoom(membership.roomId,membership.code||'',membership.instanceId||'');
          void deps.updateActiveRoomPointer(membership.roomId,membership.instanceId||'');
        }
        deps.setRoomError(deps.t('roomAlreadyIn'));
        return;
      }
      const gate=await deps.gateUserRoomAccess(doc.id);
      const gateGuest=await deps.gateGuestRoomAccess(doc.id);
      if(!gateGuest.ok||!gate.ok){
        deps.setRoomError(deps.t('roomAlreadyIn'));
        return;
      }
      if(gate.already){
        state.room.code=code;
        state.room.pendingInviteCode='';
        state.room.inviteOpen=false;
        deps.subscribeRoom(doc.id,code,doc.instanceId,roomDb);
        void deps.refreshRoomInviteQrDataUrl?.(true);
        void deps.updateActiveRoomPointer(doc.id,doc.instanceId||'');
        state.room.joinOpen=false;
        deps.render();
        return;
      }
      const uid=deps.baseRoomPlayerId();
      state.room.playerId=uid;
      state.room.code=code;
      state.room.pendingInviteCode='';
      state.room.inviteOpen=false;
      await roomDb.runTransaction(async(tx)=>{
        const snap=await tx.get(doc.ref);
        if(!snap.exists)throw new Error('room missing');
        const data=snap.data()??{};
        if(data.status!=='lobby'&&data.status!=='starting'&&data.status!=='finished')throw new Error('room closed');
        const now=Date.now();
        let players=Array.isArray(data.players)?[...data.players]:[];
        const name=String(state.home.name||'Player').slice(0,32);
        const gender=state.home.gender==='female'?'female':'male';
        const picture=deps.authPictureUrl();
        const matchesSelfIdentity=(entry)=>{
          if(!entry||!deps.isRoomPlayerHuman(entry))return false;
          const entryUid=String(entry.uid||'').trim();
          if(entryUid===uid)return true;
          const entryName=String(entry.name||'').trim();
          const entryGender=String(entry.gender||'male')==='female'?'female':'male';
          const entryPicture=String(entry.picture||'').trim();
          if(entryName!==name||entryGender!==gender)return false;
          if(picture&&entryPicture&&entryPicture!==picture)return false;
          if(uid.startsWith('uid:')){
            return status==='lobby'||status==='starting'||status==='finished';
          }
          return entryUid.startsWith('guest:')&&(status==='lobby'||status==='starting');
        };
        const matchingIndexes=players.reduce((out,p,idx)=>{
          if(matchesSelfIdentity(p))out.push(idx);
          return out;
        },[]);
        if(matchingIndexes.length>1){
          const exactIdx=matchingIndexes.find((idx)=>String(players[idx]?.uid||'')===uid);
          const keepIdx=Number.isInteger(exactIdx)?exactIdx:matchingIndexes
            .slice()
            .sort((a,b)=>(Number(players[b]?.lastSeen||0)-Number(players[a]?.lastSeen||0)))[0];
          players=players.filter((_,idx)=>!matchingIndexes.includes(idx)||idx===keepIdx);
        }
        let already=players.find((p)=>String(p.uid)===uid)||null;
        const prevCount=players.length;
        let hostId=String(data.hostId||'').trim();
        let hostName=String(data.hostName||'').trim();
        let tookOver=false;
        if(!already&&(data.status==='lobby'||data.status==='starting'||data.status==='finished')){
          const candidates=players.filter((p)=>matchesSelfIdentity(p)&&deps.isRoomPlayerActive(p,data.status,now));
          if(candidates.length===1){
            const idx=players.findIndex((p)=>p===candidates[0]);
            if(idx>=0){
              const oldUid=String(players[idx]?.uid||'');
              players[idx]={...players[idx],uid,name,gender,picture,lastSeen:now};
              if(oldUid&&hostId===oldUid){
                hostId=uid;
                hostName=name;
              }
              tookOver=true;
              already=players[idx];
            }
          }
        }
        if(!already&&!tookOver){
          if(players.length>=Number(data.maxPlayers||4))throw new Error('room full');
          const usedSeats=new Set(players.map((p)=>Number(p.seat)));
          let seat=0;
          while(usedSeats.has(seat)&&seat<4)seat+=1;
          if(seat>=4)throw new Error('room full');
          players.push({uid,name,gender,picture,isHost:false,seat,lastSeen:now});
        }
        const updates={players,playerIds:deps.roomPlayerIds(players),updatedAt:now,hostId,hostName};
        const selfSeat=Number(players.find((p)=>String(p?.uid||'')===uid)?.seat);
        if(Number.isInteger(selfSeat)&&selfSeat>=0&&selfSeat<4){
          const nextTotals=deps.roomTotalsWithSeatScore(data.totals,selfSeat,deps.currentHumanScoreValue());
          const prevTotals=deps.normalizeRoomTotals(data.totals);
          if(nextTotals.some((v,i)=>v!==prevTotals[i]))updates.totals=nextTotals;
        }
        if(String(data.status)==='lobby'||String(data.status)==='starting'){
          updates.expiresAt=deps.nextRoomIdleExpiry(now);
        }
        if(String(data.status)==='finished'){
          updates.expiresAt=deps.nextRoomIdleExpiry(now);
          updates.resultExpiresAt=now+deps.ROOM_RESULT_IDLE_MS;
          updates.gameVersion=Number(data.gameVersion||0)+1;
        }
        if(data.game&&String(data.status)==='playing'&&players.length>prevCount){
          const game=deps.cloneRoomGame(data.game);
          if(game){
            const text=deps.t('roomJoinLog').replace('{{name}}',name);
            deps.addRoomSystemLog(game,text);
            updates.game=game;
            updates.gameVersion=Number(data.gameVersion||0)+1;
          }
        }
        tx.update(doc.ref,updates);
      });
      deps.subscribeRoom(doc.id,code,doc.instanceId,roomDb);
      void deps.refreshRoomInviteQrDataUrl?.(true);
      void deps.updateActiveRoomPointer(doc.id,doc.instanceId||'');
      state.room.joinOpen=false;
      deps.render();
    }catch(err){
      console.error('join room failed',err);
      if(String(err?.message??'').includes('full'))deps.setRoomError(deps.t('roomFull'));
      else if(String(err?.message??'').includes('closed'))deps.setRoomError(deps.t('roomClosed'));
      else deps.setRoomError(deps.t('roomJoinFail'));
    }
  }

  return{createRoom,joinRoomByCode};
}
