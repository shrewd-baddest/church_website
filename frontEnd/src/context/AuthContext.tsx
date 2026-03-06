import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    user: { username: string; role: 'admin' | 'user' } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<{ username: string; role: 'admin' | 'user' } | null>(null);

    useEffect(() => {
        const storedAuth = localStorage.getItem('site_auth');
        if (storedAuth) {
            const { username, role } = JSON.parse(storedAuth);
            setIsAuthenticated(true);
            setUser({ username, role });
        }
    }, []);

    const login = (username: string, password: string): boolean => {
        // Mock authentication
        if (username === 'admin' && password === 'admin') {
            setIsAuthenticated(true);
            setUser({ username: 'admin', role: 'admin' });
            localStorage.setItem('site_auth', JSON.stringify({ username: 'admin', role: 'admin' }));
            return true;
        } else if (username === 'user' && password === 'user') {
            setIsAuthenticated(true);
            setUser({ username: 'user', role: 'user' });
            localStorage.setItem('site_auth', JSON.stringify({ username: 'user', role: 'user' }));
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('site_auth');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
