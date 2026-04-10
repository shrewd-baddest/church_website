import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import {  LocalStorage } from '../utils';

// Define the shape of User Data arriving from API and stored in localStorage
interface UserData {
  accessToken: string;
  refreshToken: string;
  role: string;
  name: string; // Combined firstName and lastName as per backend change
  email: string;
  status: string; // e.g. "success"
  jumuiya_id: number;
}

interface AuthContextType {
  user: UserData | null;
  login: (data: UserData) => void;
  logout: () => void;
  register: () => void;
  isAuthenticated: boolean;
}

// Create the context with defaults
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  register: () => {},
  isAuthenticated: false,
});

// Create the provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);

  // Check for stored user on initial load
  useEffect(() => {
    const storedData = LocalStorage.get('userdata');
    if (storedData) {
      try {
        const parsedData =  LocalStorage.get('userdata');
        if (parsedData && parsedData.status === 'success') {
          setUser(parsedData);
        }
      } catch (error) {
        console.error("Error parsing userdata from localStorage", error);
        localStorage.removeItem('userdata');
      }
    }
  }, []);

  const login = (data: UserData) => {
      setUser(data);
      LocalStorage.set('userdata', JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    LocalStorage.remove('userdata');
  };

  const register = () => {};

  // Compute isAuthenticated based on user status
  const isAuthenticated = !!user && user.status === 'success';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};