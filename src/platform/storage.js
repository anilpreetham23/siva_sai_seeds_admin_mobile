import { Preferences } from '@capacitor/preferences';
import { isNative } from './index';

// In-memory cache for ultra-fast synchronous access during React renders
const memoryCache = new Map();

// Prime cache on startup from web storage if available
if (typeof window !== 'undefined') {
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k) memoryCache.set(k, sessionStorage.getItem(k));
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !memoryCache.has(k)) memoryCache.set(k, localStorage.getItem(k));
    }
  } catch (e) {
    // Ignore sandbox errors
  }
}

export const platformStorage = {
  /**
   * Synchronous getter for React state initialization
   */
  getSync(key) {
    if (memoryCache.has(key)) return memoryCache.get(key);
    try {
      return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
    } catch {
      return null;
    }
  },

  /**
   * Asynchronous get — reads from Capacitor Preferences on mobile, web storage on web
   */
  async getItem(key) {
    if (isNative) {
      try {
        const { value } = await Preferences.get({ key });
        if (value !== null) {
          memoryCache.set(key, value);
          return value;
        }
      } catch (err) {
        console.warn('[Storage] Preferences.get error, using fallback:', err);
      }
    }
    const val = platformStorage.getSync(key);
    return val;
  },

  /**
   * Asynchronous set — writes to Preferences on mobile and web storage on web
   */
  async setItem(key, value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    memoryCache.set(key, stringValue);

    // Write to web storage for compatibility
    try {
      sessionStorage.setItem(key, stringValue);
      localStorage.setItem(key, stringValue);
    } catch {
      // quota or private mode
    }

    if (isNative) {
      try {
        await Preferences.set({ key, value: stringValue });
      } catch (err) {
        console.warn('[Storage] Preferences.set error:', err);
      }
    }
  },

  /**
   * Asynchronous remove
   */
  async removeItem(key) {
    memoryCache.delete(key);
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {}

    if (isNative) {
      try {
        await Preferences.remove({ key });
      } catch (err) {
        console.warn('[Storage] Preferences.remove error:', err);
      }
    }
  },

  /**
   * Clear all stored platform data
   */
  async clear() {
    memoryCache.clear();
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {}

    if (isNative) {
      try {
        await Preferences.clear();
      } catch (err) {
        console.warn('[Storage] Preferences.clear error:', err);
      }
    }
  }
};

export default platformStorage;
