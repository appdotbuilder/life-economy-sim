import { db } from '../db';
import { playersTable } from '../db/schema';
import { type UpdatePlayerInput, type Player } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePlayer = async (input: UpdatePlayerInput): Promise<Player> => {
  try {
    // Build update object with only the fields that are provided
    const updateData: any = {};
    
    if (input.total_wealth !== undefined) {
      updateData.total_wealth = input.total_wealth.toString(); // Convert number to string for numeric column
    }
    
    if (input.experience_points !== undefined) {
      updateData.experience_points = input.experience_points;
    }
    
    if (input.level !== undefined) {
      updateData.level = input.level;
    }
    
    if (input.last_active !== undefined) {
      updateData.last_active = input.last_active;
    }

    // Update the player record
    const result = await db.update(playersTable)
      .set(updateData)
      .where(eq(playersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Player with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const player = result[0];
    return {
      ...player,
      total_wealth: parseFloat(player.total_wealth) // Convert string back to number
    };
  } catch (error) {
    console.error('Player update failed:', error);
    throw error;
  }
};