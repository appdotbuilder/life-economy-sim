import { db } from '../db';
import { lifeChoicesTable, playersTable } from '../db/schema';
import { type CreateLifeChoiceInput, type LifeChoice } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const createLifeChoice = async (input: CreateLifeChoiceInput): Promise<LifeChoice> => {
  try {
    // Verify player exists
    const existingPlayers = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, input.player_id))
      .execute();

    if (existingPlayers.length === 0) {
      throw new Error(`Player with id ${input.player_id} not found`);
    }

    // Insert life choice record
    const result = await db.insert(lifeChoicesTable)
      .values({
        player_id: input.player_id,
        choice_type: input.choice_type,
        title: input.title,
        description: input.description,
        cost: input.cost.toString(), // Convert number to string for numeric column
        wealth_impact: input.wealth_impact.toString(),
        business_impact: input.business_impact.toString(),
        experience_gain: input.experience_gain
      })
      .returning()
      .execute();

    const lifeChoice = result[0];

    // Apply effects to player - update wealth and experience
    const totalWealthChange = input.wealth_impact - input.cost;
    
    await db.update(playersTable)
      .set({
        total_wealth: sql`${playersTable.total_wealth} + ${totalWealthChange.toString()}`,
        experience_points: sql`${playersTable.experience_points} + ${input.experience_gain}`,
        last_active: new Date()
      })
      .where(eq(playersTable.id, input.player_id))
      .execute();

    // Convert numeric fields back to numbers before returning
    return {
      ...lifeChoice,
      cost: parseFloat(lifeChoice.cost),
      wealth_impact: parseFloat(lifeChoice.wealth_impact),
      business_impact: parseFloat(lifeChoice.business_impact)
    };
  } catch (error) {
    console.error('Life choice creation failed:', error);
    throw error;
  }
};