import { createContext, useContext, useState, useEffect } from 'react';
import { User, Wallet } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  login: (user: User, wallet: Wallet) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on app start
    const savedUser = localStorage.getItem('ghc_user');
    const savedWallet = localStorage.getItem('ghc_wallet');
    
    if (savedUser && savedWallet) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const parsedWallet = JSON.parse(savedWallet);
        setUser(parsedUser);
        setWallet(parsedWallet);
        
        // Set role-based body class
        document.body.className = `bg-background text-foreground role-${parsedUser.role}`;
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
        localStorage.removeItem('ghc_user');
        localStorage.removeItem('ghc_wallet');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (user: User, wallet: Wallet) => {
    // Update state synchronously
    setUser(user);
    setWallet(wallet);
    
    // Store in localStorage
    localStorage.setItem('ghc_user', JSON.stringify(user));
    localStorage.setItem('ghc_wallet', JSON.stringify(wallet));
    
    // Set role-based body class
    document.body.className = `bg-background text-foreground role-${user.role}`;
    
    console.log('Auth state updated:', { user: user.username, role: user.role, isAuthenticated: true });
  };

  const logout = () => {
    setUser(null);
    setWallet(null);
    localStorage.removeItem('ghc_user');
    localStorage.removeItem('ghc_wallet');
    
    // Reset body class
    document.body.className = 'bg-background text-foreground';
  };

  return (
    <AuthContext.Provider value={{
      user,
      wallet,
      login,
      logout,
      isAuthenticated: !!user,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
