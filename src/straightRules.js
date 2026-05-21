// Straight ranking order, lowest to highest.
const STRAIGHT_SEQUENCES=[
  [0,1,2,3,4], // 3-4-5-6-7
  [1,2,3,4,5], // 4-5-6-7-8
  [2,3,4,5,6], // 5-6-7-8-9
  [3,4,5,6,7], // 6-7-8-9-10
  [4,5,6,7,8], // 7-8-9-10-J
  [5,6,7,8,9], // 8-9-10-J-Q
  [6,7,8,9,10], // 9-10-J-Q-K
  [8,9,10,11,12], // J-Q-K-A-2
  [9,10,11,12,0], // Q-K-A-2-3
  [10,11,12,0,1], // K-A-2-3-4
  [7,8,9,10,11], // 10-J-Q-K-A
  [12,0,1,2,3], // 2-3-4-5-6
  [11,12,0,1,2] // A-2-3-4-5
];

export function straightMeta(ranks){
  if(ranks.length!==5)return null;
  const uniq=[...new Set(ranks)];
  if(uniq.length!==5)return null;
  const has=new Set(uniq);
  for(let power=0;power<STRAIGHT_SEQUENCES.length;power+=1){
    const seq=STRAIGHT_SEQUENCES[power];
    if(seq.every((rank)=>has.has(rank))){
      return{
        seq,
        high:seq[seq.length-1],
        power
      };
    }
  }
  return null;
}
