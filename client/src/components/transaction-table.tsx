import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Transaction } from "@shared/schema";
import { Eye, Hash, Calendar, ArrowRightLeft, User } from "lucide-react";

interface TransactionTableProps {
  title: string;
  transactions: Transaction[];
  showAllColumns?: boolean;
  showActions?: boolean;
  onViewAll?: () => void;
  onViewTransaction?: (txHash: string) => void;
  onVerifyTransaction?: (txHash: string) => void;
}

export function TransactionTable({ 
  title, 
  transactions, 
  showAllColumns = false,
  showActions = false,
  onViewAll,
  onViewTransaction,
  onVerifyTransaction
}: TransactionTableProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'retired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAddress = (address: string) => {
    if (address === "SYSTEM") return "SYSTEM";
    if (address === "0x000000000000000000000000000000000000dEaD") return "Burn Address";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Card data-testid={`transaction-table-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            {title}
          </CardTitle>
          {onViewAll && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAll}
              data-testid="button-view-all-transactions"
            >
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="transactions-table">
            <thead>
              <tr className="border-b border-border">
                {showAllColumns && (
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Tx Hash
                  </th>
                )}
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Type
                </th>
                {showAllColumns && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      From
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      To
                    </th>
                  </>
                )}
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                {showActions && (
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td 
                    colSpan={showAllColumns ? (showActions ? 7 : 6) : (showActions ? 5 : 4)} 
                    className="py-8 text-center text-muted-foreground"
                    data-testid="no-transactions-message"
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr 
                    key={transaction.id} 
                    className="border-b border-border"
                    data-testid={`transaction-row-${transaction.id}`}
                  >
                    {showAllColumns && (
                      <td className="py-3 px-4 text-sm text-foreground font-mono">
                        {formatAddress(transaction.txHash)}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-foreground">
                      {formatDate(transaction.timestamp!)}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground capitalize">
                      {transaction.txType}
                    </td>
                    {showAllColumns && (
                      <>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {formatAddress(transaction.fromAddress)}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {formatAddress(transaction.toAddress)}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4 text-sm text-foreground">
                      {transaction.txType === 'retire' ? '-' : ''}
                      {transaction.amount} GHC
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        className={getStatusColor(transaction.status!)}
                        data-testid={`transaction-status-${transaction.id}`}
                      >
                        {transaction.status}
                      </Badge>
                    </td>
                    {showActions && (
                      <td className="py-3 px-4">
                        {transaction.status === 'pending' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onVerifyTransaction?.(transaction.txHash)}
                            data-testid={`button-verify-${transaction.id}`}
                          >
                            Verify
                          </Button>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-view-${transaction.id}`}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center text-lg">
                                  <Hash className="w-5 h-5 mr-2 text-primary" />
                                  Transaction Details
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6 pb-6">
                                {/* Transaction Overview */}
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-center">
                                        <p className="text-2xl font-bold text-foreground">{transaction.amount} GHC</p>
                                        <p className="text-sm text-muted-foreground">Amount</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardContent className="p-4">
                                      <div className="text-center">
                                        <Badge className={getStatusColor(transaction.status!)}>
                                          {transaction.status?.toUpperCase()}
                                        </Badge>
                                        <p className="text-sm text-muted-foreground mt-2">Status</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                <Separator />

                                {/* Transaction Details */}
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold text-foreground">Transaction Information</h3>
                                  
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                                      <Hash className="w-5 h-5 text-muted-foreground" />
                                      <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Transaction Hash</p>
                                        <p className="font-mono text-sm text-foreground break-all">{transaction.txHash}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                                      <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                                      <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Transaction Type</p>
                                        <p className="font-semibold text-foreground capitalize">{transaction.txType}</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                                      <Calendar className="w-5 h-5 text-muted-foreground" />
                                      <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Timestamp</p>
                                        <p className="font-semibold text-foreground">
                                          {new Date(transaction.timestamp!).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                          <p className="text-sm text-muted-foreground">From Address</p>
                                          <p className="font-mono text-sm text-foreground break-all">
                                            {transaction.fromAddress === "SYSTEM" 
                                              ? "SYSTEM" 
                                              : transaction.fromAddress
                                            }
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                          <p className="text-sm text-muted-foreground">To Address</p>
                                          <p className="font-mono text-sm text-foreground break-all">
                                            {transaction.toAddress === "0x000000000000000000000000000000000000dEaD" 
                                              ? "Burn Address (0x000000000000000000000000000000000000dEaD)" 
                                              : transaction.toAddress
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {transaction.signature && (
                                      <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                                        <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                          <p className="text-sm text-muted-foreground">Digital Signature</p>
                                          <p className="font-mono text-sm text-foreground break-all">
                                            {transaction.signature}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {transaction.data && (
                                      <div className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                                        <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                          <p className="text-sm text-muted-foreground">Additional Data</p>
                                          <pre className="text-xs text-foreground bg-background p-2 rounded mt-1 overflow-x-auto">
                                            {JSON.stringify(transaction.data, null, 2)}
                                          </pre>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Transaction Impact */}
                                {(transaction.txType === 'retire' || transaction.txType === 'issue') && (
                                  <>
                                    <Separator />
                                    <div>
                                      <h3 className="text-lg font-semibold text-foreground mb-3">Environmental Impact</h3>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                          <CardContent className="p-4 text-center">
                                            <p className="text-xl font-bold text-green-700 dark:text-green-300">
                                              {transaction.txType === 'retire' 
                                                ? `${(transaction.amount * 10.4).toFixed(1)} kg` 
                                                : `+${(transaction.amount * 10.4).toFixed(1)} kg`
                                              }
                                            </p>
                                            <p className="text-sm text-green-600 dark:text-green-400">
                                              CO₂ {transaction.txType === 'retire' ? 'Emissions Avoided' : 'Potential Savings'}
                                            </p>
                                          </CardContent>
                                        </Card>
                                        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                          <CardContent className="p-4 text-center">
                                            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                              {transaction.txType === 'retire' 
                                                ? `${(transaction.amount * 0.033).toFixed(2)} MWh` 
                                                : `+${(transaction.amount * 0.033).toFixed(2)} MWh`
                                              }
                                            </p>
                                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                              {transaction.txType === 'retire' ? 'Green Energy Used' : 'Green Energy Certified'}
                                            </p>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
