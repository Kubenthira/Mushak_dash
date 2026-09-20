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

## 🚀 Running Locally & Deploying to Vercel

### Run Locally:
```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
```
Open `http://localhost:3000` in your browser.

### Build for Production / Vercel:
```bash
npm run build
```
- The output will be in the `dist/` directory.
- **Deploy to Vercel**: Connect your GitHub repository to Vercel or run `npx vercel`. The default Vite preset will automatically detect the build settings (`dist`).
