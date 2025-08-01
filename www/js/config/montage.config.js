window.zmMontageConfig = {
  STREAM_MODES: ['jpeg', 'mpeg', 'single'],
  MAX_RETRIES: 5,
  RETRY_DELAY: 1000,
  
  RESIZE_THROTTLE_MS: 200,
  MAX_CACHED_MONITORS: 20,
  
  DEFAULT_TILE_SIZE: 50,
  MIN_TILE_SIZE: 20,
  MAX_TILE_SIZE: 100,
  
  MJPEG_FETCH_ENABLED: true,
  GPU_ACCELERATION: true,
  EXPONENTIAL_BACKOFF: true,
  
  FPS_OPTIMIZATION_ENABLED: true,
  SNAPSHOT_FALLBACK_ENABLED: true,
  SNAPSHOT_RETRY_DELAY: 30000,
  MAX_EXPONENTIAL_BACKOFF: 30000
};

if (!window.AppConfig) window.AppConfig = {};
window.AppConfig.montage = window.zmMontageConfig;
