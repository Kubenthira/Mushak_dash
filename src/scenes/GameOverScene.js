import Phaser from 'phaser';
import { sounds } from '../utils/audio';
import { submitScore, getPlayerProfile } from '../services/leaderboardService';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data.finalScore || 0;
    this.highScore = data.highScore || 0;
    this.modaks = data.modaks || 0;
    this.isNewHigh = data.isNewHigh || false;
  }

  create() {
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const width = this.scale.width;
    const height = this.scale.height;
    const isMobile = width < 680 || width < height;

    // 1. 3-Layer Parallax Background
    const texH = 724;
    const scaleFactor = height / texH;

    this.bg1 = this.add.tileSprite(0, 0, width / scaleFactor, height / scaleFactor, 'bg_layer1')
      .setOrigin(0, 0).setScale(scaleFactor).setAlpha(0.35).setDepth(0);
    this.bg2 = this.add.tileSprite(0, 0, width / scaleFactor, height / scaleFactor, 'bg_layer2')
      .setOrigin(0, 0).setScale(scaleFactor).setAlpha(0.35).setDepth(1);
    this.bg3 = this.add.tileSprite(0, 0, width / scaleFactor, height / scaleFactor, 'bg_layer3')
      .setOrigin(0, 0).setScale(scaleFactor).setAlpha(0.35).setDepth(2);

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(0x1a0826, 0x1a0826, 0x3d0c0c, 0x3d0c0c, 0.92, 0.92, 0.92, 0.92);
    overlay.fillRect(0, 0, width, height);

    // 2. High score celebration particles
    if (this.isNewHigh) {
      this.add.particles(0, 0, 'sparkle_particle', {
        x: { min: 40, max: width - 40 },
        y: 0,
        speedY: { min: 80, max: 220 },
        speedX: { min: -50, max: 50 },
        scale: { start: 0.8, end: 0.2 },
        lifespan: 2500,
        frequency: 90
      });
    }

    // 3. Title
    const titleY = isMobile ? (this.isNewHigh ? 48 : 58) : 80;
    const titleSize = isMobile ? Math.min(width * 0.09, 36) : 48;

    this.add.text(width / 2, titleY, 'RUN FINISHED', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: `${titleSize}px`,
      fontStyle: 'bold',
      color: '#FFF8E1',
      stroke: '#E65100',
      strokeThickness: isMobile ? 5 : 8,
      shadow: { offsetX: 0, offsetY: 4, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5);

    if (this.isNewHigh) {
      const bannerY = isMobile ? titleY + 34 : 135;
      const banner = this.add.text(width / 2, bannerY, '⭐ NEW RECORD! ⭐', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: isMobile ? '16px' : '22px',
        color: '#FFD700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: banner,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 400,
        yoyo: true,
        repeat: -1
      });
    }

    // 4. Results Card (Fully Responsive)
    const cardWidth = Math.min(width * 0.90, 620);
    const cardHeight = isMobile ? 220 : 250;
    const cardY = isMobile ? (this.isNewHigh ? 115 : 105) : 175;
    const centerX = width / 2;

    const card = this.add.graphics();
    card.fillStyle(0x130e26, 0.92);
    card.fillRoundedRect(centerX - cardWidth / 2, cardY, cardWidth, cardHeight, 20);
    card.lineStyle(2, 0xffd700, 0.5);
    card.strokeRoundedRect(centerX - cardWidth / 2, cardY, cardWidth, cardHeight, 20);

    const animatedScore = { val: 0 };

    if (!isMobile) {
      // Desktop / Wide Layout: Split Left (Score) and Right (Stats)
      const leftColX = centerX - cardWidth * 0.25;
      const rightColX = centerX + cardWidth * 0.08;
      const rightValX = centerX + cardWidth * 0.44;

      this.add.text(leftColX, cardY + 40, 'TOTAL SCORE', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '15px',
        letterSpacing: 2,
        color: '#FFE082'
      }).setOrigin(0.5);

      const scoreValText = this.add.text(leftColX, cardY + 95, '0', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: animatedScore,
        val: this.finalScore,
        duration: 900,
        ease: 'Power2.easeOut',
        onUpdate: () => {
          scoreValText.setText(`${Math.floor(animatedScore.val)}`);
        }
      });

      const div = this.add.graphics();
      div.lineStyle(1.5, 0xffffff, 0.15);
      div.lineBetween(centerX, cardY + 30, centerX, cardY + cardHeight - 50);

      this.add.text(rightColX, cardY + 50, 'BEST SCORE', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '15px',
        color: '#B0BEC5'
      });
      this.add.text(rightValX, cardY + 50, `${this.highScore}`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#FFD700'
      }).setOrigin(1, 0);

      this.add.text(rightColX, cardY + 105, 'MODAKS COLLECTED', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '15px',
        color: '#B0BEC5'
      });
      this.add.text(rightValX, cardY + 105, `🥟 ${this.modaks}`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#FFE082'
      }).setOrigin(1, 0);

    } else {
      // Mobile Layout: Clean Centered Stack
      this.add.text(centerX, cardY + 28, 'TOTAL SCORE', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        letterSpacing: 1.5,
        color: '#FFE082'
      }).setOrigin(0.5);

      const scoreValText = this.add.text(centerX, cardY + 70, '0', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: animatedScore,
        val: this.finalScore,
        duration: 900,
        ease: 'Power2.easeOut',
        onUpdate: () => {
          scoreValText.setText(`${Math.floor(animatedScore.val)}`);
        }
      });

      // Bottom Row Stats
      const statY = cardY + 130;
      const leftStatX = centerX - cardWidth * 0.25;
      const rightStatX = centerX + cardWidth * 0.25;

      this.add.text(leftStatX, statY, `BEST: ${this.highScore}`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '15px',
        color: '#FFD700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(rightStatX, statY, `🥟 ${this.modaks}`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '15px',
        color: '#FFE082',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    // 5. Leaderboard Status Banner
    const lbStatusY = cardY + cardHeight - 24;
    const lbStatus = this.add.text(centerX, lbStatusY, '⏳ Submitting score...', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#FFE082'
    }).setOrigin(0.5);

    // Asynchronously submit score
    const profile = getPlayerProfile();
    const playerId = profile.playerId || 'MushakRunner';

    submitScore(playerId, this.finalScore, { modaks: this.modaks })
      .then((res) => {
        if (res.success) {
          lbStatus.setText(res.message);
          lbStatus.setColor('#81C784');
        } else {
          lbStatus.setText(`⚠️ ${res.message}`);
          lbStatus.setColor('#FFAB91');
        }
      })
      .catch(() => {
        lbStatus.setText('Score recorded locally');
        lbStatus.setColor('#B0BEC5');
      });

    // 6. Action Buttons (Responsive Layout)
    this.createActionButtons(width, height, cardY, cardHeight, isMobile);

    this.scale.on('resize', () => this.scene.restart());
  }

  createActionButtons(width, height, cardY, cardHeight, isMobile) {
    const centerX = width / 2;
    const restartGame = () => {
      sounds.playClick();
      this.cameras.main.fade(250, 15, 12, 32, false, (camera, progress) => {
        if (progress === 1) {
          this.scene.start('GameScene');
        }
      });
    };

    if (isMobile) {
      // Mobile Button Layout
      const btn1Y = cardY + cardHeight + 35;
      const btn2Y = btn1Y + 54;
      const btnW = Math.min(width * 0.85, 280);
      const halfW = (btnW - 12) / 2;

      // Play Again (Primary full-width)
      this.createBtn(centerX, btn1Y, btnW, 46, '⚡ PLAY AGAIN', 0xff7722, true, restartGame);

      // Leaderboard & Main Menu (Split row)
      this.createBtn(centerX - halfW / 2 - 6, btn2Y, halfW, 42, '🏆 RANKS', 0x4a148c, false, () => {
        sounds.playClick();
        this.scene.start('LeaderboardScene');
      });

      this.createBtn(centerX + halfW / 2 + 6, btn2Y, halfW, 42, 'MENU', 0x2d174d, false, () => {
        sounds.playClick();
        this.scene.start('MenuScene');
      });

    } else {
      // Desktop / Wide Layout: 3 Side-by-Side Buttons
      const btnY = cardY + cardHeight + 42;
      const btnW = 180;
      const btnH = 48;

      this.createBtn(centerX - 200, btnY, btnW, btnH, 'PLAY AGAIN', 0xff7722, true, restartGame);
      this.createBtn(centerX, btnY, btnW, btnH, '🏆 LEADERBOARD', 0x4a148c, false, () => {
        sounds.playClick();
        this.scene.start('LeaderboardScene');
      });
      this.createBtn(centerX + 200, btnY, btnW, btnH, 'MAIN MENU', 0x2d174d, false, () => {
        sounds.playClick();
        this.scene.start('MenuScene');
      });
    }

    this.input.keyboard.on('keydown-SPACE', restartGame);
    this.input.keyboard.on('keydown-ENTER', restartGame);
  }

  createBtn(x, y, w, h, label, colorHex, isPrimary, onClick) {
    const btn = this.add.container(x, y).setDepth(15);

    const bg = this.add.graphics();
    bg.fillStyle(colorHex, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    bg.lineStyle(2, 0xffd700, isPrimary ? 1 : 0.6);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);

    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: `${Math.min(h * 0.38, 17)}px`,
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
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    btn.on('pointerdown', onClick);
    return btn;
  }
}
