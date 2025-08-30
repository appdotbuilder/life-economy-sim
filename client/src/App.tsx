import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { DashboardKPIs } from '@/components/DashboardKPIs';
import { BusinessManager } from '@/components/BusinessManager';
import { MarketEventsFeed } from '@/components/MarketEventsFeed';
import { InvestmentPortfolio } from '@/components/InvestmentPortfolio';
import { Leaderboard } from '@/components/Leaderboard';
import { LifeChoicesPanel } from '@/components/LifeChoicesPanel';
import { AchievementsPanel } from '@/components/AchievementsPanel';
import type { DashboardData, Player } from '../../server/src/schema';

function App() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev: boolean) => {
      const newTheme = !prev;
      document.documentElement.classList.toggle('dark', newTheme);
      return newTheme;
    });
  }, []);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      // Using player ID 1 as default - in real app this would be from auth
      const data = await trpc.getDashboardData.query({ playerId: 1 });
      setDashboardData(data);
      setCurrentPlayer(data.player);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Fallback to local demo data when API is unavailable
      const fallbackData = {
        player: {
          id: 1,
          username: "DemoPlayer",
          email: "demo@lifeeconomy.com",
          total_wealth: 75000,
          experience_points: 2250,
          level: 4,
          created_at: new Date(),
          last_active: new Date()
        },
        businesses: [
          {
            id: 1,
            player_id: 1,
            name: "Tech Solutions Inc",
            industry: 'technology' as const,
            monthly_income: 18000,
            monthly_expenses: 10000,
            employee_count: 8,
            growth_rate: 0.18,
            market_share: 0.025,
            is_active: true,
            created_at: new Date()
          },
          {
            id: 2,
            player_id: 1,
            name: "Green Energy Co",
            industry: 'manufacturing' as const,
            monthly_income: 12000,
            monthly_expenses: 8500,
            employee_count: 5,
            growth_rate: 0.12,
            market_share: 0.018,
            is_active: true,
            created_at: new Date()
          }
        ],
        recent_market_events: [
          {
            id: 1,
            title: "AI Revolution",
            description: "Artificial Intelligence adoption accelerating across all industries",
            event_type: 'innovation_breakthrough' as const,
            impact_magnitude: 0.6,
            affected_industry: null,
            duration_hours: 168,
            is_active: true,
            created_at: new Date(),
            expires_at: new Date(Date.now() + 168 * 60 * 60 * 1000)
          }
        ],
        recent_achievements: [
          {
            id: 1,
            player_id: 1,
            achievement_type: 'milestone' as const,
            title: "Multi-Business Owner",
            description: "Successfully operating multiple businesses simultaneously",
            icon: "🏭",
            experience_reward: 300,
            unlocked_at: new Date()
          }
        ],
        active_investments: [
          {
            id: 1,
            player_id: 1,
            business_id: null,
            investment_type: 'cryptocurrency' as const,
            title: "Crypto Portfolio",
            description: "Diversified cryptocurrency investment portfolio",
            amount_invested: 20000,
            expected_return: 5000,
            actual_return: 0,
            risk_level: 8,
            duration_months: 6,
            is_completed: false,
            created_at: new Date(),
            completed_at: null
          }
        ]
      };
      setDashboardData(fallbackData);
      setCurrentPlayer(fallbackData.player);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    // Apply initial theme
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [loadDashboard, isDarkMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">Loading LifeEconomy...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTitle>⚠️ Connection Error</AlertTitle>
          <AlertDescription>
            Unable to load your LifeEconomy data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const xpToNextLevel = (currentPlayer.level + 1) * 1000;
  const xpProgress = (currentPlayer.experience_points % 1000) / 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                🌐 LifeEconomy
              </h1>
              <Badge variant="outline" className="hidden sm:flex">
                v2.1.0
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Player Info */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {currentPlayer.username}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Level {currentPlayer.level}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
                  {currentPlayer.username.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="sm"
                className="rounded-full"
              >
                {isDarkMode ? '🌙' : '☀️'}
              </Button>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div className="mt-3 flex items-center space-x-3">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              XP: {currentPlayer.experience_points.toLocaleString()}
            </span>
            <Progress value={xpProgress} className="flex-1 h-2" />
            <span className="text-xs text-slate-500 dark:text-slate-500">
              {xpToNextLevel - (currentPlayer.experience_points % 1000)} to Level {currentPlayer.level + 1}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Wealth Overview */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-700 dark:text-green-400">Total Wealth</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-800 dark:text-green-300">
                ${currentPlayer.total_wealth.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                🎯 Your economic empire grows stronger
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KPI Dashboard */}
        <div className="mb-8">
          <DashboardKPIs businesses={dashboardData.businesses} />
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="investments">Invest</TabsTrigger>
            <TabsTrigger value="life">Life</TabsTrigger>
            <TabsTrigger value="leaderboard">Rankings</TabsTrigger>
            <TabsTrigger value="achievements">Awards</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <MarketEventsFeed events={dashboardData.recent_market_events} />
                <BusinessManager 
                  businesses={dashboardData.businesses}
                  playerId={currentPlayer.id}
                  onUpdate={loadDashboard}
                />
              </div>
              
              <div className="space-y-6">
                <InvestmentPortfolio investments={dashboardData.active_investments} />
                <AchievementsPanel 
                  achievements={dashboardData.recent_achievements}
                  playerId={currentPlayer.id}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="business">
            <BusinessManager 
              businesses={dashboardData.businesses}
              playerId={currentPlayer.id}
              onUpdate={loadDashboard}
            />
          </TabsContent>

          <TabsContent value="investments">
            <InvestmentPortfolio investments={dashboardData.active_investments} />
          </TabsContent>

          <TabsContent value="life">
            <LifeChoicesPanel playerId={currentPlayer.id} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementsPanel 
              achievements={dashboardData.recent_achievements}
              playerId={currentPlayer.id}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;