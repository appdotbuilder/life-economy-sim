import { db } from '../db';
import { playersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Player, type PlayerIdParam } from '../schema';

export const getPlayer = async (params: PlayerIdParam): Promise<Player> => {
  try {
    const result = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, params.playerId))
      .execute();

    if (result.length === 0) {
      throw new Error(`Player with id ${params.playerId} not found`);
    }

    const player = result[0];
    return {
      ...player,
      total_wealth: parseFloat(player.total_wealth), // Convert numeric to number
    };
  } catch (error) {
    console.error('Get player failed:', error);
    throw error;
  }
};