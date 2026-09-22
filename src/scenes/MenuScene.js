import Phaser from 'phaser';
import { STORAGE_KEYS } from '../config/gameConfig';
import { sounds } from '../utils/audio';
import { getPlayerProfile } from '../services/leaderboardService';
import { showProfileModal } from '../utils/profileModal';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const width = this.scale.width;
    const height = this.scale.height;
    const isMobile = width < 768 || width < height;

    // 1. 3-Layer Parallax Street Background
    const texH = 724;
    this.scaleFactor = height / texH;

    this.bgLayer1 = this.add.tileSprite(0, 0, width / this.scaleFactor, height / this.scaleFactor, 'bg_layer1')
      .setOrigin(0, 0)
      .setScale(this.scaleFactor)
      .setDepth(0);

    this.bgLayer2 = this.add.tileSprite(0, 0, width / this.scaleFactor, height / this.scaleFactor, 'bg_layer2')
      .setOrigin(0, 0)
      .setScale(this.scaleFactor)
      .setDepth(1);

    this.bgLayer3 = this.add.tileSprite(0, 0, width / this.scaleFactor, height / this.scaleFactor, 'bg_layer3')
      .setOrigin(0, 0)
      .setScale(this.scaleFactor)
      .setDepth(2);

    // Festive gradient overlay
    this.overlay = this.add.graphics();
    this.overlay.fillGradientStyle(0x1a0b2e, 0x1a0b2e, 0x3d1b04, 0x3d1b04, 0.65, 0.65, 0.65, 0.65);
    this.overlay.fillRect(0, 0, width, height);
    this.overlay.setDepth(3);

    // 2. Ambient Particles
    this.particles = this.add.particles(0, 0, 'sparkle_particle', {
      x: { min: 20, max: width - 20 },
      y: { min: height * 0.2, max: height },
      speedY: { min: -45, max: -12 },
      speedX: { min: -12, max: 12 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.75, end: 0 },
      lifespan: 2200,
      frequency: 150
    });
    this.particles.setDepth(4);

    // 3. Top High Score & Modak Badge + Profile Pill (Responsive)
    const highScore = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10);
    const modakCount = parseInt(localStorage.getItem(STORAGE_KEYS.MODAK_COUNT) || '0', 10);
    const profile = getPlayerProfile();

    const pillWidth = Math.min(width * 0.92, 480);
    const pillHeight = isMobile ? 42 : 48;
    const pillY = isMobile ? 20 : 28;

    const scoreCard = this.add.graphics();
    scoreCard.fillStyle(0x0f0c20, 0.88);
    scoreCard.fillRoundedRect(width / 2 - pillWidth / 2, pillY, pillWidth, pillHeight, pillHeight / 2);
    scoreCard.lineStyle(2, 0xffd700, 0.6);
    scoreCard.strokeRoundedRect(width / 2 - pillWidth / 2, pillY, pillWidth, pillHeight, pillHeight / 2);
    scoreCard.setDepth(10);

    const iconX = width / 2 - pillWidth / 2 + (isMobile ? 22 : 36);
    const bestX = iconX + (isMobile ? 20 : 26);
    const modakX = bestX + (isMobile ? 90 : 120);
    const profileX = width / 2 + pillWidth / 2 - (isMobile ? 20 : 36);

    this.add.image(iconX, pillY + pillHeight / 2, 'modak_item')
      .setScale(isMobile ? 0.09 : 0.12)
      .setDepth(11);

    this.add.text(bestX, pillY + pillHeight / 2, `BEST: ${highScore}`, {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: isMobile ? '14px' : '17px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(11);

    this.add.text(modakX, pillY + pillHeight / 2, `🥟 ${modakCount}`, {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: isMobile ? '13px' : '16px',
      color: '#FFE082'
    }).setOrigin(0, 0.5).setDepth(11);

    const displayName = profile.playerId
      ? (profile.playerId.length > 10 ? profile.playerId.slice(0, 9) + '…' : profile.playerId)
      : 'Register ID';

    const profileTag = this.add.text(
      profileX,
      pillY + pillHeight / 2,
      `👤 ${displayName}`,
      {
        fontFamily: 'Fredoka, Outfit, sans-serif',
        fontSize: isMobile ? '13px' : '15px',
        color: profile.playerId ? '#81C784' : '#FFD700',
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0.5).setDepth(11).setInteractive({ useHandCursor: true });

    profileTag.on('pointerdown', () => {
      sounds.playClick();
      showProfileModal(() => {
        this.scene.restart();
      });
    });

    if (isMobile) {
      this.createMobileLayout(width, height);
    } else {
      this.createDesktopLayout(width, height);
    }

    // Automatically prompt player for unique ID & campus before starting the game
    if (!profile.isRegistered || !profile.playerId) {
      this.time.delayedCall(350, () => {
        showProfileModal(() => {
          this.scene.restart();
        }, true);
      });
    }

    this.scale.on('resize', this.onResize, this);
  }

  createDesktopLayout(width, height) {
    // 4. Main Title (Left Column)
    const titleContainer = this.add.container(width * 0.35, height * 0.38).setDepth(10);

    const subTitle = this.add.text(0, -42, '✨ VINAYAKA CHATURTHI FESTIVAL RUNNER ✨', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      letterSpacing: 2.5,
      color: '#FFE082',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const titleText = this.add.text(0, 10, 'MUSHAK DASH', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#FFF8E1',
      stroke: '#E65100',
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 8, color: '#000000', blur: 12, stroke: true, fill: true }
    }).setOrigin(0.5);

    titleContainer.add([subTitle, titleText]);

    this.tweens.add({
      targets: titleContainer,
      y: height * 0.38 - 10,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 5. Hero Character on the Right
    const characterGlow = this.add.graphics();
    characterGlow.fillStyle(0xffd700, 0.22);
    characterGlow.fillCircle(width * 0.76, height * 0.44, 160);
    characterGlow.setDepth(10);

    const charShadow = this.add.graphics();
    charShadow.fillStyle(0x000000, 0.4);
    charShadow.fillEllipse(width * 0.76, height * 0.44 + 90, 110, 32);
    charShadow.setDepth(10);

    this.character = this.add.sprite(width * 0.76, height * 0.44, 'mushak_protag')
      .setScale(1.25)
      .setDepth(11);
    this.character.play('mushak_run');

    this.tweens.add({
      targets: this.character,
      y: height * 0.44 - 15,
      scaleX: 1.22,
      scaleY: 1.29,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut'
    });

    // 6. Buttons
    this.createButton(width * 0.25, height * 0.62, 220, 64, 'PLAY RUN', 0xff7722, true, () => this.startGame());
    this.createButton(width * 0.46, height * 0.62, 220, 64, '🏆 LEADERBOARD', 0x2d174d, false, () => {
      sounds.playClick();
      this.scene.start('LeaderboardScene');
    });

    // 7. Footer Instructions
    const infoBg = this.add.graphics();
    infoBg.fillStyle(0x0f0c20, 0.88);
    infoBg.fillRoundedRect(width * 0.08, height * 0.82, width * 0.84, 90, 18);
    infoBg.lineStyle(1.5, 0xff9800, 0.5);
    infoBg.strokeRoundedRect(width * 0.08, height * 0.82, width * 0.84, 90, 18);
    infoBg.setDepth(10);

    const cols = [
      '• ▲ / ▼ or W / S : Switch Track',
      '• SPACE / D : Jump Hazards',
      '• 🥟 Collect Modaks & Durva Grass',
      '• ॐ Ganesha Blessing for Invincibility!'
    ];

    cols.forEach((col, idx) => {
      const colX = width * 0.12 + (idx % 2) * (width * 0.42);
      const colY = height * 0.85 + Math.floor(idx / 2) * 32;
      this.add.text(colX, colY, col, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '16px',
        color: '#FFFFFF'
      }).setDepth(11);
    });
  }

  createMobileLayout(width, height) {
    const isPortrait = height >= width;
    const centerX = width / 2;

    // Title Section
    const titleY = isPortrait ? height * 0.19 : height * 0.22;
    const titleContainer = this.add.container(centerX, titleY).setDepth(10);

    const subTitle = this.add.text(0, -26, '✨ VINAYAKA CHATURTHI FESTIVAL RUNNER ✨', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: Math.min(width * 0.034, 13) + 'px',
      letterSpacing: 1.5,
      color: '#FFE082',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const titleFontSize = Math.min(width * 0.11, 46);
    const titleText = this.add.text(0, 14, 'MUSHAK DASH', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: `${titleFontSize}px`,
      fontStyle: 'bold',
      color: '#FFF8E1',
      stroke: '#E65100',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 8, stroke: true, fill: true }
    }).setOrigin(0.5);

    titleContainer.add([subTitle, titleText]);

    // Hero Character in Middle
    const charY = isPortrait ? height * 0.42 : height * 0.50;
    const charScale = isPortrait ? Math.min(width * 0.0028, 1.1) : Math.min(height * 0.002, 0.95);

    const characterGlow = this.add.graphics();
    characterGlow.fillStyle(0xffd700, 0.2);
    characterGlow.fillCircle(centerX, charY, 100 * charScale);
    characterGlow.setDepth(10);

    const charShadow = this.add.graphics();
    charShadow.fillStyle(0x000000, 0.35);
    charShadow.fillEllipse(centerX, charY + 65 * charScale, 75 * charScale, 22 * charScale);
    charShadow.setDepth(10);

    this.character = this.add.sprite(centerX, charY, 'mushak_protag')
      .setScale(charScale)
      .setDepth(11);
    this.character.play('mushak_run');

    this.tweens.add({
      targets: this.character,
      y: charY - 10,
      scaleX: charScale * 0.96,
      scaleY: charScale * 1.04,
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut'
    });

    // Buttons
    const btnW = Math.min(width * 0.82, 270);
    const btnH = isPortrait ? 52 : 46;

    if (isPortrait) {
      const playY = height * 0.65;
      const lbY = playY + btnH + 16;
      this.createButton(centerX, playY, btnW, btnH, '⚡ PLAY RUN', 0xff7722, true, () => this.startGame());
      this.createButton(centerX, lbY, btnW, btnH, '🏆 LEADERBOARD', 0x2d174d, false, () => {
        sounds.playClick();
        this.scene.start('LeaderboardScene');
      });

      // Bottom Touch Tip
      const tipY = height * 0.88;
      const tipBg = this.add.graphics();
      tipBg.fillStyle(0x0f0c20, 0.85);
      tipBg.fillRoundedRect(centerX - btnW / 2, tipY - 18, btnW, 36, 18);
      tipBg.lineStyle(1.5, 0xffd700, 0.4);
      tipBg.strokeRoundedRect(centerX - btnW / 2, tipY - 18, btnW, 36, 18);
      tipBg.setDepth(10);

      this.add.text(centerX, tipY, '👆 Tap or Swipe to Switch Lanes & Jump', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '12px',
        color: '#FFE082'
      }).setOrigin(0.5).setDepth(11);
    } else {
      // Landscape Mobile: Side by Side Buttons
      const playX = centerX - btnW * 0.55;
      const lbX = centerX + btnW * 0.55;
      const btnY = height * 0.80;
      this.createButton(playX, btnY, btnW * 0.9, btnH, '⚡ PLAY RUN', 0xff7722, true, () => this.startGame());
      this.createButton(lbX, btnY, btnW * 0.9, btnH, '🏆 LEADERBOARD', 0x2d174d, false, () => {
        sounds.playClick();
        this.scene.start('LeaderboardScene');
      });
    }
  }

  createButton(x, y, w, h, label, colorHex, isPrimary, onClick) {
    const btn = this.add.container(x, y).setDepth(12);

    const bg = this.add.graphics();
    bg.fillStyle(colorHex, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    bg.lineStyle(2, 0xffd700, isPrimary ? 1 : 0.6);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);

    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: `${Math.min(h * 0.42, 22)}px`,
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    btn.add([bg, txt]);
    btn.setSize(w, h);
    btn.setInteractive({ useHandCursor: true });

    if (isPrimary) {
      this.tweens.add({
        targets: btn,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 750,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    btn.on('pointerdown', onClick);

    if (isPrimary) {
      this.input.keyboard.on('keydown-SPACE', onClick);
      this.input.keyboard.on('keydown-ENTER', onClick);
    }

    return btn;
  }

  startGame() {
    sounds.init();
    sounds.playClick();

    const profile = getPlayerProfile();
    if (!profile.isRegistered || !profile.playerId) {
      // Mandatory registration before first run
      showProfileModal((newProfile) => {
        if (newProfile && newProfile.playerId) {
          this.launchRun();
        }
      }, true);
      return;
    }

    this.launchRun();
  }

  launchRun() {
    this.cameras.main.fade(280, 26, 11, 46, false, (camera, progress) => {
      if (progress === 1) {
        this.scene.start('GameScene');
      }
    });
  }

  onResize() {
    this.scene.restart();
  }

  update() {
    if (this.bgLayer1) this.bgLayer1.tilePositionX += 0.04;
    if (this.bgLayer2) this.bgLayer2.tilePositionX += 0.15;
    if (this.bgLayer3) this.bgLayer3.tilePositionX += 1.2;
  }
}
