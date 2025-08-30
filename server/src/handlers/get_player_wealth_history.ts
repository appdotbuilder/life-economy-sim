import { db } from '../db';
import { playerWealthHistoryTable } from '../db/schema';
import { type PlayerWealthHistory, type PlayerIdParam, type PaginationParams } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getPlayerWealthHistory(
    params: PlayerIdParam, 
    pagination: PaginationParams
): Promise<PlayerWealthHistory[]> {
  try {
    // Build query with proper ordering (most recent first) and pagination
    const query = db.select()
      .from(playerWealthHistoryTable)
      .where(eq(playerWealthHistoryTable.player_id, params.playerId))
      .orderBy(desc(playerWealthHistoryTable.recorded_at))
      .limit(pagination.limit)
      .offset((pagination.page - 1) * pagination.limit);

    const results = await query.execute();

    // Convert numeric fields from strings to numbers
    return results.map(record => ({
      ...record,
      total_wealth_snapshot: parseFloat(record.total_wealth_snapshot)
    }));
  } catch (error) {
    console.error('Failed to fetch player wealth history:', error);
    throw error;
  }
}