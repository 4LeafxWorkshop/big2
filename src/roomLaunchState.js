export function resolveRoomLaunchState({state,roomData,roomPlayers}={}){
  const players=Array.isArray(roomPlayers)?roomPlayers:Array.isArray(roomData?.players)?roomData.players:[];
  const roomStatus=String(roomData?.status??'');
  const roomStarting=roomStatus==='starting';
  const humanPlayers=players.filter((player)=>String(player?.uid||'').startsWith('uid:')||String(player?.uid||'').startsWith('guest:'));
  const roomCanStart=humanPlayers.length>=2;
  const profileRestorePending=Boolean(state?.home?.google?.signedIn&&state?.home?.google?.hydrating);
  const roomStartPending=Boolean(state?.room?.pendingStart);
  const startDisabled=roomStarting||!roomCanStart||roomStartPending||profileRestorePending;
  const startSubtitleKey=roomStarting||roomStartPending
    ?'startingGame'
    :profileRestorePending
      ?'restoringScore'
      :roomCanStart
        ?'startReadySubtitle'
        :'roomNeedPlayersShort';
  const startHintKey=roomStartPending
    ?''
    :roomStarting
      ?'roomStarting'
      :profileRestorePending
        ?'restoringScore'
        :'';
  const lobbyHintKey=roomStarting?'roomStarting':'roomWaitingHost';
  return{
    players,
    roomStatus,
    roomStarting,
    humanPlayers,
    roomCanStart,
    profileRestorePending,
    roomStartPending,
    startDisabled,
    startSubtitleKey,
    startHintKey,
    lobbyHintKey
  };
}
