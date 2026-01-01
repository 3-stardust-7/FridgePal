import { supabase } from '../config/supabase';

/**
 * Authentication Service for FridgePal
 */
export const authService = {
  /**
   * Sign up with email and password
   */
  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in with OAuth provider (Google, Apple, etc.)
   */
  signInWithProvider: async provider => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'fridgepal://auth/callback',
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign out
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  /**
   * Reset password
   */
  resetPassword: async email => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'fridgepal://auth/reset-password',
    });

    if (error) throw error;
    return data;
  },

  /**
   * Update password
   */
  updatePassword: async newPassword => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange: callback => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};

export default authService;
