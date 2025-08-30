import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle, FileText, Calendar, TrendingUp, AlertTriangle, Download, Eye } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BuyerCompliance() {
  const [, setLocation] = useLocation();
  const { user, wallet, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [retireAmount, setRetireAmount] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'buyer')) {
      setLocation('/login');
    }
  }, [isAuthenticated, user, setLocation, isLoading]);

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', wallet?.address],
    enabled: !!wallet?.address,
    queryFn: () => api.transactions.getByAddress(wallet!.address)
  });

  const { data: balance } = useQuery({
    queryKey: ['/api/balance', wallet?.address],
    enabled: !!wallet?.address,
    queryFn: () => api.wallet.getBalance(wallet!.address),
    refetchInterval: 5000
  });

  const retireCredits = useMutation({
    mutationFn: (data: { amount: number; purpose: string }) => 
      api.credits.retire({ address: wallet!.address, ...data }),
    onSuccess: (response) => {
      toast({
        title: "Credits Retired Successfully",
        description: response.message
      });
      setRetireAmount(undefined);
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

  const handleRetire = (purpose: string) => {
    if (retireAmount && retireAmount > 0) {
      retireCredits.mutate({ amount: retireAmount, purpose });
    }
  };

  const generateReportContent = () => {
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const purchasedTransactions = transactions.filter((tx: any) => 
      tx.txType === 'transfer' && tx.toAddress === wallet?.address
    );
    
    const retiredByPurpose = retiredTransactions.reduce((acc: any, tx: any) => {
      const purpose = tx.data?.purpose || "General compliance";
      acc[purpose] = (acc[purpose] || 0) + tx.amount;
      return acc;
    }, {});

    return {
      reportDate,
      companyName: user?.name || "Company Name",
      walletAddress: wallet?.address || "N/A",
      reportingPeriod: "2024 Annual Report",
      totalPurchased,
      totalRetired,
      currentBalance,
      annualRequirement,
      complianceProgress,
      isCompliant,
      remaining,
      purchasedTransactions,
      retiredTransactions,
      retiredByPurpose
    };
  };

  const downloadReport = () => {
    const report = generateReportContent();
    
    // Create a comprehensive HTML report
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Green Hydrogen Credits Compliance Report - ${report.companyName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .report-title { font-size: 20px; margin: 10px 0; }
        .report-date { color: #666; }
        .section { margin: 30px 0; }
        .section h2 { color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .stat-label { color: #666; margin-top: 5px; }
        .compliance-status { padding: 15px; border-radius: 8px; margin: 20px 0; }
        .compliant { background-color: #dcfce7; border-left: 4px solid #16a34a; }
        .non-compliant { background-color: #fef3c7; border-left: 4px solid #f59e0b; }
        .transaction-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .transaction-table th, .transaction-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .transaction-table th { background-color: #f8fafc; font-weight: bold; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${report.companyName}</div>
        <div class="report-title">Green Hydrogen Credits Compliance Report</div>
        <div class="report-date">Report Date: ${report.reportDate}</div>
        <div class="report-date">Reporting Period: ${report.reportingPeriod}</div>
        <div class="report-date">Wallet Address: ${report.walletAddress}</div>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="compliance-status ${report.isCompliant ? 'compliant' : 'non-compliant'}">
            <strong>Compliance Status: ${report.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}</strong>
            <p>Your organization has achieved ${report.complianceProgress.toFixed(1)}% of the annual requirement.</p>
            ${!report.isCompliant ? `<p>Remaining requirement: ${report.remaining} GHC</p>` : ''}
        </div>
    </div>

    <div class="section">
        <h2>Credit Summary</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${report.totalPurchased}</div>
                <div class="stat-label">Total Credits Purchased</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${report.totalRetired}</div>
                <div class="stat-label">Total Credits Retired</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${report.currentBalance}</div>
                <div class="stat-label">Current Balance</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${report.annualRequirement}</div>
                <div class="stat-label">Annual Requirement</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Retirement by Purpose</h2>
        <table class="transaction-table">
            <thead>
                <tr>
                    <th>Purpose</th>
                    <th>Credits Retired (GHC)</th>
                    <th>Percentage of Total</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(report.retiredByPurpose).map(([purpose, amount]: [string, any]) => `
                    <tr>
                        <td>${purpose}</td>
                        <td>${amount}</td>
                        <td>${((amount / report.totalRetired) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Retirement Transaction History</h2>
        <table class="transaction-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount (GHC)</th>
                    <th>Purpose</th>
                    <th>Transaction ID</th>
                </tr>
            </thead>
            <tbody>
                ${report.retiredTransactions.map((tx: any) => `
                    <tr>
                        <td>${new Date(tx.timestamp).toLocaleDateString()}</td>
                        <td>${tx.amount}</td>
                        <td>${tx.data?.purpose || 'General compliance'}</td>
                        <td style="font-family: monospace; font-size: 10px;">${tx.txHash.substring(0, 16)}...</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Environmental Impact</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${(report.totalRetired * 10.4).toFixed(1)} kg</div>
                <div class="stat-label">CO₂ Emissions Avoided</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(report.totalRetired * 0.001).toFixed(3)} MW</div>
                <div class="stat-label">Renewable Energy Equivalent</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>This report was generated automatically by the Green Hydrogen Credits (GHC) System.</p>
        <p>Report generated on ${report.reportDate} for ${report.companyName}</p>
        <p>For questions regarding this report, please contact your compliance officer.</p>
    </div>
</body>
</html>
    `;

    // Create and download the HTML file
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GHC-Compliance-Report-${report.companyName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "Your compliance report has been downloaded successfully."
    });
  };

  if (!isAuthenticated || user?.role !== 'buyer') {
    return null;
  }

  const currentBalance = balance?.balance || wallet?.balance || 0;
  const totalPurchased = transactions
    .filter((tx: any) => tx.txType === 'transfer' && tx.toAddress === wallet?.address)
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const totalRetired = transactions
    .filter((tx: any) => tx.txType === 'retire')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  // Compliance calculations
  const annualRequirement = 2000; // 2000 GHC annual requirement
  const complianceProgress = Math.min((totalRetired / annualRequirement) * 100, 100);
  const remaining = Math.max(0, annualRequirement - totalRetired);
  const isCompliant = totalRetired >= annualRequirement;

  const retiredTransactions = transactions.filter((tx: any) => tx.txType === 'retire');

  return (
    <div className="min-h-screen bg-background role-buyer">
      <Navigation role="buyer" currentSection="compliance" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="compliance-title">
            Compliance Management
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="compliance-subtitle">
            Track your regulatory compliance and retire credits for reporting
          </p>
        </div>

        {/* Compliance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="compliance-status">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance Status</p>
                  <p className="text-2xl font-bold text-foreground">{complianceProgress.toFixed(1)}%</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isCompliant ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                }`}>
                  {isCompliant ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
              </div>
              <Progress value={complianceProgress} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                {isCompliant ? 'Fully compliant' : `${remaining} GHC remaining`}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="retired-credits">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Retired Credits</p>
                  <p className="text-2xl font-bold text-foreground">{totalRetired} GHC</p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                For regulatory compliance
              </p>
            </CardContent>
          </Card>

          <Card data-testid="annual-requirement">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Annual Requirement</p>
                  <p className="text-2xl font-bold text-foreground">{annualRequirement} GHC</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Steel industry standard
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Retire Credits */}
          <div className="lg:col-span-1">
            <Card data-testid="retire-credits-form">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Retire Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium text-foreground mb-2">Available Balance</h4>
                    <p className="text-2xl font-bold text-primary">{currentBalance} GHC</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Amount to Retire</label>
                    <Input
                      type="number"
                      placeholder="Enter amount to retire"
                      value={retireAmount || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRetireAmount(value === '' ? undefined : Number(value));
                      }}
                      className="mt-1"
                      data-testid="input-retire-amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => handleRetire("Steel production compliance")}
                      disabled={!retireAmount || retireAmount <= 0 || retireAmount > currentBalance || retireCredits.isPending}
                      className="w-full"
                      data-testid="button-retire-steel"
                    >
                      {retireCredits.isPending ? "Processing..." : "Retire for Steel Production"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleRetire("General industrial compliance")}
                      disabled={!retireAmount || retireAmount <= 0 || retireAmount > currentBalance || retireCredits.isPending}
                      className="w-full"
                      data-testid="button-retire-general"
                    >
                      Retire for General Industry
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleRetire("Voluntary carbon reduction")}
                      disabled={!retireAmount || retireAmount <= 0 || retireAmount > currentBalance || retireCredits.isPending}
                      className="w-full"
                      data-testid="button-retire-voluntary"
                    >
                      Retire for Carbon Reduction
                    </Button>
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full"
                          data-testid="button-preview-report"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview Compliance Report
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center text-xl">
                            <FileText className="w-6 h-6 mr-2 text-primary" />
                            Compliance Report Preview
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          {(() => {
                            const report = generateReportContent();
                            return (
                              <>
                                {/* Report Header */}
                                <div className="border-b pb-4">
                                  <h2 className="text-2xl font-bold text-primary">{report.companyName}</h2>
                                  <h3 className="text-lg font-semibold text-foreground mt-1">Green Hydrogen Credits Compliance Report</h3>
                                  <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                    <p>Report Date: {report.reportDate}</p>
                                    <p>Reporting Period: {report.reportingPeriod}</p>
                                    <p>Wallet: {report.walletAddress?.substring(0, 16)}...{report.walletAddress?.substring(report.walletAddress.length - 6)}</p>
                                  </div>
                                </div>

                                {/* Executive Summary */}
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground mb-3">Executive Summary</h3>
                                  <div className={`p-4 rounded-lg border-l-4 ${
                                    report.isCompliant 
                                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200'
                                      : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200'
                                  }`}>
                                    <p className="font-semibold mb-2">
                                      Compliance Status: {report.isCompliant ? 'COMPLIANT ✓' : 'NON-COMPLIANT ⚠'}
                                    </p>
                                    <p>Your organization has achieved {report.complianceProgress.toFixed(1)}% of the annual requirement.</p>
                                    {!report.isCompliant && (
                                      <p className="mt-1">Remaining requirement: {report.remaining} GHC</p>
                                    )}
                                  </div>
                                </div>

                                <Separator />

                                {/* Credit Summary */}
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground mb-4">Credit Summary</h3>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                      <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-primary">{report.totalPurchased}</p>
                                        <p className="text-sm text-muted-foreground">Credits Purchased</p>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-red-600">{report.totalRetired}</p>
                                        <p className="text-sm text-muted-foreground">Credits Retired</p>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-blue-600">{report.currentBalance}</p>
                                        <p className="text-sm text-muted-foreground">Current Balance</p>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-gray-600">{report.annualRequirement}</p>
                                        <p className="text-sm text-muted-foreground">Annual Requirement</p>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>

                                <Separator />

                                {/* Environmental Impact */}
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground mb-4">Environmental Impact</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                      <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                          {(report.totalRetired * 10.4).toFixed(1)} kg
                                        </p>
                                        <p className="text-sm text-green-600 dark:text-green-400">CO₂ Emissions Avoided</p>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                      <CardContent className="p-4 text-center">
                                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                          {(report.totalRetired * 0.001).toFixed(3)} MW
                                        </p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">Renewable Energy Equivalent</p>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>

                                <Separator />

                                {/* Recent Retirements */}
                                {report.retiredTransactions.length > 0 && (
                                  <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Recent Retirement Transactions</h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {report.retiredTransactions.slice(0, 5).map((tx: any) => (
                                        <div key={tx.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                          <div>
                                            <p className="font-medium text-foreground">{tx.amount} GHC</p>
                                            <p className="text-sm text-muted-foreground">{tx.data?.purpose || 'General compliance'}</p>
                                          </div>
                                          <p className="text-sm text-muted-foreground">
                                            {new Date(tx.timestamp).toLocaleDateString()}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Download Button */}
                                <div className="border-t pt-4 flex justify-end">
                                  <Button onClick={downloadReport} className="flex items-center">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Full Report
                                  </Button>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="outline"
                      onClick={downloadReport}
                      className="w-full"
                      data-testid="button-download-report"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Retirement History */}
          <div className="lg:col-span-2">
            <Card data-testid="retirement-history">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Retirement History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {retiredTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" data-testid="no-retirements">
                    No credits retired yet. Start by retiring some credits for compliance.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {retiredTransactions.map((transaction: any) => (
                      <Card key={transaction.id} className="border border-border" data-testid={`retirement-${transaction.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">
                                  {transaction.amount} GHC Retired
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {transaction.data?.purpose || "Compliance retirement"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                                Retired
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(transaction.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}