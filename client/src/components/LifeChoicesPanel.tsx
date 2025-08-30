import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import type { LifeChoice, CreateLifeChoiceInput } from '../../../server/src/schema';

interface LifeChoicesPanelProps {
  playerId: number;
}

export function LifeChoicesPanel({ playerId }: LifeChoicesPanelProps) {
  const [choices, setChoices] = useState<LifeChoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newChoice, setNewChoice] = useState<CreateLifeChoiceInput>({
    player_id: playerId,
    choice_type: 'luxury_purchase',
    title: '',
    description: '',
    cost: 0,
    wealth_impact: 0,
    business_impact: 0,
    experience_gain: 0,
  });

  const loadLifeChoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getPlayerLifeChoices.query({ 
        playerId, 
        page: 1, 
        limit: 20 
      });
      setChoices(data);
    } catch (error) {
      console.error('Failed to load life choices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadLifeChoices();
  }, [loadLifeChoices]);

  const choiceTypeIcons: Record<string, string> = {
    luxury_purchase: '💎',
    networking_event: '🤝',
    education: '📚',
    health_wellness: '🏃‍♂️',
    family_time: '👨‍👩‍👧‍👦',
    savings_investment: '🏦'
  };

  const choiceTypeColors: Record<string, string> = {
    luxury_purchase: 'from-purple-500/10 to-violet-500/10 border-purple-200 dark:border-purple-800',
    networking_event: 'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800',
    education: 'from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800',
    health_wellness: 'from-red-500/10 to-pink-500/10 border-red-200 dark:border-red-800',
    family_time: 'from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800',
    savings_investment: 'from-indigo-500/10 to-blue-500/10 border-indigo-200 dark:border-indigo-800'
  };

  const predefinedChoices = [
    {
      choice_type: 'luxury_purchase' as const,
      title: 'Luxury Sports Car',
      description: 'Purchase a high-end sports car to boost your status and confidence',
      cost: 150000,
      wealth_impact: -150000,
      business_impact: 0.05,
      experience_gain: 200
    },
    {
      choice_type: 'networking_event' as const,
      title: 'Elite Business Conference',
      description: 'Attend an exclusive networking event with industry leaders',
      cost: 5000,
      wealth_impact: -5000,
      business_impact: 0.15,
      experience_gain: 500
    },
    {
      choice_type: 'education' as const,
      title: 'MBA Program',
      description: 'Enroll in a prestigious MBA program to enhance business skills',
      cost: 75000,
      wealth_impact: -75000,
      business_impact: 0.25,
      experience_gain: 1000
    },
    {
      choice_type: 'health_wellness' as const,
      title: 'Personal Trainer & Nutritionist',
      description: 'Invest in your health with professional fitness and nutrition guidance',
      cost: 12000,
      wealth_impact: -12000,
      business_impact: 0.08,
      experience_gain: 300
    },
    {
      choice_type: 'family_time' as const,
      title: 'Family Vacation',
      description: 'Take your family on a luxury vacation to strengthen relationships',
      cost: 25000,
      wealth_impact: -25000,
      business_impact: 0.03,
      experience_gain: 250
    },
    {
      choice_type: 'savings_investment' as const,
      title: 'Emergency Fund',
      description: 'Build a substantial emergency fund for financial security',
      cost: 50000,
      wealth_impact: -50000,
      business_impact: 0.02,
      experience_gain: 150
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getImpactColor = (impact: number) => {
    if (impact > 0.1) return 'text-green-600 dark:text-green-400';
    if (impact > 0) return 'text-blue-600 dark:text-blue-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  const getImpactDescription = (impact: number) => {
    if (impact >= 0.2) return 'Major Boost';
    if (impact >= 0.1) return 'Significant Impact';
    if (impact >= 0.05) return 'Moderate Effect';
    if (impact > 0) return 'Minor Benefit';
    return 'No Business Impact';
  };

  const handleCreateChoice = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChoice.title || !newChoice.description) return;

    try {
      setIsCreating(true);
      await trpc.createLifeChoice.mutate(newChoice);
      setNewChoice({
        player_id: playerId,
        choice_type: 'luxury_purchase',
        title: '',
        description: '',
        cost: 0,
        wealth_impact: 0,
        business_impact: 0,
        experience_gain: 0,
      });
      setIsCreateDialogOpen(false);
      loadLifeChoices();
    } catch (error) {
      console.error('Failed to create life choice:', error);
    } finally {
      setIsCreating(false);
    }
  }, [newChoice, playerId, loadLifeChoices]);

  const handlePredefinedChoice = useCallback((choice: typeof predefinedChoices[0]) => {
    setNewChoice({
      ...choice,
      player_id: playerId,
    });
  }, [playerId]);

  const makeLifeChoice = useCallback(async (choice: typeof predefinedChoices[0]) => {
    try {
      await trpc.createLifeChoice.mutate({
        ...choice,
        player_id: playerId,
      });
      loadLifeChoices();
    } catch (error) {
      console.error('Failed to make life choice:', error);
    }
  }, [playerId, loadLifeChoices]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>🌟</span>
                <span>Life Choices</span>
              </CardTitle>
              <CardDescription>
                Make personal decisions that shape your business journey
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                  <span className="mr-1">✨</span>
                  Custom Choice
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Custom Life Choice</DialogTitle>
                  <DialogDescription>
                    Design a personal decision that will impact your journey
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateChoice} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Choice Title</Label>
                    <Input
                      id="title"
                      value={newChoice.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewChoice(prev => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="e.g., Start a Podcast"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="choice_type">Category</Label>
                    <Select
                      value={newChoice.choice_type || 'luxury_purchase'}
                      onValueChange={(value: 'luxury_purchase' | 'networking_event' | 'education' | 'health_wellness' | 'family_time' | 'savings_investment') =>
                        setNewChoice(prev => ({ ...prev, choice_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(choiceTypeIcons).map((type) => (
                          <SelectItem key={type} value={type}>
                            <span className="flex items-center space-x-2">
                              <span>{choiceTypeIcons[type]}</span>
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
                      value={newChoice.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNewChoice(prev => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Describe the choice and its potential impacts..."
                      className="h-20"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cost">Cost ($)</Label>
                      <Input
                        id="cost"
                        type="number"
                        min="0"
                        step="100"
                        value={newChoice.cost}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewChoice(prev => ({ 
                            ...prev, 
                            cost: parseFloat(e.target.value) || 0,
                            wealth_impact: -(parseFloat(e.target.value) || 0)
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience Gain</Label>
                      <Input
                        id="experience"
                        type="number"
                        min="0"
                        step="10"
                        value={newChoice.experience_gain}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewChoice(prev => ({ 
                            ...prev, 
                            experience_gain: parseInt(e.target.value) || 0 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_impact">Business Impact (0-1)</Label>
                    <Input
                      id="business_impact"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={newChoice.business_impact}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewChoice(prev => ({ 
                          ...prev, 
                          business_impact: parseFloat(e.target.value) || 0 
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Quick Templates</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {predefinedChoices.slice(0, 4).map((choice, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handlePredefinedChoice(choice)}
                          className="text-xs"
                        >
                          {choiceTypeIcons[choice.choice_type]} {choice.title}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={isCreating} className="w-full">
                      {isCreating ? 'Creating...' : 'Make This Choice ✨'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Life Choices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎯 Available Choices</CardTitle>
          <CardDescription>
            Make strategic life decisions to enhance your business performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predefinedChoices.map((choice, index) => (
              <Card 
                key={index}
                className={`bg-gradient-to-r ${choiceTypeColors[choice.choice_type]} hover:shadow-lg transition-all duration-200`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{choiceTypeIcons[choice.choice_type]}</span>
                      <CardTitle className="text-sm">{choice.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(choice.cost)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {choice.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">Business Impact</span>
                      <span className={getImpactColor(choice.business_impact)}>
                        {getImpactDescription(choice.business_impact)}
                      </span>
                    </div>
                    <Progress value={choice.business_impact * 100} className="h-1" />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      +{choice.experience_gain} XP
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => makeLifeChoice(choice)}
                      className="h-7 text-xs"
                    >
                      Choose
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Previous Choices History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📚 Your Journey</CardTitle>
          <CardDescription>
            Review your past life choices and their impacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : choices.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-slate-600 dark:text-slate-400">
                Your life choices will appear here as you make decisions
              </p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {choices.map((choice: LifeChoice) => (
                  <div key={choice.id}>
                    <div className="flex items-start space-x-3">
                      <div className="text-lg">{choiceTypeIcons[choice.choice_type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{choice.title}</h4>
                          <span className="text-xs text-slate-500">
                            {choice.made_at.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                          {choice.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex space-x-3">
                            <span className="text-red-600">
                              {formatCurrency(choice.cost)} cost
                            </span>
                            <span className="text-blue-600">
                              +{choice.experience_gain} XP
                            </span>
                            {choice.business_impact > 0 && (
                              <span className="text-green-600">
                                +{(choice.business_impact * 100).toFixed(1)}% business
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}