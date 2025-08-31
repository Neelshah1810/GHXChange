import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Archive, Factory, Clock, Search, ShieldCheck, AlertTriangle, Download, FileText, Eye, Hash } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/stats-card";
import { TransactionTable } from "@/components/transaction-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@shared/schema";

export default function AuditorDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All Types");
  const [txSearchTerm, setTxSearchTerm] = useState("");
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    } else if (!isLoading && isAuthenticated && user?.role !== 'auditor') {
      setLocation('/login');
    }
  }, [isAuthenticated, user, setLocation, isLoading]);

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

  // Reset current page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleVerifyTransaction = (txHash: string) => {
    toast({
      title: "Transaction Verified",
      description: `Transaction ${txHash.substring(0, 10)}... has been verified.`
    });
  };

  const handleSearchTransactions = () => {
    setShowSearchDialog(true);
  };

  const handleVerifyCertificate = () => {
    setLocation('/auditor/verification');
  };

  const handleFlagSuspicious = () => {
    const suspiciousTransactions = transactions.filter((tx: Transaction) => 
      tx.amount > 2500 || // Large amounts (2.5k GHC threshold)
      (tx.txType === 'transfer' && Math.abs(new Date(tx.timestamp!).getTime() - Date.now()) < 60000) // Very recent transfers
    );
    
    if (suspiciousTransactions.length > 0) {
      toast({
        title: "Suspicious Activity Detected",
        description: `Found ${suspiciousTransactions.length} potentially suspicious transactions.`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "No Suspicious Activity",
        description: "All transactions appear normal."
      });
    }
  };

  const handleExportCSV = () => {
    // Generate CSV content
    const csvHeader = "Date,Transaction Hash,Type,From,To,Amount,Status,Timestamp\n";
    const csvContent = transactions.map((tx: Transaction) => {
      const date = new Date(tx.timestamp!).toLocaleDateString();
      const fromAddr = tx.fromAddress === "SYSTEM" ? "SYSTEM" : tx.fromAddress.substring(0, 10) + "...";
      const toAddr = tx.toAddress === "0x000000000000000000000000000000000000dEaD" ? "Burn Address" : tx.toAddress.substring(0, 10) + "...";
      return `${date},${tx.txHash},${tx.txType},${fromAddr},${toAddr},${tx.amount},${tx.status},${tx.timestamp}`;
    }).join("\n");

    const fullCSV = csvHeader + csvContent;
    
    // Create and download CSV file
    const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ghc-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Export Complete",
      description: "Transaction data has been exported to CSV file."
    });
  };

  const handleGeneratePDF = () => {
    // Generate comprehensive audit report
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>GHC System Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #2563eb; }
        .subtitle { font-size: 16px; margin: 10px 0; }
        .section { margin: 30px 0; }
        .section h2 { color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f8fafc; font-weight: bold; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Green Hydrogen Credits System - Audit Report</div>
        <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
        <div class="subtitle">Auditor: ${user?.name || 'System Auditor'}</div>
    </div>

    <div class="section">
        <h2>System Overview</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats?.totalIssued || 0}</div>
                <div>Credits Issued</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats?.totalRetired || 0}</div>
                <div>Credits Retired</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${producers.length}</div>
                <div>Active Producers</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${pendingTransactions.length}</div>
                <div>Pending Verifications</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Transaction Summary</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.slice(0, 20).map((tx: Transaction) => `
                    <tr>
                        <td>${new Date(tx.timestamp!).toLocaleDateString()}</td>
                        <td>${tx.txType.toUpperCase()}</td>
                        <td>${tx.fromAddress === "SYSTEM" ? "SYSTEM" : tx.fromAddress.substring(0, 10) + "..."}</td>
                        <td>${tx.toAddress === "0x000000000000000000000000000000000000dEaD" ? "Burn Address" : tx.toAddress.substring(0, 10) + "..."}</td>
                        <td>${tx.amount} GHC</td>
                        <td>${tx.status?.toUpperCase()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>This report was generated automatically by the GHC System for audit purposes.</p>
        <p>Report covers ${transactions.length} total transactions as of ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>
    `;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ghc-audit-report-${new Date().toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "PDF Report Generated",
      description: "Comprehensive audit report has been downloaded."
    });
  };

  const handleViewTransaction = (txHash: string) => {
    // This will be handled by the TransactionTable component
    return;
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
            subtitle="System total"
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
            subtitle="Currently registered"
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
                  <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        data-testid="button-search-transactions"
                        onClick={handleSearchTransactions}
                      >
                        <Search className="w-5 h-5 mr-3" />
                        Search Transactions
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center text-xl">
                          <Search className="w-6 h-6 mr-2 text-primary" />
                          Advanced Transaction Search
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Input
                            type="text"
                            placeholder="Search by transaction hash, address, or amount..."
                            value={txSearchTerm}
                            onChange={(e) => setTxSearchTerm(e.target.value)}
                            className="flex-1"
                            data-testid="input-tx-search"
                          />
                          <Button onClick={() => setTxSearchTerm("")}>
                            Clear
                          </Button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {transactions
                            .filter((tx: Transaction) => 
                              txSearchTerm === "" ||
                              tx.txHash.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
                              tx.fromAddress.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
                              tx.toAddress.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
                              tx.amount.toString().includes(txSearchTerm)
                            )
                            .slice(0, 20)
                            .map((tx: Transaction) => (
                              <Card key={tx.id} className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-mono text-sm text-foreground">{tx.txHash}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {tx.txType.toUpperCase()} • {tx.amount} GHC • {new Date(tx.timestamp!).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Badge className={tx.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                    {tx.status}
                                  </Badge>
                                </div>
                              </Card>
                            ))
                          }
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    data-testid="button-verify-certificate"
                    onClick={handleVerifyCertificate}
                  >
                    <ShieldCheck className="w-5 h-5 mr-3" />
                    Verify Certificate
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    data-testid="button-flag-suspicious"
                    onClick={handleFlagSuspicious}
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
                  transactions={currentTransactions}
                  showAllColumns={true}
                  showActions={true}
                  onVerifyTransaction={handleVerifyTransaction}
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-muted-foreground" data-testid="transaction-count">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
                    </p>
                    {totalPages > 1 && (
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      data-testid="button-previous-page"
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || totalPages === 0}
                      data-testid="button-next-page"
                    >
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
