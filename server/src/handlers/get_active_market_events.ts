import { db } from '../db';
import { marketEventsTable } from '../db/schema';
import { type MarketEvent } from '../schema';
import { eq, and, lte, gt } from 'drizzle-orm';

export const getActiveMarketEvents = async (): Promise<MarketEvent[]> => {
  try {
    const now = new Date();
    
    // Query for market events that are:
    // 1. Marked as active (is_active = true)
    // 2. Not yet expired (expires_at > current time)
    const results = await db.select()
      .from(marketEventsTable)
      .where(
        and(
          eq(marketEventsTable.is_active, true),
          gt(marketEventsTable.expires_at, now)
        )
      )
      .execute();

    // Convert numeric fields back to numbers
    return results.map(event => ({
      ...event,
      impact_magnitude: parseFloat(event.impact_magnitude)
    }));
  } catch (error) {
    console.error('Failed to fetch active market events:', error);
    throw error;
  }
};