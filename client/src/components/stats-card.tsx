import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  subtitle, 
  change, 
  changeType = 'neutral' 
}: StatsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card data-testid={`stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground" data-testid={`stats-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground" data-testid={`stats-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
          </div>
          <div className={`w-12 h-12 ${iconColor} rounded-full flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {(subtitle || change) && (
          <div className="mt-2">
            {change && (
              <p className={`text-xs ${getChangeColor()}`} data-testid={`stats-change-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {change}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground" data-testid={`stats-subtitle-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {subtitle}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
