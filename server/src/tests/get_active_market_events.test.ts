import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketEventsTable } from '../db/schema';
import { type CreateMarketEventInput } from '../schema';
import { getActiveMarketEvents } from '../handlers/get_active_market_events';

// Helper function to create test market events
const createTestEvent = async (overrides: Partial<CreateMarketEventInput> = {}) => {
  const baseEvent: CreateMarketEventInput = {
    title: 'Test Market Event',
    description: 'A test event for unit testing',
    event_type: 'boom',
    impact_magnitude: 0.5,
    affected_industry: 'technology',
    duration_hours: 24,
    ...overrides
  };

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + baseEvent.duration_hours);

  const result = await db.insert(marketEventsTable)
    .values({
      title: baseEvent.title,
      description: baseEvent.description,
      event_type: baseEvent.event_type,
      impact_magnitude: baseEvent.impact_magnitude.toString(),
      affected_industry: baseEvent.affected_industry,
      duration_hours: baseEvent.duration_hours,
      expires_at: expiresAt
    })
    .returning()
    .execute();

  return result[0];
};

describe('getActiveMarketEvents', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return active market events that have not expired', async () => {
    // Create an active event that expires in the future
    await createTestEvent({
      title: 'Tech Boom',
      event_type: 'boom',
      impact_magnitude: 0.75,
      duration_hours: 48
    });

    const results = await getActiveMarketEvents();

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Tech Boom');
    expect(results[0].event_type).toEqual('boom');
    expect(results[0].impact_magnitude).toEqual(0.75);
    expect(typeof results[0].impact_magnitude).toBe('number');
    expect(results[0].is_active).toBe(true);
    expect(results[0].expires_at).toBeInstanceOf(Date);
  });

  it('should not return expired market events', async () => {
    // Create an expired event (expires 1 hour ago)
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    await db.insert(marketEventsTable)
      .values({
        title: 'Expired Event',
        description: 'This event should not appear',
        event_type: 'crash',
        impact_magnitude: '-0.5',
        affected_industry: 'finance',
        duration_hours: 1,
        is_active: true,
        expires_at: pastTime
      })
      .execute();

    const results = await getActiveMarketEvents();

    expect(results).toHaveLength(0);
  });

  it('should not return inactive market events', async () => {
    // Create an inactive event
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 24);

    await db.insert(marketEventsTable)
      .values({
        title: 'Inactive Event',
        description: 'This event should not appear',
        event_type: 'innovation_breakthrough',
        impact_magnitude: '0.3',
        affected_industry: 'healthcare',
        duration_hours: 24,
        is_active: false,
        expires_at: futureTime
      })
      .execute();

    const results = await getActiveMarketEvents();

    expect(results).toHaveLength(0);
  });

  it('should return multiple active events correctly', async () => {
    // Create multiple active events
    await createTestEvent({
      title: 'Economic Crisis',
      event_type: 'economic_crisis',
      impact_magnitude: -0.6,
      affected_industry: 'finance',
      duration_hours: 72
    });

    await createTestEvent({
      title: 'Innovation Breakthrough',
      event_type: 'innovation_breakthrough',
      impact_magnitude: 0.8,
      affected_industry: 'healthcare',
      duration_hours: 96
    });

    await createTestEvent({
      title: 'Competitor Action',
      event_type: 'competitor_action',
      impact_magnitude: -0.2,
      affected_industry: null,
      duration_hours: 12
    });

    const results = await getActiveMarketEvents();

    expect(results).toHaveLength(3);
    
    // Check that all events are properly converted and active
    results.forEach(event => {
      expect(event.is_active).toBe(true);
      expect(typeof event.impact_magnitude).toBe('number');
      expect(event.expires_at).toBeInstanceOf(Date);
      expect(event.expires_at > new Date()).toBe(true);
    });

    // Check specific events
    const economicCrisis = results.find(e => e.title === 'Economic Crisis');
    expect(economicCrisis?.impact_magnitude).toEqual(-0.6);
    expect(economicCrisis?.affected_industry).toEqual('finance');

    const innovation = results.find(e => e.title === 'Innovation Breakthrough');
    expect(innovation?.impact_magnitude).toEqual(0.8);
    expect(innovation?.affected_industry).toEqual('healthcare');

    const competitor = results.find(e => e.title === 'Competitor Action');
    expect(competitor?.impact_magnitude).toEqual(-0.2);
    expect(competitor?.affected_industry).toBeNull();
  });

  it('should return empty array when no active events exist', async () => {
    const results = await getActiveMarketEvents();

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle mixed scenarios with active, inactive, and expired events', async () => {
    // Create one active event
    await createTestEvent({
      title: 'Active Event',
      event_type: 'boom',
      impact_magnitude: 0.4,
      duration_hours: 48
    });

    // Create one expired event
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 2);
    await db.insert(marketEventsTable)
      .values({
        title: 'Expired Event',
        description: 'Should not appear',
        event_type: 'crash',
        impact_magnitude: '-0.3',
        affected_industry: 'retail',
        duration_hours: 1,
        is_active: true,
        expires_at: pastTime
      })
      .execute();

    // Create one inactive event
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 24);
    await db.insert(marketEventsTable)
      .values({
        title: 'Inactive Event',
        description: 'Should not appear',
        event_type: 'regulation_change',
        impact_magnitude: '0.2',
        affected_industry: 'manufacturing',
        duration_hours: 24,
        is_active: false,
        expires_at: futureTime
      })
      .execute();

    const results = await getActiveMarketEvents();

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Active Event');
    expect(results[0].impact_magnitude).toEqual(0.4);
    expect(results[0].is_active).toBe(true);
  });

  it('should correctly convert all numeric fields', async () => {
    await createTestEvent({
      title: 'Numeric Test Event',
      event_type: 'boom',
      impact_magnitude: 0.12,  // Using 2 decimal places to match schema precision
      duration_hours: 36
    });

    const results = await getActiveMarketEvents();

    expect(results).toHaveLength(1);
    expect(typeof results[0].impact_magnitude).toBe('number');
    expect(results[0].impact_magnitude).toEqual(0.12);
    expect(typeof results[0].duration_hours).toBe('number');
    expect(results[0].duration_hours).toEqual(36);
  });
});