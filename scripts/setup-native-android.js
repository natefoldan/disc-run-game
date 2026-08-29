const fs = require('fs');
const path = require('path');

// 1. Root build.gradle
const rootGradle = `// Top-level build file where you can add configuration options common to all sub-projects/modules.
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
`;
fs.writeFileSync('android/build.gradle', rootGradle, 'utf8');

// 2. settings.gradle
const settingsGradle = `include ':app'
rootProject.name = 'Disc Run'
`;
fs.writeFileSync('android/settings.gradle', settingsGradle, 'utf8');

// 3. gradle.properties
const gradleProps = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
android.nonTransitiveRClass=true
`;
fs.writeFileSync('android/gradle.properties', gradleProps, 'utf8');

// 4. gradle/wrapper/gradle-wrapper.properties
const wrapperProps = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;
if (!fs.existsSync('android/gradle/wrapper')) {
    fs.mkdirSync('android/gradle/wrapper', { recursive: true });
}
fs.writeFileSync('android/gradle/wrapper/gradle-wrapper.properties', wrapperProps, 'utf8');

// 5. app/build.gradle
const vCode = process.argv[2] || '14';
const vName = process.argv[3] || '1.0.14';

const appGradle = `apply plugin: 'com.android.application'

android {
    namespace 'com.coniferstudios.discrun'
    compileSdk 35

    defaultConfig {
        applicationId "com.coniferstudios.discrun"
        minSdk 22
        targetSdk 35
        versionCode ${vCode}
        versionName "${vName}"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        release {
            storeFile file('signing.keystore')
            storePassword 'MM62gVjuAiiq'
            keyAlias 'my-key-alias'
            keyPassword 'MM62gVjuAiiq'
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            signingConfig signingConfigs.release
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            signingConfig signingConfigs.release
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    lint {
        abortOnError false
        checkReleaseBuilds false
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.webkit:webkit:1.9.0'
}
`;
fs.writeFileSync('android/app/build.gradle', appGradle, 'utf8');

// Copy keystore to app directory if present
if (fs.existsSync('signing.keystore')) {
    fs.copyFileSync('signing.keystore', 'android/app/signing.keystore');
    console.log('Copied signing.keystore to android/app/signing.keystore');
}

// 6. AndroidManifest.xml
const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.DiscRun.Fullscreen"
        android:hardwareAccelerated="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|screenSize|keyboardHidden|keyboard|smallestScreenSize|screenLayout"
            android:theme="@style/Theme.DiscRun.Fullscreen"
            android:launchMode="singleTask">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`;
fs.writeFileSync('android/app/src/main/AndroidManifest.xml', manifest, 'utf8');

// 7. MainActivity.java
const mainActivity = `package com.coniferstudios.discrun;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on during gameplay
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Fullscreen immersive mode
        hideSystemUI();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Enable hardware accelerated smooth 60fps WebGL
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setBackgroundColor(0xFF060714);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Load self-contained local web game directly from assets
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            );
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`;
fs.writeFileSync('android/app/src/main/java/com/coniferstudios/discrun/MainActivity.java', mainActivity, 'utf8');

// 8. res/values/styles.xml, colors.xml, strings.xml
const styles = `<resources>
    <style name="Theme.DiscRun.Fullscreen" parent="Theme.AppCompat.NoActionBar">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:windowBackground">@color/background_dark</item>
        <item name="android:colorBackground">@color/background_dark</item>
    </style>
</resources>
`;
fs.writeFileSync('android/app/src/main/res/values/styles.xml', styles, 'utf8');

const colors = `<resources>
    <color name="background_dark">#060714</color>
    <color name="ic_launcher_background">#060714</color>
</resources>
`;
fs.writeFileSync('android/app/src/main/res/values/colors.xml', colors, 'utf8');

const strings = `<resources>
    <string name="app_name">Disc Run</string>
</resources>
`;
fs.writeFileSync('android/app/src/main/res/values/strings.xml', strings, 'utf8');

// 9. Copy Icons to mipmaps
const mipmaps = [
    'android/app/src/main/res/mipmap-mdpi',
    'android/app/src/main/res/mipmap-hdpi',
    'android/app/src/main/res/mipmap-xhdpi',
    'android/app/src/main/res/mipmap-xxhdpi',
    'android/app/src/main/res/mipmap-xxxhdpi'
];
mipmaps.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync('icon-512.png')) {
        fs.copyFileSync('icon-512.png', path.join(dir, 'ic_launcher.png'));
        fs.copyFileSync('icon-512.png', path.join(dir, 'ic_launcher_round.png'));
    }
});

// 10. Copy web game assets to android/app/src/main/assets/
const assetFiles = ['index.html', 'style.css', 'game.js', 'audio.js', 'three.min.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png'];
assetFiles.forEach(f => {
    if (fs.existsSync(f)) {
        fs.copyFileSync(f, path.join('android/app/src/main/assets', f));
    }
});

console.log('Pure Native Android Studio Shell successfully initialized!');
