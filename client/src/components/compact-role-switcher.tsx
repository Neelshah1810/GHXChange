import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, AlertTriangle, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

interface CompactRoleSwitcherProps {
  currentRole: string;
  walletAddress: string;
  balance: number;
  onRoleSwitch?: (newRole: string) => void;
}

export function CompactRoleSwitcher({ 
  currentRole, 
  walletAddress, 
  balance, 
  onRoleSwitch 
}: CompactRoleSwitcherProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: userRoles = [] } = useQuery({
    queryKey: ['/api/users/roles', walletAddress],
    queryFn: () => api.user.getRoles(walletAddress)
  });

  const switchRole = useMutation({
    mutationFn: (newRole: 'buyer' | 'producer') => 
      api.user.switchRole({ walletAddress, newRole }),
    onSuccess: (response) => {
      toast({
        title: 'Role Switch Successful',
        description: response.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/roles'] });
      if (onRoleSwitch) {
        onRoleSwitch(response.newRole);
      }
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Role Switch Failed',
        description: error.message || 'Failed to switch role. Please try again.'
      });
    }
  });

  const handleRoleSwitch = async (newRole: 'buyer' | 'producer') => {
    setIsLoading(true);
    try {
      await switchRole.mutateAsync(newRole);
    } finally {
      setIsLoading(false);
    }
  };

  const canBecomeProducer = balance >= 1000;
  const availableRoles = (['buyer', 'producer'] as const).filter(role => role !== currentRole);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="capitalize">{currentRole}</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Current Role */}
        <DropdownMenuItem disabled className="opacity-70">
          <Check className="w-4 h-4 mr-2 text-green-500" />
          <span className="capitalize">{currentRole} (Current)</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Available Roles */}
        {availableRoles.map((role) => {
          const isProducerRole = role === 'producer';
          const canSwitch = !isProducerRole || canBecomeProducer;
          
          return (
            <div key={role}>
              <DropdownMenuItem
                onClick={() => canSwitch && handleRoleSwitch(role)}
                disabled={!canSwitch || isLoading}
                className={`cursor-pointer ${!canSwitch ? 'opacity-50' : ''}`}
              >
                {isProducerRole && !canBecomeProducer ? (
                  <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                ) : (
                  <User className="w-4 h-4 mr-2" />
                )}
                <span className="capitalize">
                  {isLoading ? 'Switching...' : `Switch to ${role}`}
                </span>
              </DropdownMenuItem>
              
              {/* Show requirement alert for producer role */}
              {isProducerRole && !canBecomeProducer && (
                <div className="px-2 py-1">
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-xs text-yellow-700">
                      Need 1000+ GHC credits (Current: {balance})
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          );
        })}
        
        {/* User Roles Info */}
        {userRoles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <div className="text-xs text-muted-foreground mb-1">Your Roles:</div>
              <div className="flex flex-wrap gap-1">
                {userRoles.map((role: any) => (
                  <span
                    key={role.id}
                    className={`px-2 py-1 rounded text-xs ${
                      role.isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {role.role}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
