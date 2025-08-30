import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

import { trpc } from '@/utils/trpc';
import type { Achievement } from '../../../server/src/schema';

interface AchievementsPanelProps {
  achievements: Achievement[];
  playerId: number;
}

export function AchievementsPanel({ achievements: initialAchievements, playerId }: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [isLoading, setIsLoading] = useState(false);

  const loadAchievements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getPlayerAchievements.query({ playerId });
      setAchievements(data);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Upcoming achievements for motivation
  const upcomingAchievements = [
    {
      id: 'upcoming_1',
      title: 'Business Mogul',
      description: 'Own 5 profitable businesses simultaneously',
      icon: '👑',
      experience_reward: 1000,
      type: 'milestone' as const,
      progress: 40, // 2 out of 5 businesses
      requirement: '2/5 businesses'
    },
    {
      id: 'upcoming_2',
      title: 'Investment Guru',
      description: 'Successfully complete 10 investments',
      icon: '📊',
      experience_reward: 750,
      type: 'milestone' as const,
      progress: 20, // 2 out of 10 investments
      requirement: '2/10 investments'
    },
    {
      id: 'upcoming_3',
      title: 'Market Leader',
      description: 'Achieve 10% market share in any industry',
      icon: '🎯',
      experience_reward: 1500,
      type: 'milestone' as const,
      progress: 25, // 2.5% out of 10%
      requirement: '2.5%/10% market share'
    },
    {
      id: 'upcoming_4',
      title: 'Wealth Builder',
      description: 'Accumulate $1,000,000 in total wealth',
      icon: '💎',
      experience_reward: 2000,
      type: 'milestone' as const,
      progress: 75, // $750,000 out of $1,000,000
      requirement: '$750K/$1M wealth'
    }
  ];

  const achievementTypeColors: Record<string, string> = {
    milestone: 'from-yellow-500/10 to-orange-500/10 border-yellow-200 dark:border-yellow-800',
    streak: 'from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800',
    badge: 'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800',
    special_event: 'from-purple-500/10 to-violet-500/10 border-purple-200 dark:border-purple-800'
  };

  const getAchievementRarity = (experienceReward: number) => {
    if (experienceReward >= 2000) return { label: 'Legendary', color: 'text-purple-600 dark:text-purple-400' };
    if (experienceReward >= 1000) return { label: 'Epic', color: 'text-orange-600 dark:text-orange-400' };
    if (experienceReward >= 500) return { label: 'Rare', color: 'text-blue-600 dark:text-blue-400' };
    return { label: 'Common', color: 'text-green-600 dark:text-green-400' };
  };

  const totalExperienceEarned = achievements.reduce((sum, achievement) => sum + achievement.experience_reward, 0);

  return (
    <div className="space-y-6">
      {/* Achievements Overview */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>🏆</span>
                <span>Achievements</span>
              </CardTitle>
              <CardDescription>
                Unlock rewards through strategic gameplay
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadAchievements}
              disabled={isLoading}
            >
              {isLoading ? '🔄' : '🔄'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Unlocked</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {achievements.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Experience</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalExperienceEarned.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Progress</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.round((achievements.length / (achievements.length + upcomingAchievements.length)) * 100)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>✨</span>
              <span>Unlocked Achievements</span>
            </CardTitle>
            <CardDescription>
              Celebrate your accomplishments and milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {achievements.map((achievement: Achievement) => {
                  const rarity = getAchievementRarity(achievement.experience_reward);
                  
                  return (
                    <div key={achievement.id}>
                      <Card className={`bg-gradient-to-r ${achievementTypeColors[achievement.achievement_type]} hover:shadow-md transition-all duration-200`}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="text-3xl animate-bounce">
                              {achievement.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                  {achievement.title}
                                </h4>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className={`text-xs ${rarity.color}`}>
                                    {rarity.label}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    +{achievement.experience_reward} XP
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {achievement.description}
                              </p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400 capitalize">
                                  {achievement.achievement_type.replace('_', ' ')}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                  Unlocked: {achievement.unlocked_at.toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>🎯</span>
            <span>In Progress</span>
          </CardTitle>
          <CardDescription>
            Work towards these achievements to unlock rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingAchievements.map((achievement) => {
              const rarity = getAchievementRarity(achievement.experience_reward);
              
              return (
                <Card key={achievement.id} className="bg-gradient-to-r from-slate-500/10 to-gray-500/10 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl opacity-60">
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-700 dark:text-slate-300">
                            {achievement.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={`text-xs ${rarity.color} opacity-75`}>
                              {rarity.label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs opacity-75">
                              +{achievement.experience_reward} XP
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {achievement.description}
                        </p>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Progress</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {achievement.requirement}
                            </span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>

                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {achievement.progress}% complete
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎲 Achievement Categories</CardTitle>
          <CardDescription>
            Explore different ways to earn achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-200 dark:border-yellow-800 text-center p-4">
              <div className="text-2xl mb-2">🏆</div>
              <p className="text-sm font-medium mb-1">Milestones</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Major accomplishments
              </p>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800 text-center p-4">
              <div className="text-2xl mb-2">🔥</div>
              <p className="text-sm font-medium mb-1">Streaks</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Consistent performance
              </p>
            </Card>
            
            <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800 text-center p-4">
              <div className="text-2xl mb-2">🏅</div>
              <p className="text-sm font-medium mb-1">Badges</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Skill recognition
              </p>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-200 dark:border-purple-800 text-center p-4">
              <div className="text-2xl mb-2">⭐</div>
              <p className="text-sm font-medium mb-1">Special</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Limited-time events
              </p>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800 text-center">
          <CardContent className="p-4">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Completion Rate</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {Math.round((achievements.length / (achievements.length + upcomingAchievements.length)) * 100)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800 text-center">
          <CardContent className="p-4">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total XP</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {totalExperienceEarned.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-200 dark:border-purple-800 text-center">
          <CardContent className="p-4">
            <div className="text-2xl mb-2">🏆</div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Rank</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              Elite
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}