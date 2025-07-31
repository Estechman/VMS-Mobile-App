window.zmMontageConfig = {
  STREAM_MODES: ['jpeg', 'mpeg', 'single'],
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,
  
  RESIZE_THROTTLE_MS: 200,
  MAX_CACHED_MONITORS: 20,
  
  DEFAULT_TILE_SIZE: 50,
  MIN_TILE_SIZE: 20,
  MAX_TILE_SIZE: 100
};

if (!window.AppConfig) window.AppConfig = {};
window.AppConfig.montage = window.zmMontageConfig;
