import { db } from '../db';
import { playersTable, businessesTable } from '../db/schema';
import { type Leaderboard, type PaginationParams } from '../schema';
import { desc, count, eq, sql } from 'drizzle-orm';

export const getLeaderboard = async (pagination: PaginationParams): Promise<Leaderboard> => {
  try {
    // Calculate offset for pagination
    const offset = (pagination.page - 1) * pagination.limit;

    // Query to get players with their business count, ordered by total wealth
    const results = await db
      .select({
        player_id: playersTable.id,
        username: playersTable.username,
        email: playersTable.email,
        total_wealth: playersTable.total_wealth,
        experience_points: playersTable.experience_points,
        level: playersTable.level,
        created_at: playersTable.created_at,
        last_active: playersTable.last_active,
        business_count: count(businessesTable.id),
      })
      .from(playersTable)
      .leftJoin(businessesTable, eq(playersTable.id, businessesTable.player_id))
      .groupBy(
        playersTable.id,
        playersTable.username,
        playersTable.email,
        playersTable.total_wealth,
        playersTable.experience_points,
        playersTable.level,
        playersTable.created_at,
        playersTable.last_active
      )
      .orderBy(desc(playersTable.total_wealth))
      .limit(pagination.limit)
      .offset(offset)
      .execute();

    // Transform results to match the Leaderboard schema
    return results.map((result, index) => ({
      rank: offset + index + 1,
      player: {
        id: result.player_id,
        username: result.username,
        email: result.email,
        total_wealth: parseFloat(result.total_wealth),
        experience_points: result.experience_points,
        level: result.level,
        created_at: result.created_at,
        last_active: result.last_active,
      },
      total_wealth: parseFloat(result.total_wealth),
      business_count: result.business_count,
    }));
  } catch (error) {
    console.error('Leaderboard retrieval failed:', error);
    throw error;
  }
};