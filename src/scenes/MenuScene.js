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

    // Festive gradient overlay (on top of all 3 background layers)
    this.overlay = this.add.graphics();
    this.overlay.fillGradientStyle(0x1a0b2e, 0x1a0b2e, 0x3d1b04, 0x3d1b04, 0.65, 0.65, 0.65, 0.65);
    this.overlay.fillRect(0, 0, width, height);
    this.overlay.setDepth(3);

    // 2. Ambient Particles
    this.particles = this.add.particles(0, 0, 'sparkle_particle', {
      x: { min: 40, max: width - 40 },
      y: { min: height * 0.3, max: height },
      speedY: { min: -50, max: -15 },
      speedX: { min: -15, max: 15 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 2500,
      frequency: 140
    });
    this.particles.setDepth(4);

    // 3. Top High Score & Modak Badge + Profile Pill
    const highScore = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10);
    const modakCount = parseInt(localStorage.getItem(STORAGE_KEYS.MODAK_COUNT) || '0', 10);
    const profile = getPlayerProfile();

    const scoreCard = this.add.graphics();
    scoreCard.fillStyle(0x0f0c20, 0.85);
    scoreCard.fillRoundedRect(width / 2 - 240, 24, 480, 48, 24);
    scoreCard.lineStyle(2, 0xffd700, 0.6);
    scoreCard.strokeRoundedRect(width / 2 - 240, 24, 480, 48, 24);
    scoreCard.setDepth(10);

    this.add.image(width / 2 - 200, 48, 'modak_item').setScale(0.12).setDepth(11);

    this.add.text(width / 2 - 170, 36, `BEST: ${highScore}`, {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '18px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setDepth(11);

    this.add.text(width / 2 - 50, 37, `🥟 ${modakCount}`, {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '16px',
      color: '#FFE082'
    }).setDepth(11);

    // Profile Tag Button (clickable to edit profile)
    const profileTag = this.add.text(
      width / 2 + 70,
      37,
      profile.playerId ? `👤 ${profile.playerId}` : '👤 Set Player ID',
      {
        fontFamily: 'Fredoka, Outfit, sans-serif',
        fontSize: '15px',
        color: '#81C784',
        fontStyle: 'bold'
      }
    ).setDepth(11).setInteractive({ useHandCursor: true });

    profileTag.on('pointerdown', () => {
      sounds.playClick();
      showProfileModal(() => {
        this.scene.restart();
      });
    });

    // 4. Main Title
    const titleContainer = this.add.container(width * 0.35, height * 0.38);
    titleContainer.setDepth(10);

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

    // 5. Hero Character on the Right (scaled up)
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

    // 6. Buttons Container (Play Run + Leaderboard)
    // Play Button
    const startBtnContainer = this.add.container(width * 0.25, height * 0.62);
    startBtnContainer.setDepth(10);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xff7722, 1);
    btnBg.fillRoundedRect(-110, -32, 220, 64, 32);
    btnBg.lineStyle(3, 0xffd700, 1);
    btnBg.strokeRoundedRect(-110, -32, 220, 64, 32);

    const btnText = this.add.text(0, 0, 'PLAY RUN', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      shadow: { offsetX: 0, offsetY: 3, color: '#6A1B9A', blur: 6, fill: true }
    }).setOrigin(0.5);

    startBtnContainer.add([btnBg, btnText]);
    startBtnContainer.setSize(220, 64);
    startBtnContainer.setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: startBtnContainer,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const startGame = () => {
      sounds.init();
      sounds.playClick();

      this.cameras.main.fade(300, 26, 11, 46, false, (camera, progress) => {
        if (progress === 1) {
          this.scene.start('GameScene');
        }
      });
    };

    startBtnContainer.on('pointerdown', startGame);
    this.input.keyboard.on('keydown-SPACE', startGame);
    this.input.keyboard.on('keydown-ENTER', startGame);

    // Leaderboard Button
    const leaderboardBtn = this.add.container(width * 0.46, height * 0.62);
    leaderboardBtn.setDepth(10);

    const lbBg = this.add.graphics();
    lbBg.fillStyle(0x2d174d, 0.95);
    lbBg.fillRoundedRect(-110, -32, 220, 64, 32);
    lbBg.lineStyle(2.5, 0xffd700, 0.8);
    lbBg.strokeRoundedRect(-110, -32, 220, 64, 32);

    const lbText = this.add.text(0, 0, '🏆 LEADERBOARD', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFE082'
    }).setOrigin(0.5);

    leaderboardBtn.add([lbBg, lbText]);
    leaderboardBtn.setSize(220, 64);
    leaderboardBtn.setInteractive({ useHandCursor: true });

    leaderboardBtn.on('pointerdown', () => {
      sounds.playClick();
      this.scene.start('LeaderboardScene');
    });

    // 7. Horizontal How-To-Play Footer Bar
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

    this.scale.on('resize', this.resize, this);
  }

  resize(gameSize) {
    const texH = 724;
    this.scaleFactor = gameSize.height / texH;

    if (this.bgLayer1) {
      this.bgLayer1.setSize(gameSize.width / this.scaleFactor, gameSize.height / this.scaleFactor);
      this.bgLayer1.setScale(this.scaleFactor);
    }
    if (this.bgLayer2) {
      this.bgLayer2.setSize(gameSize.width / this.scaleFactor, gameSize.height / this.scaleFactor);
      this.bgLayer2.setScale(this.scaleFactor);
    }
    if (this.bgLayer3) {
      this.bgLayer3.setSize(gameSize.width / this.scaleFactor, gameSize.height / this.scaleFactor);
      this.bgLayer3.setScale(this.scaleFactor);
    }
  }

  update() {
    if (this.bgLayer1) this.bgLayer1.tilePositionX += 0.04;
    if (this.bgLayer2) this.bgLayer2.tilePositionX += 0.15;
    if (this.bgLayer3) this.bgLayer3.tilePositionX += 1.2;
  }
}
