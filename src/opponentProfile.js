import {resolveAvatarSrc} from './avatarProfile.js';
import {createOpponentProfileTextHelpers} from './opponentProfileText.js';

export function resolveRoomSeatProfile({
  name,
  state
}){
  const roomPlayers=Array.isArray(state?.room?.data?.players)?state.room.data.players:[];
  const lastResultPlayers=Array.isArray(state?.room?.lastResultPlayers)?state.room.lastResultPlayers:[];
  return roomPlayers.find((p)=>String(p?.name||p?.displayName||'')===String(name))
    ||lastResultPlayers.find((p)=>String(p?.name||p?.displayName||'')===String(name))
    ||null;
}

export function resolveOpponentProfileModalState({
  name,
  state,
  opponentProfiles,
  botGenderByName,
  authPictureUrlFrom,
  avatarDataUri
}){
  const profile=opponentProfiles?.[name]??{dob:'-',hobbies:{},profile:{},zodiac:{},motto:{}};
  const roomSeatProfile=resolveRoomSeatProfile({name,state});
  const hasProfileCard=Boolean(opponentProfiles?.[name]);
  const gender=String(roomSeatProfile?.gender||profile?.gender||botGenderByName(name))==='female'?'female':'male';
  const avatarSrc=resolveAvatarSrc({
    picture:roomSeatProfile?.picture,
    name,
    color:'#7aaed8',
    gender,
    isBot:!roomSeatProfile,
    authPictureUrlFrom,
    avatarDataUri
  });
  return{
    profile,
    roomSeatProfile,
    hasProfileCard,
    gender,
    avatarSrc
  };
}

export function createOpponentProfileHelpers(deps){
  return createOpponentProfileTextHelpers(deps);
}
