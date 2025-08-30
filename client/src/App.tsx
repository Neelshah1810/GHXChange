import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import Login from "@/pages/login";
import ProducerDashboard from "@/pages/producer-dashboard";
import ProducerProduction from "@/pages/producer-production";
import ProducerCertificates from "@/pages/producer-certificates";
import BuyerDashboard from "@/pages/buyer-dashboard";
import BuyerMarketplace from "@/pages/buyer-marketplace";
import BuyerCompliance from "@/pages/buyer-compliance";
import AuditorDashboard from "@/pages/auditor-dashboard";
import AuditorVerification from "@/pages/auditor-verification";
import AuditorReports from "@/pages/auditor-reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      
      {/* Producer Routes */}
      <Route path="/producer" component={ProducerDashboard} />
      <Route path="/producer/production" component={ProducerProduction} />
      <Route path="/producer/certificates" component={ProducerCertificates} />
      
      {/* Buyer Routes */}
      <Route path="/buyer" component={BuyerDashboard} />
      <Route path="/buyer/marketplace" component={BuyerMarketplace} />
      <Route path="/buyer/compliance" component={BuyerCompliance} />
      
      {/* Auditor Routes */}
      <Route path="/auditor" component={AuditorDashboard} />
      <Route path="/auditor/verification" component={AuditorVerification} />
      <Route path="/auditor/reports" component={AuditorReports} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
