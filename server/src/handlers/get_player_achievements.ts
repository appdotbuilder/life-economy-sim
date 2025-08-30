import { db } from '../db';
import { achievementsTable } from '../db/schema';
import { type Achievement, type PlayerIdParam } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getPlayerAchievements = async (params: PlayerIdParam): Promise<Achievement[]> => {
  try {
    const results = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.player_id, params.playerId))
      .orderBy(desc(achievementsTable.unlocked_at))
      .execute();

    // Convert the results to match the expected Achievement type
    return results.map(achievement => ({
      ...achievement,
      // No numeric conversions needed - all fields are already correct types
    }));
  } catch (error) {
    console.error('Failed to fetch player achievements:', error);
    throw error;
  }
};