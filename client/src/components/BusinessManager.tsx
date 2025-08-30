import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Business, CreateBusinessInput } from '../../../server/src/schema';

interface BusinessManagerProps {
  businesses: Business[];
  playerId: number;
  onUpdate: () => void;
}

export function BusinessManager({ businesses, playerId, onUpdate }: BusinessManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newBusiness, setNewBusiness] = useState<CreateBusinessInput>({
    player_id: playerId,
    name: '',
    industry: 'technology',
    monthly_income: 0,
    monthly_expenses: 0,
  });

  const industryIcons: Record<string, string> = {
    technology: '💻',
    finance: '💰',
    healthcare: '🏥',
    retail: '🛍️',
    manufacturing: '🏭',
    real_estate: '🏢',
    entertainment: '🎬',
    food_service: '🍕'
  };

  const industryColors: Record<string, string> = {
    technology: 'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800',
    finance: 'from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800',
    healthcare: 'from-red-500/10 to-pink-500/10 border-red-200 dark:border-red-800',
    retail: 'from-purple-500/10 to-violet-500/10 border-purple-200 dark:border-purple-800',
    manufacturing: 'from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800',
    real_estate: 'from-indigo-500/10 to-blue-500/10 border-indigo-200 dark:border-indigo-800',
    entertainment: 'from-pink-500/10 to-rose-500/10 border-pink-200 dark:border-pink-800',
    food_service: 'from-yellow-500/10 to-orange-500/10 border-yellow-200 dark:border-yellow-800'
  };

  const handleCreateBusiness = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusiness.name) return;

    try {
      setIsLoading(true);
      await trpc.createBusiness.mutate(newBusiness);
      setNewBusiness({
        player_id: playerId,
        name: '',
        industry: 'technology',
        monthly_income: 0,
        monthly_expenses: 0,
      });
      setIsCreateDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to create business:', error);
    } finally {
      setIsLoading(false);
    }
  }, [newBusiness, playerId, onUpdate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGrowthTrend = (rate: number) => {
    if (rate > 0.15) return { color: 'text-green-600 dark:text-green-400', text: 'Excellent' };
    if (rate > 0.05) return { color: 'text-blue-600 dark:text-blue-400', text: 'Good' };
    if (rate > 0) return { color: 'text-yellow-600 dark:text-yellow-400', text: 'Moderate' };
    return { color: 'text-red-600 dark:text-red-400', text: 'Declining' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            🏢 Business Empire
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage and expand your business portfolio
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
              <span className="mr-2">🚀</span>
              Start New Business
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Launch New Business</DialogTitle>
              <DialogDescription>
                Create a new business venture to expand your empire
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateBusiness} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  value={newBusiness.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewBusiness(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter business name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={newBusiness.industry || 'technology'}
                  onValueChange={(value: 'technology' | 'finance' | 'healthcare' | 'retail' | 'manufacturing' | 'real_estate' | 'entertainment' | 'food_service') =>
                    setNewBusiness(prev => ({ ...prev, industry: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(industryIcons).map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        <span className="flex items-center space-x-2">
                          <span>{industryIcons[industry]}</span>
                          <span className="capitalize">{industry.replace('_', ' ')}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="income">Initial Monthly Income</Label>
                  <Input
                    id="income"
                    type="number"
                    min="0"
                    step="100"
                    value={newBusiness.monthly_income}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewBusiness(prev => ({ 
                        ...prev, 
                        monthly_income: parseFloat(e.target.value) || 0 
                      }))
                    }
                    placeholder="$0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expenses">Initial Monthly Expenses</Label>
                  <Input
                    id="expenses"
                    type="number"
                    min="0"
                    step="100"
                    value={newBusiness.monthly_expenses}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewBusiness(prev => ({ 
                        ...prev, 
                        monthly_expenses: parseFloat(e.target.value) || 0 
                      }))
                    }
                    placeholder="$0"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Creating...' : 'Launch Business 🚀'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {businesses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🏗️</div>
            <CardTitle className="mb-2">Ready to Build Your Empire?</CardTitle>
            <CardDescription className="mb-4">
              Start your first business and begin your journey to economic success!
            </CardDescription>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-violet-600"
            >
              Launch Your First Business
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {businesses.map((business: Business) => {
            const monthlyProfit = business.monthly_income - business.monthly_expenses;
            const growthTrend = getGrowthTrend(business.growth_rate);
            
            return (
              <Card 
                key={business.id} 
                className={`bg-gradient-to-r ${industryColors[business.industry]} hover:shadow-lg transition-all duration-200`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">
                        {industryIcons[business.industry]}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{business.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {business.industry.replace('_', ' ')}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={business.is_active ? 'default' : 'secondary'}>
                      {business.is_active ? '🟢 Active' : '⭕ Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Financial Overview */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Monthly Revenue</p>
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(business.monthly_income)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Monthly Expenses</p>
                      <p className="font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(business.monthly_expenses)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Net Profit */}
                  <div className="text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Monthly Profit</p>
                    <p className={`text-xl font-bold ${monthlyProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(monthlyProfit)}
                    </p>
                  </div>

                  <Separator />

                  {/* Performance Metrics */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400">👥 Employees</span>
                      <span className="font-medium">{business.employee_count}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400">📈 Growth Rate</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${growthTrend.color}`}>
                          {(business.growth_rate * 100).toFixed(1)}%
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {growthTrend.text}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400">🎯 Market Share</span>
                      <span className="font-medium">{(business.market_share * 100).toFixed(2)}%</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Market Position</span>
                        <span>{(business.market_share * 100).toFixed(2)}%</span>
                      </div>
                      <Progress value={business.market_share * 100 * 20} className="h-2" />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      📊 Analytics
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      ⚙️ Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}