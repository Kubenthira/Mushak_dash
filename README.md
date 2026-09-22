# 🌸 Mushak Dash (मुषक डॅश) 🌸
### 2D Endless Runner for Vinayaka Chaturthi — Built with Phaser 3 & Vite

A vibrant, anime-arcade style 2D endless runner where you guide **Mushak** (Lord Ganesha's companion) through festive streets during Vinayaka Chaturthi, dodging obstacles and collecting Modaks, Marigold flowers, Durva grass, and Divine Ganesha Blessings!

---

## 🎮 How to Play

| Action | Desktop Controls | Mobile / Touch Controls |
| :--- | :--- | :--- |
| **Switch Lane Left** | `◀` (Left Arrow) or `A` | Swipe Left / Tap left side / `◀` Button |
| **Switch Lane Right**| `▶` (Right Arrow) or `D` | Swipe Right / Tap right side / `▶` Button |
| **Jump (Over Puddles)** | `▲` (Up Arrow), `Spacebar`, or `W` | Swipe Up / Tap bottom area / `▲ JUMP` Button |
| **Start / Replay** | `Spacebar` or `Enter` or Click | Tap "PLAY RUN" / "PLAY AGAIN" |

---

## ✨ Features & Polish ("Juice")

- **3-Lane Running Mechanics**: Smooth tween-based lane transitions with dynamic tilt and no instant snapping.
- **Physics-based Jumps**: Squash-and-stretch easing on takeoff and landing with shrinking dynamic shadow.
- **Festive Collectibles**:
  - 🥟 **Modaks** (+10 pts & Modak counter)
  - 🌼 **Marigold Flowers** (+25 pts)
  - 🌿 **Durva Grass** (+10 pts)
  - ॐ **Ganesha Blessing** (+200 pts, golden aura, modak magnet attraction & invincibility)
- **Obstacles**:
  - 💧 **Puddles** (Ground hazard — can be jumped over)
  - 🏮 **Festive Toran Poles** (Tall hazard — must be dodged sideways)
- **Parallax & Particle Effects**:
  - Continuous vertical parallax scrolling street scene (`street.png`).
  - Burst particle sparks upon item collection and golden aura during divine blessing.
  - Screen shake & hit-flash on obstacle collision.
  - Smooth score interpolation counter.
- **Synthesized Audio Engine**:
  - Web Audio API procedural sound synthesizer for jump whooshes, lane swishes, modak arpeggios, blessing chimes, and crash impacts — zero audio file loading overhead.

---

## 📁 Architecture & File Structure

```
ganesh_chathurthi_game_project/
├── index.html                 # Main HTML container & responsive viewport
├── vite.config.js             # Vite configuration for static Vercel deployment
├── package.json               # Phaser 3 + Vite dependencies & scripts
├── public/
│   └── assets/                # Real PNG assets and sprite sheets
│       ├── street.png         # Festive street background
│       ├── modak.png          # Modak collectible sprite
│       ├── protag.png         # Mushak character sprite
│       └── ...                # Place new sprite sheets here!
└── src/
    ├── style.css              # Saffron/Gold festive styling & touch buttons
    ├── main.js                # Phaser.Game initialization & config
    ├── config/
    │   └── gameConfig.js      # Speeds, lanes, spawn rates & balancing
    ├── utils/
    │   └── audio.js           # Web Audio API sound effects synthesizer
    └── scenes/
        ├── BootScene.js       # Preloads assets, generates procedural textures & anims
        ├── MenuScene.js       # Main menu, high score & start button
        ├── GameScene.js       # Core 3-lane loop, jumps, parallax, magnet & collision
        └── GameOverScene.js   # Score breakdown, record banner & replay
```

---

## 🎨 Dropping In Real Sprite Sheets (Animation-Ready)

The game is pre-architected to seamlessly accept multi-frame sprite sheets for Mushak without breaking gameplay:

1. Place your run animation sprite sheet in `public/assets/mushak_run_sheet.png`.
2. Open [`src/scenes/BootScene.js`](file:///f:/ganesh_chathurthi_game_project/src/scenes/BootScene.js).
3. In `preload()`, uncomment the spritesheet loader:
   ```javascript
   this.load.spritesheet('mushak_sheet', 'assets/mushak_run_sheet.png', {
     frameWidth: 128, // adjust to your sprite's frame width
     frameHeight: 128 // adjust to your sprite's frame height
   });
   ```
4. In `setupAnimations()`, update `end: <total_frames - 1>` and `frameRate: 14` as needed. The game automatically binds `mushak_run` to the player!

---

---

## 🚀 Running Locally & Deploying to Vercel

### Run Locally:
```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ☁️ Vercel Deployment & Database Credentials Guide

To connect your live online Firebase Firestore database with your Vercel deployment:

### Step 1: Where to find your Firebase Credentials
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (e.g. `leaderboard7`).
3. Click the **Project Settings** (gear icon ⚙️ in the top-left sidebar) -> **General** tab.
4. Scroll down to the **Your apps** section and select your **Web app** (`</>`).
5. Under **SDK setup and configuration**, select **Config**. You will see your keys:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef...",
     measurementId: "G-ABCDEF..."
   };
   ```

### Step 2: Add Environment Variables in Vercel
In Vite, all client-exposed environment variables **must start with `VITE_`**.

1. Go to your **Vercel Dashboard** -> Open your deployed project.
2. Go to **Settings** -> **Environment Variables**.
3. Add the following **7 Environment Variables** (copying values from your Firebase config):

| Key | Value Description | Example Value |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Your Firebase Web API Key | `AIzaSyAx9lBbI1jFcaCb1y6_kOmT-tttrZiKGY8` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `leaderboard7.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID | `leaderboard7` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage Bucket | `leaderboard7.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Sender ID | `819545184172` |
| `VITE_FIREBASE_APP_ID` | Web App ID | `1:819545184172:web:66f0d97f236a9054480c09` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics Measurement ID | `G-5JVWS4XBZE` |

4. After adding the variables, trigger a **Redeploy** on Vercel so the build includes them!

### Step 3: Ensure Firestore Rules are Active
In the Firebase Console -> **Firestore Database** -> **Rules** tab, ensure you paste the rules from `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{docId} {
      allow read: if true;
      allow create, update: if
        request.resource.data.score is number &&
        request.resource.data.score >= 0 &&
        request.resource.data.score <= 100000 &&
        (
          (request.resource.data.playerId is string && request.resource.data.playerId.size() >= 2 && request.resource.data.playerId.size() <= 30) ||
          (request.resource.data.playerName is string && request.resource.data.playerName.size() >= 2 && request.resource.data.playerName.size() <= 30)
        ) &&
        (!('campus' in request.resource.data) || (request.resource.data.campus is string && request.resource.data.campus.size() <= 50)) &&
        (!('ownerToken' in request.resource.data) || request.resource.data.ownerToken is string) &&
        (request.resource.data.timestamp is timestamp || request.resource.data.timestamp is number) &&
        (resource == null || request.resource.data.score >= resource.data.score);
      allow delete: if false;
    }
  }
}
```
Click **Publish**.

---

## 📱 Mobile Landscape Orientation & Responsiveness

- **Orientation Lock**: When loaded on a mobile phone or tablet in portrait mode, a full-screen festive orientation blocker appears prompting the player: **"PLEASE ROTATE TO LANDSCAPE"** with an animated device graphic.
- **Landscape Gameplay**: As soon as the device is turned sideways into landscape mode, the blocker disappears and the game smoothly adapts:
  - **Left Thumb Controls**: Ergonomic Track Up (`▲`) and Track Down (`▼`) buttons spaced with safe-area insets.
  - **Right Thumb Controls**: Glowing `⚡ JUMP` button.
  - **Touch Gestures**: Fullscreen swipe up/down to switch tracks, swipe right or tap right half of screen to jump!
- **Unique Player ID & Campus**: Every player registers a unique handle and campus before starting a run, which is dynamically displayed across rankings on the live Temple Leaderboard!
