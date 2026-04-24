export function createRoomLifecycleController(deps){
  function clearPresenceTimer(){
    const timer=deps.getRoomPresenceTimer();
    if(timer){
      clearInterval(timer);
      deps.setRoomPresenceTimer(null);
    }
  }

  function resetRoomState(){
    const state=deps.getState();
    if(state.room.unsub){try{state.room.unsub();}catch{}}
    clearPresenceTimer();
    deps.setRoomResultExpiryReached(false);
    void deps.updateActiveRoomPointer('');
    deps.clearRoomStartPending();
    state.room={id:'',code:'',firebaseInstanceId:'',data:null,joinOpen:false,inviteOpen:false,error:'',started:false,unsub:null,selfSeat:-1,recordedGameKey:'',lastMoveKey:'',playerId:'',pendingStart:false,lastResultPlayers:null,inviteUrl:'',inviteQrDataUrl:'',inviteQrLoading:false,inviteQrError:'',pendingInviteCode:'',adPromptGameKey:''};
    state.room.playerId='';
    if(state.home.mode==='room')state.home.mode='solo';
  }

  function abandonRoomLocally(msg='',openLobby=true){
    const state=deps.getState();
    if(state.room.unsub){try{state.room.unsub();}catch{}}
    clearPresenceTimer();
    deps.setRoomResultExpiryReached(false);
    void deps.updateActiveRoomPointer('');
    deps.clearRoomStartPending();
    state.screen='home';
    state.selected.clear();
    state.recommendation=null;
    deps.setRecommendHint('');
    state.opponentProfileName='';
    state.home.mode='solo';
    state.room={id:'',code:'',firebaseInstanceId:'',data:null,joinOpen:Boolean(openLobby),inviteOpen:false,error:String(msg||''),started:false,unsub:null,selfSeat:-1,recordedGameKey:'',lastMoveKey:'',playerId:'',pendingStart:false,lastResultPlayers:null,inviteUrl:'',inviteQrDataUrl:'',inviteQrLoading:false,inviteQrError:'',pendingInviteCode:'',adPromptGameKey:''};
    state.room.playerId='';
    deps.render();
  }

  async function leaveRoom(toLobby=false){
    const state=deps.getState();
    const roomId=String(state.room.id||'').trim();
    const uid=deps.currentRoomPlayerId();
    const roomDb=deps.currentRoomDb();
    let refreshLobbyAfterLeave=false;
    if(roomId){
      await deps.updateActiveRoomPointer('');
      resetRoomState();
      state.screen='home';
      state.selected.clear();
      state.recommendation=null;
      deps.setRecommendHint('');
      state.opponentProfileName='';
      if(toLobby){
        state.room.joinOpen=true;
        state.room.error='';
        refreshLobbyAfterLeave=true;
      }
      deps.render();
    }
    if(!roomId||!roomDb||!uid)return;
    try{
      const ref=roomDb.collection(deps.FIRESTORE_ROOMS_COLLECTION).doc(roomId);
      let shouldDeleteDirectory=false;
      await roomDb.runTransaction(async(tx)=>{
        const snap=await tx.get(ref);
        if(!snap.exists)return;
        const data=snap.data()??{};
        const players=Array.isArray(data.players)?[...data.players]:[];
        const remaining=players.filter((p)=>String(p.uid)!==uid);
        const now=Date.now();
        const status=String(data.status??'lobby');
        const leaving=players.find((p)=>String(p.uid)===uid);
        const hostLeaving=String(data.hostId)===uid;
        if(!remaining.length){
          tx.delete(ref);
          shouldDeleteDirectory=true;
          return;
        }
        const remainingHumans=remaining.filter((p)=>deps.isRoomPlayerHuman(p));
        if(!remainingHumans.length){
          tx.delete(ref);
          shouldDeleteDirectory=true;
          return;
        }
        const activeHumans=remainingHumans.filter((p)=>deps.isRoomPlayerActive(p,status,now));
        if(!activeHumans.length){
          tx.delete(ref);
          shouldDeleteDirectory=true;
          return;
        }
        const hostUpdate=hostLeaving?{hostId:String(remainingHumans[0]?.uid??remaining[0]?.uid??''),hostName:String(remainingHumans[0]?.name??remaining[0]?.name??'')}:{}; 
        if(status==='playing'&&data.game&&leaving&&Number.isFinite(Number(leaving.seat))){
          const game=deps.cloneRoomGame(data.game);
          const seat=Number(leaving.seat);
          if(game&&game.players&&game.players[seat]){
            const bp=deps.botProfileForSeat(seat);
            const target=game.players[seat];
            target.isHuman=false;
            target.uid=`bot:${seat}:${bp.name}`;
            target.name=bp.name;
            target.gender=bp.gender;
            target.picture='';
          }
          if(game){
            const text=deps.roomLeaveLogText(String(leaving.name||''));
            deps.addRoomSystemLog(game,text);
          }
          tx.update(ref,{players:remaining,playerIds:deps.roomPlayerIds(remaining),game,updatedAt:now,gameVersion:Number(data.gameVersion||0)+1,...hostUpdate});
          return;
        }
        tx.update(ref,{players:remaining,playerIds:deps.roomPlayerIds(remaining),updatedAt:now,...hostUpdate});
      });
      if(shouldDeleteDirectory)await deps.deleteRoomDirectory(roomId);
    }catch(err){
      console.error('leave room failed',err);
    }finally{
      if(refreshLobbyAfterLeave)void deps.loadActiveRooms();
    }
  }

  return{
    abandonRoomLocally,
    leaveRoom,
    resetRoomState
  };
}
