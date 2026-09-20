// 16:9 Landscape / Full Responsive Game Configuration
export const BASE_WIDTH = 1280;
export const BASE_HEIGHT = 720;

// 3 horizontal running lanes (Top, Middle, Bottom tracks on the festive street road surface)
export const LANES_Y = [
  BASE_HEIGHT * 0.74, // Lane 0 (Upper Track on the road pavement)
  BASE_HEIGHT * 0.83, // Lane 1 (Middle Track on the road pavement)
  BASE_HEIGHT * 0.92  // Lane 2 (Lower Track on the road pavement)
];

export const PLAYER_CONFIG = {
  startX: BASE_WIDTH * 0.18,
  laneSwitchDuration: 130, // ms for vertical lane transition
  jumpDuration: 620,       // jump airtime in ms
  jumpHeight: 175,         // jump apex height in px
  scale: 0.76              // 2x bigger Mushak character
};

export const SPEED_CONFIG = {
  initialScrollSpeed: 460, // px per second scrolling right-to-left
  maxScrollSpeed: 1050,
  acceleration: 8.5        // speed increase per second
};

export const SPAWN_CONFIG = {
  initialSpawnInterval: 1400, // ms between obstacle/item waves
  minSpawnInterval: 700,
  blessingDuration: 8500,     // 8.5 seconds
  magnetRadius: 400           // attraction range
};

export const SCORES = {
  MODAK: 10,
  FLOWER: 25,
  DURVA: 10,
  DISTANCE_PER_SECOND: 25
};

export const STORAGE_KEYS = {
  HIGH_SCORE: 'mushak_dash_high_score',
  MODAK_COUNT: 'mushak_dash_total_modaks'
};
