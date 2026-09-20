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

    // 1. 3-Layer Parallax Background with Dark Red-Violet Tint
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
        x: { min: 80, max: width - 80 },
        y: 0,
        speedY: { min: 80, max: 220 },
        speedX: { min: -60, max: 60 },
        scale: { start: 0.8, end: 0.2 },
        lifespan: 2500,
        frequency: 90
      });
    }

    // 3. Title
    this.add.text(width / 2, 90, 'RUN FINISHED', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#FFF8E1',
      stroke: '#E65100',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 6, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5);

    if (this.isNewHigh) {
      const banner = this.add.text(width / 2, 150, '⭐ NEW RECORD! ⭐', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '24px',
        color: '#FFD700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: banner,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 400,
        yoyo: true,
        repeat: -1
      });
    }

    // 4. Results Card
    const card = this.add.graphics();
    card.fillStyle(0x130e26, 0.9);
    card.fillRoundedRect(width / 2 - 320, 190, 640, 290, 24);
    card.lineStyle(2.5, 0xffd700, 0.5);
    card.strokeRoundedRect(width / 2 - 320, 190, 640, 290, 24);

    this.add.text(width / 2 - 160, 230, 'TOTAL SCORE', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      letterSpacing: 2,
      color: '#FFE082'
    }).setOrigin(0.5);

    const animatedScore = { val: 0 };
    const scoreValText = this.add.text(width / 2 - 160, 285, '0', {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '56px',
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
    div.lineBetween(width / 2, 220, width / 2, 360);

    this.add.text(width / 2 + 40, 240, 'BEST SCORE', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#B0BEC5'
    });
    this.add.text(width / 2 + 260, 240, `${this.highScore}`, {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFD700'
    }).setOrigin(1, 0);

    this.add.text(width / 2 + 40, 300, 'MODAKS COLLECTED', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#B0BEC5'
    });
    this.add.text(width / 2 + 260, 300, `🥟 ${this.modaks}`, {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFE082'
    }).setOrigin(1, 0);

    // 5. Leaderboard Status Banner
    const lbStatus = this.add.text(width / 2, 410, '⏳ Submitting score to Leaderboard...', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#FFE082'
    }).setOrigin(0.5);

    // Asynchronously submit score to Firestore
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
      .catch((err) => {
        lbStatus.setText('Score recorded locally');
        lbStatus.setColor('#B0BEC5');
      });

    // 6. Action Buttons (Play Again, Leaderboard, Main Menu)
    const btnY = 465;

    // A. Play Again Button
    const playAgainBtn = this.add.container(width / 2 - 200, btnY);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xff7722, 1);
    btnBg.fillRoundedRect(-90, -24, 180, 48, 24);
    btnBg.lineStyle(2.5, 0xffd700, 1);
    btnBg.strokeRoundedRect(-90, -24, 180, 48, 24);

    const btnText = this.add.text(0, 0, 'PLAY AGAIN', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    playAgainBtn.add([btnBg, btnText]);
    playAgainBtn.setSize(180, 48);
    playAgainBtn.setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: playAgainBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const restartGame = () => {
      sounds.playClick();
      this.cameras.main.fade(250, 15, 12, 32, false, (camera, progress) => {
        if (progress === 1) {
          this.scene.start('GameScene');
        }
      });
    };

    playAgainBtn.on('pointerdown', restartGame);
    this.input.keyboard.on('keydown-SPACE', restartGame);
    this.input.keyboard.on('keydown-ENTER', restartGame);

    // B. Leaderboard Button
    const lbBtn = this.add.container(width / 2, btnY);
    const lbBg = this.add.graphics();
    lbBg.fillStyle(0x4a148c, 0.95);
    lbBg.fillRoundedRect(-90, -24, 180, 48, 24);
    lbBg.lineStyle(2, 0xffd700, 0.9);
    lbBg.strokeRoundedRect(-90, -24, 180, 48, 24);

    const lbText = this.add.text(0, 0, '🏆 LEADERBOARD', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFD700'
    }).setOrigin(0.5);

    lbBtn.add([lbBg, lbText]);
    lbBtn.setSize(180, 48);
    lbBtn.setInteractive({ useHandCursor: true });

    lbBtn.on('pointerdown', () => {
      sounds.playClick();
      this.scene.start('LeaderboardScene');
    });

    // C. Main Menu Button
    const menuBtn = this.add.container(width / 2 + 200, btnY);
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x2d174d, 0.9);
    menuBg.fillRoundedRect(-90, -24, 180, 48, 24);
    menuBg.lineStyle(1.5, 0xffd700, 0.4);
    menuBg.strokeRoundedRect(-90, -24, 180, 48, 24);

    const menuText = this.add.text(0, 0, 'MAIN MENU', {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '16px',
      color: '#FFE082'
    }).setOrigin(0.5);

    menuBtn.add([menuBg, menuText]);
    menuBtn.setSize(180, 48);
    menuBtn.setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      sounds.playClick();
      this.scene.start('MenuScene');
    });
  }
}
