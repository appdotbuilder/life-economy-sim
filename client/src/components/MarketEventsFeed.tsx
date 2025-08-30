import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { MarketEvent } from '../../../server/src/schema';

interface MarketEventsFeedProps {
  events: MarketEvent[];
}

export function MarketEventsFeed({ events: initialEvents }: MarketEventsFeedProps) {
  const [events, setEvents] = useState<MarketEvent[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);

  const loadActiveEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const activeEvents = await trpc.getActiveMarketEvents.query();
      setEvents(activeEvents);
    } catch (error) {
      console.error('Failed to load market events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-refresh events every 30 seconds
    const interval = setInterval(loadActiveEvents, 30000);
    return () => clearInterval(interval);
  }, [loadActiveEvents]);

  const eventTypeIcons: Record<string, string> = {
    boom: '📈',
    crash: '📉',
    competitor_action: '⚔️',
    economic_crisis: '🌪️',
    regulation_change: '⚖️',
    innovation_breakthrough: '💡'
  };

  const eventTypeColors: Record<string, string> = {
    boom: 'from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800',
    crash: 'from-red-500/10 to-pink-500/10 border-red-200 dark:border-red-800',
    competitor_action: 'from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-800',
    economic_crisis: 'from-purple-500/10 to-violet-500/10 border-purple-200 dark:border-purple-800',
    regulation_change: 'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800',
    innovation_breakthrough: 'from-yellow-500/10 to-orange-500/10 border-yellow-200 dark:border-yellow-800'
  };

  const getImpactBadge = (magnitude: number) => {
    const absValue = Math.abs(magnitude);
    if (absValue >= 0.7) return { text: 'MAJOR', variant: 'destructive' as const };
    if (absValue >= 0.4) return { text: 'HIGH', variant: 'default' as const };
    if (absValue >= 0.2) return { text: 'MEDIUM', variant: 'secondary' as const };
    return { text: 'LOW', variant: 'outline' as const };
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="h-96">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>🌍</span>
              <span>Global Market Events</span>
            </CardTitle>
            <CardDescription>
              AI-driven economic events affecting the market
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">Live</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadActiveEvents}
              disabled={isLoading}
            >
              {isLoading ? '🔄' : '🔄'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {events.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Markets are stable. No active events at this time.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-72 px-6 pb-6">
            <div className="space-y-4">
              {events.map((event: MarketEvent, index: number) => {
                const impact = getImpactBadge(event.impact_magnitude);
                const timeRemaining = formatTimeRemaining(event.expires_at);
                
                return (
                  <div key={event.id}>
                    <Alert className={`bg-gradient-to-r ${eventTypeColors[event.event_type]}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="text-2xl mt-1">
                            {eventTypeIcons[event.event_type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-sm">{event.title}</h4>
                              <Badge variant={impact.variant} className="text-xs">
                                {impact.text}
                              </Badge>
                            </div>
                            <AlertDescription className="text-xs leading-relaxed">
                              {event.description}
                            </AlertDescription>
                            
                            <div className="flex items-center justify-between mt-3 text-xs">
                              <div className="flex items-center space-x-4">
                                {event.affected_industry && (
                                  <span className="text-slate-600 dark:text-slate-400">
                                    🎯 {event.affected_industry.replace('_', ' ')}
                                  </span>
                                )}
                                <span className={`font-medium ${
                                  event.impact_magnitude > 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {event.impact_magnitude > 0 ? '+' : ''}{(event.impact_magnitude * 100).toFixed(0)}% Impact
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-slate-500">⏱️ {timeRemaining}</span>
                                {event.is_active && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Alert>
                    {index < events.length - 1 && <Separator className="my-3" />}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}