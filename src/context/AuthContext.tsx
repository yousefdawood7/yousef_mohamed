import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authStorage,
  authApi,
  patientApi,
  BackendUser,
  PatientProfileData,
} from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: BackendUser | null;
  patientProfile: PatientProfileData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  patientProfile: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<BackendUser | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const profile = await patientApi.getProfile();
      setPatientProfile(profile);
      if (profile.user) {
        setUser(profile.user);
      }
    } catch (e) {
      console.warn('[AuthContext] Could not fetch profile:', e);
    }
  };

  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        const token = await authStorage.getToken();
        const storedUser = await authStorage.getUser();
        if (token) {
          setIsAuthenticated(true);
          setUser(storedUser);
          // Fetch fresh profile in background
          refreshProfile();
        }
      } catch (e) {
        console.error('Failed checking initial auth', e);
      } finally {
        setLoading(false);
      }
    };
    checkInitialAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const authData = await authApi.login(email, password);
    setUser(authData.user);
    setIsAuthenticated(true);
    await refreshProfile();
  };

  const register = async (name: string, email: string, password: string, passwordConfirmation: string) => {
    const authData = await authApi.register(name, email, password, passwordConfirmation);
    setUser(authData.user);
    setIsAuthenticated(true);
    await refreshProfile();
  };

  const signOut = async () => {
    try {
      await authApi.logout();
    } finally {
      await authStorage.clearAuth();
      setUser(null);
      setPatientProfile(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        patientProfile,
        loading,
        login,
        register,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
