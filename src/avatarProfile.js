import {
  AVATAR_A4_COMMON,
  AVATAR_A4_BACKGROUND_COLORS,
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

const BOT_AVATAR_ASSET_VERSION='20260426';

export function resolveAvatarSrc({
  picture,
  name,
  color,
  gender='male',
  isBot=false,
  avatarVariant='',
  avatarBackground='',
  authPictureUrlFrom,
  avatarDataUri
}){
  if(isBot){
    return avatarDataUri(name,color,gender,true);
  }
  const pic=String(picture??'').trim();
  if(!pic){
    return avatarDataUri(name,color,gender,isBot,avatarVariant,avatarBackground);
  }
  const authPic=authPictureUrlFrom(pic);
  return authPic
    ?authPic
    :avatarDataUri(name,color,gender,isBot,avatarVariant,avatarBackground);
}

function addCacheBuster(url){
  const suffix=`v=${BOT_AVATAR_ASSET_VERSION}`;
  return url.includes('?')?`${url}&${suffix}`:`${url}?${suffix}`;
}

export function botAvatarUrl(name,withBase){
  const baseName=String(name??'').trim();
  if(!baseName)return'';
  const overrideImage=AVATAR_IMAGE_BY_BOT_NAME[baseName]??'';
  if(!overrideImage)return'';
  return /^https?:\/\//i.test(overrideImage)||/^data:|^blob:/i.test(overrideImage)
    ?addCacheBuster(overrideImage)
    :addCacheBuster(withBase(overrideImage));
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
    const lower=pic.toLowerCase();
    if(lower==='undefined'||lower==='null'||lower==='nan')return'';
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

  function avatarDataUri(name,_color,gender='male',isBot=false,avatarVariant='',avatarBackground=''){
    const g=String(gender??'male')==='female'?'female':'male';
    const baseName=String(name??'player')||'player';
    const overrideImage=isBot?botAvatarUrl(baseName,withBase):'';
    if(overrideImage){
      return overrideImage;
    }
    const variant=AVATAR_VARIANT_BY_NAME[baseName]??'';
    const seedParts=[g,baseName];
    if(variant)seedParts.push(variant);
    const dynamicVariant=String(avatarVariant??'').trim();
    if(dynamicVariant)seedParts.push(dynamicVariant);
    const dynamicBackground=String(avatarBackground??'').trim();
    if(dynamicBackground)seedParts.push(dynamicBackground);
    const seedText=seedParts.join('-');
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
    params.set(
      'facialHairProbability',
      g==='male'
        ?pick(['0','20','35','50','65'],seedHash,11)
        :'0'
    );
    if(dynamicBackground){
      params.set('backgroundColor',pick(AVATAR_A4_BACKGROUND_COLORS,seedHash,12));
    }
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
