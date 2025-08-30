import { db } from '../db';
import { businessPerformanceTable } from '../db/schema';
import { type CreateBusinessPerformanceInput, type BusinessPerformance } from '../schema';

export const recordBusinessPerformance = async (input: CreateBusinessPerformanceInput): Promise<BusinessPerformance> => {
  try {
    // Insert business performance record
    const result = await db.insert(businessPerformanceTable)
      .values({
        business_id: input.business_id,
        income_snapshot: input.income_snapshot.toString(),
        expenses_snapshot: input.expenses_snapshot.toString(),
        employee_count_snapshot: input.employee_count_snapshot,
        growth_rate_snapshot: input.growth_rate_snapshot.toString(),
        market_share_snapshot: input.market_share_snapshot.toString(),
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const performance = result[0];
    return {
      ...performance,
      income_snapshot: parseFloat(performance.income_snapshot),
      expenses_snapshot: parseFloat(performance.expenses_snapshot),
      growth_rate_snapshot: parseFloat(performance.growth_rate_snapshot),
      market_share_snapshot: parseFloat(performance.market_share_snapshot),
    };
  } catch (error) {
    console.error('Business performance recording failed:', error);
    throw error;
  }
};