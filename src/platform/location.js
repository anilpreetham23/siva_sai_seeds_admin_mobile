import { Geolocation } from '@capacitor/geolocation';
import { isNative } from './index';

export const platformLocation = {
  /**
   * Get current device GPS location
   */
  async getCurrentPosition(options = {}) {
    const geoOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout || 10000,
      maximumAge: options.maximumAge || 3000,
    };

    if (isNative) {
      try {
        const pos = await Geolocation.getCurrentPosition(geoOptions);
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          timestamp: pos.timestamp,
        };
      } catch (err) {
        console.warn('[Location] Capacitor Geolocation error:', err);
        throw new Error('Unable to retrieve location. Please ensure GPS is enabled.');
      }
    }

    // Web Fallback via navigator.geolocation
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            timestamp: pos.timestamp,
          });
        },
        (err) => {
          reject(new Error(err.message || 'Failed to get location on Web.'));
        },
        geoOptions
      );
    });
  },

  /**
   * Check permissions
   */
  async checkPermissions() {
    if (isNative) {
      return await Geolocation.checkPermissions();
    }
    return { location: 'prompt' };
  },

  /**
   * Request permissions
   */
  async requestPermissions() {
    if (isNative) {
      return await Geolocation.requestPermissions();
    }
    return { location: 'granted' };
  }
};

export default platformLocation;
