import { db } from '../db';
import { playerWealthHistoryTable, playersTable } from '../db/schema';
import { type CreatePlayerWealthHistoryInput, type PlayerWealthHistory } from '../schema';
import { eq } from 'drizzle-orm';

export const recordPlayerWealth = async (input: CreatePlayerWealthHistoryInput): Promise<PlayerWealthHistory> => {
  try {
    // First verify that the player exists
    const existingPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, input.player_id))
      .execute();

    if (existingPlayer.length === 0) {
      throw new Error(`Player with id ${input.player_id} not found`);
    }

    // Insert wealth history record
    const result = await db.insert(playerWealthHistoryTable)
      .values({
        player_id: input.player_id,
        total_wealth_snapshot: input.total_wealth_snapshot.toString(), // Convert number to string for numeric column
        level_snapshot: input.level_snapshot,
        experience_points_snapshot: input.experience_points_snapshot
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const wealthRecord = result[0];
    return {
      ...wealthRecord,
      total_wealth_snapshot: parseFloat(wealthRecord.total_wealth_snapshot) // Convert string back to number
    };
  } catch (error) {
    console.error('Player wealth recording failed:', error);
    throw error;
  }
};