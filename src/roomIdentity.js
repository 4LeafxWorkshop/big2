export function createRoomIdentityHelpers({getState,getFirebaseAuth}){
  function currentAuthUserUid(){
    return String(getFirebaseAuth()?.currentUser?.uid??'').trim();
  }

  function baseRoomPlayerId(){
    const uid=currentAuthUserUid();
    if(uid)return `uid:${uid}`;
    const state=getState();
    if(!state.sessionId){
      const rand=(()=>{try{return crypto.randomUUID();}catch{return Math.random().toString(36).slice(2,10);}})();
      state.sessionId=`guest:${rand}`;
    }
    return state.sessionId;
  }

  function currentRoomPlayerId(){
    const state=getState();
    const pinned=String(state.room?.playerId??'').trim();
    if(pinned)return pinned;
    return baseRoomPlayerId();
  }

  return{
    baseRoomPlayerId,
    currentAuthUserUid,
    currentRoomPlayerId
  };
}
