const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 --- DISC RUN AUTOMATED RELEASE PIPELINE ---');

const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (!fs.existsSync(buildGradlePath)) {
  console.error('❌ Could not find android/app/build.gradle');
  process.exit(1);
}

let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
const vCodeMatch = buildGradleContent.match(/versionCode\s+(\d+)/);
const vNameMatch = buildGradleContent.match(/versionName\s+([^]+)/);

if (!vCodeMatch) {
 console.error('❌ Could not parse versionCode from build.gradle');
 process.exit(1);
}

const currentVersionCode = parseInt(vCodeMatch[1], 10);
const nextVersionCode = currentVersionCode + 1;
const nextVersionName = 1.0.;

const customCommitMessage = process.argv.slice(2).join(' ').trim() || Automated release v (Version Code );

console.log(📌 Current Version: Code ());
console.log(✨ Bumping to: Code ());
console.log(📝 Commit Note: \n);

buildGradleContent = buildGradleContent
 .replace(/versionCode\s+\d+/, ersionCode )
 .replace(/versionName\s+[^]+/, ersionName ");
fs.writeFileSync(buildGradlePath, buildGradleContent, 'utf8');
console.log('✅ Updated android/app/build.gradle');

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'build-android.yml');
if (fs.existsSync(workflowPath)) {
 let workflowContent = fs.readFileSync(workflowPath, 'utf8');
 workflowContent = workflowContent
 .replace(/default:\s+'\d+'/g, default: '')
 .replace(/default:\s+'1\.0\.\d+'/g, default: '')
 .replace(/tag_name:\s+v1\.0\.\d+/g, ag_name: v)
 .replace(/name:\s+Disc Run Pure Native Android Release \(v1\.0\.\d+\)/g, 
ame: Disc Run Pure Native Android Release (v));
 fs.writeFileSync(workflowPath, workflowContent, 'utf8');
 console.log('✅ Updated .github/workflows/build-android.yml');
}

const assetsDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets');
if (!fs.existsSync(assetsDir)) {
 fs.mkdirSync(assetsDir, { recursive: true });
}

const filesToSync = [
 'index.html',
 'style.css',
 'game.js',
 'audio.js',
 'three.min.js',
 'manifest.json',
 'icon-192.png',
 'icon-512.png',
 'icon-512-maskable.png'
];

filesToSync.forEach((file) => {
 const src = path.join(__dirname, '..', file);
 const dst = path.join(assetsDir, file);
 if (fs.existsSync(src)) {
 fs.copyFileSync(src, dst);
 }
});
console.log('✅ Synced web assets into android/app/src/main/assets/');

const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
const icon512 = path.join(__dirname, '..', 'icon-512.png');
const iconMaskable = path.join(__dirname, '..', 'icon-512-maskable.png');

densities.forEach((density) => {
 const dir = path.join(resDir, mipmap-);
 if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
 if (fs.existsSync(icon512)) fs.copyFileSync(icon512, path.join(dir, 'ic_launcher.png'));
 if (fs.existsSync(iconMaskable)) {
 fs.copyFileSync(iconMaskable, path.join(dir, 'ic_launcher_round.png'));
 fs.copyFileSync(iconMaskable, path.join(dir, 'ic_launcher_foreground.png'));
 }
});
console.log('✅ Synced 3D icons to Android mipmap densities');

try {
 console.log('\n📦 Committing and pushing to GitHub repository...');
 execSync('git add .', { stdio: 'inherit' });
 execSync(git commit -m , { stdio: 'inherit' });
 execSync('git push origin main', { stdio: 'inherit' });
 console.log('\n🎉 SUCCESS! Release pipeline triggered on GitHub Actions.');
 console.log(🔗 Monitor build: https://github.com/natefoldan/disc-run-game/actions);
 console.log(📦 Release tag: v);
} catch (err) {
 console.error('⚠️ Git push output:', err.message);
}
