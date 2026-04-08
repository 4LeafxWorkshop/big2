export const DEFAULT_SOLO_TOTALS=[5000,5000,5000,5000];
export const DEFAULT_SOLO_ROUND_WINS=[0,0,0,0];

function cloneNumberList(values,fallback){
  if(!Array.isArray(values)||values.length!==fallback.length)return[...fallback];
  return values.map((value,index)=>{
    const next=Number(value);
    return Number.isFinite(next)?next:fallback[index];
  });
}

export function getNextSoloTotals(currentTotals,{resetTotals=false}={}){
  if(resetTotals)return[...DEFAULT_SOLO_TOTALS];
  return cloneNumberList(currentTotals,DEFAULT_SOLO_TOTALS);
}

export function getNextSoloRoundWins(currentRoundWins,{resetTotals=false,resetRoundWins=false}={}){
  if(resetTotals||resetRoundWins)return[...DEFAULT_SOLO_ROUND_WINS];
  return cloneNumberList(currentRoundWins,DEFAULT_SOLO_ROUND_WINS);
}

export function resetSoloSessionCarryoverState(soloState){
  const next={...(soloState||{})};
  next.totals=[...DEFAULT_SOLO_TOTALS];
  next.roundWins=[...DEFAULT_SOLO_ROUND_WINS];
  return next;
}
