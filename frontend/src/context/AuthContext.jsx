/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import api from '../api/axios';

const CACHE_KEY = 'srv_user';

const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) } catch { return null }
};

const AuthContext = createContext();

export const AppUserProvider = ({ children }) => {
  const { isSignedIn, isLoaded, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();

  // Seed from cache so pages render instantly on subsequent loads
  const [dbUser, setDbUser] = useState(() => readCache());
  const [loading, setLoading] = useState(true);
  const interceptorRef = useRef(null);

  // Always keep latest getToken in a ref so the interceptor never closes over a stale version
  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  // One-time interceptor setup — reads token via ref on every request
  useEffect(() => {
    interceptorRef.current = api.interceptors.request.use(async (config) => {
      if (getTokenRef.current) {
        const token = await getTokenRef.current();
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return () => {
      if (interceptorRef.current !== null) {
        api.interceptors.request.eject(interceptorRef.current);
        interceptorRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      localStorage.removeItem(CACHE_KEY);
      setDbUser(null);
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => {
        setDbUser(res.data.user);
        localStorage.setItem(CACHE_KEY, JSON.stringify(res.data.user));
      })
      .catch(() => {
        // Keep cached data visible while offline/slow; don't blank the UI
      })
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn]);

  const refreshUser = () =>
    api.get('/auth/me').then((res) => {
      setDbUser(res.data.user);
      localStorage.setItem(CACHE_KEY, JSON.stringify(res.data.user));
    }).catch(() => {});

  const user = dbUser
    ? {
        ...dbUser,
        name: clerkUser?.fullName || dbUser.name,
        email: clerkUser?.primaryEmailAddress?.emailAddress || dbUser.email,
      }
    : null;

  return (
    <AuthContext.Provider value={{ user, loading: !isLoaded || loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
