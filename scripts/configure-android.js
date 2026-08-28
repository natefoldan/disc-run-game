const fs = require('fs');

const vCode = process.argv[2] || '4';
const vName = process.argv[3] || '1.0.4';

console.log(`Configuring Android Build: Version Code ${vCode}, Version Name ${vName}`);

// 1. Configure android/app/build.gradle
const gradlePath = 'android/app/build.gradle';
if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, 'utf8');

  // Replace version & appId
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${vCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${vName}"`);
  gradle = gradle.replace(/applicationId\s+"[^"]+"/, 'applicationId "com.coniferstudios.discrun"');

  // Inject signingConfig
  const signingBlock = `
    signingConfigs {
        release {
            storeFile file('../../signing.keystore')
            storePassword 'MM62gVjuAiiq'
            keyAlias 'my-key-alias'
            keyPassword 'MM62gVjuAiiq'
        }
    }
`;
  if (!gradle.includes('signingConfigs {')) {
    gradle = gradle.replace('buildTypes {', signingBlock + '\n    buildTypes {');
    gradle = gradle.replace(/release\s*\{/, 'release {\n            signingConfig signingConfigs.release');
  }

  fs.writeFileSync(gradlePath, gradle, 'utf8');
  console.log('Successfully configured build.gradle with release signing!');
} else {
  console.error('build.gradle not found at ' + gradlePath);
}

// 2. Configure android/app/src/main/AndroidManifest.xml
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
