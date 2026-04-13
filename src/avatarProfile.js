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

  const AVATAR_BASE_SRC={male:withBase('avatar-male.png'),female:withBase('avatar-female.png')};
  const AVATAR_DICEBEAR_BASE='https://api.dicebear.com/9.x/avataaars/svg';
  const AVATAR_A4_COMMON={
    backgroundColor:'transparent',
    backgroundType:'solid',
    clip:'true',
    style:'default'
  };
  const AVATAR_A4_HK={
    skinColor:['d08b5b','edb98a','ffdbb4','f8d25c'],
    hairColor:['2c1b18','4a312c','724133','a55728']
  };
  const AVATAR_A4_ENERGETIC={
    eyes:['happy','surprised','wink','default'],
    mouth:['smile','twinkle','default'],
    eyebrows:['raisedExcited','raisedExcitedNatural','upDown','defaultNatural'],
    accessories:['round','prescription01','prescription02'],
    clothing:['blazerAndShirt','blazerAndSweater','collarAndSweater','hoodie','shirtCrewNeck'],
    clothesColor:['65c9ff','5199e4','ff5c5c','ff488e','a7ffc4','b1e2ff','ffffb1','ffdeb5']
  };
  const AVATAR_A4_TOP={
    male:['shortFlat','shortRound','shortWaved','shortCurly','theCaesar','theCaesarAndSidePart','shaggy'],
    female:['longButNotTooLong','straight01','straight02','straightAndStrand','bob','bun','curvy','curly','bigHair']
  };
  const AVATAR_A4_FACIAL_HAIR={
    list:['beardLight','beardMedium','moustacheFancy']
  };
  const AVATAR_VARIANT_BY_NAME={
    '俊傑':'v2',
    '穎欣':'v2'
  };
  const AVATAR_IMAGE_BY_BOT_NAME={
    '志明':'https://avataaars.io/?topType=WinterHat3&accessoriesType=Round&hatColor=Blue02&facialHairType=Blank&clotheType=GraphicShirt&clotheColor=Blue02&graphicType=Bear&eyeType=Squint&eyebrowType=UpDown&mouthType=Smile&skinColor=Light',
    '子朗':'https://avataaars.io/?topType=Hat&accessoriesType=Prescription02&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=EyeRoll&eyebrowType=Default&mouthType=Twinkle&skinColor=Light&scale=200',
    '家樂':'https://avataaars.io/?topType=ShortHairDreads02&accessoriesType=Sunglasses&hairColor=BrownDark&facialHairType=BeardLight&facialHairColor=BrownDark&clotheType=Hoodie&clotheColor=PastelRed&eyeType=Wink&eyebrowType=Default&mouthType=Grimace&skinColor=Pale',
    '嘉欣':'https://avataaars.io/?topType=LongHairCurvy&accessoriesType=Round&hairColor=Black&facialHairType=Blank&clotheType=GraphicShirt&clotheColor=Pink&graphicType=Diamond&eyeType=Default&eyebrowType=RaisedExcited&mouthType=Smile&skinColor=Light',
    '芷晴':'https://avataaars.io/?topType=LongHairStraightStrand&accessoriesType=Blank&hairColor=BrownDark&facialHairType=Blank&clotheType=GraphicShirt&clotheColor=Blue03&graphicType=Selena&eyeType=Happy&eyebrowType=Default&mouthType=Smile&skinColor=Light',
    'ReXX':'https://avataaars.io/?topType=ShortHairShortFlat&accessoriesType=Prescription02&hairColor=Black&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=DefaultNatural&mouthType=Smile&skinColor=Light',
    'Axel':'https://avataaars.io/?topType=ShortHairDreads02&accessoriesType=Round&hairColor=Red&facialHairType=BeardMajestic&facialHairColor=Red&clotheType=Hoodie&clotheColor=Red&eyeType=Default&eyebrowType=UnibrowNatural&mouthType=Eating&skinColor=Pale',
    '穎欣':'https://avataaars.io/?topType=LongHairFroBand&accessoriesType=Kurt&hairColor=Blonde&facialHairType=Blank&clotheType=ShirtVNeck&clotheColor=Red&eyeType=Squint&eyebrowType=RaisedExcitedNatural&mouthType=Twinkle&skinColor=Light',
    '佩儀':'https://avataaars.io/?topType=LongHairFrida&accessoriesType=Round&hairColor=Blonde&facialHairType=Blank&clotheType=CollarSweater&clotheColor=Pink&eyeType=WinkWacky&eyebrowType=Default&mouthType=Grimace&skinColor=Pale&backgroundColor=b6e3f4,c0aede,d1d4f9',
    '少龍':'https://avataaars.io/?avatarStyle=Transparent&topType=ShortHairDreads01&accessoriesType=Sunglasses&hairColor=Brown&facialHairColor=BrownDark&clotheType=BlazerShirt&eyeType=Side&eyebrowType=AngryNatural&mouthType=Concerned&skinColor=Brown&backgroundColor=b6e3f4,c0aede,d1d4f9',
    'Kane':'https://avataaars.io/?topType=Eyepatch&facialHairType=BeardMedium&facialHairColor=Black&clotheType=ShirtVNeck&clotheColor=Black&eyeType=Surprised&eyebrowType=AngryNatural&mouthType=Grimace&skinColor=DarkBrown&scale=150',
    'Milo':'https://avataaars.io/?topType=WinterHat2&accessoriesType=Blank&hatColor=Blue03&facialHairType=Blank&clotheType=Hoodie&clotheColor=Heather&eyeType=Squint&eyebrowType=UpDownNatural&mouthType=Smile&skinColor=Light',
    'Jade':'https://avataaars.io/?topType=LongHairFro&accessoriesType=Blank&hairColor=PastelPink&facialHairType=Blank&clotheType=ShirtScoopNeck&clotheColor=PastelRed&eyeType=Happy&eyebrowType=UpDown&mouthType=Twinkle&skinColor=Pale',
    'Nora':'https://avataaars.io/?topType=LongHairFroBand&accessoriesType=Blank&hairColor=Auburn&facialHairType=Blank&clotheType=ShirtScoopNeck&clotheColor=Pink&eyeType=Close&eyebrowType=RaisedExcited&mouthType=Smile&skinColor=Light',
    '天樂':'https://avataaars.io/?topType=ShortHairDreads01&accessoriesType=Prescription01&hairColor=Black&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Wink&eyebrowType=RaisedExcited&mouthType=Smile&skinColor=Brown',
    'Nova':'https://avataaars.io/?topType=LongHairDreads&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=ShirtScoopNeck&clotheColor=Pink&eyeType=Default&eyebrowType=RaisedExcited&mouthType=Smile&skinColor=Brown',
    'Skye':'https://avataaars.io/?topType=LongHairStraight&accessoriesType=Prescription01&hairColor=Black&facialHairType=Blank&clotheType=GraphicShirt&clotheColor=Blue03&graphicType=Cumbia&eyeType=Close&eyebrowType=RaisedExcitedNatural&mouthType=Smile&skinColor=Light',
    'Iris':'https://avataaars.io/?topType=LongHairBun&accessoriesType=Kurt&hairColor=Red&facialHairType=Blank&clotheType=ShirtVNeck&clotheColor=Pink&eyeType=Close&eyebrowType=UpDown&mouthType=Disbelief&skinColor=Light',
    '葵芳':'https://avataaars.io/?topType=LongHairCurvy&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Overall&clotheColor=Red&eyeType=Side&eyebrowType=Default&mouthType=Concerned&skinColor=Light',
    '葵兄':'https://avataaars.io/?topType=ShortHairShaggyMullet&accessoriesType=Sunglasses&hairColor=Black&facialHairType=Blank&clotheType=BlazerShirt&eyeType=WinkWacky&eyebrowType=Default&mouthType=Serious&skinColor=Light',
    'Jax':'https://avataaars.io/?topType=ShortHairShortRound&accessoriesType=Round&hairColor=BrownDark&facialHairType=Blank&clotheType=Hoodie&clotheColor=Heather&eyeType=Happy&eyebrowType=RaisedExcitedNatural&mouthType=Grimace&skinColor=Light'
  };
  const AVATAR_OVERRIDE_BY_NAME={
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
    if(overrideImage)return overrideImage;
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
