import { db } from '../db';
import { businessesTable } from '../db/schema';
import { type Business, type PlayerIdParam } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getPlayerBusinesses = async (params: PlayerIdParam): Promise<Business[]> => {
  try {
    const results = await db.select()
      .from(businessesTable)
      .where(eq(businessesTable.player_id, params.playerId))
      .orderBy(desc(businessesTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(business => ({
      ...business,
      monthly_income: parseFloat(business.monthly_income),
      monthly_expenses: parseFloat(business.monthly_expenses),
      growth_rate: parseFloat(business.growth_rate),
      market_share: parseFloat(business.market_share)
    }));
  } catch (error) {
    console.error('Failed to fetch player businesses:', error);
    throw error;
  }
};