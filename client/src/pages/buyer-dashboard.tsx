import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, ShoppingCart, CheckCircle, CreditCard } from "lucide-react";
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
import { purchaseCreditsSchema, type PurchaseCreditsData } from "@shared/schema";

export default function BuyerDashboard() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'buyer') {
      setLocation('/login');
    }
  }, [isAuthenticated, user, setLocation]);

  const form = useForm<PurchaseCreditsData & { amount: number }>({
    resolver: zodResolver(purchaseCreditsSchema.extend({
      amount: purchaseCreditsSchema.shape.amount
    })),
    defaultValues: {
      producerAddress: "",
      amount: 0
    }
  });

  // Queries
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', wallet?.address],
    enabled: !!wallet?.address,
    queryFn: () => api.transactions.getByAddress(wallet!.address)
  });

  const { data: producers = [] } = useQuery({
    queryKey: ['/api/producers'],
    queryFn: () => api.system.getProducers()
  });

  const { data: balance } = useQuery({
    queryKey: ['/api/balance', wallet?.address],
    enabled: !!wallet?.address,
    queryFn: () => api.wallet.getBalance(wallet!.address),
    refetchInterval: 5000
  });

  // Mutations
  const purchaseCredits = useMutation({
    mutationFn: (data: PurchaseCreditsData) => 
      api.credits.purchase({ ...data, buyerAddress: wallet!.address }),
    onSuccess: (response) => {
      toast({
        title: "Credits Purchased Successfully",
        description: response.message
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to Purchase Credits",
        description: "Please try again later."
      });
    }
  });

  const retireCredits = useMutation({
    mutationFn: (data: { amount: number; purpose?: string }) => 
      api.credits.retire({ address: wallet!.address, ...data }),
    onSuccess: (response) => {
      toast({
        title: "Credits Retired Successfully",
        description: response.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to Retire Credits",
        description: "Please try again later."
      });
    }
  });

  const onSubmit = (data: PurchaseCreditsData & { amount: number }) => {
    purchaseCredits.mutate(data);
  };

  const handleRetire = () => {
    const amount = 50; // Default retirement amount
    retireCredits.mutate({ 
      amount, 
      purpose: "Steel production compliance" 
    });
  };

  if (!isAuthenticated || user?.role !== 'buyer') {
    return null;
  }

  const currentBalance = balance?.balance || wallet?.balance || 0;
  const totalPurchased = transactions
    .filter(tx => tx.txType === 'transfer' && tx.toAddress === wallet?.address)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalRetired = transactions
    .filter(tx => tx.txType === 'retire')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalSpent = totalPurchased * 32.5; // Assuming $32.5 per GHC

  const complianceProgress = Math.min((totalRetired / 2000) * 100, 100); // 2000 GHC annual requirement

  return (
    <div className="min-h-screen bg-background role-buyer">
      <Navigation role="buyer" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="dashboard-title">
            Buyer Dashboard
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="dashboard-subtitle">
            Purchase and manage your green hydrogen credits
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Available Credits"
            value={`${currentBalance} GHC`}
            icon={Wallet}
            iconColor="bg-primary/10 text-primary"
            subtitle="Ready for use"
          />
          <StatsCard
            title="Total Purchased"
            value={`${totalPurchased} GHC`}
            icon={ShoppingCart}
            iconColor="bg-green-500/10 text-green-500"
            subtitle="All time"
          />
          <StatsCard
            title="Retired Credits"
            value={`${totalRetired} GHC`}
            icon={CheckCircle}
            iconColor="bg-red-500/10 text-red-500"
            subtitle="Used for compliance"
          />
          <StatsCard
            title="Total Spent"
            value={`$${totalSpent.toLocaleString()}`}
            icon={CreditCard}
            iconColor="bg-purple-500/10 text-purple-500"
            subtitle={`Average $${totalPurchased > 0 ? (totalSpent / totalPurchased).toFixed(2) : '0'}/GHC`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Purchase Credits & Compliance */}
          <div className="lg:col-span-1 space-y-6">
            {/* Purchase Credits Form */}
            <Card data-testid="purchase-credits-form">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Purchase Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (GHC)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-purchase-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="producerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Producer</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-producer">
                                <SelectValue placeholder="Select producer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {producers.map((producer) => (
                                <SelectItem key={producer.address} value={producer.address}>
                                  {producer.name} ({producer.balance} GHC available)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-muted rounded-md p-3" data-testid="purchase-summary">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price per GHC:</span>
                        <span className="text-foreground font-medium">$32.50</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="text-foreground font-medium">
                          ${((form.watch('amount') || 0) * 32.5).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={purchaseCredits.isPending}
                      data-testid="button-purchase-credits"
                    >
                      {purchaseCredits.isPending ? "Purchasing..." : "Purchase Credits"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Compliance Section */}
            <Card data-testid="compliance-status">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">2024 Requirement</span>
                    <span className="text-sm font-medium text-foreground">2,000 GHC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Retired to Date</span>
                    <span className="text-sm font-medium text-foreground">{totalRetired} GHC</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${complianceProgress}%` }}
                      data-testid="compliance-progress-bar"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Remaining</span>
                    <span className="text-sm font-medium text-orange-600">
                      {Math.max(0, 2000 - totalRetired)} GHC
                    </span>
                  </div>
                  <Button 
                    onClick={handleRetire}
                    variant="outline"
                    className="w-full mt-4"
                    disabled={currentBalance < 50 || retireCredits.isPending}
                    data-testid="button-retire-credits"
                  >
                    {retireCredits.isPending ? "Retiring..." : "Retire 50 GHC"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <TransactionTable
              title="Transaction History"
              transactions={transactions.slice(0, 10)}
              showAllColumns={false}
              showActions={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
