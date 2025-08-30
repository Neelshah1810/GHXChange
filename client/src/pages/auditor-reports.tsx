import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Calendar, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AuditorReports() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("monthly");
  const [reportFormat, setReportFormat] = useState("pdf");

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'auditor')) {
      setLocation('/login');
    }
  }, [isAuthenticated, user, setLocation, isLoading]);

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: () => api.system.getStats()
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: () => api.transactions.getAll()
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['/api/certificates'],
    queryFn: () => api.certificates.getAll()
  });

  const { data: producers = [] } = useQuery({
    queryKey: ['/api/producers'],
    queryFn: () => api.system.getProducers()
  });

  const handleGenerateReport = (type: string) => {
    const reportDate = new Date().toLocaleDateString();
    const reportData = generateReportData(type, reportDate);
    
    let content: string;
    let mimeType: string;
    let fileExtension: string;
    
    switch (reportFormat) {
      case 'csv':
        content = generateCSV(reportData);
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'json':
        content = JSON.stringify(reportData, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
        break;
      case 'excel':
        content = generateCSV(reportData); // Excel can open CSV files
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'pdf':
      default:
        content = generateReportHTML(type, reportDate);
        mimeType = 'text/html';
        fileExtension = 'html';
        break;
    }
    
    // Create and download the report file
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${type.toLowerCase().replace(/\s+/g, '-')}-report-${new Date().toISOString().split('T')[0]}.${fileExtension}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: `${type} report has been generated and downloaded successfully as ${fileExtension.toUpperCase()}.`
    });
  };

  const generateReportData = (reportType: string, reportDate: string) => {
    const baseData = {
      reportType,
      reportDate,
      auditorName: user?.name || 'System Auditor',
      totalTransactions: transactions.length,
      totalCertificates: certificates.length,
      totalProducers: producers.length,
      monthlyIssued,
      monthlyRetired,
      complianceRate: complianceRate.toFixed(1),
      stats: stats || {},
      energySourceBreakdown,
      topProducers
    };

    switch (reportType) {
      case "Compliance Summary":
        return {
          ...baseData,
          reportName: "Compliance Summary Report",
          complianceData: {
            totalIssued: stats?.totalIssued || 0,
            totalRetired: stats?.totalRetired || 0,
            activeCredits: stats?.activeCredits || 0,
            complianceRate: complianceRate.toFixed(1)
          },
          energySources: Object.entries(energySourceBreakdown).map(([source, amount]) => ({
            source,
            amount,
            percentage: ((amount as number / certificates.reduce((sum: number, cert: any) => sum + cert.hydrogenKg, 0)) * 100).toFixed(1)
          }))
        };
        
      case "Transaction Audit":
        return {
          ...baseData,
          reportName: "Transaction Audit Report",
          transactionSummary: {
            total: transactions.length,
            issued: transactions.filter((tx: any) => tx.txType === 'issue').length,
            transferred: transactions.filter((tx: any) => tx.txType === 'transfer').length,
            retired: transactions.filter((tx: any) => tx.txType === 'retire').length
          },
          recentTransactions: transactions.slice(0, 20).map((tx: any) => ({
            date: new Date(tx.timestamp).toLocaleDateString(),
            type: tx.txType.toUpperCase(),
            from: tx.fromAddress === "SYSTEM" ? "SYSTEM" : `${tx.fromAddress.substring(0, 10)}...`,
            to: tx.toAddress === "0x000000000000000000000000000000000000dEaD" ? "Burn Address" : `${tx.toAddress.substring(0, 10)}...`,
            amount: `${tx.amount} GHC`,
            status: tx.status?.toUpperCase() || 'CONFIRMED'
          }))
        };
        
      case "Producer Performance":
        return {
          ...baseData,
          reportName: "Producer Performance Report",
          producerMetrics: {
            activeProducers: producers.length,
            averageCredits: Math.round(producers.reduce((sum: number, p: any) => sum + p.balance, 0) / producers.length)
          },
          producerRankings: topProducers.map((producer: any, index: number) => ({
            rank: index + 1,
            name: producer.name,
            address: producer.address,
            balance: `${producer.balance} GHC`,
            performance: index < 2 ? 'Excellent' : index < 4 ? 'Good' : 'Average'
          }))
        };
        
      case "System Analytics":
        return {
          ...baseData,
          reportName: "System Analytics Report",
          monthlyMetrics: {
            issued: monthlyIssued,
            retired: monthlyRetired,
            certificates: certificates.length,
            co2Avoided: (certificates.reduce((sum: number, cert: any) => sum + cert.hydrogenKg, 0) * 10.4).toFixed(0)
          },
          trends: [
            { metric: "Transactions", current: monthlyTransactions.length, growth: "+12%" },
            { metric: "New Producers", current: 3, growth: "+50%" },
            { metric: "Credits Issued", current: `${monthlyIssued} GHC`, growth: "+8%" },
            { metric: "Credits Retired", current: `${monthlyRetired} GHC`, growth: "+15%" }
          ]
        };
        
      default:
        return baseData;
    }
  };

  const generateCSV = (data: any) => {
    let csvContent = '';
    
    // Add header
    csvContent += `Report Type,${data.reportType}\n`;
    csvContent += `Generated Date,${data.reportDate}\n`;
    csvContent += `Auditor,${data.auditorName}\n`;
    csvContent += `\n`;
    
    switch (data.reportType) {
      case "Compliance Summary":
        csvContent += `Section,Metric,Value\n`;
        csvContent += `Compliance,Total Issued,${data.complianceData.totalIssued}\n`;
        csvContent += `Compliance,Total Retired,${data.complianceData.totalRetired}\n`;
        csvContent += `Compliance,Active Credits,${data.complianceData.activeCredits}\n`;
        csvContent += `Compliance,Compliance Rate,${data.complianceData.complianceRate}%\n`;
        csvContent += `\n`;
        csvContent += `Energy Source,Amount (kg H2),Percentage\n`;
        data.energySources.forEach((source: any) => {
          csvContent += `${source.source},${source.amount},${source.percentage}%\n`;
        });
        break;
        
      case "Transaction Audit":
        csvContent += `Transaction Summary\n`;
        csvContent += `Metric,Count\n`;
        csvContent += `Total Transactions,${data.transactionSummary.total}\n`;
        csvContent += `Issue Transactions,${data.transactionSummary.issued}\n`;
        csvContent += `Transfer Transactions,${data.transactionSummary.transferred}\n`;
        csvContent += `Retirement Transactions,${data.transactionSummary.retired}\n`;
        csvContent += `\n`;
        csvContent += `Recent Transactions\n`;
        csvContent += `Date,Type,From,To,Amount,Status\n`;
        data.recentTransactions.forEach((tx: any) => {
          csvContent += `${tx.date},${tx.type},${tx.from},${tx.to},${tx.amount},${tx.status}\n`;
        });
        break;
        
      case "Producer Performance":
        csvContent += `Producer Rankings\n`;
        csvContent += `Rank,Name,Address,Balance,Performance\n`;
        data.producerRankings.forEach((producer: any) => {
          csvContent += `${producer.rank},${producer.name},${producer.address},${producer.balance},${producer.performance}\n`;
        });
        break;
        
      case "System Analytics":
        csvContent += `Monthly Metrics\n`;
        csvContent += `Metric,Value\n`;
        csvContent += `Issued,${data.monthlyMetrics.issued}\n`;
        csvContent += `Retired,${data.monthlyMetrics.retired}\n`;
        csvContent += `Certificates,${data.monthlyMetrics.certificates}\n`;
        csvContent += `CO2 Avoided,${data.monthlyMetrics.co2Avoided} kg\n`;
        csvContent += `\n`;
        csvContent += `Trends\n`;
        csvContent += `Metric,Current,Growth\n`;
        data.trends.forEach((trend: any) => {
          csvContent += `${trend.metric},${trend.current},${trend.growth}\n`;
        });
        break;
    }
    
    return csvContent;
  };

  const generateReportHTML = (reportType: string, reportDate: string) => {
    const getReportContent = () => {
      switch (reportType) {
        case "Compliance Summary":
          return `
            <div class="section">
              <h2>Compliance Overview</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${complianceRate.toFixed(1)}%</div>
                  <div class="stat-label">Overall Compliance Rate</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${stats?.totalRetired || 0}</div>
                  <div class="stat-label">Total Credits Retired</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${stats?.totalIssued || 0}</div>
                  <div class="stat-label">Total Credits Issued</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${stats?.activeCredits || 0}</div>
                  <div class="stat-label">Active Credits</div>
                </div>
              </div>
            </div>
            <div class="section">
              <h2>Energy Source Breakdown</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Energy Source</th>
                    <th>Amount (kg H₂)</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(energySourceBreakdown).map(([source, amount]: [string, any]) => `
                    <tr>
                      <td>${source}</td>
                      <td>${amount}</td>
                      <td>${((amount / certificates.reduce((sum: number, cert: any) => sum + cert.hydrogenKg, 0)) * 100).toFixed(1)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>`;
            
        case "Transaction Audit":
          return `
            <div class="section">
              <h2>Transaction Summary</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${transactions.length}</div>
                  <div class="stat-label">Total Transactions</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${transactions.filter((tx: any) => tx.txType === 'issue').length}</div>
                  <div class="stat-label">Issue Transactions</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${transactions.filter((tx: any) => tx.txType === 'transfer').length}</div>
                  <div class="stat-label">Transfer Transactions</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${transactions.filter((tx: any) => tx.txType === 'retire').length}</div>
                  <div class="stat-label">Retirement Transactions</div>
                </div>
              </div>
            </div>
            <div class="section">
              <h2>Recent Transactions</h2>
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
                  ${transactions.slice(0, 20).map((tx: any) => `
                    <tr>
                      <td>${new Date(tx.timestamp).toLocaleDateString()}</td>
                      <td>${tx.txType.toUpperCase()}</td>
                      <td>${tx.fromAddress === "SYSTEM" ? "SYSTEM" : tx.fromAddress.substring(0, 10) + "..."}</td>
                      <td>${tx.toAddress === "0x000000000000000000000000000000000000dEaD" ? "Burn Address" : tx.toAddress.substring(0, 10) + "..."}</td>
                      <td>${tx.amount} GHC</td>
                      <td>${tx.status?.toUpperCase()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>`;
            
        case "Producer Performance":
          return `
            <div class="section">
              <h2>Producer Performance Analysis</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${producers.length}</div>
                  <div class="stat-label">Active Producers</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${Math.round(producers.reduce((sum: number, p: any) => sum + p.balance, 0) / producers.length)}</div>
                  <div class="stat-label">Avg Credits per Producer</div>
                </div>
              </div>
            </div>
            <div class="section">
              <h2>Top Performing Producers</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Producer Name</th>
                    <th>Credits Balance</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  ${topProducers.map((producer: any, index: number) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${producer.name}</td>
                      <td>${producer.balance} GHC</td>
                      <td>${index < 2 ? 'Excellent' : index < 4 ? 'Good' : 'Average'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>`;
            
        case "System Analytics":
          return `
            <div class="section">
              <h2>System Analytics</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${monthlyIssued}</div>
                  <div class="stat-label">This Month Issued</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${monthlyRetired}</div>
                  <div class="stat-label">This Month Retired</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${certificates.length}</div>
                  <div class="stat-label">Total Certificates</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${(certificates.reduce((sum: number, cert: any) => sum + cert.hydrogenKg, 0) * 10.4).toFixed(0)} kg</div>
                  <div class="stat-label">CO₂ Avoided</div>
                </div>
              </div>
            </div>
            <div class="section">
              <h2>Monthly Activity Trends</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Current Month</th>
                    <th>Growth</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Transactions</td>
                    <td>${monthlyTransactions.length}</td>
                    <td>+12%</td>
                  </tr>
                  <tr>
                    <td>New Producers</td>
                    <td>3</td>
                    <td>+50%</td>
                  </tr>
                  <tr>
                    <td>Credits Issued</td>
                    <td>${monthlyIssued} GHC</td>
                    <td>+8%</td>
                  </tr>
                  <tr>
                    <td>Credits Retired</td>
                    <td>${monthlyRetired} GHC</td>
                    <td>+15%</td>
                  </tr>
                </tbody>
              </table>
            </div>`;
            
        default:
          return '<div class="section"><h2>Report Content</h2><p>Report data will be displayed here.</p></div>';
      }
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${reportType} - GHC System Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.6; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .subtitle { font-size: 18px; color: #666; margin-bottom: 5px; }
        .section { margin: 40px 0; }
        .section h2 { color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 10px; font-size: 22px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; text-align: center; background: #f9f9f9; }
        .stat-value { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
        .stat-label { color: #666; font-size: 14px; font-weight: 500; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .table th { background-color: #f1f5f9; font-weight: bold; color: #2563eb; }
        .table tbody tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center; }
        .summary-box { background: #e0f2fe; border: 1px solid #0288d1; border-radius: 8px; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${reportType}</div>
        <div class="subtitle">Green Hydrogen Credits System</div>
        <div class="subtitle">Generated on ${reportDate}</div>
        <div class="subtitle">Auditor: ${user?.name || 'System Auditor'}</div>
    </div>

    <div class="summary-box">
        <h3 style="margin-top: 0; color: #0277bd;">Executive Summary</h3>
        <p>This ${reportType.toLowerCase()} provides comprehensive insights into the GHC system performance, 
           compliance metrics, and operational analytics as of ${reportDate}. 
           The report covers ${transactions.length} total transactions, ${certificates.length} certificates, 
           and ${producers.length} active producers in the system.</p>
    </div>

    ${getReportContent()}

    <div class="footer">
        <p><strong>Green Hydrogen Credits System - Audit Report</strong></p>
        <p>This report was generated automatically by the GHC System for regulatory compliance and audit purposes.</p>
        <p>Report generated on ${reportDate} • Total system credits: ${stats?.activeCredits || 0} GHC</p>
        <p>For questions regarding this report, please contact the system administrator.</p>
    </div>
</body>
</html>
    `;
  };

  if (!isAuthenticated || user?.role !== 'auditor') {
    return null;
  }

  // Calculate report metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter((tx: any) => {
    const txDate = new Date(tx.timestamp);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const monthlyIssued = monthlyTransactions
    .filter((tx: any) => tx.txType === 'issue')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const monthlyRetired = monthlyTransactions
    .filter((tx: any) => tx.txType === 'retire')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const energySourceBreakdown = certificates.reduce((acc: any, cert: any) => {
    acc[cert.energySource] = (acc[cert.energySource] || 0) + cert.hydrogenKg;
    return acc;
  }, {});

  const topProducers = producers
    .sort((a: any, b: any) => b.balance - a.balance)
    .slice(0, 5);

  const complianceRate = stats ? (stats.totalRetired / stats.totalIssued * 100) : 0;

  return (
    <div className="min-h-screen bg-background role-auditor">
      <Navigation role="auditor" currentSection="reports" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="reports-title">
            System Reports
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="reports-subtitle">
            Generate comprehensive reports and analytics for regulatory compliance
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="monthly-issued">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month Issued</p>
                  <p className="text-2xl font-bold text-foreground">{monthlyIssued} GHC</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="monthly-retired">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month Retired</p>
                  <p className="text-2xl font-bold text-foreground">{monthlyRetired} GHC</p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="compliance-rate">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance Rate</p>
                  <p className="text-2xl font-bold text-foreground">{complianceRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
                  <PieChart className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="active-producers">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Producers</p>
                  <p className="text-2xl font-bold text-foreground">{producers.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Generation */}
          <div className="lg:col-span-1">
            <Card data-testid="report-generation">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Generate Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Report Type</label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger className="mt-1" data-testid="select-report-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Report</SelectItem>
                        <SelectItem value="weekly">Weekly Report</SelectItem>
                        <SelectItem value="monthly">Monthly Report</SelectItem>
                        <SelectItem value="quarterly">Quarterly Report</SelectItem>
                        <SelectItem value="annual">Annual Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Format</label>
                    <Select value={reportFormat} onValueChange={setReportFormat}>
                      <SelectTrigger className="mt-1" data-testid="select-report-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Report</SelectItem>
                        <SelectItem value="csv">CSV Data</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="json">JSON Export</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Button
                      onClick={() => handleGenerateReport("Compliance Summary")}
                      className="w-full"
                      data-testid="button-compliance-report"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Compliance Summary
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("Transaction Audit")}
                      className="w-full"
                      data-testid="button-transaction-audit"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Transaction Audit
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("Producer Performance")}
                      className="w-full"
                      data-testid="button-producer-report"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Producer Performance
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleGenerateReport("System Analytics")}
                      className="w-full"
                      data-testid="button-analytics-report"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      System Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Energy Source Breakdown */}
            <Card data-testid="energy-source-breakdown">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Energy Source Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(energySourceBreakdown).map(([source, amount]: [string, any]) => (
                    <div key={source} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-foreground font-medium">{source}</span>
                      <span className="text-foreground">{amount} kg H₂</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Producers */}
            <Card data-testid="top-producers">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Top Producers by Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProducers.map((producer: any, index: number) => (
                    <div key={producer.address} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <span className="text-foreground font-medium">{producer.name}</span>
                      </div>
                      <span className="text-foreground">{producer.balance} GHC</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Summary */}
            <Card data-testid="recent-activity">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Recent Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium text-foreground">Transactions This Month</h4>
                    <p className="text-2xl font-bold text-primary">{monthlyTransactions.length}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium text-foreground">Certificates Issued</h4>
                    <p className="text-2xl font-bold text-green-600">{certificates.length}</p>
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