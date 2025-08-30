import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import type { LeaderboardEntry } from '../../../server/src/schema';

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadLeaderboard = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      const data = await trpc.getLeaderboard.query({ page, limit: 10 });
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard(currentPage);
  }, [loadLeaderboard, currentPage]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: amount >= 1000000 ? 1 : 0,
    }).format(amount);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🏆';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-orange-500';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-600 to-yellow-700';
      default: return 'from-slate-400 to-slate-600';
    }
  };

  const getWealthProgress = (wealth: number, maxWealth: number) => {
    return maxWealth > 0 ? (wealth / maxWealth) * 100 : 0;
  };

  if (isLoading) {
    return (
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🏆</span>
            <span>Global Leaderboard</span>
          </CardTitle>
          <CardDescription>Loading the world's top entrepreneurs...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  const maxWealth = leaderboard.length > 0 ? leaderboard[0].total_wealth : 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🏆</span>
            <span>Global Leaderboard</span>
          </CardTitle>
          <CardDescription>
            Compete with players worldwide in the ultimate economic challenge
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-slate-600 dark:text-slate-400">
                No leaderboard data available
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Top 3 Podium */}
              {leaderboard.slice(0, 3).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-center">🎖️ Hall of Fame</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {leaderboard.slice(0, 3).map((entry: LeaderboardEntry) => (
                      <Card 
                        key={entry.player.id}
                        className={`bg-gradient-to-br ${getRankColor(entry.rank)} text-white shadow-lg`}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="text-3xl mb-2">{getRankIcon(entry.rank)}</div>
                          <Avatar className="mx-auto mb-3 h-16 w-16 border-4 border-white/30">
                            <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                              {entry.player.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <h4 className="font-bold text-lg mb-1">{entry.player.username}</h4>
                          <p className="text-sm opacity-90 mb-2">Level {entry.player.level}</p>
                          <div className="space-y-1">
                            <p className="text-2xl font-bold">{formatCurrency(entry.total_wealth)}</p>
                            <p className="text-xs opacity-75">
                              {entry.business_count} business{entry.business_count !== 1 ? 'es' : ''}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Full Ranking List */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">📈 Full Rankings</h3>
                {leaderboard.map((entry: LeaderboardEntry) => (
                  <Card key={entry.player.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold">
                          {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold">
                                {entry.player.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                {entry.player.username}
                              </h4>
                              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                                <span>Level {entry.player.level}</span>
                                <span>•</span>
                                <span>{entry.player.experience_points.toLocaleString()} XP</span>
                              </div>
                            </div>
                          </div>

                          {/* Wealth Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">Total Wealth</span>
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(entry.total_wealth)}
                              </span>
                            </div>
                            <Progress 
                              value={getWealthProgress(entry.total_wealth, maxWealth)} 
                              className="h-2"
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex flex-col items-end space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {entry.business_count} 🏢
                          </Badge>
                          {entry.rank <= 10 && (
                            <Badge variant="secondary" className="text-xs">
                              Top 10
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={leaderboard.length < 10}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">💰</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Top Wealth</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {maxWealth > 0 ? formatCurrency(maxWealth) : '$0'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active Players</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {leaderboard.length.toLocaleString()}+
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🏢</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Businesses</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {leaderboard.reduce((sum, entry) => sum + entry.business_count, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}