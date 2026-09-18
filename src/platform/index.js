import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';

/**
 * Platform Detection Utilities
 */
export const isNative = Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
export const isAndroid = getPlatform() === 'android';
export const isIOS = getPlatform() === 'ios';
export const isWeb = !isNative;

/**
 * Initialize Native Platform capabilities safely
 */
export async function initPlatform() {
  if (!isNative) return;

  try {
    // 1. Status bar configuration
    await StatusBar.setStyle({ style: Style.Dark });
    if (isAndroid) {
      await StatusBar.setBackgroundColor({ color: '#15302A' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (err) {
    console.warn('[Platform] StatusBar init warning:', err);
  }

  try {
    // 2. Hide splash screen smoothly after app is ready
    await SplashScreen.hide({ fadeOutDuration: 400 });
  } catch (err) {
    console.warn('[Platform] SplashScreen hide warning:', err);
  }
}

/**
 * Register hardware back button listener for Android
 */
export function registerBackButtonListener(navigate, currentPath) {
  if (!isNative) return () => {};

  const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
    const rootPaths = ['/', '/login', '/farmer', '/farmer/profile', '/manager/dashboard', '/admin/dashboard'];
    const isAtRoot = rootPaths.includes(window.location.pathname);

    if (isAtRoot || !canGoBack) {
      CapApp.exitApp();
    } else {
      navigate(-1);
    }
  });

  return () => {
    listener.then(handle => handle.remove()).catch(() => {});
  };
}

/**
 * Register deep link listener for native app
 */
export function registerDeepLinkListener(navigate) {
  if (!isNative) return () => {};

  const listener = CapApp.addListener('appUrlOpen', (data) => {
    try {
      const url = new URL(data.url);
      // Example: srisivasaiseeds://farmer/crops -> path = /farmer/crops
      const path = url.pathname || url.host;
      const search = url.search || '';
      const fullTarget = (path.startsWith('/') ? path : '/' + path) + search;
      if (fullTarget) {
        navigate(fullTarget);
      }
    } catch (err) {
      console.warn('[Platform] Deep link parsing error:', err, data.url);
    }
  });

  return () => {
    listener.then(handle => handle.remove()).catch(() => {});
  };
}
