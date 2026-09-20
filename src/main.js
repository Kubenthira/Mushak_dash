import Phaser from 'phaser';
import { BASE_WIDTH, BASE_HEIGHT } from './config/gameConfig';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';
import LeaderboardScene from './scenes/LeaderboardScene';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  scale: {
    mode: Phaser.Scale.RESIZE, // Dynamically resizes to fill entire screen on mobile, desktop, tablets
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%'
  },
  render: {
    pixelArt: false,
    antialias: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, LeaderboardScene]
};

function launchGame() {
  if (!window.__MUSHAK_GAME_INSTANCE__) {
    console.log('[MushakDash] Launching Phaser Game Engine...');
    window.__MUSHAK_GAME_INSTANCE__ = new Phaser.Game(config);
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', launchGame);
} else {
  // DOM is already ready (standard with async/deferred ESM scripts)
  launchGame();
}

