import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

interface RoleSwitcherProps {
  currentRole: string;
  walletAddress: string;
  balance: number;
  onRoleSwitch?: (newRole: string) => void;
}

export function RoleSwitcher({ currentRole, walletAddress, balance, onRoleSwitch }: RoleSwitcherProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: userRoles = [] } = useQuery({
    queryKey: ['/api/users/roles', walletAddress],
    queryFn: () => api.user.getRoles(walletAddress)
  });

  const switchRole = useMutation({
    mutationFn: (newRole: string) => 
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

  const handleRoleSwitch = async (newRole: string) => {
    setIsLoading(true);
    try {
      await switchRole.mutateAsync(newRole);
    } finally {
      setIsLoading(false);
    }
  };

  const canBecomeProducer = balance >= 1000; // Minimum balance requirement

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Switch Role
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentRole === 'buyer' && (
            <>
              <Alert className={canBecomeProducer ? 'bg-green-50' : 'bg-yellow-50'}>
                <div className="flex items-center gap-2">
                  {canBecomeProducer ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  <AlertTitle>
                    {canBecomeProducer
                      ? 'You can become a producer!'
                      : 'Insufficient balance to become producer'}
                  </AlertTitle>
                </div>
                <AlertDescription>
                  {canBecomeProducer
                    ? 'You have enough GHC credits to become a producer.'
                    : `You need at least 1000 GHC credits to become a producer. Current balance: ${balance} GHC`}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => handleRoleSwitch('producer')}
                disabled={!canBecomeProducer || isLoading}
                className="w-full"
              >
                {isLoading ? 'Switching...' : 'Switch to Producer'}
              </Button>
            </>
          )}

          {currentRole === 'producer' && (
            <>
              <Alert>
                <AlertTitle>Switch to Buyer Role</AlertTitle>
                <AlertDescription>
                  You can switch to buyer role while maintaining your GHC credits.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => handleRoleSwitch('buyer')}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Switching...' : 'Switch to Buyer'}
              </Button>
            </>
          )}

          {userRoles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Your Roles:</h4>
              <div className="flex gap-2">
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
