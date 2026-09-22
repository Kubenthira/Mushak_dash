import Phaser from 'phaser';
import {
  PLAYER_CONFIG,
  SPEED_CONFIG,
  SPAWN_CONFIG,
  SCORES,
  STORAGE_KEYS
} from '../config/gameConfig';
import { sounds } from '../utils/audio';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    sounds.init();

    this.width = this.scale.width;
    this.height = this.scale.height;

    // Calculate dynamic 3 tracks based on current screen height
    this.updateLanes();

    this.currentLane = 1;
    this.isJumping = false;
    this.isDead = false;
    this.hasBlessing = false;
    this.blessingTimer = 0;

    this.score = 0;
    this.displayScore = 0;
    this.collectedModaks = 0;
    this.distance = 0;
    this.scrollSpeed = SPEED_CONFIG.initialScrollSpeed;
    this.spawnTimer = 0;
    this.currentSpawnInterval = SPAWN_CONFIG.initialSpawnInterval;

    // 1. 3-Layer Parallax Background
    const texH = 724;
    this.scaleFactor = this.height / texH;

    // Layer 1: Distant Sky & Far City Skyline (Slowest)
    this.bgLayer1 = this.add.tileSprite(0, 0, this.width / this.scaleFactor, this.height / this.scaleFactor, 'bg_layer1')
      .setOrigin(0, 0)
      .setScale(this.scaleFactor)
      .setDepth(0);

    // Layer 2: Midground Festive Houses, Temples & Torans (Medium)
    this.bgLayer2 = this.add.tileSprite(0, 0, this.width / this.scaleFactor, this.height / this.scaleFactor, 'bg_layer2')
      .setOrigin(0, 0)
      .setScale(this.scaleFactor)
      .setDepth(1);

    // Layer 3: Foreground Street, Road & Pavement (1:1 with gameplay speed)
    this.bgLayer3 = this.add.tileSprite(0, 0, this.width / this.scaleFactor, this.height / this.scaleFactor, 'bg_layer3')
      .setOrigin(0, 0)
      .setScale(this.scaleFactor)
      .setDepth(2);

    // Decorative lane track guides
    this.laneOverlay = this.add.graphics();
    this.laneOverlay.setDepth(3);
    this.drawLaneMarkers();

    // 2. Object Groups & Pools
    this.modaksGroup = this.add.group();
    this.obstaclesGroup = this.add.group();
    this.collectiblesGroup = this.add.group();
    this.lastModakLane = 1;
    this.waveCount = 0;

    // 3. Particle Systems
    this.createParticleSystems();

    // 4. Player
    this.createPlayer();

    // 5. Inputs
    this.setupInputHandlers();

    // 6. HUD
    this.createHUD();

    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.scale.on('resize', this.onResize, this);
  }

  updateLanes() {
    const isPortrait = this.height > this.width;
    const isPhoneLandscape = this.width > this.height && this.height <= 520;
    if (isPortrait) {
      // In mobile portrait, the street road sits lower down to give generous sky view
      this.lanesY = [
        this.height * 0.69, // Top track on road
        this.height * 0.78, // Middle track on road
        this.height * 0.87  // Bottom track on road
      ];
    } else if (isPhoneLandscape) {
      // In phone landscape, optimize 3 tracks to road pavement
      this.lanesY = [
        this.height * 0.72,
        this.height * 0.82,
        this.height * 0.92
      ];
    } else {
      this.lanesY = [
        this.height * 0.74, // Top track on road
        this.height * 0.83, // Middle track on road
        this.height * 0.92  // Bottom track on road
      ];
    }
  }

  onResize(gameSize) {
    this.width = gameSize.width;
    this.height = gameSize.height;
    this.updateLanes();

    const texH = 724;
    this.scaleFactor = this.height / texH;

    if (this.bgLayer1) {
      this.bgLayer1.setSize(this.width / this.scaleFactor, this.height / this.scaleFactor);
      this.bgLayer1.setScale(this.scaleFactor);
    }
    if (this.bgLayer2) {
      this.bgLayer2.setSize(this.width / this.scaleFactor, this.height / this.scaleFactor);
      this.bgLayer2.setScale(this.scaleFactor);
    }
    if (this.bgLayer3) {
      this.bgLayer3.setSize(this.width / this.scaleFactor, this.height / this.scaleFactor);
      this.bgLayer3.setScale(this.scaleFactor);
    }
    this.drawLaneMarkers();

    const isPortrait = this.height > this.width;
    const isPhoneLandscape = this.width > this.height && this.height <= 520;
    const playerX = Math.max(75, this.width * (isPhoneLandscape ? 0.14 : (isPortrait ? 0.15 : 0.18)));
    if (this.playerContainer && !this.isDead) {
      this.playerContainer.x = playerX;
      this.playerContainer.y = this.lanesY[this.currentLane];
    }
  }

  drawLaneMarkers() {
    this.laneOverlay.clear();
    this.laneOverlay.lineStyle(1.5, 0xffd700, 0.2);

    const div1 = (this.lanesY[0] + this.lanesY[1]) / 2;
    const div2 = (this.lanesY[1] + this.lanesY[2]) / 2;

    this.laneOverlay.lineBetween(0, div1, this.width, div1);
    this.laneOverlay.lineBetween(0, div2, this.width, div2);
  }

  createParticleSystems() {
    this.modakEmitter = this.add.particles(0, 0, 'sparkle_particle', {
      lifespan: 600,
      speed: { min: 80, max: 240 },
      scale: { start: 0.9, end: 0 },
      blendMode: 'ADD',
      emitting: false
    });
    this.modakEmitter.setDepth(30);

    this.dustEmitter = this.add.particles(0, 0, 'sparkle_particle', {
      lifespan: 350,
      speedX: { min: -120, max: -60 },
      speedY: { min: -15, max: 15 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      frequency: 75
    });
    this.dustEmitter.setDepth(18);
  }

  createPlayer() {
    const isPortrait = this.height > this.width;
    const playerX = Math.max(70, this.width * (isPortrait ? 0.15 : 0.18));
    this.playerContainer = this.add.container(playerX, this.lanesY[this.currentLane]);
    this.playerContainer.setDepth(10 + this.currentLane * 15 + 5);

    // Proportional character scaling for small screens
    const scaleMod = Phaser.Math.Clamp(this.height / 720, 0.68, 1.05);
    this.playerScale = PLAYER_CONFIG.scale * scaleMod;

    this.blessingAura = this.add.graphics();
    this.blessingAura.fillStyle(0xffd700, 0.35);
    this.blessingAura.fillCircle(0, -10 * scaleMod, 95 * scaleMod);
    this.blessingAura.lineStyle(3, 0xffffff, 0.9);
    this.blessingAura.strokeCircle(0, -10 * scaleMod, 95 * scaleMod);
    this.blessingAura.setVisible(false);

    this.playerSprite = this.add.sprite(0, 0, 'mushak_protag')
      .setScale(this.playerScale)
      .setOrigin(0.5, 0.72);

    this.playerSprite.play('mushak_run');

    this.shadow = this.add.graphics();
    this.shadow.fillStyle(0x000000, 0.38);
    this.shadow.fillEllipse(0, 32 * scaleMod, 78 * scaleMod, 24 * scaleMod);

    this.playerContainer.add([this.shadow, this.blessingAura, this.playerSprite]);
    this.dustEmitter.startFollow(this.playerContainer, -30, 30);
  }

  setupInputHandlers() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W, false);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S, false);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A, false);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D, false);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, false);

    const isInputActive = () => document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

    this.input.keyboard.on('keydown-UP', () => { if (!isInputActive()) this.switchLane(-1); });
    this.input.keyboard.on('keydown-W', () => { if (!isInputActive()) this.switchLane(-1); });
    this.input.keyboard.on('keydown-DOWN', () => { if (!isInputActive()) this.switchLane(1); });
    this.input.keyboard.on('keydown-S', () => { if (!isInputActive()) this.switchLane(1); });

    this.input.keyboard.on('keydown-SPACE', () => { if (!isInputActive()) this.jump(); });
    this.input.keyboard.on('keydown-RIGHT', () => { if (!isInputActive()) this.jump(); });
    this.input.keyboard.on('keydown-D', () => { if (!isInputActive()) this.jump(); });

    // Show Mobile Touch Controls if on mobile/touch device
    const touchControls = document.getElementById('touch-controls');
    if (touchControls) {
      touchControls.style.display = 'flex';
    }

    const handlePress = (fn) => {
      return (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (navigator.vibrate) navigator.vibrate(10);
        fn();
      };
    };

    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnJump = document.getElementById('btn-jump');

    if (btnUp) {
      btnUp.onpointerdown = handlePress(() => this.switchLane(-1));
    }
    if (btnDown) {
      btnDown.onpointerdown = handlePress(() => this.switchLane(1));
    }
    if (btnJump) {
      btnJump.onpointerdown = handlePress(() => this.jump());
    }

    // Fullscreen touch and swipe gesture support
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    this.input.on('pointerdown', (pointer) => {
      touchStartX = pointer.x;
      touchStartY = pointer.y;
      touchStartTime = this.time.now;
    });

    this.input.on('pointerup', (pointer) => {
      const dx = pointer.x - touchStartX;
      const dy = pointer.y - touchStartY;
      const duration = this.time.now - touchStartTime;

      if (duration < 450) {
        // Vertical swipe takes priority
        if (Math.abs(dy) > 30 && Math.abs(dy) > Math.abs(dx)) {
          if (dy < 0) this.switchLane(-1);
          else this.switchLane(1);
        } else if (dx > 30) {
          // Horizontal right swipe to jump
          this.jump();
        } else if (Math.abs(dx) < 22 && Math.abs(dy) < 22) {
          // Tap zones: Right half to jump, Left top to go up, Left bottom to go down
          if (pointer.x > this.width * 0.55) {
            this.jump();
          } else if (pointer.y < this.lanesY[1]) {
            this.switchLane(-1);
          } else {
            this.switchLane(1);
          }
        }
      }
    });

    this.events.once('shutdown', () => {
      if (touchControls) touchControls.style.display = 'none';
    });
  }

  createHUD() {
    const isPhoneLandscape = this.width > this.height && this.height <= 520;
    const isMobile = this.width < 600 || isPhoneLandscape;
    const hudW = isPhoneLandscape ? 210 : (isMobile ? Math.min(this.width * 0.65, 230) : 380);
    const hudH = isPhoneLandscape ? 36 : (isMobile ? 42 : 54);
    const hudX = isPhoneLandscape ? 12 : (isMobile ? 14 : 30);
    const hudY = isPhoneLandscape ? 10 : (isMobile ? 12 : 20);

    const hudBar = this.add.graphics();
    hudBar.fillStyle(0x0f0c20, 0.82);
    hudBar.fillRoundedRect(hudX, hudY, hudW, hudH, hudH / 2);
    hudBar.lineStyle(1.5, 0xffd700, 0.4);
    hudBar.strokeRoundedRect(hudX, hudY, hudW, hudH, hudH / 2);
    hudBar.setDepth(100);

    const scoreFontSize = isPhoneLandscape ? '14px' : (isMobile ? '15px' : '22px');
    const scoreX = hudX + (isPhoneLandscape ? 12 : (isMobile ? 14 : 22));
    const scoreY = hudY + hudH / 2;

    this.scoreText = this.add.text(scoreX, scoreY, 'SCORE: 0', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: scoreFontSize,
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0, 0.5).setDepth(101);

    const modakIconX = hudX + hudW - (isPhoneLandscape ? 44 : (isMobile ? 48 : 95));
    const modakTextX = modakIconX + (isPhoneLandscape ? 16 : (isMobile ? 18 : 25));

    this.modakIcon = this.add.image(modakIconX, scoreY, 'modak_item')
      .setScale(isPhoneLandscape ? 0.07 : (isMobile ? 0.08 : 0.12))
      .setDepth(101);

    this.modakText = this.add.text(modakTextX, scoreY, '0', {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: scoreFontSize,
      fontStyle: 'bold',
      color: '#FFD700'
    }).setOrigin(0, 0.5).setDepth(101);

    // Blessing Banner
    const bannerW = isPhoneLandscape ? 200 : (isMobile ? Math.min(this.width * 0.65, 220) : 280);
    const bannerH = isPhoneLandscape ? 28 : (isMobile ? 30 : 36);
    const bannerY = isPhoneLandscape ? 28 : (isMobile ? hudY + hudH + 20 : 45);
    const bannerX = this.width / 2;

    this.blessingBanner = this.add.container(bannerX, bannerY);
    this.blessingBanner.setDepth(102);

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0xff9800, 0.95);
    bannerBg.fillRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, bannerH / 2);
    bannerBg.lineStyle(2, 0xffffff, 0.9);
    bannerBg.strokeRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, bannerH / 2);

    const bannerText = this.add.text(0, 0, '✨ GANESHA BLESSING ✨', {
      fontFamily: 'Fredoka, sans-serif',
      fontSize: isPhoneLandscape ? '11px' : (isMobile ? '12px' : '16px'),
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    this.blessingBanner.add([bannerBg, bannerText]);
    this.blessingBanner.setVisible(false);
  }

  switchLane(direction) {
    if (this.isDead) return;

    const targetLane = Phaser.Math.Clamp(this.currentLane + direction, 0, 2);
    if (targetLane === this.currentLane) return;

    this.currentLane = targetLane;
    sounds.playLaneSwitch();
    this.playerContainer.setDepth(10 + this.currentLane * 15 + 5);

    const targetY = this.lanesY[this.currentLane];

    this.tweens.add({
      targets: this.playerContainer,
      y: targetY,
      duration: PLAYER_CONFIG.laneSwitchDuration,
      ease: 'Quad.easeOut'
    });
  }

  jump() {
    if (this.isDead || this.isJumping) return;

    this.isJumping = true;
    sounds.playJump();

    this.tweens.add({
      targets: this.playerSprite,
      scaleX: PLAYER_CONFIG.scale * 1.25,
      scaleY: PLAYER_CONFIG.scale * 0.75,
      duration: 80,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.playerSprite.setScale(PLAYER_CONFIG.scale * 0.88, PLAYER_CONFIG.scale * 1.15);

        this.tweens.add({
          targets: this.playerSprite,
          y: -PLAYER_CONFIG.jumpHeight,
          duration: PLAYER_CONFIG.jumpDuration * 0.48,
          ease: 'Quad.easeOut',
          yoyo: true,
          onYoyo: () => {
            this.playerSprite.setScale(PLAYER_CONFIG.scale);
          },
          onComplete: () => {
            this.playerSprite.y = 0;
            this.tweens.add({
              targets: this.playerSprite,
              scaleX: PLAYER_CONFIG.scale * 1.3,
              scaleY: PLAYER_CONFIG.scale * 0.7,
              duration: 90,
              yoyo: true,
              ease: 'Quad.easeOut',
              onComplete: () => {
                this.playerSprite.setScale(PLAYER_CONFIG.scale);
                this.isJumping = false;
              }
            });
          }
        });

        this.tweens.add({
          targets: this.shadow,
          scaleX: 0.4,
          scaleY: 0.4,
          alpha: 0.15,
          duration: PLAYER_CONFIG.jumpDuration * 0.48,
          yoyo: true,
          ease: 'Quad.easeOut'
        });
      }
    });
  }

  update(time, delta) {
    if (this.isDead) return;

    const dt = delta / 1000;

    // 1. Continuous 3-layer parallax motion
    const deltaScroll = (this.scrollSpeed * dt) / this.scaleFactor;
    this.bgLayer3.tilePositionX += deltaScroll;
    this.bgLayer2.tilePositionX += deltaScroll * 0.12;
    this.bgLayer1.tilePositionX += deltaScroll * 0.03;

    this.scrollSpeed = Math.min(
      SPEED_CONFIG.maxScrollSpeed,
      this.scrollSpeed + SPEED_CONFIG.acceleration * dt
    );

    this.distance += this.scrollSpeed * dt * 0.05;
    this.score += SCORES.DISTANCE_PER_SECOND * dt;

    this.displayScore = Phaser.Math.Linear(this.displayScore, this.score, 0.1);
    this.scoreText.setText(`SCORE: ${Math.floor(this.displayScore)}`);

    if (this.hasBlessing) {
      this.blessingAura.rotation += 0.05;
      this.blessingTimer -= delta;

      this.applyMagnet();

      if (this.blessingTimer <= 0) {
        this.hasBlessing = false;
        this.blessingAura.setVisible(false);
        this.blessingBanner.setVisible(false);
      }
    }

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.currentSpawnInterval) {
      this.spawnTimer = 0;
      this.spawnWave();
      this.currentSpawnInterval = Phaser.Math.Clamp(
        SPAWN_CONFIG.initialSpawnInterval * (SPEED_CONFIG.initialScrollSpeed / this.scrollSpeed),
        SPAWN_CONFIG.minSpawnInterval,
        SPAWN_CONFIG.initialSpawnInterval
      );
    }

    this.updateEntities(dt);
  }

  getModak(x, y, lane) {
    let modak = this.modaksGroup.getChildren().find((m) => !m.active);
    if (!modak) {
      modak = this.add.sprite(x, y, 'modak_item');
      this.modaksGroup.add(modak);
    } else {
      modak.setPosition(x, y);
    }
    modak.setScale(0.11);
    modak.setOrigin(0.5, 0.95);
    modak.setDepth(10 + lane * 15 + 2); // Dynamic depth based on lane track
    modak.setActive(true);
    modak.setVisible(true);
    modak.setAlpha(1);
    modak.lane = lane;
    modak.isModak = true;
    modak.scoreValue = SCORES.MODAK;
    return modak;
  }

  recycleModak(modak) {
    if (!modak) return;
    modak.setActive(false);
    modak.setVisible(false);
  }

  getObstacle(x, y, lane, type) {
    let obstacle = this.obstaclesGroup.getChildren().find((o) => !o.active && o.obstacleType === type);
    if (!obstacle) {
      obstacle = this.add.sprite(x, y, type);
      obstacle.obstacleType = type;
      this.obstaclesGroup.add(obstacle);
    } else {
      obstacle.setPosition(x, y);
    }
    if (type === 'obstacle_pole') {
      obstacle.setScale(2.5, 1.64); // 2x bigger: bold, large festival street pole barrier
      obstacle.setOrigin(0.5, 0.95);
      obstacle.setPosition(x, y + 30); // Anchored to base ground line
      obstacle.setDepth(10 + lane * 15 + 8); // Tall obstacle in this lane
    } else if (type === 'obstacle_puddle') {
      obstacle.setScale(1.1, 0.95);
      obstacle.setOrigin(0.5, 0.5); // Perfectly flat surface with no vertical elevation
      obstacle.setPosition(x, y + 30); // Flush with the asphalt ground contact line where feet run
      obstacle.setDepth(10 + lane * 15 + 1); // Flat on road asphalt, under character in this lane
    }
    obstacle.setActive(true);
    obstacle.setVisible(true);
    obstacle.setAlpha(1);
    obstacle.lane = lane;
    obstacle.isJumpable = (type === 'obstacle_puddle');
    return obstacle;
  }

  recycleObstacle(obstacle) {
    if (!obstacle) return;
    obstacle.setActive(false);
    obstacle.setVisible(false);
  }

  spawnWave() {
    this.waveCount++;
    const playerPosX = this.playerContainer ? this.playerContainer.x : 100;
    const isPortrait = this.height > this.width;
    const minTravelDist = isPortrait ? 650 : 750;
    const spawnX = Math.max(this.width + 100, playerPosX + minTravelDist);

    // Alternate lanes across waves so player moves between tracks
    const availableLanes = [0, 1, 2].filter((l) => l !== this.lastModakLane);
    const modakLane = Phaser.Utils.Array.GetRandom(availableLanes);
    this.lastModakLane = modakLane;

    // Pattern selection with strict longitudinal (X-axis) separation so obstacles never overlap modaks
    const patternType = this.waveCount % 4;

    if (patternType === 0) {
      // 1. Clean straight line of 3 to 5 modaks on the road surface
      const count = Phaser.Math.Between(3, 5);
      const spacing = 70;
      for (let i = 0; i < count; i++) {
        const x = spawnX + i * spacing;
        const y = this.lanesY[modakLane];
        this.getModak(x, y, modakLane);
      }
    } else if (patternType === 1) {
      // 2. Longer linear line of 4 to 6 modaks
      const count = Phaser.Math.Between(4, 6);
      const spacing = 65;
      for (let i = 0; i < count; i++) {
        const x = spawnX + i * spacing;
        const y = this.lanesY[modakLane];
        this.getModak(x, y, modakLane);
      }
    } else if (patternType === 2) {
      // 3. Obstacle first, followed cleanly by a line of modaks after a safe X-gap (NO overlap)
      const obsLane = Phaser.Utils.Array.GetRandom([0, 1, 2]);
      const obsType = Math.random() < 0.5 ? 'obstacle_puddle' : 'obstacle_pole';
      this.getObstacle(spawnX, this.lanesY[obsLane], obsLane, obsType);

      // Spawn modak row well after the obstacle (gap >= 180px) to prevent any overlap
      const targetModakLane = (obsLane === modakLane) ? Phaser.Utils.Array.GetRandom([0, 1, 2].filter((l) => l !== obsLane)) : modakLane;
      const modakStartX = spawnX + 190;
      const count = Phaser.Math.Between(3, 4);
      const spacing = 70;
      for (let i = 0; i < count; i++) {
        const x = modakStartX + i * spacing;
        const y = this.lanesY[targetModakLane];
        this.getModak(x, y, targetModakLane);
      }

      // Occasional Divine Blessing powerup
      if (this.waveCount % 6 === 0) {
        this.spawnBlessing(modakStartX + count * spacing + 120, targetModakLane);
      }
    } else if (patternType === 3) {
      // 4. Modak line first, followed cleanly by an obstacle after the row (NO overlap)
      const count = Phaser.Math.Between(3, 4);
      const spacing = 70;
      for (let i = 0; i < count; i++) {
        const x = spawnX + i * spacing;
        const y = this.lanesY[modakLane];
        this.getModak(x, y, modakLane);
      }

      const obsX = spawnX + count * spacing + 180;
      const obsLane = Phaser.Utils.Array.GetRandom([0, 1, 2]);
      const obsType = Math.random() < 0.5 ? 'obstacle_puddle' : 'obstacle_pole';
      this.getObstacle(obsX, this.lanesY[obsLane], obsLane, obsType);
    }
  }

  spawnBlessing(x, lane) {
    const item = this.add.sprite(x, this.lanesY[lane] - 30, 'powerup_blessing');
    item.setScale(0.85);
    item.lane = lane;
    item.isBlessing = true;
    this.collectiblesGroup.add(item);
  }

  updateEntities(dt) {
    const playerX = this.playerContainer.x;
    const playerContainerY = this.playerContainer.y;
    // Effective player center Y during jumping or lane switching
    const playerEffY = playerContainerY + this.playerSprite.y;

    // 1. Modaks (Object Pooled)
    this.modaksGroup.getChildren().forEach((modak) => {
      if (!modak.active) return;
      modak.x -= this.scrollSpeed * dt;

      if (!this.isDead) {
        const isSameLane = (modak.lane === this.currentLane);
        const dx = Math.abs(modak.x - playerX);

        if (this.hasBlessing) {
          // Magnet blessing can collect nearby pulled modaks
          const dist = Phaser.Math.Distance.Between(modak.x, modak.y, playerX, playerEffY);
          if (dist < 55) {
            this.collectModak(modak);
          }
        } else if (isSameLane && dx < 55) {
          // Strictly collectable only when the character is in that lane
          const dy = Math.abs(modak.y - playerEffY);
          if (dy < 45) {
            this.collectModak(modak);
          }
        }
      }

      if (modak.x < -100) {
        this.recycleModak(modak);
      }
    });

    // 2. Obstacles (Object Pooled)
    this.obstaclesGroup.getChildren().forEach((obstacle) => {
      if (!obstacle.active) return;
      obstacle.x -= this.scrollSpeed * dt;

      const hitDist = obstacle.obstacleType === 'obstacle_pole' ? 78 : 55;
      if (
        !this.isDead &&
        obstacle.lane === this.currentLane &&
        Math.abs(obstacle.x - playerX) < hitDist
      ) {
        if (obstacle.isJumpable && this.isJumping && this.playerSprite.y < -50) {
          // Cleared jump over hazard!
        } else if (this.hasBlessing) {
          this.modakEmitter.explode(15, obstacle.x, obstacle.y);
          this.recycleObstacle(obstacle);
          sounds.playCollectItem();
        } else {
          this.handlePlayerHit(obstacle);
        }
      }

      if (obstacle.x < -100) {
        this.recycleObstacle(obstacle);
      }
    });

    // 3. Rare Collectibles (Blessing, etc.)
    this.collectiblesGroup.getChildren().forEach((item) => {
      if (!item.active) return;
      item.x -= this.scrollSpeed * dt;

      if (!this.isDead) {
        const isSameLane = (item.lane === this.currentLane);
        const dx = Math.abs(item.x - playerX);
        const dy = Math.abs(item.y - playerEffY);

        if ((isSameLane && dx < 55 && dy < 45) || (this.hasBlessing && Phaser.Math.Distance.Between(item.x, item.y, playerX, playerEffY) < 55)) {
          this.collectItem(item);
        }
      }

      if (item.x < -100) {
        item.destroy();
      }
    });
  }

  applyMagnet() {
    const playerX = this.playerContainer.x;
    const playerY = this.playerContainer.y + this.playerSprite.y;

    this.modaksGroup.getChildren().forEach((modak) => {
      if (!modak.active) return;
      const dist = Phaser.Math.Distance.Between(modak.x, modak.y, playerX, playerY);
      if (dist < SPAWN_CONFIG.magnetRadius) {
        const angle = Phaser.Math.Angle.Between(modak.x, modak.y, playerX, playerY);
        modak.x += Math.cos(angle) * 18;
        modak.y += Math.sin(angle) * 18;
      }
    });

    this.collectiblesGroup.getChildren().forEach((item) => {
      if (!item.active) return;
      const dist = Phaser.Math.Distance.Between(item.x, item.y, playerX, playerY);
      if (dist < SPAWN_CONFIG.magnetRadius) {
        const angle = Phaser.Math.Angle.Between(item.x, item.y, playerX, playerY);
        item.x += Math.cos(angle) * 18;
        item.y += Math.sin(angle) * 18;
      }
    });
  }

  collectModak(modak) {
    this.score += modak.scoreValue;
    this.collectedModaks++;
    this.modakText.setText(`${this.collectedModaks}`);
    sounds.playCollectModak();
    this.modakEmitter.explode(15, modak.x, modak.y - 15);
    this.showFloatingText(modak.x, modak.y - 15, `+${modak.scoreValue}`, '#FFD700');
    this.recycleModak(modak);
  }

  collectItem(item) {
    if (item.isBlessing) {
      this.hasBlessing = true;
      this.blessingTimer = SPAWN_CONFIG.blessingDuration;
      this.blessingAura.setVisible(true);
      this.blessingBanner.setVisible(true);
      this.score += 200;

      sounds.playBlessing();
      this.modakEmitter.explode(25, item.x, item.y);
      this.showFloatingText(item.x, item.y, 'DIVINE BLESSING! +200', '#FFD700');
    } else {
      this.score += item.scoreValue;
      sounds.playCollectItem();
      this.showFloatingText(item.x, item.y, `+${item.scoreValue}`, '#81C784');
      this.modakEmitter.explode(12, item.x, item.y);
    }

    item.destroy();
  }

  showFloatingText(x, y, text, color) {
    const floating = this.add.text(x, y - 10, text, {
      fontFamily: 'Fredoka, Outfit, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(150);

    this.tweens.add({
      targets: floating,
      y: y - 55,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => floating.destroy()
    });
  }

  handlePlayerHit(obstacle) {
    this.isDead = true;
    sounds.playHit();

    this.cameras.main.shake(350, 0.025);
    this.cameras.main.flash(200, 255, 100, 100);

    if (this.runBobTween) this.runBobTween.stop();
    this.dustEmitter.stop();

    this.tweens.add({
      targets: this.playerSprite,
      rotation: 1.8,
      scaleX: PLAYER_CONFIG.scale * 0.7,
      scaleY: PLAYER_CONFIG.scale * 0.7,
      y: -20,
      duration: 400,
      ease: 'Quad.easeOut'
    });

    const finalScore = Math.floor(this.score);
    const prevBest = parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0', 10);
    const isNewHigh = finalScore > prevBest;

    if (isNewHigh) {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, finalScore.toString());
    }

    const prevModaks = parseInt(localStorage.getItem(STORAGE_KEYS.MODAK_COUNT) || '0', 10);
    localStorage.setItem(STORAGE_KEYS.MODAK_COUNT, (prevModaks + this.collectedModaks).toString());

    this.time.delayedCall(800, () => {
      this.cameras.main.fade(350, 15, 12, 32, false, (camera, progress) => {
        if (progress === 1) {
          this.scene.start('GameOverScene', {
            finalScore: finalScore,
            highScore: Math.max(finalScore, prevBest),
            modaks: this.collectedModaks,
            isNewHigh: isNewHigh
          });
        }
      });
    });
  }
}
