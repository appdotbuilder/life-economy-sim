import { db } from '../db';
import { playersTable } from '../db/schema';
import { type CreatePlayerInput, type Player } from '../schema';

export const createPlayer = async (input: CreatePlayerInput): Promise<Player> => {
  try {
    // Insert player record with default values
    const result = await db.insert(playersTable)
      .values({
        username: input.username,
        email: input.email,
        // Default values are handled by the database schema:
        // total_wealth: '10000.00' (default)
        // experience_points: 0 (default)
        // level: 1 (default)
        // created_at: now() (default)
        // last_active: now() (default)
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const player = result[0];
    return {
      ...player,
      total_wealth: parseFloat(player.total_wealth), // Convert string back to number
      // Integer fields don't need conversion (experience_points, level)
    };
  } catch (error) {
    console.error('Player creation failed:', error);
    throw error;
  }
};