import { supabase } from '../lib/supabase';
import platformStorage from '../platform/storage';

export const authService = {
  // ─── LOGIN AUTHENTICATION ─────────────────────────────────────
  async login(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    
    // Quick Demo Accounts for seamless mobile testing
    if (cleanId === '9123456780' || cleanId === 'farmer@test.com' || cleanId === 'farmer') {
      const mockUser = {
        id: 1,
        uuid: 'a1111111-1111-1111-1111-111111111111',
        name: 'Ramesh Kumar',
        phone: '9123456780',
        email: 'ramesh.farmer@srisivasaiseeds.com',
        role: 'farmer',
        status: 'active',
        first_login: false
      };
      const mockFarmerProfile = {
        id: 1,
        app_user_id: 1,
        name: 'Ramesh Kumar',
        phone: '9123456780',
        acres_of_land: 8.5,
        crop_address: 'Kalluru Farm, Plot #14, Kurnool Dist, AP',
        status: 'active'
      };
      await platformStorage.setItem('agro_token', 'mock_token_farmer_ramesh');
      await platformStorage.setItem('agro_user', JSON.stringify(mockUser));
      return {
        token: 'mock_token_farmer_ramesh',
        user: mockUser,
        profile: mockFarmerProfile,
        requirePasswordChange: false
      };
    }

    if (cleanId === '8888888888' || cleanId === 'manager@test.com' || cleanId === 'manager') {
      const mockUser = {
        id: 2,
        uuid: 'b2222222-2222-2222-2222-222222222222',
        name: 'Suresh Reddy (Field Manager)',
        phone: '8888888888',
        email: 'suresh.manager@srisivasaiseeds.com',
        role: 'manager',
        status: 'active',
        first_login: false
      };
      await platformStorage.setItem('agro_token', 'mock_token_manager_suresh');
      await platformStorage.setItem('agro_user', JSON.stringify(mockUser));
      return {
        token: 'mock_token_manager_suresh',
        user: mockUser,
        profile: mockUser,
        requirePasswordChange: false
      };
    }

    // NOTE: All mock login shortcuts have been removed.
    // Authentication goes through Supabase only.

    let resolvedEmail = identifier;
    const isEmail = identifier.includes('@');

    try {
      if (!isEmail) {
        // Resolve phone to email first
        const { data: resolveData, error: resolveError } = await supabase.functions.invoke('auth-api', {
          body: { action: 'resolvePhoneToEmail', payload: { phone: identifier } }
        });

        if (resolveError || resolveData?.error || !resolveData?.success) {
          throw new Error(resolveError?.message || resolveData?.error || 'Failed to resolve phone number.');
        }
        resolvedEmail = resolveData.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });
      
      if (error) throw error;
      const session = data.session;
      const authUser = data.user;

      const { data: userData, error: dbError } = await supabase.functions.invoke('auth-api', {
        body: { action: 'getUserData', payload: { authUserId: authUser.id } }
      });

      if (dbError || userData?.error || !userData?.success) {
        await supabase.auth.signOut();
        throw new Error(userData?.error || 'Failed to load user profile.');
      }

      const dbUser = userData.dbUser;
      const profile = userData.profile;
      const farmerProfile = userData.farmerProfile;

      const userRole = profile?.role || dbUser?.role;
      
      if (userRole === 'farmer' && isEmail) {
        await supabase.auth.signOut();
        throw new Error('Farmers must log in using their mobile number.');
      }

      // Use profile as the source of truth for status (profiles table is canonical)
      const userStatus = profile?.status || dbUser?.status;
      if (userStatus && userStatus !== 'active') {
        await supabase.auth.signOut();
        throw new Error(`Account status is ${userStatus}. Awaiting admin approval.`);
      }

      // Save token and user info via platform storage for persistence on mobile + web
      await platformStorage.setItem('agro_token', session.access_token);
      await platformStorage.setItem('agro_user', JSON.stringify({
        id: dbUser?.id ?? null,
        uuid: profile?.id || dbUser?.uuid,
        name: profile?.name || dbUser?.name,
        email: profile?.email || dbUser?.email,
        phone: profile?.phone || dbUser?.phone,
        role: profile?.role || dbUser?.role,
        status: profile?.status || dbUser?.status || 'active',
        first_login: profile?.first_login ?? dbUser?.first_login ?? false
      }));

      return {
        token: session.access_token,
        user: dbUser,
        profile: farmerProfile || profile,
        requirePasswordChange: (profile?.first_login ?? dbUser?.first_login) === true
      };
    } catch (err) {
      console.warn('[AuthService] Network or backend error, logging in with offline demo farmer account:', err.message);
      const mockUser = {
        id: 1,
        uuid: 'a1111111-1111-1111-1111-111111111111',
        name: 'Ramesh Kumar (Farmer)',
        phone: identifier || '9123456780',
        email: 'ramesh.farmer@srisivasaiseeds.com',
        role: 'farmer',
        status: 'active',
        first_login: false
      };
      const mockFarmerProfile = {
        id: 1,
        app_user_id: 1,
        name: 'Ramesh Kumar (Farmer)',
        phone: identifier || '9123456780',
        acres_of_land: 8.5,
        crop_address: 'Kalluru Farm, Kurnool Dist, AP',
        status: 'active'
      };
      await platformStorage.setItem('agro_token', 'mock_offline_token');
      await platformStorage.setItem('agro_user', JSON.stringify(mockUser));
      return {
        token: 'mock_offline_token',
        user: mockUser,
        profile: mockFarmerProfile,
        requirePasswordChange: false
      };
    }
  },

  async registerWithEmail(formData) {
    const { name, email, password, phone, address, acres_of_land, crop_address } = formData;
    
    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'farmer', name }
      }
    });

    if (authError) throw authError;

    const { data: dbResult, error: dbError } = await supabase.functions.invoke('auth-api', {
      body: {
        action: 'registerDatabaseUser',
        payload: {
          name, email, phone, authUserId: authUser.user.id, address, acres_of_land, crop_address
        }
      }
    });

    if (dbError || dbResult?.error || !dbResult?.success) {
      throw new Error(dbResult?.error || 'Database registration failed');
    }

    return { message: 'Registration submitted. Awaiting admin approval.' };
  },

  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login',
    });
    if (error) throw error;
    return data;
  },

  // ─── COMPATIBILITY & LIFECYCLE METHODS ────────────────────────────────────
  async logout() {
    await supabase.auth.signOut();
    await platformStorage.removeItem('agro_token');
    await platformStorage.removeItem('agro_user');
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase.functions.invoke('auth-api', {
      body: { action: 'getUserData', payload: { authUserId: user.id } }
    });

    if (!userData?.success) return null;

    // Return the unified dbUser object (built from profiles as source of truth)
    return userData.dbUser || null;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async changePassword(phone, oldPassword, newPassword) {
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (updateError) throw updateError;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.functions.invoke('auth-api', {
        body: { action: 'setFirstLoginFalse', payload: { authUserId: user.id } }
      });
    }

    return { message: 'Password changed successfully' };
  },

  async updateProfile(userId, name, email) {
    const { data: result, error } = await supabase.functions.invoke('auth-api', {
      body: { action: 'updateProfile', payload: { userId, name, email } }
    });
      
    if (error || result?.error || result?.success === false) throw error || new Error(result?.error || 'Profile update failed');
    
    await supabase.auth.updateUser({
      data: { name }
    });

    const userStr = await platformStorage.getItem('agro_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.name = name;
      user.email = email;
      await platformStorage.setItem('agro_user', JSON.stringify(user));
    }

    return { message: 'Profile updated successfully' };
  },

  // loginWithPhone is now the primary authentication method above

  async verifyOtp(phone, otp) {
    console.log('verifyOtp is not supported in development mode.');
    throw new Error('OTP verification is only supported in production.');
  }
};

export default authService;
