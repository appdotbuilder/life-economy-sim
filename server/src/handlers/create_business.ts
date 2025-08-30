import { db } from '../db';
import { businessesTable, playersTable } from '../db/schema';
import { type CreateBusinessInput, type Business } from '../schema';
import { eq } from 'drizzle-orm';

export const createBusiness = async (input: CreateBusinessInput): Promise<Business> => {
  try {
    // Verify the player exists before creating business
    const player = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, input.player_id))
      .execute();

    if (player.length === 0) {
      throw new Error(`Player with id ${input.player_id} not found`);
    }

    // Insert business record
    const result = await db.insert(businessesTable)
      .values({
        player_id: input.player_id,
        name: input.name,
        industry: input.industry,
        monthly_income: input.monthly_income.toString(), // Convert number to string for numeric column
        monthly_expenses: input.monthly_expenses.toString(), // Convert number to string for numeric column
        employee_count: 0, // Default value
        growth_rate: '0.0001', // Small starting growth rate as string
        market_share: '0.0001', // Small starting market share as string
        is_active: true // Default value
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const business = result[0];
    return {
      ...business,
      monthly_income: parseFloat(business.monthly_income), // Convert string back to number
      monthly_expenses: parseFloat(business.monthly_expenses), // Convert string back to number
      growth_rate: parseFloat(business.growth_rate), // Convert string back to number
      market_share: parseFloat(business.market_share) // Convert string back to number
    };
  } catch (error) {
    console.error('Business creation failed:', error);
    throw error;
  }
};