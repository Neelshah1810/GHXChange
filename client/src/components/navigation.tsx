import { Leaf, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CompactRoleSwitcher } from "@/components/compact-role-switcher";

interface NavigationProps {
  role: 'producer' | 'buyer' | 'auditor';
  currentSection?: string;
}

export function Navigation({ role, currentSection = 'dashboard' }: NavigationProps) {
  const { user, wallet, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Get current balance for role switching (only needed for buyers and producers)
  const { data: balance } = useQuery({
    queryKey: ['/api/balance', wallet?.address],
    enabled: !!wallet?.address && role !== 'auditor',
    queryFn: () => api.wallet.getBalance(wallet!.address),
    refetchInterval: 5000
  });

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const getNavItems = () => {
    switch (role) {
      case 'producer':
        return [
          { label: 'Dashboard', route: '/producer/dashboard', section: 'dashboard' },
          { label: 'Production', route: '/producer/production', section: 'production' },
          { label: 'Certificates', route: '/producer/certificates', section: 'certificates' }
        ];
      case 'buyer':
        return [
          { label: 'Dashboard', route: '/buyer/dashboard', section: 'dashboard' },
          { label: 'Marketplace', route: '/buyer/marketplace', section: 'marketplace' },
          { label: 'Compliance', route: '/buyer/compliance', section: 'compliance' }
        ];
      case 'auditor':
        return [
          { label: 'Dashboard', route: '/auditor', section: 'dashboard' },
          { label: 'Verification', route: '/auditor/verification', section: 'verification' },
          { label: 'Reports', route: '/auditor/reports', section: 'reports' }
        ];
      default:
        return [];
    }
  };

  return (
    <nav className="bg-card border-b border-border" data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLocation('/')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground" data-testid="app-title">
                GHC System
              </span>
            </button>
            <div className="hidden md:flex space-x-1">
              {getNavItems().map((item, index) => (
                <button
                  key={index}
                  onClick={() => setLocation(item.route)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentSection === item.section
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground" data-testid="user-name">
              {user?.name}
            </span>
            {/* Show current role for auditors since they can't switch */}
            {role === 'auditor' && (
              <span className="text-sm text-muted-foreground capitalize bg-muted px-3 py-1 rounded-md" data-testid="user-role">
                {role}
              </span>
            )}
            {/* Role switcher only for buyers and producers */}
            {wallet && role !== 'auditor' && (
              <CompactRoleSwitcher
                currentRole={role}
                walletAddress={wallet.address}
                balance={balance?.balance || wallet?.balance || 0}
                onRoleSwitch={(newRole) => {
                  // Navigate to the appropriate dashboard based on the new role
                  if (newRole === 'producer') {
                    setLocation('/producer/dashboard');
                  } else if (newRole === 'buyer') {
                    setLocation('/buyer/dashboard');
                  }
                }}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
