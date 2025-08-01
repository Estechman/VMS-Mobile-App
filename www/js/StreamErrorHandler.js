angular.module('zmApp.controllers')
  .factory('StreamErrorHandler', ['NVR', 'MontageStream', '$translate', '$ionicLoading', function(NVR, MontageStream, $translate, $ionicLoading) {
    
    var handle = function(error, context) {
      $ionicLoading.hide();
      
      NVR.debug("StreamErrorHandler: Processing error:", JSON.stringify(error));
      
      if (error.type === 'mjpeg' || error.target && error.target.tagName === 'IMG') {
        if (typeof MontageStream !== 'undefined' && MontageStream.regenerateKey) {
          MontageStream.regenerateKey();
          return 'RETRYING';
        }
        return 'MJPEG_ERROR';
      } else if (error.code === 4 || error.target && error.target.error && error.target.error.code === 4) {
        return 'UNSUPPORTED_FORMAT';
      } else if (error.type === 'network' || error.code === 'NETWORK_ERROR') {
        return 'NETWORK_ERROR';
      }
      
      return 'UNKNOWN_ERROR';
    };
    
    return {
      handle: handle
    };
  }]);
