import {execSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {defineConfig} from 'vite';

const isCapacitor=process.env.CAPACITOR==='1';
const packageJson=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8'));
const appVersion=String(packageJson.version||'0.0.0');
const buildHash=(()=>{
  try{
    return execSync('git rev-parse --short HEAD',{stdio:['ignore','pipe','ignore']}).toString().trim();
  }catch{
    return'local';
  }
})();
const buildLabel=`v${appVersion} ${buildHash}`;
const manualChunks=(id)=>{
  const path=String(id||'').replaceAll('\\','/');
  if(path.includes('/node_modules/')){
    if(path.includes('/qrcode/'))return'qr-code';
    if(path.includes('/@capacitor/')||path.includes('/@codetrix-studio/'))return'native-plugins';
    return'vendor';
  }
  if(/\/src\/(i18nData|localeData|botProfileData|botAvatarProfileData|opponentProfileData|scoreGuideData)\.js$/.test(path)){
    return'game-data';
  }
  if(/\/src\/(homeView|modalViews|footerMenu|introGuide|roomView|opponentProfile|opponentProfileText|opponentNamecard)\.js$/.test(path)){
    return'app-views';
  }
  return undefined;
};

export default defineConfig({
  base: isCapacitor ? './' : '/big2/',
  define: {
    'import.meta.env.ENV': JSON.stringify(process.env.ENV ?? ''),
    'import.meta.env.APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.BUILD_VERSION': JSON.stringify(buildLabel)
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks
      }
    }
  }
});
