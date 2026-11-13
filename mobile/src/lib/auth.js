import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { api, setAuthToken, setUnauthorizedHandler } from './api';

const TOKEN_KEY = 'safehome.token';
const USER_KEY = 'safehome.user';

// SecureStore is native-only; the web preview falls back to localStorage.
const store = Platform.OS === 'web'
  ? {
    get: async (k) => { try { return globalThis.localStorage?.getItem(k) ?? null; } catch { return null; } },
    set: async (k, v) => { try { globalThis.localStorage?.setItem(k, v); } catch { /* ignore */ } },
    del: async (k) => { try { globalThis.localStorage?.removeItem(k); } catch { /* ignore */ } },
  }
  : { get: SecureStore.getItemAsync, set: SecureStore.setItemAsync, del: SecureStore.deleteItemAsync };

const AuthContext = createContext(null);

export const ROLE_LABELS = {
  MAIN_ADMIN: 'Main Admin', BLOCK_SUB_ADMIN: 'Block Admin', RESIDENT: 'Resident',
  TECHNICIAN: 'Technician', SECURITY: 'Security', FACILITY_MANAGER: 'Facility Manager',
};

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ready: false, user: null });

  const signOut = useCallback(async () => {
    setAuthToken(null);
    await Promise.all([store.del(TOKEN_KEY), store.del(USER_KEY)]);
    setState({ ready: true, user: null });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { signOut(); });
    (async () => {
      const [token, raw] = await Promise.all([store.get(TOKEN_KEY), store.get(USER_KEY)]);
      if (!token || !raw) return setState({ ready: true, user: null });
      setAuthToken(token);
      let user = JSON.parse(raw);
      try { user = await api('/auth/me'); await store.set(USER_KEY, JSON.stringify(user)); } catch (e) { if (e.status === 401) return signOut(); }
      setState({ ready: true, user });
    })();
  }, [signOut]);

  const signIn = useCallback(async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email: email.trim(), password } });
    setAuthToken(data.token);
    await Promise.all([store.set(TOKEN_KEY, data.token), store.set(USER_KEY, JSON.stringify(data.user))]);
    setState({ ready: true, user: data.user });
    return data.user;
  }, []);

  const value = useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const can = (user, ...roles) => Boolean(user && roles.includes(user.role));
export const MANAGERS = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'];
