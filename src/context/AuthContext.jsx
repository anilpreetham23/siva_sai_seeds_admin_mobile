import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { supabase } from '../lib/supabase';
import platformStorage from '../platform/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = platformStorage.getSync('agro_user');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount + listen for auth state changes
  useEffect(() => {
    // 1. Check for existing session on mount
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const currentUserStr = await platformStorage.getItem('agro_user');
          if (currentUserStr) {
            const parsedUser = JSON.parse(currentUserStr);
            setUser(parsedUser);
            if (parsedUser.role === 'farmer') {
              await loadFarmerProfile(parsedUser.id);
            }
          } else {
            // Session exists but no cached user — fetch from DB
            await syncUserFromAuth(session);
          }
        } else {
          // If no remote Supabase session, preserve cached local/demo session on mobile
          const currentUserStr = await platformStorage.getItem('agro_user');
          if (currentUserStr) {
            try {
              const parsedUser = JSON.parse(currentUserStr);
              setUser(parsedUser);
              if (parsedUser.role === 'farmer') {
                await loadFarmerProfile(parsedUser.id);
              }
            } catch {
              setUser(null);
              setProfile(null);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.warn('Session restore fallback:', err.message);
        try {
          const currentUserStr = await platformStorage.getItem('agro_user');
          if (currentUserStr) {
            setUser(JSON.parse(currentUserStr));
          }
        } catch (_) {}
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase Auth State Change:', event);
      if (event === 'SIGNED_OUT') {
        await platformStorage.removeItem('agro_token');
        await platformStorage.removeItem('agro_user');
        setUser(null);
        setProfile(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          await platformStorage.setItem('agro_token', session.access_token);
          // If we don't have user in state, fetch from database
          const currentUserStr = await platformStorage.getItem('agro_user');
          if (!currentUserStr) {
            await syncUserFromAuth(session);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync user data from auth session to local state
  // Uses profiles as source of truth for role, status, and identity
  const syncUserFromAuth = async (session) => {
    try {
      const { data: userData, error: dbError } = await supabase.functions.invoke('auth-api', {
        body: { action: 'getUserData', payload: { authUserId: session.user.id } }
      });

      if (dbError || userData?.error || !userData?.success) {
        console.error('syncUserFromAuth failed:', dbError || userData?.error);
        return;
      }

      const dbUser = userData.dbUser;
      const authProfile = userData.profile;
      const farmerProfile = userData.farmerProfile;

      // Build the cached user from profile (source of truth) + dbUser for business FK
      const cachedUser = {
        id: dbUser?.id ?? authProfile?.app_user_id ?? null,
        uuid: authProfile?.id || dbUser?.uuid,
        name: authProfile?.name || dbUser?.name,
        email: authProfile?.email || dbUser?.email,
        phone: authProfile?.phone || dbUser?.phone,
        role: authProfile?.role || dbUser?.role,
        status: authProfile?.status || dbUser?.status || 'active',
        first_login: authProfile?.first_login ?? dbUser?.first_login ?? false
      };

      await platformStorage.setItem('agro_user', JSON.stringify(cachedUser));
      setUser(cachedUser);

      if (farmerProfile) {
        setProfile(farmerProfile);
      } else if (cachedUser.role === 'farmer' && cachedUser.id) {
        await loadFarmerProfile(cachedUser.id);
      }
    } catch (err) {
      console.error('Failed to sync auth session with public user details:', err);
    }
  };

  // Load farmer profile from Supabase directly
  const loadFarmerProfile = async (userId) => {
    if (!userId) return; // Guard against null app_user_id
    try {
      const { data: pData } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      setProfile(pData);
    } catch (err) {
      console.error('Error loading farmer profile:', err);
    }
  };

  // Fetch farmer profile on initial load if user is a farmer
  useEffect(() => {
    if (user?.role === 'farmer' && !profile) {
      loadFarmerProfile(user.id);
    }
  }, [user]);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const data = await authService.login(identifier, password);
      setUser(data.user);
      setProfile(data.profile);
      return data;
    } finally { setLoading(false); }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user?.role === 'farmer') {
      await loadFarmerProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile, setUser, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
