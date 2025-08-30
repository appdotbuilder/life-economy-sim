import { db } from '../db';
import { investmentsTable, playersTable, businessesTable } from '../db/schema';
import { type CreateInvestmentInput, type Investment } from '../schema';
import { eq } from 'drizzle-orm';

export const createInvestment = async (input: CreateInvestmentInput): Promise<Investment> => {
  try {
    // Verify that the player exists
    const playerExists = await db.select({ id: playersTable.id })
      .from(playersTable)
      .where(eq(playersTable.id, input.player_id))
      .limit(1)
      .execute();

    if (playerExists.length === 0) {
      throw new Error(`Player with ID ${input.player_id} does not exist`);
    }

    // If business_id is provided, verify that the business exists and belongs to the player
    if (input.business_id !== null) {
      const businessExists = await db.select({ id: businessesTable.id, player_id: businessesTable.player_id })
        .from(businessesTable)
        .where(eq(businessesTable.id, input.business_id))
        .limit(1)
        .execute();

      if (businessExists.length === 0) {
        throw new Error(`Business with ID ${input.business_id} does not exist`);
      }

      if (businessExists[0].player_id !== input.player_id) {
        throw new Error(`Business with ID ${input.business_id} does not belong to player ${input.player_id}`);
      }
    }

    // Calculate expected return based on risk level if not provided
    let expectedReturn = input.expected_return;
    if (expectedReturn === 0) {
      // Basic risk-return calculation: higher risk = higher expected return
      // Formula: (risk_level / 10) * amount_invested * (duration_months / 12) * base_rate
      const baseRate = 0.08; // 8% base annual return
      const riskMultiplier = input.risk_level / 10;
      const timeMultiplier = input.duration_months / 12;
      expectedReturn = input.amount_invested * riskMultiplier * timeMultiplier * baseRate;
    }

    // Insert investment record
    const result = await db.insert(investmentsTable)
      .values({
        player_id: input.player_id,
        business_id: input.business_id,
        investment_type: input.investment_type,
        title: input.title,
        description: input.description,
        amount_invested: input.amount_invested.toString(),
        expected_return: expectedReturn.toString(),
        actual_return: '0.00',
        risk_level: input.risk_level,
        duration_months: input.duration_months,
        is_completed: false,
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const investment = result[0];
    return {
      ...investment,
      amount_invested: parseFloat(investment.amount_invested),
      expected_return: parseFloat(investment.expected_return),
      actual_return: parseFloat(investment.actual_return),
    };
  } catch (error) {
    console.error('Investment creation failed:', error);
    throw error;
  }
};