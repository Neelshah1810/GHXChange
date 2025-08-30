import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Coins, FlaskConical, Award, DollarSign } from "lucide-react";
import { RoleSwitcher } from "@/components/role-switcher";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/stats-card";
import { TransactionTable } from "@/components/transaction-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { issueCreditsSchema, type IssueCreditsData } from "@shared/schema";

export default function ProducerDashboard() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    } else if (!isLoading && isAuthenticated && user?.role !== 'producer') {
      setLocation('/login');
    }
  }, [isAuthenticated, user, setLocation, isLoading]);

  const form = useForm<IssueCreditsData>({
    resolver: zodResolver(issueCreditsSchema),
    defaultValues: {
      hydrogenKg: undefined,
      energySource: "",
      location: ""
    }
  });

  // Queries
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', wallet?.address],
    enabled: !!wallet?.address,
    queryFn: () => api.transactions.getByAddress(wallet!.address)
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['/api/certificates', wallet?.address],
    enabled: !!wallet?.address,
    queryFn: () => api.certificates.getByProducer(wallet!.address)
  });

  const { data: balance } = useQuery({
    queryKey: ['/api/balance', wallet?.address],
    enabled: !!wallet?.address,
    queryFn: () => api.wallet.getBalance(wallet!.address),
    refetchInterval: 5000
  });

  // Mutations
  const issueCredits = useMutation({
    mutationFn: (data: IssueCreditsData) => 
      api.credits.issue({ ...data, producerAddress: wallet!.address }),
    onSuccess: (response) => {
      toast({
        title: "Credits Issued Successfully",
        description: response.message
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to Issue Credits",
        description: "Please try again later."
      });
    }
  });

  const onSubmit = (data: IssueCreditsData) => {
    issueCredits.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'producer') {
    return null;
  }

  const totalProduced = certificates.reduce((sum: number, cert: any) => sum + cert.hydrogenKg, 0);
  const revenue = (balance?.balance || 0) * 415; // ₹415 per GHC

  return (
    <div className="min-h-screen bg-background role-producer">
      <Navigation role="producer" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="dashboard-title">
            Producer Dashboard
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="dashboard-subtitle">
            Manage your green hydrogen production and credits
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Credits"
            value={`${balance?.balance || wallet?.balance || 0} GHC`}
            icon={Coins}
            iconColor="bg-primary/10 text-primary"
            change="+12% from last month"
            changeType="positive"
          />
          <StatsCard
            title="H₂ Produced"
            value={`${totalProduced} kg`}
            icon={FlaskConical}
            iconColor="bg-blue-500/10 text-blue-500"
            change="+8% from last month"
            changeType="positive"
          />
          <StatsCard
            title="Certificates"
            value={certificates.length}
            icon={Award}
            iconColor="bg-purple-500/10 text-purple-500"
            subtitle="Valid certificates"
          />
          <StatsCard
            title="Revenue"
            value={`₹${revenue.toLocaleString()}`}
            icon={DollarSign}
            iconColor="bg-green-500/10 text-green-500"
            change="+15% from last month"
            changeType="positive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Issue Credits Form */}
          <div className="lg:col-span-1">
            <Card data-testid="issue-credits-form">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Issue New Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="hydrogenKg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hydrogen Produced (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="Enter hydrogen amount"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === '' ? undefined : Number(value));
                              }}
                              data-testid="input-hydrogen-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="energySource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Energy Source</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-energy-source">
                                <SelectValue placeholder="Select energy source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Solar PV">Solar PV</SelectItem>
                              <SelectItem value="Wind">Wind</SelectItem>
                              <SelectItem value="Hydroelectric">Hydroelectric</SelectItem>
                              <SelectItem value="Geothermal">Geothermal</SelectItem>
                              <SelectItem value="Green Grid">Green Grid</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Production facility location"
                              {...field}
                              data-testid="input-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={issueCredits.isPending}
                      data-testid="button-issue-credits"
                    >
                      {issueCredits.isPending ? "Issuing..." : "Issue Credits"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Role Switcher */}
          <Card data-testid="role-switcher">
            <RoleSwitcher
              currentRole="producer"
              walletAddress={wallet!.address}
              balance={balance?.balance || 0}
              onRoleSwitch={(newRole) => {
                queryClient.invalidateQueries();
                if (newRole === 'buyer') {
                  setLocation('/buyer/dashboard');
                }
              }}
            />
          </Card>

          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <TransactionTable
              title="Recent Transactions"
              transactions={transactions.slice(0, 5)}
              showAllColumns={false}
              showActions={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
