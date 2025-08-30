import { db } from '../db';
import { 
  playersTable, 
  businessesTable, 
  marketEventsTable, 
  achievementsTable, 
  investmentsTable 
} from '../db/schema';
import { type DashboardData, type PlayerIdParam } from '../schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export const getDashboardData = async (params: PlayerIdParam): Promise<DashboardData> => {
  try {
    // Fetch player data
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, params.playerId))
      .execute();

    if (players.length === 0) {
      throw new Error(`Player with ID ${params.playerId} not found`);
    }

    const player = {
      ...players[0],
      total_wealth: parseFloat(players[0].total_wealth)
    };

    // Fetch player's businesses (active ones only)
    const businessResults = await db.select()
      .from(businessesTable)
      .where(and(
        eq(businessesTable.player_id, params.playerId),
        eq(businessesTable.is_active, true)
      ))
      .orderBy(desc(businessesTable.created_at))
      .execute();

    const businesses = businessResults.map(business => ({
      ...business,
      monthly_income: parseFloat(business.monthly_income),
      monthly_expenses: parseFloat(business.monthly_expenses),
      growth_rate: parseFloat(business.growth_rate),
      market_share: parseFloat(business.market_share)
    }));

    // Fetch recent market events (active ones from last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const marketEventResults = await db.select()
      .from(marketEventsTable)
      .where(and(
        eq(marketEventsTable.is_active, true),
        gte(marketEventsTable.created_at, sevenDaysAgo)
      ))
      .orderBy(desc(marketEventsTable.created_at))
      .limit(5)
      .execute();

    const recent_market_events = marketEventResults.map(event => ({
      ...event,
      impact_magnitude: parseFloat(event.impact_magnitude)
    }));

    // Fetch recent achievements (last 10)
    const achievementResults = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.player_id, params.playerId))
      .orderBy(desc(achievementsTable.unlocked_at))
      .limit(10)
      .execute();

    const recent_achievements = achievementResults;

    // Fetch active investments (not completed)
    const investmentResults = await db.select()
      .from(investmentsTable)
      .where(and(
        eq(investmentsTable.player_id, params.playerId),
        eq(investmentsTable.is_completed, false)
      ))
      .orderBy(desc(investmentsTable.created_at))
      .execute();

    const active_investments = investmentResults.map(investment => ({
      ...investment,
      amount_invested: parseFloat(investment.amount_invested),
      expected_return: parseFloat(investment.expected_return),
      actual_return: parseFloat(investment.actual_return)
    }));

    return {
      player,
      businesses,
      recent_market_events,
      recent_achievements,
      active_investments
    };
  } catch (error) {
    console.error('Dashboard data fetch failed:', error);
    throw error;
  }
};