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

export default defineConfig({
  base: isCapacitor ? './' : '/big2/',
  define: {
    'import.meta.env.ENV': JSON.stringify(process.env.ENV ?? ''),
    'import.meta.env.APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.BUILD_VERSION': JSON.stringify(buildLabel)
  }
});
