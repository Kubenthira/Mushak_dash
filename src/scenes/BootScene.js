import Phaser from 'phaser';
import { BASE_WIDTH, BASE_HEIGHT } from '../config/gameConfig';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Show a festive styled loading bar
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();

    progressBox.fillStyle(0x1a1235, 0.8);
    progressBox.fillRoundedRect(BASE_WIDTH / 2 - 160, BASE_HEIGHT / 2 - 15, 320, 30, 8);
    progressBox.lineStyle(2, 0xffd700, 0.8);
    progressBox.strokeRoundedRect(BASE_WIDTH / 2 - 160, BASE_HEIGHT / 2 - 15, 320, 30, 8);

    const titleText = this.add.text(BASE_WIDTH / 2, BASE_HEIGHT / 2 - 50, 'MUSHAK DASH', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#ff7722',
      strokeThickness: 3
    }).setOrigin(0.5);

    const loadText = this.add.text(BASE_WIDTH / 2, BASE_HEIGHT / 2 + 35, 'Preparing Festival Streets...', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '15px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xff7722, 1);
      progressBar.fillRoundedRect(BASE_WIDTH / 2 - 156, BASE_HEIGHT / 2 - 11, 312 * value, 22, 6);
    });

    // 1. Load Real Images from assets/
    this.load.image('bg_layer1', 'assets/layer1.png');
    this.load.image('bg_layer2', 'assets/layer2.png');
    this.load.image('bg_layer3', 'assets/layer3.png');
    this.load.image('composed_bg', 'assets/composed.png');
    this.load.image('modak_item', 'assets/modak.png');
    this.load.image('mushak_protag', 'assets/protag.png');
    this.load.image('obstacle_puddle', 'assets/puddle.png');
    this.load.image('obstacle_pole', 'assets/pole.png');

    // 2. 7-frame character run spritesheet from protagupdate.png:
    this.load.spritesheet('mushak_sheet', 'assets/mushak_run_sheet.png', {
      frameWidth: 256,
      frameHeight: 256
    });
  }

  create() {
    this.createProceduralTextures();
    this.setupAnimations();

    this.time.delayedCall(300, () => {
      this.scene.start('MenuScene');
    });
  }

  createProceduralTextures() {
    // 1. Marigold Flower Collectible (Orange & Gold petaled flower)
    const flowerCanvas = this.textures.createCanvas('flower_item', 64, 64);
    const fCtx = flowerCanvas.getContext();
    fCtx.save();
    fCtx.translate(32, 32);
    for (let i = 0; i < 8; i++) {
      fCtx.rotate((Math.PI * 2) / 8);
      fCtx.fillStyle = '#FF9800';
      fCtx.beginPath();
      fCtx.ellipse(0, 16, 8, 12, 0, 0, Math.PI * 2);
      fCtx.fill();
      fCtx.strokeStyle = '#E65100';
      fCtx.lineWidth = 1.5;
      fCtx.stroke();
    }
    fCtx.fillStyle = '#FFD700';
    fCtx.beginPath();
    fCtx.arc(0, 0, 10, 0, Math.PI * 2);
    fCtx.fill();
    fCtx.fillStyle = '#D84315';
    fCtx.beginPath();
    fCtx.arc(0, 0, 4, 0, Math.PI * 2);
    fCtx.fill();
    fCtx.restore();
    flowerCanvas.refresh();

    // 2. Durva Grass Collectible
    const durvaCanvas = this.textures.createCanvas('durva_item', 64, 64);
    const dCtx = durvaCanvas.getContext();
    dCtx.save();
    dCtx.translate(32, 54);
    const angles = [-0.35, 0, 0.35];
    const lengths = [38, 46, 36];
    angles.forEach((ang, idx) => {
      dCtx.save();
      dCtx.rotate(ang);
      dCtx.fillStyle = '#4CAF50';
      dCtx.beginPath();
      dCtx.moveTo(-4, 0);
      dCtx.quadraticCurveTo(-6, -lengths[idx] / 2, 0, -lengths[idx]);
      dCtx.quadraticCurveTo(6, -lengths[idx] / 2, 4, 0);
      dCtx.closePath();
      dCtx.fill();
      dCtx.strokeStyle = '#2E7D32';
      dCtx.lineWidth = 2;
      dCtx.stroke();
      dCtx.restore();
    });
    dCtx.fillStyle = '#FFD700';
    dCtx.fillRect(-5, -6, 10, 5);
    dCtx.restore();
    durvaCanvas.refresh();

    // 3. Ganesha Blessing Glow (Golden Sacred Aura Orb)
    const blessingCanvas = this.textures.createCanvas('powerup_blessing', 80, 80);
    const bCtx = blessingCanvas.getContext();
    bCtx.save();
    bCtx.translate(40, 40);
    const grad = bCtx.createRadialGradient(0, 0, 5, 0, 0, 38);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 215, 0, 0.9)');
    grad.addColorStop(0.7, 'rgba(255, 119, 34, 0.6)');
    grad.addColorStop(1, 'rgba(255, 119, 34, 0)');
    bCtx.fillStyle = grad;
    bCtx.beginPath();
    bCtx.arc(0, 0, 38, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.fillStyle = '#FFFFFF';
    bCtx.font = 'bold 26px "Outfit", sans-serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.fillText('ॐ', 0, 0);
    bCtx.restore();
    blessingCanvas.refresh();

    // 7. Particle Sparkle
    const sparkCanvas = this.textures.createCanvas('sparkle_particle', 16, 16);
    const sCtx = sparkCanvas.getContext();
    sCtx.fillStyle = '#FFD700';
    sCtx.beginPath();
    sCtx.arc(8, 8, 7, 0, Math.PI * 2);
    sCtx.fill();
    sCtx.fillStyle = '#FFFFFF';
    sCtx.beginPath();
    sCtx.arc(8, 8, 3, 0, Math.PI * 2);
    sCtx.fill();
    sparkCanvas.refresh();
  }

  setupAnimations() {
    if (this.textures.exists('mushak_sheet')) {
      this.anims.create({
        key: 'mushak_run',
        frames: this.anims.generateFrameNumbers('mushak_sheet', { start: 0, end: 6 }),
        frameRate: 12,
        repeat: -1
      });
    } else {
      this.anims.create({
        key: 'mushak_run',
        frames: [{ key: 'mushak_protag' }],
        frameRate: 1,
        repeat: -1
      });
    }
  }
}
