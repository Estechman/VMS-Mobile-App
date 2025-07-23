angular.module('zmApp.controllers')
  .service('PlatformService', ['$rootScope', function($rootScope) {
    
    var isCapacitorAvailable = function() {
      return window.Capacitor && window.Capacitor.isNativePlatform();
    };
    
    var getPlatformInfo = function() {
      if (isCapacitorAvailable()) {
        return window.Capacitor.getPlatform();
      } else {
        return $rootScope.platformOS;
      }
    };
    
    var isIOS = function() {
      return getPlatformInfo() === 'ios';
    };
    
    var isAndroid = function() {
      return getPlatformInfo() === 'android';
    };
    
    var isDesktop = function() {
      return getPlatformInfo() === 'desktop' || getPlatformInfo() === 'web';
    };
    
    var isMobile = function() {
      return isIOS() || isAndroid();
    };
    
    return {
      isCapacitorAvailable: isCapacitorAvailable,
      getPlatformInfo: getPlatformInfo,
      isIOS: isIOS,
      isAndroid: isAndroid,
      isDesktop: isDesktop,
      isMobile: isMobile
    };
  }]);
