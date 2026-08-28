# Comprehensive Guide: Google AdMob Setup, Android Packaging & Google Play Upload

---

## Part 1: Setting Up Your Google AdMob Account

### 1.1 Create and Activate Your AdMob Account
1. Go to [https://admob.google.com](https://admob.google.com) and sign in with your Google account.
2. Complete your payment and tax profile (address, country, currency).
3. Google will verify your account (usually takes 24–48 hours for ad serving activation).

### 1.2 Register Your App in AdMob
1. In the AdMob dashboard sidebar, click **Apps** > **Add App**.
2. Select **Android**.
3. Under *"Is the app listed on a supported app store?"*, select **No** (since it's not live on Google Play yet).
4. Enter App Name: `Disc Run: Cyber Turntable 3D`.
5. Click **Add App** and save your **AdMob App ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`).

### 1.3 Create Ad Units
In your new app's dashboard, go to **Ad Units** > **Add Ad Unit**:

| Ad Type | Purpose in Disc Run | Placement | Recommended Settings |
| :--- | :--- | :--- | :--- |
| **Rewarded Video** | 1 UP Revive & 2X Points Bonus | Post-Run / Game Over Modal | Reward: 1 Revive / 2X Multiplier |
| **Adaptive Banner** | Passive ad revenue | Bottom of Main Menu / Workshop | Refresh Rate: 30–60s |
| **Interstitial** | High CPM transition ad | Every 4–5 completed runs | Frequency Cap: 1 impression per 3 min |

> [!IMPORTANT]
> **Use Google Test Ad Unit IDs during development & testing!**
> Never click or test real ads on your own devices during development, or Google will flag your account for invalid traffic.
> - **Rewarded Video Test ID**: `ca-app-pub-3940256099942544/5224354917`
> - **Banner Test ID**: `ca-app-pub-3940256099942544/6300978111`
> - **Interstitial Test ID**: `ca-app-pub-3940256099942544/1033173712`

---

## Part 2: Testing Dev Build on Your Android Phone

You have two simple, proven methods to test on your phone immediately:

### Option A: Instant Full-Screen Web App (PWA) — Zero Setup
1. On your PC, open PowerShell inside the `disc-run-game` folder and start a quick local server:
   ```powershell
   npx serve . -l 8080
   ```
   *(or `python -m http.server 8080` if Python is installed)*
2. Find your PC's local Wi-Fi IP address:
   ```powershell
   ipconfig
   ```
   *(Look for `IPv4 Address`, e.g., `192.168.1.150`)*
3. On your Android phone (connected to the same Wi-Fi):
   - Open Chrome and navigate to `http://192.168.1.150:8080`
   - Tap the 3 dots in Chrome > **Install app** or **Add to Home screen**.
   - Launch from your phone home screen: it opens in full-screen standalone mode with native 60 FPS WebGL, touch zones, and orientation support!

---

### Option B: Native Android Dev APK (via Capacitor)

Capacitor wraps your HTML5 Three.js web app into a standard native Android Studio project with full hardware acceleration and native AdMob plugin support.

1. **Install Capacitor CLI**:
   ```bash
   npm init -y
   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor-community/admob
   ```
2. **Initialize Capacitor**:
   ```bash
   npx cap init "Disc Run" "com.discrun.game" --web-dir "."
   ```
3. **Add Android Platform**:
   ```bash
   npx cap add android
   npx cap sync
   ```
4. **Build & Install Debug APK on Phone**:
   - Open the project in Android Studio:
     ```bash
     npx cap open android
     ```
   - Connect your Android phone with **USB Debugging** enabled (Developer Options).
   - Click the green **Run (▶)** button in Android Studio, or select **Build > Build APK(s)** to get a direct `.apk` file you can send to your phone.

---

## Part 3: Google Play Console Setup & App Upload

### 3.1 Register Developer Account
1. Go to [https://play.google.com/console/signup](https://play.google.com/console/signup).
2. Pay the **$25 one-time registration fee**.
3. Complete identity verification (Government ID).

### 3.2 Create the App in Play Console
1. Click **Create app**.
2. App Name: `Disc Run: Cyber Turntable 3D`.
3. Default Language: `English (United States)`.
4. App type: `Game` | Free/Paid: `Free`.
5. Accept Developer Program Policies and US export laws > Click **Create app**.

### 3.3 Complete Store Listing & Policy Declarations
Fill out the required sections on the left sidebar:
1. **Store Presence > Main Store Listing**:
   - **Short Description**: `Duck, dodge, and warp on a spinning 3D neon disc! Charge 10X Orbit Multipliers!`
   - **Full Description**: Copy & paste directly from [`store_listing_description.md`](file:///c:/Users/natef/OneDrive/Desktop/disc-run-game/store_listing_description.md).
   - **App Icon**: 512 x 512 px PNG.
   - **Feature Graphic**: 1024 x 500 px JPG/PNG.
   - **Screenshots**: Upload images from [`promo_screenshots/`](file:///c:/Users/natef/OneDrive/Desktop/disc-run-game/promo_screenshots/) and [`actual_screenshots/`](file:///c:/Users/natef/OneDrive/Desktop/disc-run-game/actual_screenshots/).
2. **App Content Questionnaire**:
   - **Privacy Policy**: Link to your hosted privacy policy URL.
   - **Ads**: Check *"Yes, my app contains ads"*.
   - **App Access**: Check *"All functionality is available without special access"*.
   - **Content Ratings**: Complete the IARC questionnaire (Violence: None, Language: None) &mdash; will receive `Everyone / PEGI 3`.
   - **Target Audience**: Select `13+` or `16+` (recommended to avoid COPPA / Kids policy complexities).
   - **Data Safety**:
     - Check that the app collects Device IDs / Advertising IDs via Google AdMob SDK for analytics and advertising.

### 3.4 Generate Signed Release Bundle (.aab)
In Android Studio:
1. Go to **Build > Generate Signed Bundle / APK...**
2. Select **Android App Bundle (.aab)** > Click **Next**.
3. Create a new Keystore file (save your key password securely!).
4. Build variant: `release`.
5. Android Studio generates `app-release.aab`.

### 3.5 Upload to Internal / Closed Testing
1. In Google Play Console, go to **Testing > Internal testing**.
2. Click **Create new release**.
3. Upload your `app-release.aab`.
4. Add your email to the tester list and send yourself the invite link.
5. Download directly from Google Play on your phone to verify everything before clicking **Promote to Production**!
