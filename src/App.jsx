import './index.css';
import './index';
import { useEffect } from 'react';
import { BrowserRouter, HashRouter, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './app/router/AppRouter';
import ScrollToTop from './components/shared/ScrollToTop';
import { initPlatform, registerBackButtonListener, registerDeepLinkListener, isNative } from './platform/index';
import platformNetwork from './platform/network';
import ErrorBoundary from './components/shared/ErrorBoundary';

function NativeBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Initialize native status bar and hide splash screen
    initPlatform();

    // 2. Register native deep link routing (srisivasaiseeds://)
    const cleanupDeepLink = registerDeepLinkListener(navigate);

    // 3. Register network status listener
    const cleanupNetwork = platformNetwork.addListener((status) => {
      if (!status.connected) {
        toast.error('No internet connection. Working in offline preview mode.', {
          id: 'network-status',
          duration: 5000,
        });
      } else {
        toast.success('Connected to network.', {
          id: 'network-status',
          duration: 3000,
        });
      }
    });

    return () => {
      cleanupDeepLink();
      cleanupNetwork();
    };
  }, [navigate]);

  // 4. Register hardware back button listener responding to route changes
  useEffect(() => {
    const cleanupBack = registerBackButtonListener(navigate, location.pathname);
    return () => cleanupBack();
  }, [navigate, location.pathname]);

  return null;
}

export default function App() {
  const RouterComponent = isNative ? HashRouter : BrowserRouter;

  return (
    <RouterComponent>
      <NativeBridge />
      <AuthProvider>
        <ScrollToTop />
        <Toaster position="top-right" toastOptions={{ duration: 3500,
          style: { borderRadius: '12px', padding: '14px 18px', fontSize: '14px', fontWeight: 500 },
          success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
          error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }} />
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </AuthProvider>
    </RouterComponent>
  );
}
