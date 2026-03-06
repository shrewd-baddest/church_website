import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

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
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ user_id: number; username: string; role: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);


   
  useEffect(() => {
    // // On initial load, check if user info is in localStorage
    // const storedUser = localStorage.getItem('user');
    // const storedToken = localStorage.getItem('token');
    // if (storedUser == " " || storedUser == "undefined"   &&  storedToken == " " || storedToken == "undefined" ) {
    //   setUser(JSON.parse(storedUser));
    //   setToken(storedToken);
    // }
  }, []);

  const login = (userData: { user_id: number; username: string; role: string }, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
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

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        isAuthenticated: !!user && !!token,
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
