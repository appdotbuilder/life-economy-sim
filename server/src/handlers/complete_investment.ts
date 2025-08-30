import { db } from '../db';
import { investmentsTable, playersTable } from '../db/schema';
import { type CompleteInvestmentInput, type Investment } from '../schema';
import { eq } from 'drizzle-orm';

export const completeInvestment = async (input: CompleteInvestmentInput): Promise<Investment> => {
  try {
    // First, get the investment details
    const investmentResults = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, input.id))
      .execute();

    if (investmentResults.length === 0) {
      throw new Error(`Investment with id ${input.id} not found`);
    }

    const investment = investmentResults[0];

    if (investment.is_completed) {
      throw new Error(`Investment with id ${input.id} is already completed`);
    }

    // Update the investment with actual return and completion status
    const updateResult = await db.update(investmentsTable)
      .set({
        actual_return: input.actual_return.toString(),
        is_completed: true,
        completed_at: new Date()
      })
      .where(eq(investmentsTable.id, input.id))
      .returning()
      .execute();

    const completedInvestment = updateResult[0];

    // Get current player wealth
    const playerResults = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, investment.player_id))
      .execute();

    if (playerResults.length === 0) {
      throw new Error(`Player with id ${investment.player_id} not found`);
    }

    const currentWealth = parseFloat(playerResults[0].total_wealth);
    const newWealth = currentWealth + input.actual_return;

    // Update player's total wealth with the actual return
    await db.update(playersTable)
      .set({
        total_wealth: newWealth.toString()
      })
      .where(eq(playersTable.id, investment.player_id))
      .execute();

    // Return the completed investment with numeric conversions
    return {
      ...completedInvestment,
      amount_invested: parseFloat(completedInvestment.amount_invested),
      expected_return: parseFloat(completedInvestment.expected_return),
      actual_return: parseFloat(completedInvestment.actual_return)
    };
  } catch (error) {
    console.error('Investment completion failed:', error);
    throw error;
  }
};