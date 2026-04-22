import {
  AVATAR_A4_COMMON,
  AVATAR_A4_ENERGETIC,
  AVATAR_A4_FACIAL_HAIR,
  AVATAR_A4_HK,
  AVATAR_A4_TOP,
  AVATAR_BASE_SRC_BY_GENDER,
  AVATAR_DICEBEAR_BASE,
  AVATAR_OVERRIDE_BY_NAME,
  AVATAR_VARIANT_BY_NAME
} from './avatarProfileData.js';
import {AVATAR_IMAGE_BY_BOT_NAME} from './botAvatarProfileData.js';

export function resolveAvatarSrc({
  picture,
  name,
  color,
  gender='male',
  isBot=false,
  authPictureUrlFrom,
  avatarDataUri
}){
  const pic=String(picture??'').trim();
  return pic
    ?authPictureUrlFrom(pic)
    :avatarDataUri(name,color,gender,isBot);
}

export function createAvatarProfileHelpers(deps){
  const {
    withBase,
    hashNameSeed,
    pick,
    getGooglePicture,
    isGoogleSignedIn,
    isGooglePictureLoaded=()=>true
  }=deps;

  const AVATAR_BASE_SRC={
    male:withBase(AVATAR_BASE_SRC_BY_GENDER.male),
    female:withBase(AVATAR_BASE_SRC_BY_GENDER.female)
  };

  function authPictureUrlFrom(picRaw){
    const pic=String(picRaw??'').trim();
    if(!pic)return'';
    try{
      let url=pic;
      if(/^data:|^blob:/i.test(url))return url;
      if(/^\/\//.test(url))url=`https:${url}`;
      if(!/^https?:\/\//i.test(url))url=`https://${url.replace(/^\/+/,'')}`;
      if(!/^https?:\/\//i.test(url))return'';
      return url;
    }catch{
      return pic;
    }
  }

  function authPictureUrl(){
    return authPictureUrlFrom(getGooglePicture());
  }

  function avatarDataUri(name,_color,gender='male',isBot=false){
    const g=String(gender??'male')==='female'?'female':'male';
    const baseName=String(name??'player')||'player';
    const overrideImage=isBot?AVATAR_IMAGE_BY_BOT_NAME[baseName]??'':'';
    if(overrideImage){
      return /^https?:\/\//i.test(overrideImage)||/^data:|^blob:/i.test(overrideImage)
        ?overrideImage
        :withBase(overrideImage);
    }
    const variant=AVATAR_VARIANT_BY_NAME[baseName]??'';
    const seedText=`${g}-${baseName}${variant?`-${variant}`:''}`;
    const seedHash=hashNameSeed(seedText);
    const params=new URLSearchParams();
    params.set('seed',seedText);
    const override=AVATAR_OVERRIDE_BY_NAME[baseName]??null;
    params.set('top',override?.top??pick(AVATAR_A4_TOP[g],seedHash,1));
    params.set('eyes',override?.eyes??pick(AVATAR_A4_ENERGETIC.eyes,seedHash,2));
    params.set('mouth',override?.mouth??pick(AVATAR_A4_ENERGETIC.mouth,seedHash,3));
    params.set('eyebrows',override?.eyebrows??pick(AVATAR_A4_ENERGETIC.eyebrows,seedHash,4));
    params.set('accessories',override?.accessories??pick(AVATAR_A4_ENERGETIC.accessories,seedHash,5));
    params.set('clothing',pick(AVATAR_A4_ENERGETIC.clothing,seedHash,6));
    params.set('clothesColor',pick(AVATAR_A4_ENERGETIC.clothesColor,seedHash,7));
    params.set('skinColor',override?.skinColor??pick(AVATAR_A4_HK.skinColor,seedHash,8));
    params.set('hairColor',override?.hairColor??pick(AVATAR_A4_HK.hairColor,seedHash,9));
    params.set('facialHair',pick(AVATAR_A4_FACIAL_HAIR.list,seedHash,10));
    params.set('facialHairProbability','0');
    Object.entries(AVATAR_A4_COMMON).forEach(([k,v])=>{
      if(params.has(k))return;
      params.set(k,v);
    });
    return `${AVATAR_DICEBEAR_BASE}?${params.toString()}`;
  }

  function selfAvatarDataUri(_name,_color,gender='male'){
    const authPic=authPictureUrl();
    if(isGoogleSignedIn()&&authPic&&isGooglePictureLoaded())return authPic;
    const g=String(gender??'male')==='female'?'female':'male';
    return AVATAR_BASE_SRC[g];
  }

  function avatarGenderClass(gender){
    return String(gender??'male')==='female'?'avatar-female':'avatar-male';
  }

  return{
    AVATAR_BASE_SRC,
    authPictureUrl,
    authPictureUrlFrom,
    avatarDataUri,
    selfAvatarDataUri,
    avatarGenderClass
  };
}
