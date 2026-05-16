export function markLastCardBreachIfNeeded({
  game,
  seat,
  playEval,
  shouldForceMaxAgainstLastCard,
  legalTurnPlays,
  cmpStrongPlayDesc,
  comparePower
}){
  if(!shouldForceMaxAgainstLastCard?.(game,seat))return false;
  const legal=legalTurnPlays(game.players[seat].hand,game).sort(cmpStrongPlayDesc);
  const strongest=legal[0];
  const chosen=legal.find((x)=>x.eval.count===playEval.count&&x.eval.kind===playEval.kind&&comparePower(x.eval.power,playEval.power)===0);
  if(chosen&&strongest&&comparePower(chosen.eval.power,strongest.eval.power)!==0){
    game.lastCardBreach={seat,threatenedSeat:(seat+1)%4};
    return true;
  }
  return false;
}

export function markLastCardBreachOnPassIfNeeded({
  game,
  seat,
  shouldForceMaxAgainstLastCard,
  legalTurnPlays,
  cmpStrongPlayDesc,
  canBeat
}){
  if(!shouldForceMaxAgainstLastCard?.(game,seat))return false;
  if(!game?.lastPlay)return false;
  const legal=legalTurnPlays(game.players[seat].hand,game)
    .filter((x)=>Boolean(x?.eval))
    .filter((x)=>canBeat?.(x.eval,game.lastPlay.eval));
  if(!legal.length)return false;
  legal.sort(cmpStrongPlayDesc);
  game.lastCardBreach={seat,threatenedSeat:(seat+1)%4};
  return true;
}

export function settleRoundDeductions({
  game,
  winnerSeat,
  calcPenaltyDetail
}){
  const details=game.players.map((p,i)=>i===winnerSeat
    ?{remain:0,base:0,multiplier:1,deduction:0,anyTwo:false,topTwo:false,chaoMultiplier:1,chaoKey:''}
    :calcPenaltyDetail(p.hand));
  let deductions=details.map((d)=>d.deduction);
  if(game.lastCardBreach&&winnerSeat===game.lastCardBreach.threatenedSeat){
    const violator=game.lastCardBreach.seat;
    const transferred=deductions.reduce((sum,v)=>sum+v,0);
    deductions=deductions.map((v,i)=>i===violator?transferred:0);
  }
  const winnerGain=deductions.reduce((sum,v)=>sum+v,0);
  return{
    details,
    deductions,
    winnerGain,
    lastCardBreach:game.lastCardBreach?{...game.lastCardBreach}:null
  };
}
