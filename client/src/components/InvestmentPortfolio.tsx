import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import type { Investment, CreateInvestmentInput } from '../../../server/src/schema';

interface InvestmentPortfolioProps {
  investments: Investment[];
}

export function InvestmentPortfolio({ investments }: InvestmentPortfolioProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newInvestment, setNewInvestment] = useState<CreateInvestmentInput>({
    player_id: 1, // This would come from auth context in real app
    business_id: null,
    investment_type: 'stocks',
    title: '',
    description: '',
    amount_invested: 0,
    expected_return: 0,
    risk_level: 1,
    duration_months: 12,
  });

  const investmentTypeIcons: Record<string, string> = {
    stocks: '📈',
    marketing_campaign: '📢',
    business_expansion: '🏗️',
    real_estate: '🏘️',
    cryptocurrency: '₿',
    research_development: '🔬'
  };

  const investmentTypeColors: Record<string, string> = {
    stocks: 'from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800',
    marketing_campaign: 'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800',
    business_expansion: 'from-purple-500/10 to-violet-500/10 border-purple-200 dark:border-purple-800',
    real_estate: 'from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800',
    cryptocurrency: 'from-yellow-500/10 to-orange-500/10 border-yellow-200 dark:border-yellow-800',
    research_development: 'from-indigo-500/10 to-blue-500/10 border-indigo-200 dark:border-indigo-800'
  };

  const getRiskColor = (level: number) => {
    if (level >= 8) return 'text-red-600 dark:text-red-400';
    if (level >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getRiskLabel = (level: number) => {
    if (level >= 8) return 'High Risk';
    if (level >= 5) return 'Medium Risk';
    return 'Low Risk';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProgress = (investment: Investment) => {
    const createdAt = new Date(investment.created_at);
    const now = new Date();
    const totalDuration = investment.duration_months * 30 * 24 * 60 * 60 * 1000; // Convert to milliseconds
    const elapsed = now.getTime() - createdAt.getTime();
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  const handleCreateInvestment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestment.title || !newInvestment.description) return;

    try {
      setIsLoading(true);
      await trpc.createInvestment.mutate(newInvestment);
      setNewInvestment({
        player_id: 1,
        business_id: null,
        investment_type: 'stocks',
        title: '',
        description: '',
        amount_invested: 0,
        expected_return: 0,
        risk_level: 1,
        duration_months: 12,
      });
      setIsCreateDialogOpen(false);
      // In a real app, you'd call onUpdate here
    } catch (error) {
      console.error('Failed to create investment:', error);
    } finally {
      setIsLoading(false);
    }
  }, [newInvestment]);

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount_invested, 0);
  const totalExpectedReturns = investments.reduce((sum, inv) => sum + inv.expected_return, 0);
  const activeInvestments = investments.filter(inv => !inv.is_completed);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>💼</span>
                <span>Investment Portfolio</span>
              </CardTitle>
              <CardDescription>
                Track and manage your investment opportunities
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600">
                  <span className="mr-1">💰</span>
                  New Investment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Investment</DialogTitle>
                  <DialogDescription>
                    Add a new investment opportunity to your portfolio
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateInvestment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Investment Title</Label>
                    <Input
                      id="title"
                      value={newInvestment.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewInvestment(prev => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="e.g., Tech Stock Portfolio"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investment_type">Investment Type</Label>
                    <Select
                      value={newInvestment.investment_type || 'stocks'}
                      onValueChange={(value: 'stocks' | 'marketing_campaign' | 'business_expansion' | 'real_estate' | 'cryptocurrency' | 'research_development') =>
                        setNewInvestment(prev => ({ ...prev, investment_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(investmentTypeIcons).map((type) => (
                          <SelectItem key={type} value={type}>
                            <span className="flex items-center space-x-2">
                              <span>{investmentTypeIcons[type]}</span>
                              <span className="capitalize">{type.replace('_', ' ')}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newInvestment.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNewInvestment(prev => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Describe your investment strategy..."
                      className="h-20"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Investment Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        step="100"
                        value={newInvestment.amount_invested}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewInvestment(prev => ({ 
                            ...prev, 
                            amount_invested: parseFloat(e.target.value) || 0 
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expected">Expected Return ($)</Label>
                      <Input
                        id="expected"
                        type="number"
                        min="0"
                        step="100"
                        value={newInvestment.expected_return}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewInvestment(prev => ({ 
                            ...prev, 
                            expected_return: parseFloat(e.target.value) || 0 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="risk">Risk Level (1-10)</Label>
                      <Input
                        id="risk"
                        type="number"
                        min="1"
                        max="10"
                        value={newInvestment.risk_level}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewInvestment(prev => ({ 
                            ...prev, 
                            risk_level: parseInt(e.target.value) || 1 
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (months)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="120"
                        value={newInvestment.duration_months}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewInvestment(prev => ({ 
                            ...prev, 
                            duration_months: parseInt(e.target.value) || 12 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? 'Creating...' : 'Create Investment 💰'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Portfolio Summary */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Invested</p>
              <p className="text-lg font-bold text-violet-600 dark:text-violet-400">
                {formatCurrency(totalInvested)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Expected Returns</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalExpectedReturns)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Investments</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {activeInvestments.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Cards */}
      {investments.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <div className="text-4xl mb-3">📊</div>
            <CardTitle className="mb-2">Start Your Investment Journey</CardTitle>
            <CardDescription className="mb-4">
              Build wealth through strategic investments and diversified portfolio
            </CardDescription>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-violet-600 to-purple-600"
            >
              Make Your First Investment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {investments.map((investment: Investment) => {
            const progress = calculateProgress(investment);
            const remainingMonths = Math.max(0, investment.duration_months - Math.floor(progress / 100 * investment.duration_months));
            
            return (
              <Card 
                key={investment.id} 
                className={`bg-gradient-to-r ${investmentTypeColors[investment.investment_type]}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {investmentTypeIcons[investment.investment_type]}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{investment.title}</CardTitle>
                        <CardDescription className="capitalize">
                          {investment.investment_type.replace('_', ' ')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={investment.is_completed ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {investment.is_completed ? '✅ Completed' : '🔄 Active'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getRiskColor(investment.risk_level)}`}
                      >
                        {getRiskLabel(investment.risk_level)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {investment.description}
                  </p>
                  
                  <Separator />
                  
                  {/* Investment Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Amount Invested</p>
                      <p className="font-bold text-violet-600 dark:text-violet-400">
                        {formatCurrency(investment.amount_invested)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Expected Return</p>
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(investment.expected_return)}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  {!investment.is_completed && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Progress</span>
                        <span>{remainingMonths} months remaining</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {investment.is_completed && (
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        <span className="font-bold">Actual Return: {formatCurrency(investment.actual_return)}</span>
                      </p>
                      <p className="text-xs text-green-500 mt-1">
                        ROI: {((investment.actual_return / investment.amount_invested) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}