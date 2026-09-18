import { Network } from '@capacitor/network';
import { isNative } from './index';

export const platformNetwork = {
  /**
   * Get current network connection status
   */
  async getStatus() {
    if (isNative) {
      try {
        const status = await Network.getStatus();
        return {
          connected: status.connected,
          connectionType: status.connectionType, // 'wifi' | 'cellular' | 'none' | 'unknown'
        };
      } catch (err) {
        console.warn('[Network] Network.getStatus error:', err);
      }
    }

    return {
      connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
      connectionType: 'unknown',
    };
  },

  /**
   * Listen for connectivity changes
   */
  addListener(callback) {
    if (isNative) {
      const listenerPromise = Network.addListener('networkStatusChange', (status) => {
        callback({
          connected: status.connected,
          connectionType: status.connectionType,
        });
      });

      return () => {
        listenerPromise.then((handle) => handle.remove()).catch(() => {});
      };
    }

    // Web Fallback
    const handleOnline = () => callback({ connected: true, connectionType: 'online' });
    const handleOffline = () => callback({ connected: false, connectionType: 'none' });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
};

export default platformNetwork;
