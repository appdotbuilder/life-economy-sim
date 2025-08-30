import { db } from '../db';
import { investmentsTable } from '../db/schema';
import { type Investment, type PlayerIdParam } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getPlayerInvestments = async (params: PlayerIdParam): Promise<Investment[]> => {
  try {
    // Query investments for the specific player, ordered by creation date (newest first)
    const results = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.player_id, params.playerId))
      .orderBy(desc(investmentsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers for return
    return results.map(investment => ({
      ...investment,
      amount_invested: parseFloat(investment.amount_invested),
      expected_return: parseFloat(investment.expected_return),
      actual_return: parseFloat(investment.actual_return),
    }));
  } catch (error) {
    console.error('Failed to fetch player investments:', error);
    throw error;
  }
};