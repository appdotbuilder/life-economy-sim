import { db } from '../db';
import { marketEventsTable } from '../db/schema';
import { type CreateMarketEventInput, type MarketEvent } from '../schema';

export const createMarketEvent = async (input: CreateMarketEventInput): Promise<MarketEvent> => {
  try {
    // Calculate expiration date based on duration
    const expiresAt = new Date(Date.now() + input.duration_hours * 60 * 60 * 1000);

    // Insert market event record
    const result = await db.insert(marketEventsTable)
      .values({
        title: input.title,
        description: input.description,
        event_type: input.event_type,
        impact_magnitude: input.impact_magnitude.toString(), // Convert number to string for numeric column
        affected_industry: input.affected_industry,
        duration_hours: input.duration_hours,
        expires_at: expiresAt,
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const marketEvent = result[0];
    return {
      ...marketEvent,
      impact_magnitude: parseFloat(marketEvent.impact_magnitude), // Convert string back to number
    };
  } catch (error) {
    console.error('Market event creation failed:', error);
    throw error;
  }
};