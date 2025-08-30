import { db } from '../db';
import { achievementsTable, playersTable } from '../db/schema';
import { type CreateAchievementInput, type Achievement } from '../schema';
import { eq } from 'drizzle-orm';

export const createAchievement = async (input: CreateAchievementInput): Promise<Achievement> => {
  try {
    // First, verify the player exists
    const player = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, input.player_id))
      .execute();

    if (player.length === 0) {
      throw new Error(`Player with id ${input.player_id} does not exist`);
    }

    // Insert achievement record
    const result = await db.insert(achievementsTable)
      .values({
        player_id: input.player_id,
        achievement_type: input.achievement_type,
        title: input.title,
        description: input.description,
        icon: input.icon,
        experience_reward: input.experience_reward
      })
      .returning()
      .execute();

    // Update player's experience points with the achievement reward
    if (input.experience_reward > 0) {
      await db.update(playersTable)
        .set({
          experience_points: player[0].experience_points + input.experience_reward
        })
        .where(eq(playersTable.id, input.player_id))
        .execute();
    }

    // Return the achievement data
    const achievement = result[0];
    return {
      ...achievement,
      // No numeric conversions needed - all fields are already correct types
    };
  } catch (error) {
    console.error('Achievement creation failed:', error);
    throw error;
  }
};