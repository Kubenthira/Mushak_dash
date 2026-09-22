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
    this.isMobile = this.width < 680 || this.width < this.height;

    const texH = 724;
    this.scaleFactor = this.height / texH;

    // 1. Background Layers
    this.bgLayer1 = this.add.tileSprite(0, 0, this.width / this.scaleFactor, this.height / this.scaleFactor, 'bg_layer1')
      .setOrigin(0, 0).setScale(this.scaleFactor).setDepth(0);
    this.bgLayer2 = this.add.tileSprite(0, 0, this.width / this.scaleFactor, this.height / this.scaleFactor, 'bg_layer2')
      .setOrigin(0, 0).setScale(this.scaleFactor).setDepth(1);
    this.bgLayer3 = this.add.tileSprite(0, 0, this.width / this.scaleFactor, this.height / this.scaleFactor, 'bg_layer3')
      .setOrigin(0, 0).setScale(this.scaleFactor).setDepth(2);

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
    this.scoreContainer = this.add.container(0, 0).setDepth(10);

    // 4. Status / Loading Indicator
    this.statusText = this.add.text(this.width / 2, this.height * 0.48, this.statusMessage, {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: this.isMobile ? '16px' : '20px',
      color: '#FFD700',
      align: 'center',
      wordWrap: { width: Math.min(this.width * 0.88, 640) }
    }).setOrigin(0.5).setDepth(15);

    // 5. Navigation Buttons
    this.createNavigationButtons();

    // 6. Fetch Data
    this.fetchLeaderboard();

    this.scale.on('resize', this.onResize, this);
  }

  createHeader() {
    const headerY = this.isMobile ? 32 : 45;
    const headerContainer = this.add.container(this.width / 2, headerY).setDepth(10);

    const titleSize = this.isMobile ? Math.min(this.width * 0.065, 24) : 32;
    const titleText = this.add.text(0, -6, '🏆 FESTIVAL LEADERBOARD 🏆', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: `${titleSize}px`,
      fontStyle: 'bold',
      color: '#FFF8E1',
      stroke: '#E65100',
      strokeThickness: this.isMobile ? 4 : 6,
      shadow: { offsetX: 0, offsetY: 3, color: '#000000', blur: 6, fill: true }
    }).setOrigin(0.5);

    const profile = getPlayerProfile();
    const profileSubtitle = profile.playerId
      ? `Your ID: ${profile.playerId}`
      : 'Top Global Runners';

    const subText = this.add.text(0, this.isMobile ? 20 : 26, profileSubtitle, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: this.isMobile ? '12px' : '14px',
      color: '#FFE082'
    }).setOrigin(0.5);

    headerContainer.add([titleText, subText]);
  }

  async fetchLeaderboard() {
    this.isLoading = true;
    this.statusText.setText('⏳ Fetching Live Rankings...');
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

    const startY = this.isMobile ? 70 : 96;
    const rowHeight = this.isMobile ? 38 : 44;
    const cardWidth = Math.min(this.width * 0.94, 660);
    const centerX = this.width / 2;

    const rankX = centerX - cardWidth / 2 + (this.isMobile ? 12 : 28);
    const playerX = centerX - cardWidth / 2 + (this.isMobile ? 55 : 120);
    const scoreX = centerX + cardWidth / 2 - (this.isMobile ? 14 : 30);

    // Header row
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0a0718, 0.95);
    headerBg.fillRoundedRect(centerX - cardWidth / 2, startY - 2, cardWidth, 30, 8);
    headerBg.lineStyle(1, 0xffd700, 0.3);
    headerBg.strokeRoundedRect(centerX - cardWidth / 2, startY - 2, cardWidth, 30, 8);
    this.scoreContainer.add(headerBg);

    const hRank = this.add.text(rankX, startY + 13, 'RANK', {
      fontFamily: 'Outfit, sans-serif', fontSize: this.isMobile ? '11px' : '13px', fontStyle: 'bold', color: '#B0BEC5'
    }).setOrigin(0, 0.5);

    const hPlayer = this.add.text(playerX, startY + 13, 'PLAYER & CAMPUS', {
      fontFamily: 'Outfit, sans-serif', fontSize: this.isMobile ? '11px' : '13px', fontStyle: 'bold', color: '#B0BEC5'
    }).setOrigin(0, 0.5);

    const hScore = this.add.text(scoreX, startY + 13, 'SCORE', {
      fontFamily: 'Outfit, sans-serif', fontSize: this.isMobile ? '11px' : '13px', fontStyle: 'bold', color: '#B0BEC5'
    }).setOrigin(1, 0.5);

    this.scoreContainer.add([hRank, hPlayer, hScore]);

    // Rows calculation
    const bottomNavSpace = this.isMobile ? 65 : 75;
    const maxVisibleRows = Math.floor((this.height - startY - bottomNavSpace) / rowHeight);
    const visibleScores = this.scores.slice(0, Math.max(4, maxVisibleRows));

    visibleScores.forEach((entry, idx) => {
      const y = startY + 34 + idx * rowHeight;
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
      rowBg.fillRoundedRect(centerX - cardWidth / 2, y, cardWidth, rowHeight - 5, 8);
      rowBg.lineStyle(entry.isCurrentPlayer ? 2 : 1, strokeColor, strokeAlpha);
      rowBg.strokeRoundedRect(centerX - cardWidth / 2, y, cardWidth, rowHeight - 5, 8);
      rowContainer.add(rowBg);

      // Rank Icon / Number
      let rankText = `${entry.rank}`;
      let rankColor = '#E0E0E0';
      if (entry.rank === 1) { rankText = '🥇 1'; rankColor = '#FFD700'; }
      else if (entry.rank === 2) { rankText = '🥈 2'; rankColor = '#CFD8DC'; }
      else if (entry.rank === 3) { rankText = '🥉 3'; rankColor = '#FFAB91'; }

      const rText = this.add.text(rankX, y + (rowHeight - 5) / 2, rankText, {
        fontFamily: 'Fredoka, Outfit, sans-serif',
        fontSize: this.isMobile ? '13px' : '15px',
        fontStyle: 'bold',
        color: rankColor
      }).setOrigin(0, 0.5);

      // Player ID + Campus Name formatting
      let nameStr = entry.playerId || 'Runner';
      const maxNameLen = this.isMobile ? 10 : 16;
      if (nameStr.length > maxNameLen) {
        nameStr = nameStr.slice(0, maxNameLen - 1) + '…';
      }
      if (entry.isCurrentPlayer) nameStr += ' ⭐';

      let campusStr = (entry.campus || '').trim();
      const maxCampusLen = this.isMobile ? 12 : 20;
      if (campusStr.length > maxCampusLen) {
        campusStr = campusStr.slice(0, maxCampusLen - 1) + '…';
      }

      // Name Text
      const nameText = this.add.text(
        playerX,
        y + (rowHeight - 5) / 2,
        nameStr,
        {
          fontFamily: 'Fredoka, Outfit, sans-serif',
          fontSize: this.isMobile ? '13px' : '15px',
          fontStyle: 'bold',
          color: entry.isCurrentPlayer ? '#FFD700' : '#FFFFFF'
        }
      ).setOrigin(0, 0.5);

      const rowChildren = [rText, nameText];

      // Campus badge next to name (only shown if player specified a campus)
      if (campusStr) {
        const campusOffset = nameText.width + (this.isMobile ? 6 : 12);
        const campusText = this.add.text(
          playerX + campusOffset,
          y + (rowHeight - 5) / 2,
          `🏫 ${campusStr}`,
          {
            fontFamily: 'Outfit, sans-serif',
            fontSize: this.isMobile ? '10px' : '12px',
            color: '#80DEEA'
          }
        ).setOrigin(0, 0.5);
        rowChildren.push(campusText);
      }

      // Score
      const scoreText = this.add.text(scoreX, y + (rowHeight - 5) / 2, `${entry.score}`, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: this.isMobile ? '14px' : '17px',
        fontStyle: 'bold',
        color: '#FFD700'
      }).setOrigin(1, 0.5);

      rowChildren.push(scoreText);
      rowContainer.add(rowChildren);
      this.scoreContainer.add(rowContainer);
    });
  }

  createNavigationButtons() {
    const bottomY = this.height - (this.isMobile ? 30 : 36);
    const centerX = this.width / 2;
    const cardWidth = Math.min(this.width * 0.94, 660);

    if (this.isMobile) {
      // Mobile Navigation Buttons
      const btnW = (cardWidth - 16) / 3;
      const btnH = 34;

      const backX = centerX - cardWidth / 2 + btnW / 2;
      const refX = centerX;
      const editX = centerX + cardWidth / 2 - btnW / 2;

      this.createNavBtn(backX, bottomY, btnW, btnH, '⬅️ MENU', 0x2d174d, () => {
        sounds.playClick();
        this.scene.start('MenuScene');
      });

      this.createNavBtn(refX, bottomY, btnW, btnH, '🔄 REFRESH', 0xff7722, () => {
        sounds.playClick();
        this.fetchLeaderboard();
      });

      this.createNavBtn(editX, bottomY, btnW, btnH, '👤 SET ID', 0x2d174d, () => {
        sounds.playClick();
        showProfileModal(() => this.scene.restart());
      });

    } else {
      // Desktop Navigation Buttons
      const btnH = 38;
      this.createNavBtn(centerX - 170, bottomY, 150, btnH, '⬅️ MAIN MENU', 0x2d174d, () => {
        sounds.playClick();
        this.scene.start('MenuScene');
      });

      this.createNavBtn(centerX, bottomY, 130, btnH, '🔄 REFRESH', 0xff7722, () => {
        sounds.playClick();
        this.fetchLeaderboard();
      });

      this.createNavBtn(centerX + 170, bottomY, 160, btnH, '👤 EDIT PLAYER ID', 0x2d174d, () => {
        sounds.playClick();
        showProfileModal(() => this.scene.restart());
      });
    }
  }

  createNavBtn(x, y, w, h, label, colorHex, onClick) {
    const btn = this.add.container(x, y).setDepth(15);
    const bg = this.add.graphics();
    bg.fillStyle(colorHex, 0.92);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    bg.lineStyle(1.5, 0xffd700, 0.5);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);

    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: this.isMobile ? '12px' : '13px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    btn.add([bg, txt]);
    btn.setSize(w, h);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onClick);
    return btn;
  }

  onResize() {
    this.scene.restart();
  }

  update() {
    if (this.bgLayer1) this.bgLayer1.tilePositionX += 0.03;
    if (this.bgLayer2) this.bgLayer2.tilePositionX += 0.08;
    if (this.bgLayer3) this.bgLayer3.tilePositionX += 0.25;
  }
}
