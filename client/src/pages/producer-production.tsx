import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FlaskConical, Zap, MapPin, Calendar } from "lucide-react";
import { Navigation } from "@/components/navigation";
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

export default function ProducerProduction() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'producer')) {
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

  // Mutations
  const issueCredits = useMutation({
    mutationFn: (data: IssueCreditsData) => 
      api.credits.issue({ ...data, producerAddress: wallet!.address }),
    onSuccess: (response) => {
      toast({
        title: "Production Recorded Successfully",
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
        title: "Failed to Record Production",
        description: "Please try again later."
      });
    }
  });

  const onSubmit = (data: IssueCreditsData) => {
    issueCredits.mutate(data);
  };

  if (!isAuthenticated || user?.role !== 'producer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background role-producer">
      <Navigation role="producer" currentSection="production" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="production-title">
            Production Management
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="production-subtitle">
            Record and track your green hydrogen production
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Production Entry Form */}
          <Card data-testid="production-entry-form">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                <FlaskConical className="w-6 h-6 mr-2 text-primary" />
                Record New Production
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="hydrogenKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <FlaskConical className="w-4 h-4 mr-2" />
                          Hydrogen Produced (kg)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Enter amount in kg"
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
                        <FormLabel className="flex items-center">
                          <Zap className="w-4 h-4 mr-2" />
                          Energy Source
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-energy-source">
                              <SelectValue placeholder="Select renewable energy source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Solar PV">Solar PV</SelectItem>
                            <SelectItem value="Wind">Wind Power</SelectItem>
                            <SelectItem value="Hydroelectric">Hydroelectric</SelectItem>
                            <SelectItem value="Geothermal">Geothermal</SelectItem>
                            <SelectItem value="Green Grid">Green Grid Mix</SelectItem>
                            <SelectItem value="Biomass">Biomass</SelectItem>
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
                        <FormLabel className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          Production Location
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter facility location"
                            {...field}
                            data-testid="input-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-muted rounded-lg p-4" data-testid="production-summary">
                    <h4 className="font-medium text-foreground mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Production Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="text-foreground">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Producer:</span>
                        <span className="text-foreground">{user?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credits to Issue:</span>
                        <span className="text-foreground font-medium">
                          {form.watch('hydrogenKg') || 0} GHC
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={issueCredits.isPending}
                    data-testid="button-record-production"
                  >
                    {issueCredits.isPending ? "Recording..." : "Record Production & Issue Credits"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Production Guidelines */}
          <Card data-testid="production-guidelines">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">
                Production Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium text-foreground">Green Hydrogen Requirements</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Only hydrogen produced using renewable energy sources qualifies for green hydrogen credits.
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-foreground">Documentation</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ensure accurate recording of production amounts, energy sources, and facility locations for certification.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-foreground">Credit Issuance</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    1 kg of green hydrogen = 1 Green Hydrogen Credit (GHC). Credits are issued immediately upon verification.
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Important Notice</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    All production records are subject to third-party auditing and verification. False reporting may result in credit revocation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}