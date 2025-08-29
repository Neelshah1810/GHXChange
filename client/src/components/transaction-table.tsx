import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Transaction } from "@shared/schema";

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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewTransaction?.(transaction.txHash)}
                            data-testid={`button-view-${transaction.id}`}
                          >
                            View
                          </Button>
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
