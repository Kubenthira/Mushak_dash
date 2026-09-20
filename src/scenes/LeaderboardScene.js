import Phaser from 'phaser';
import { sounds } from '../utils/audio';
import { getTopScores, getPlayerProfile } from '../services/leaderboardService';
import { showProfileModal } from '../utils/profileModal';

export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super('LeaderboardScene');
  }

  init() {
    this.scores = [];
    this.isLoading = true;
    this.statusMessage = 'Connecting to Temple Leaderboard...';
    this.isOffline = false;
  }

  create() {
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.width = this.scale.width;
    this.height = this.scale.height;

    const texH = 724;
    this.scaleFactor = this.height / texH;

    // 1. Background Layers
    this.bgLayer1 = this.add.tileSprite(0, 0, this.width / this.scaleFactor, this.height / this.scaleFactor, 'bg_layer1')
      .setOrigin(0, 0)
      .setScale(this.scaleFactor)
      .setDepth(0);

    this.bgLayer2 = this.add.tileSprite(0, 0, this.width / this.scaleFactor, this.height / this.scaleFactor, 'bg_layer2')
      .setOrigin(0, 0)
      .setScale(this.scaleFactor)
      .setDepth(1);

    this.bgLayer3 = this.add.tileSprite(0, 0, this.width / this.scaleFactor, this.height / this.scaleFactor, 'bg_layer3')
      .setOrigin(0, 0)
      .setScale(this.scaleFactor)
      .setDepth(2);

    // Dark Festive Tint Overlay
    this.overlay = this.add.graphics();
    this.overlay.fillGradientStyle(0x130724, 0x130724, 0x240e06, 0x240e06, 0.94, 0.94, 0.94, 0.94);
    this.overlay.fillRect(0, 0, this.width, this.height);
    this.overlay.setDepth(3);

    // Sparkles
    this.particles = this.add.particles(0, 0, 'sparkle_particle', {
      x: { min: 20, max: this.width - 20 },
      y: { min: 20, max: this.height - 20 },
      speedY: { min: -40, max: -10 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 2000,
      frequency: 180
    });
    this.particles.setDepth(4);

    // 2. Header Bar
    this.createHeader();

    // 3. Score List Container
    this.scoreContainer = this.add.container(0, 0);
    this.scoreContainer.setDepth(10);

    // 4. Status / Loading Indicator
    this.statusText = this.add.text(this.width / 2, this.height * 0.48, this.statusMessage, {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '20px',
      color: '#FFD700',
      align: 'center',
      wordWrap: { width: Math.min(this.width * 0.85, 700) }
    }).setOrigin(0.5).setDepth(15);

    // 5. Navigation Buttons
    this.createNavigationButtons();

    // 6. Fetch Data
    this.fetchLeaderboard();

    this.scale.on('resize', this.onResize, this);
  }

  createHeader() {
    const headerContainer = this.add.container(this.width / 2, 45).setDepth(10);

    const titleText = this.add.text(0, -5, '🏆 FESTIVAL LEADERBOARD 🏆', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#FFF8E1',
      stroke: '#E65100',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 4, color: '#000000', blur: 8, fill: true }
    }).setOrigin(0.5);

    const profile = getPlayerProfile();
    const profileSubtitle = profile.playerId
      ? `Your Player ID: ${profile.playerId}`
      : 'Top Global Runners';

    const subText = this.add.text(0, 26, profileSubtitle, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '15px',
      color: '#FFE082'
    }).setOrigin(0.5);

    headerContainer.add([titleText, subText]);
  }

  async fetchLeaderboard() {
    this.isLoading = true;
    this.statusText.setText('⏳ Fetching Live Rankings from Temple...');
    this.statusText.setColor('#FFD700');
    this.statusText.setVisible(true);
    this.scoreContainer.removeAll(true);

    const res = await getTopScores(20);

    this.isLoading = false;
    this.isOffline = Boolean(res.isOffline);

    if (!res.success) {
      this.statusText.setText(`⚠️ ${res.message || 'Unable to load leaderboard.'}`);
      this.statusText.setColor('#FF8A80');
      this.statusText.setVisible(true);
      return;
    }

    this.scores = res.scores || [];

    if (this.scores.length === 0) {
      this.statusText.setText(res.message || 'No runs logged yet.\nBe the first to set a high score!');
      this.statusText.setColor('#FFE082');
      this.statusText.setVisible(true);
      return;
    }

    this.statusText.setVisible(false);
    this.renderScoresList();
  }

  renderScoresList() {
    this.scoreContainer.removeAll(true);

    const startY = 100;
    const rowHeight = 44;
    const cardWidth = Math.min(this.width * 0.88, 680);
    const centerX = this.width / 2;

    // Header row
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a0718, 0.95);
    headerBg.fillRoundedRect(centerX - cardWidth / 2, startY - 2, cardWidth, 32, 8);
    headerBg.lineStyle(1, 0xffd700, 0.3);
    headerBg.strokeRoundedRect(centerX - cardWidth / 2, startY - 2, cardWidth, 32, 8);
    this.scoreContainer.add(headerBg);

    const hRank = this.add.text(centerX - cardWidth / 2 + 30, startY + 14, 'RANK', {
      fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#B0BEC5'
    }).setOrigin(0, 0.5);

    const hPlayer = this.add.text(centerX - cardWidth / 2 + 130, startY + 14, 'PLAYER ID', {
      fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#B0BEC5'
    }).setOrigin(0, 0.5);

    const hScore = this.add.text(centerX + cardWidth / 2 - 35, startY + 14, 'BEST SCORE', {
      fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#B0BEC5'
    }).setOrigin(1, 0.5);

    this.scoreContainer.add([hRank, hPlayer, hScore]);

    // Rows (top up to 10 visible, scrollable / responsive)
    const maxVisibleRows = Math.floor((this.height - startY - 95) / rowHeight);
    const visibleScores = this.scores.slice(0, Math.max(5, maxVisibleRows));

    visibleScores.forEach((entry, idx) => {
      const y = startY + 38 + idx * rowHeight;
      const rowContainer = this.add.container(0, 0);

      const rowBg = this.add.graphics();
      let fillColor = idx % 2 === 0 ? 0x181033 : 0x201545;
      let strokeColor = 0x512da8;
      let strokeAlpha = 0.3;

      if (entry.isCurrentPlayer) {
        fillColor = 0x4a1420;
        strokeColor = 0xffd700;
        strokeAlpha = 0.9;
      }

      rowBg.fillStyle(fillColor, 0.88);
      rowBg.fillRoundedRect(centerX - cardWidth / 2, y, cardWidth, rowHeight - 6, 8);
      rowBg.lineStyle(entry.isCurrentPlayer ? 2 : 1, strokeColor, strokeAlpha);
      rowBg.strokeRoundedRect(centerX - cardWidth / 2, y, cardWidth, rowHeight - 6, 8);
      rowContainer.add(rowBg);

      // Rank Icon / Number
      let rankText = `${entry.rank}`;
      let rankColor = '#E0E0E0';
      if (entry.rank === 1) { rankText = '🥇 1'; rankColor = '#FFD700'; }
      else if (entry.rank === 2) { rankText = '🥈 2'; rankColor = '#CFD8DC'; }
      else if (entry.rank === 3) { rankText = '🥉 3'; rankColor = '#FFAB91'; }

      const rText = this.add.text(centerX - cardWidth / 2 + 30, y + (rowHeight - 6) / 2, rankText, {
        fontFamily: 'Fredoka, Outfit, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: rankColor
      }).setOrigin(0, 0.5);

      // Player ID
      const nameText = this.add.text(
        centerX - cardWidth / 2 + 130,
        y + (rowHeight - 6) / 2,
        entry.playerId + (entry.isCurrentPlayer ? ' (YOU)' : ''),
        {
          fontFamily: 'Fredoka, Outfit, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          color: entry.isCurrentPlayer ? '#FFD700' : '#FFFFFF'
        }
      ).setOrigin(0, 0.5);

      // Score
      const scoreText = this.add.text(centerX + cardWidth / 2 - 35, y + (rowHeight - 6) / 2, `${entry.score}`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#FFD700'
      }).setOrigin(1, 0.5);

      rowContainer.add([rText, nameText, scoreText]);
      this.scoreContainer.add(rowContainer);
    });

    // Offline / Demo notice if unconfigured
    if (this.isOffline) {
      const banner = this.add.text(centerX, this.height - 65, 'ℹ️ Connected in Local Demo Mode • Add keys in firebaseConfig.js for global live contest sync', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '12px',
        color: '#FFE082'
      }).setOrigin(0.5);
      this.scoreContainer.add(banner);
    }
  }

  createNavigationButtons() {
    const bottomY = this.height - 35;
    const centerX = this.width / 2;

    // 1. Back to Menu Button
    const backBtn = this.add.container(centerX - 160, bottomY).setDepth(15);
    const backBg = this.add.graphics();
    backBg.fillStyle(0x2d174d, 0.9);
    backBg.fillRoundedRect(-80, -18, 160, 36, 18);
    backBg.lineStyle(1.5, 0xffd700, 0.4);
    backBg.strokeRoundedRect(-80, -18, 160, 36, 18);

    const backLabel = this.add.text(0, 0, '⬅️ MAIN MENU', {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    backBtn.add([backBg, backLabel]);
    backBtn.setSize(160, 36);
    backBtn.setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      sounds.playClick();
      this.scene.start('MenuScene');
    });

    // 2. Refresh Button
    const refreshBtn = this.add.container(centerX, bottomY).setDepth(15);
    const refBg = this.add.graphics();
    refBg.fillStyle(0xff7722, 0.95);
    refBg.fillRoundedRect(-65, -18, 130, 36, 18);
    refBg.lineStyle(1.5, 0xffd700, 0.9);
    refBg.strokeRoundedRect(-65, -18, 130, 36, 18);

    const refLabel = this.add.text(0, 0, '🔄 REFRESH', {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    refreshBtn.add([refBg, refLabel]);
    refreshBtn.setSize(130, 36);
    refreshBtn.setInteractive({ useHandCursor: true });

    refreshBtn.on('pointerdown', () => {
      sounds.playClick();
      this.fetchLeaderboard();
    });

    // 3. Edit Player ID Button
    const editBtn = this.add.container(centerX + 160, bottomY).setDepth(15);
    const editBg = this.add.graphics();
    editBg.fillStyle(0x2d174d, 0.9);
    editBg.fillRoundedRect(-80, -18, 160, 36, 18);
    editBg.lineStyle(1.5, 0xffd700, 0.4);
    editBg.strokeRoundedRect(-80, -18, 160, 36, 18);

    const editLabel = this.add.text(0, 0, '👤 EDIT PLAYER ID', {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: '13px',
      color: '#FFE082'
    }).setOrigin(0.5);

    editBtn.add([editBg, editLabel]);
    editBtn.setSize(160, 36);
    editBtn.setInteractive({ useHandCursor: true });

    editBtn.on('pointerdown', () => {
      sounds.playClick();
      showProfileModal(() => {
        this.scene.restart();
      });
    });
  }

  onResize(gameSize) {
    this.width = gameSize.width;
    this.height = gameSize.height;
    this.scene.restart();
  }

  update() {
    if (this.bgLayer1) this.bgLayer1.tilePositionX += 0.03;
    if (this.bgLayer2) this.bgLayer2.tilePositionX += 0.08;
    if (this.bgLayer3) this.bgLayer3.tilePositionX += 0.25;
  }
}
