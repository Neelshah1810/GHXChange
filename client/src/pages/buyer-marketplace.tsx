import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCart, Factory, Coins, MapPin, Zap, Star } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { purchaseCreditsSchema, type PurchaseCreditsData } from "@shared/schema";

export default function BuyerMarketplace() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedProducer, setSelectedProducer] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    } else if (!isLoading && isAuthenticated && user?.role !== 'buyer') {
      setLocation('/login');
    }
  }, [isAuthenticated, user, setLocation, isLoading]);

  const form = useForm<PurchaseCreditsData & { amount: number }>({
    resolver: zodResolver(purchaseCreditsSchema.extend({
      amount: purchaseCreditsSchema.shape.amount
    })),
    defaultValues: {
      producerAddress: "",
      amount: undefined
    }
  });

  const { data: producers = [], isLoading: producersLoading } = useQuery({
    queryKey: ['/api/producers'],
    queryFn: () => api.system.getProducers()
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['/api/certificates'],
    queryFn: () => api.certificates.getAll()
  });

  const purchaseCredits = useMutation({
    mutationFn: (data: PurchaseCreditsData) => 
      api.credits.purchase({ ...data, buyerAddress: wallet!.address }),
    onSuccess: (response) => {
      toast({
        title: "Credits Purchased Successfully",
        description: response.message
      });
      form.reset();
      setSelectedProducer(null);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "Please check your selection and try again."
      });
    }
  });

  const onSubmit = (data: PurchaseCreditsData & { amount: number }) => {
    purchaseCredits.mutate(data);
  };

  const handleSelectProducer = (producer: any) => {
    setSelectedProducer(producer);
    form.setValue('producerAddress', producer.address);
  };

  if (!isAuthenticated || user?.role !== 'buyer') {
    return null;
  }

  const getProducerCertificates = (producerAddress: string) => {
    return certificates.filter((cert: any) => cert.producerAddress === producerAddress);
  };

  const getAveragePrice = () => 2700; // Fixed price for demo (₹2,700 per GHC)

  return (
    <div className="min-h-screen bg-background role-buyer">
      <Navigation role="buyer" currentSection="marketplace" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="marketplace-title">
            Credit Marketplace
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="marketplace-subtitle">
            Browse and purchase green hydrogen credits from verified producers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Producer Listings */}
          <div className="lg:col-span-2">
            <Card data-testid="producer-listings">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                  <Factory className="w-6 h-6 mr-2 text-primary" />
                  Available Producers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {producersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading producers...
                  </div>
                ) : producers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="no-producers">
                    No producers available at the moment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {producers.map((producer: any) => {
                      const producerCerts = getProducerCertificates(producer.address);
                      const totalProduction = producerCerts.reduce((sum: number, cert: any) => sum + cert.hydrogenKg, 0);
                      const energySources = Array.from(new Set(producerCerts.map((cert: any) => cert.energySource)));
                      
                      return (
                        <Card 
                          key={producer.address} 
                          className={`cursor-pointer transition-all border ${
                            selectedProducer?.address === producer.address 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => handleSelectProducer(producer)}
                          data-testid={`producer-${producer.address}`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                  <Factory className="w-6 h-6" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-foreground text-lg">
                                    {producer.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {producer.address.substring(0, 10)}...{producer.address.substring(producer.address.length - 4)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                                  <Star className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Available Credits</p>
                                <p className="text-lg font-bold text-foreground">{producer.balance} GHC</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Production</p>
                                <p className="text-lg font-bold text-foreground">{totalProduction} kg</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Certificates</p>
                                <p className="text-lg font-bold text-foreground">{producerCerts.length}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Price per GHC</p>
                                <p className="text-lg font-bold text-foreground">₹{getAveragePrice()}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {energySources.map((source: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Zap className="w-3 h-3 mr-1" />
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Purchase Form */}
          <div className="lg:col-span-1">
            <Card data-testid="purchase-form">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                  <ShoppingCart className="w-6 h-6 mr-2 text-primary" />
                  Purchase Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedProducer ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a producer to continue
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="bg-muted rounded-lg p-4" data-testid="selected-producer">
                        <h4 className="font-medium text-foreground mb-2">Selected Producer</h4>
                        <p className="text-sm text-foreground">{selectedProducer.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedProducer.balance} GHC available</p>
                      </div>

                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Coins className="w-4 h-4 mr-2" />
                              Amount (GHC)
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="Enter amount to purchase"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === '' ? undefined : Number(value));
                                }}
                                data-testid="input-purchase-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-muted rounded-lg p-4" data-testid="purchase-calculation">
                        <h4 className="font-medium text-foreground mb-2">Purchase Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price per GHC:</span>
                            <span className="text-foreground">₹{getAveragePrice()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="text-foreground">{form.watch('amount') || 0} GHC</span>
                          </div>
                          <div className="flex justify-between border-t border-border pt-2">
                            <span className="text-foreground font-medium">Total Cost:</span>
                            <span className="text-foreground font-bold">
                              ₹{((form.watch('amount') || 0) * getAveragePrice()).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={purchaseCredits.isPending || !form.watch('amount') || form.watch('amount') > selectedProducer?.balance}
                        data-testid="button-purchase"
                      >
                        {purchaseCredits.isPending ? "Processing..." : "Purchase Credits"}
                      </Button>

                      <Button 
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedProducer(null);
                          form.reset();
                        }}
                        data-testid="button-cancel"
                      >
                        Cancel Selection
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}