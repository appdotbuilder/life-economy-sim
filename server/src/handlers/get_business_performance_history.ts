import { db } from '../db';
import { businessPerformanceTable } from '../db/schema';
import { type BusinessPerformance, type BusinessIdParam, type PaginationParams } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getBusinessPerformanceHistory(
    params: BusinessIdParam, 
    pagination: PaginationParams
): Promise<BusinessPerformance[]> {
  try {
    // Calculate offset for pagination
    const offset = (pagination.page - 1) * pagination.limit;

    // Query business performance history with pagination and ordering
    const results = await db.select()
      .from(businessPerformanceTable)
      .where(eq(businessPerformanceTable.business_id, params.businessId))
      .orderBy(desc(businessPerformanceTable.recorded_at))
      .limit(pagination.limit)
      .offset(offset)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(performance => ({
      ...performance,
      income_snapshot: parseFloat(performance.income_snapshot),
      expenses_snapshot: parseFloat(performance.expenses_snapshot),
      growth_rate_snapshot: parseFloat(performance.growth_rate_snapshot),
      market_share_snapshot: parseFloat(performance.market_share_snapshot)
    }));
  } catch (error) {
    console.error('Failed to fetch business performance history:', error);
    throw error;
  }
}