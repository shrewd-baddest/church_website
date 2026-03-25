import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

// Define the shape of the context data
interface AuthContextType {
  user: { user_id: number; username: string; role: string } | null;
  token: string | null;
  login: (userData: { user_id: number; username: string; role: string }, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  getAuthToken: () => string | null;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ user_id: number; username: string; role: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check for stored user/token on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      setUser(JSON.parse(storedUser));
    }
    if (storedToken && storedToken !== "undefined" && storedToken !== "null") {
      setToken(storedToken);
    }
  }, []);

  const login = (userData: { user_id: number; username: string; role: string }, authToken: string) => {
    console.log("AuthContext login called with:", userData, authToken);
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    console.log("AuthContext user state after login:", userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const getAuthToken = () => {
    return token || localStorage.getItem('token');
  };

  // Compute isAuthenticated based on user state
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        getAuthToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
