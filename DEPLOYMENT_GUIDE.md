# HABITX – Deployment & App Packaging Guide
> **"Build Discipline. Become Unstoppable."**

HABITX is pre-configured with a **Web App Manifest (`manifest.json`)**, **Service Worker (`sw.js`)**, and high-resolution **App Icons (`icon-192.png`, `icon-512.png`)**, meaning it can be deployed directly as an installable app across mobile and desktop.

---

## 📱 Option 1: Deploy as a Progressive Web App (PWA) – *Recommended & Fastest*

A Progressive Web App installs directly on your Android phone, iPhone, or PC **without needing Google Play or Apple App Store approval**. It runs full-screen with no browser address bar, displays the HABITX app icon on your home screen, and works offline.

### Step 1: Host HABITX on the Web (Free in 2 Minutes)

Choose any of these free static hosts:

#### Path A: Netlify Drop (Zero Commands, Drag-and-Drop)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop) (free account).
2. Drag and drop the `C:\Users\Dell\.gemini\antigravity\scratch\habitx` folder directly onto the browser window.
3. Your app is live instantly at a public URL (e.g., `https://habitx-app.netlify.app`).

#### Path B: Vercel (Fastest CDN)
1. Go to [vercel.com](https://vercel.com) and sign in.
2. Push your project to GitHub or import the repository.
3. Select the folder, leave build settings empty (it's a static site), and click **Deploy**.
4. Live at `https://habitx.vercel.app`.

#### Path C: GitHub Pages (Free forever)
1. Create a repository named `habitx` on GitHub.
2. Push the files in this folder to the repository.
3. Go to **Settings > Pages** and select `Branch: main` -> `/ (root)` -> **Save**.
4. Live at `https://<your-username>.github.io/habitx/`.

---

### Step 2: Install HABITX onto Your Device

Once your URL is live (e.g. `https://habitx.vercel.app`):

#### On Android (Chrome / Brave / Edge):
1. Open the URL on your Android phone.
2. A prompt **"Add HABITX to Home Screen"** or an install banner will appear automatically.
3. Tap **Install**. HABITX now appears in your phone's app drawer with its native icon and opens in full-screen standalone mode!

#### On iPhone / iPad (Safari):
1. Open the URL in Safari.
2. Tap the **Share** button (the square with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add**. HABITX will launch as a standalone app with a black status bar matching Beast Mode.

#### On Windows / Mac (Chrome / Edge):
1. Open the URL.
2. In the right side of the address bar, click the **Install App (computer with down arrow)** icon.
3. Click **Install**. HABITX runs in its own window on your desktop and taskbar.

---

## 🤖 Option 2: Package as a Native Android App (.APK / Google Play Store)

If you want a downloadable `.apk` file to install on Android phones or publish to the Google Play Store:

### Method A: PWABuilder (Easiest - No Android Studio Needed)
1. Deploy HABITX to Netlify, Vercel, or GitHub Pages as shown above.
2. Visit [pwabuilder.com](https://www.pwabuilder.com) (created by Microsoft).
3. Enter your deployed URL and click **Start**.
4. PWABuilder will verify your manifest, icons, and service worker (all pre-configured in this repository).
5. Click **Package for Stores** -> select **Android**.
6. Download the generated `.apk` (for direct sideloading onto phones) or `.aab` (ready for Google Play Store upload).

### Method B: Capacitor (Native Android Project)
If you have Android Studio installed and want a native Android Gradle build:

```bash
# 1. Initialize Capacitor
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize project
npx cap init "HABITX" "com.habitx.app" --web-dir .

# 3. Add Android platform
npx cap add android

# 4. Copy assets & open in Android Studio
npx cap copy
npx cap open android
```
Inside Android Studio:
- Click **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate your unsigned or release `.apk`.

---

## 🖥️ Option 3: Package as a Desktop App (Windows .EXE / Mac .DMG)

If you wish to distribute an offline Windows installer (`.exe`):

1. Install Electron packager or Nativefier:
```bash
npm install -g nativefier
nativefier --name "HABITX" "http://localhost:3000" --icon icon-512.png
```
Or point it to your live deployed URL to package a standalone desktop application.

---

## 🗄️ Supabase Cloud Configuration (For Production Multi-User Data)

1. Open your [Supabase Dashboard](https://supabase.com).
2. Run the SQL schema from [`supabase_schema.sql`](supabase_schema.sql) in the **SQL Editor**.
3. Copy your project **URL** and **Anon Key** from **Settings > API**.
4. Inside HABITX, go to **Settings > Supabase Cloud Sync > Configure** and enter your credentials.
5. All habit records and streaks will now sync to your PostgreSQL database.
