import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Business } from '../../../server/src/schema';

interface DashboardKPIsProps {
  businesses: Business[];
}

export function DashboardKPIs({ businesses }: DashboardKPIsProps) {
  // Calculate aggregate metrics
  const totalMonthlyIncome = businesses.reduce((sum, b) => sum + b.monthly_income, 0);
  const totalMonthlyExpenses = businesses.reduce((sum, b) => sum + b.monthly_expenses, 0);
  const monthlyProfit = totalMonthlyIncome - totalMonthlyExpenses;
  const totalEmployees = businesses.reduce((sum, b) => sum + b.employee_count, 0);
  const avgGrowthRate = businesses.length > 0 
    ? businesses.reduce((sum, b) => sum + b.growth_rate, 0) / businesses.length 
    : 0;
  const totalMarketShare = businesses.reduce((sum, b) => sum + b.market_share, 0);

  const kpis = [
    {
      title: 'Monthly Profit',
      value: `$${monthlyProfit.toLocaleString()}`,
      change: monthlyProfit > 0 ? '+' : '',
      trend: monthlyProfit > 0 ? 'positive' : 'negative',
      icon: '💰',
      description: 'Net monthly earnings'
    },
    {
      title: 'Total Revenue',
      value: `$${totalMonthlyIncome.toLocaleString()}`,
      change: '+',
      trend: 'positive' as const,
      icon: '📈',
      description: 'Combined business income'
    },
    {
      title: 'Active Businesses',
      value: businesses.filter(b => b.is_active).length.toString(),
      change: '',
      trend: 'neutral' as const,
      icon: '🏢',
      description: 'Running enterprises'
    },
    {
      title: 'Total Employees',
      value: totalEmployees.toString(),
      change: '',
      trend: 'neutral' as const,
      icon: '👥',
      description: 'Workforce size'
    },
    {
      title: 'Avg Growth Rate',
      value: `${(avgGrowthRate * 100).toFixed(1)}%`,
      change: avgGrowthRate > 0 ? '+' : '',
      trend: avgGrowthRate > 0.1 ? 'positive' : avgGrowthRate < 0 ? 'negative' : 'neutral',
      icon: '📊',
      description: 'Business expansion rate'
    },
    {
      title: 'Market Share',
      value: `${(totalMarketShare * 100).toFixed(2)}%`,
      change: '',
      trend: 'neutral' as const,
      icon: '🎯',
      description: 'Combined market presence'
    }
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getTrendBg = (trend: string) => {
    switch (trend) {
      case 'positive':
        return 'from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800';
      case 'negative':
        return 'from-red-500/10 to-pink-500/10 border-red-200 dark:border-red-800';
      default:
        return 'from-blue-500/10 to-violet-500/10 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          📊 Key Performance Indicators
        </h2>
        <Badge variant="outline" className="text-xs">
          Real-time Data
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => (
          <Card 
            key={index} 
            className={`bg-gradient-to-r ${getTrendBg(kpi.trend)} hover:shadow-lg transition-all duration-200`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {kpi.title}
                </CardTitle>
                <span className="text-lg">{kpi.icon}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <span className={`text-2xl font-bold ${getTrendColor(kpi.trend)}`}>
                  {kpi.change}{kpi.value}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profit Margin Indicator */}
      {totalMonthlyIncome > 0 && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center space-x-2">
              <span>💹</span>
              <span>Profit Margin Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Revenue</span>
                <span className="font-medium">${totalMonthlyIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Expenses</span>
                <span className="font-medium">${totalMonthlyExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span>Profit Margin</span>
                <span className={monthlyProfit > 0 ? 'text-green-600' : 'text-red-600'}>
                  {((monthlyProfit / totalMonthlyIncome) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, ((monthlyProfit / totalMonthlyIncome) * 100) + 50))} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}