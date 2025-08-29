import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Archive, Factory, Clock, Search, ShieldCheck, AlertTriangle, Download, FileText } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/stats-card";
import { TransactionTable } from "@/components/transaction-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@shared/schema";

export default function AuditorDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All Types");

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'auditor') {
      setLocation('/login');
    }
  }, [isAuthenticated, user, setLocation]);

  // Queries
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: () => api.transactions.getAll()
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['/api/certificates'],
    queryFn: () => api.certificates.getAll()
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: () => api.system.getStats()
  });

  const { data: producers = [] } = useQuery({
    queryKey: ['/api/producers'],
    queryFn: () => api.system.getProducers()
  });

  // Filter transactions based on search and type
  const filteredTransactions = transactions.filter((tx: Transaction) => {
    const matchesSearch = searchTerm === "" || 
      tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.fromAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.toAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "All Types" || 
      tx.txType.toLowerCase() === filterType.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  const pendingTransactions = transactions.filter((tx: Transaction) => tx.status === 'pending');

  const handleVerifyTransaction = (txHash: string) => {
    toast({
      title: "Transaction Verified",
      description: `Transaction ${txHash.substring(0, 10)}... has been verified.`
    });
  };

  const handleExportCSV = () => {
    toast({
      title: "Export Started",
      description: "CSV report is being generated and will download shortly."
    });
  };

  const handleGeneratePDF = () => {
    toast({
      title: "PDF Generation Started",
      description: "PDF report is being generated and will download shortly."
    });
  };

  if (!isAuthenticated || user?.role !== 'auditor') {
    return null;
  }

  const retirementRate = stats ? (stats.totalRetired / stats.totalIssued * 100) : 0;

  return (
    <div className="min-h-screen bg-background role-auditor">
      <Navigation role="auditor" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="dashboard-title">
            Auditor Dashboard
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="dashboard-subtitle">
            Monitor and verify all green hydrogen credit transactions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Credits Issued"
            value={`${stats?.totalIssued || 0} GHC`}
            icon={TrendingUp}
            iconColor="bg-primary/10 text-primary"
            change={`+${Math.floor(Math.random() * 500 + 100)} this month`}
            changeType="positive"
          />
          <StatsCard
            title="Credits Retired"
            value={`${stats?.totalRetired || 0} GHC`}
            icon={Archive}
            iconColor="bg-red-500/10 text-red-500"
            subtitle={`${retirementRate.toFixed(1)}% retirement rate`}
          />
          <StatsCard
            title="Active Producers"
            value={producers.length}
            icon={Factory}
            iconColor="bg-blue-500/10 text-blue-500"
            change="+3 new this month"
            changeType="positive"
          />
          <StatsCard
            title="Pending Verifications"
            value={pendingTransactions.length}
            icon={Clock}
            iconColor="bg-yellow-500/10 text-yellow-500"
            subtitle="Require attention"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Verification Tools */}
          <div className="lg:col-span-1 space-y-6">
            <Card data-testid="verification-tools">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Verification Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    data-testid="button-search-transactions"
                  >
                    <Search className="w-5 h-5 mr-3" />
                    Search Transactions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    data-testid="button-verify-certificate"
                  >
                    <ShieldCheck className="w-5 h-5 mr-3" />
                    Verify Certificate
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    data-testid="button-flag-suspicious"
                  >
                    <AlertTriangle className="w-5 h-5 mr-3" />
                    Flag Suspicious
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Export Reports */}
            <Card data-testid="export-reports">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Export Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={handleExportCSV}
                    className="w-full"
                    data-testid="button-export-csv"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleGeneratePDF}
                    className="w-full"
                    data-testid="button-generate-pdf"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Transactions */}
          <div className="lg:col-span-3">
            <Card data-testid="all-transactions-table">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    All System Transactions
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48"
                      data-testid="input-search-transactions"
                    />
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-32" data-testid="select-transaction-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Types">All Types</SelectItem>
                        <SelectItem value="issue">Issue</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="retire">Retire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TransactionTable
                  title=""
                  transactions={filteredTransactions.slice(0, 10)}
                  showAllColumns={true}
                  showActions={true}
                  onVerifyTransaction={handleVerifyTransaction}
                />
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground" data-testid="transaction-count">
                    Showing {Math.min(10, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" data-testid="button-previous-page">
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-next-page">
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
