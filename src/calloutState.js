export function createCalloutStateController({
  getSoloPlayers,
  stateRefs,
  cardId,
  evaluatePlay,
  fiveKindPower,
  buildResponseCalloutText,
  newCalloutNonce,
  scheduleCalloutExpiry,
  lockTurnProgress,
  clearCalloutStates,
  playSound,
  speakCallout,
  t
}){
  function seatGenderBySeat(v,seat){
    const fromParticipants=v?.participants?.find?.((p)=>p.seat===seat)?.gender;
    if(fromParticipants==='female'||fromParticipants==='male')return fromParticipants;
    const fromSolo=getSoloPlayers()?.[seat]?.gender;
    if(fromSolo==='female'||fromSolo==='male')return fromSolo;
    return'male';
  }

  function currentMust3Call(v){
    const {must3CallState}=stateRefs;
    if(v?.gameOver)return null;
    if(!must3CallState.until)return null;
    const now=Date.now();
    if(now<=must3CallState.until)return{seat:must3CallState.seat,text:must3CallState.text};
    must3CallState.key='';
    must3CallState.text='';
    must3CallState.until=0;
    must3CallState.startedAt=0;
    must3CallState.nonce='';
    return null;
  }

  function pickPlayCalloutVariant(lastPlay,hist,playIdx,isRoundLead){
    if(isRoundLead)return 0;
    const currentEval=evaluatePlay(Array.isArray(lastPlay?.cards)?lastPlay.cards:[]);
    if(!currentEval?.valid)return 1;
    let prevPlay=null;
    for(let i=playIdx-1;i>=0;i-=1){
      const entry=hist[i];
      if(entry?.action==='play'&&Array.isArray(entry.cards)&&entry.cards.length){
        prevPlay=entry;
        break;
      }
    }
    if(!prevPlay)return 1;
    const prevEval=evaluatePlay(prevPlay.cards);
    if(!prevEval?.valid)return 1;
    const samePattern=currentEval.count===prevEval.count&&currentEval.kind===prevEval.kind;
    if(samePattern){
      const topNow=Number(currentEval.power?.[currentEval.power.length-1]??0);
      const topPrev=Number(prevEval.power?.[prevEval.power.length-1]??0);
      const topGap=Math.abs(topNow-topPrev);
      if(topGap<=1)return 3;
      if(topGap>=4)return 4;
      return 1;
    }
    if(currentEval.count===5&&prevEval.count===5){
      const nowKind=Number(fiveKindPower[currentEval.kind]??0);
      const prevKind=Number(fiveKindPower[prevEval.kind]??0);
      if(nowKind>prevKind)return 4;
    }
    return 2;
  }

  function currentLastCardSeat(v){
    const {lastCardCallState,lastCardAnnouncedSeats,lastCardProcessedHistoryLenRef}=stateRefs;
    const now=Date.now();
    const history=v.history??[];
    if(v.isFirstTrick&&history.length===0){
      lastCardAnnouncedSeats.clear();
      lastCardCallState.key='';
      lastCardCallState.text='';
      lastCardCallState.until=0;
      lastCardCallState.startedAt=0;
      lastCardCallState.nonce='';
      lastCardCallState.historyLen=0;
      lastCardProcessedHistoryLenRef.set(0);
      return null;
    }
    if(lastCardCallState.historyLen>0&&history.length===lastCardCallState.historyLen&&lastCardCallState.text){
      if(now<=lastCardCallState.until)return lastCardCallState.seat;
      lastCardCallState.text='';
      lastCardCallState.until=0;
      lastCardCallState.startedAt=0;
      lastCardCallState.nonce='';
      lastCardCallState.historyLen=0;
      return null;
    }
    if(v.gameOver)return null;
    if(history.length<=lastCardProcessedHistoryLenRef.get())return null;
    const latest=history[history.length-1];
    lastCardProcessedHistoryLenRef.set(history.length);
    if(!latest||latest.action!=='play')return null;
    const target=v.participants.find((p)=>p.seat===latest.seat);
    if(!target||target.count!==1)return null;
    if(lastCardAnnouncedSeats.has(latest.seat))return null;
    const key=`${latest.seat}-${latest.cards?.map(cardId).join(',')||''}-${v.history.length}`;
    if(lastCardCallState.key===key&&now<lastCardCallState.until)return lastCardCallState.seat;
    lastCardAnnouncedSeats.add(latest.seat);
    lastCardCallState.key=key;
    lastCardCallState.seat=latest.seat;
    lastCardCallState.text=buildResponseCalloutText('last','',key);
    lastCardCallState.until=now+1500;
    lastCardCallState.startedAt=now;
    lastCardCallState.nonce=newCalloutNonce();
    lastCardCallState.historyLen=history.length;
    scheduleCalloutExpiry(lastCardCallState.until);
    lockTurnProgress(900);
    clearCalloutStates('last');
    playSound('last');
    speakCallout(lastCardCallState.text||t('lastCardCall'),seatGenderBySeat(v,latest.seat),{clipKey:'last',seat:latest.seat});
    return latest.seat;
  }

  function currentPlayTypeCall(v){
    const {playTypeCallState}=stateRefs;
    if(v.gameOver)return'';
    if(playTypeCallState.historyLen>0&&v.history.length>playTypeCallState.historyLen){
      playTypeCallState.until=0;
      playTypeCallState.startedAt=0;
      playTypeCallState.nonce='';
      playTypeCallState.historyLen=0;
    }
    const lastPlay=(v.history??[]).slice().reverse().find((e)=>e.action==='play'&&Array.isArray(e.cards)&&e.cards.length>=4);
    if(!lastPlay)return null;
    const hist=v.history??[];
    const playIdx=hist.lastIndexOf(lastPlay);
    const isRoundLead=(()=>{
      if(playIdx<=0)return true;
      let passStreak=0;
      for(let i=playIdx-1;i>=0;i-=1){
        const entry=hist[i];
        if(entry?.action==='pass'){
          passStreak+=1;
          continue;
        }
        if(entry?.action==='play')return passStreak>=3;
      }
      return true;
    })();
    const key=`${lastPlay.seat}-${lastPlay.kind}-${lastPlay.cards.map(cardId).join(',')}`;
    const now=Date.now();
    if(playTypeCallState.key!==key){
      const playVariantIndex=pickPlayCalloutVariant(lastPlay,hist,playIdx,isRoundLead);
      playTypeCallState.key=key;
      playTypeCallState.seat=lastPlay.seat;
      playTypeCallState.text=buildResponseCalloutText('play',lastPlay.kind,key,{isRoundLead,playVariantIndex});
      playTypeCallState.until=now+1500;
      playTypeCallState.startedAt=now;
      playTypeCallState.nonce=newCalloutNonce();
      playTypeCallState.historyLen=v.history.length;
      scheduleCalloutExpiry(playTypeCallState.until);
      lockTurnProgress(900);
      clearCalloutStates('play');
      speakCallout(playTypeCallState.text,seatGenderBySeat(v,lastPlay.seat),{clipKey:`kind-${String(lastPlay.kind||'').toLowerCase()}`,seat:lastPlay.seat});
    }
    if(playTypeCallState.historyLen>0&&v.history.length===playTypeCallState.historyLen){
      if(now<=playTypeCallState.until)return{seat:playTypeCallState.seat,text:playTypeCallState.text};
      playTypeCallState.until=0;
      playTypeCallState.startedAt=0;
      playTypeCallState.nonce='';
      playTypeCallState.historyLen=0;
      return null;
    }
    if(now>playTypeCallState.until)return null;
    return{seat:playTypeCallState.seat,text:playTypeCallState.text};
  }

  function currentPassCall(v){
    const {passCallState}=stateRefs;
    if(v.gameOver)return null;
    const history=v.history??[];
    if(!history.length){
      passCallState.key='';
      passCallState.until=0;
      passCallState.startedAt=0;
      passCallState.nonce='';
      passCallState.historyLen=0;
      return null;
    }
    if(passCallState.historyLen>0&&history.length>passCallState.historyLen){
      passCallState.until=0;
      passCallState.startedAt=0;
      passCallState.nonce='';
      passCallState.historyLen=0;
    }
    const latest=history[history.length-1];
    if(!latest||latest.action!=='pass'){
      if(passCallState.historyLen>0&&history.length===passCallState.historyLen){
        const now=Date.now();
        if(now<=passCallState.until)return{seat:passCallState.seat,text:passCallState.text};
        passCallState.until=0;
        passCallState.startedAt=0;
        passCallState.nonce='';
        passCallState.historyLen=0;
        return null;
      }
      if(Date.now()>passCallState.until)return null;
      return{seat:passCallState.seat,text:passCallState.text};
    }
    const key=`pass-${history.length}-${latest.seat}`;
    const now=Date.now();
    if(passCallState.key!==key){
      passCallState.key=key;
      passCallState.seat=latest.seat;
      passCallState.text=buildResponseCalloutText('pass','',key);
      passCallState.until=now+1400;
      passCallState.startedAt=now;
      passCallState.nonce=newCalloutNonce();
      passCallState.historyLen=history.length;
      scheduleCalloutExpiry(passCallState.until);
      lockTurnProgress(850);
      clearCalloutStates('pass');
      speakCallout(passCallState.text,seatGenderBySeat(v,latest.seat),{clipKey:'pass',seat:latest.seat});
    }
    if(passCallState.historyLen>0&&history.length===passCallState.historyLen){
      if(now<=passCallState.until)return{seat:passCallState.seat,text:passCallState.text};
      passCallState.until=0;
      passCallState.startedAt=0;
      passCallState.nonce='';
      passCallState.historyLen=0;
      return null;
    }
    if(now>passCallState.until)return null;
    return{seat:passCallState.seat,text:passCallState.text};
  }

  return{
    seatGenderBySeat,
    currentMust3Call,
    currentLastCardSeat,
    currentPlayTypeCall,
    currentPassCall
  };
}
