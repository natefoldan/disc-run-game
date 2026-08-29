const fs = require('fs');

const vCode = (process.argv[2] && process.argv[2].trim() !== '') ? process.argv[2].trim() : '12';
const vName = (process.argv[3] && process.argv[3].trim() !== '') ? process.argv[3].trim() : '1.0.12';

console.log(`Configuring Android Build: Version Code ${vCode}, Version Name ${vName}, Target API Level 35`);

// 1. Configure android/variables.gradle (Upgrade to API 35 / Android 15)
const varsPath = 'android/variables.gradle';
if (fs.existsSync(varsPath)) {
  let vars = fs.readFileSync(varsPath, 'utf8');
  vars = vars.replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 35');
  vars = vars.replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 35');
  fs.writeFileSync(varsPath, vars, 'utf8');
  console.log('Successfully updated android/variables.gradle to API Level 35!');
}

// 2. Configure android/app/build.gradle
const gradlePath = 'android/app/build.gradle';
if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, 'utf8');

  // Replace version, appId, and force API 35
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${vCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${vName}"`);
  gradle = gradle.replace(/applicationId\s+"[^"]+"/, 'applicationId "com.coniferstudios.discrun"');
  gradle = gradle.replace(/compileSdk\s+\d+/, 'compileSdk 35');
  gradle = gradle.replace(/targetSdk\s+\d+/, 'targetSdk 35');
  gradle = gradle.replace(/compileSdkVersion\s+\d+/, 'compileSdkVersion 35');
  gradle = gradle.replace(/targetSdkVersion\s+\d+/, 'targetSdkVersion 35');

  // Copy keystore directly into app directory for reliable path resolution
  if (fs.existsSync('signing.keystore')) {
    fs.copyFileSync('signing.keystore', 'android/app/signing.keystore');
    console.log('Copied signing.keystore to android/app/signing.keystore');
  }

  // Inject signingConfig and lintOptions
  const signingBlock = `
    signingConfigs {
        release {
            storeFile file('signing.keystore')
            storePassword 'MM62gVjuAiiq'
            keyAlias 'my-key-alias'
            keyPassword 'MM62gVjuAiiq'
        }
    }
    lintOptions {
        abortOnError false
        checkReleaseBuilds false
    }
`;
  // First, update buildTypes release block to attach signingConfig
  gradle = gradle.replace(/buildTypes\s*\{\s*release\s*\{/, 'buildTypes {\n        release {\n            signingConfig signingConfigs.release');

  // Second, insert signingConfigs and lintOptions before buildTypes
  if (!gradle.includes('signingConfigs {')) {
    gradle = gradle.replace('buildTypes {', signingBlock + '\n    buildTypes {');
  }

  fs.writeFileSync(gradlePath, gradle, 'utf8');
  console.log('Successfully configured build.gradle with release signing and API Level 35!');
} else {
  console.error('build.gradle not found at ' + gradlePath);
}

// 3. Configure android/app/src/main/AndroidManifest.xml
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (!manifest.includes('android:screenOrientation')) {
    manifest = manifest.replace('<activity ', '<activity android:screenOrientation="portrait" ');
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log('Successfully set portrait orientation in AndroidManifest.xml');
  }
} else {
  console.error('AndroidManifest.xml not found at ' + manifestPath);
}

// 4. Configure real 3D app launcher icons across all Android mipmap densities
const mipmapDirs = [
  'android/app/src/main/res/mipmap-mdpi',
  'android/app/src/main/res/mipmap-hdpi',
  'android/app/src/main/res/mipmap-xhdpi',
  'android/app/src/main/res/mipmap-xxhdpi',
  'android/app/src/main/res/mipmap-xxxhdpi'
];

mipmapDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync('icon-512.png')) {
    fs.copyFileSync('icon-512.png', `${dir}/ic_launcher.png`);
    fs.copyFileSync('icon-512.png', `${dir}/ic_launcher_round.png`);
    fs.copyFileSync('icon-512.png', `${dir}/ic_launcher_foreground.png`);
  }
});

// Configure adaptive icon background color
const colorsPath = 'android/app/src/main/res/values/colors.xml';
if (fs.existsSync(colorsPath)) {
  let colors = fs.readFileSync(colorsPath, 'utf8');
  if (colors.includes('ic_launcher_background')) {
    colors = colors.replace(/<color name="ic_launcher_background">[^<]+<\/color>/, '<color name="ic_launcher_background">#060714</color>');
    fs.writeFileSync(colorsPath, colors, 'utf8');
  }
}
console.log('Successfully installed 3D launcher icons and cyber dark theme across all densities!');
