import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketEventsTable } from '../db/schema';
import { type CreateMarketEventInput } from '../schema';
import { createMarketEvent } from '../handlers/create_market_event';
import { eq, gte, lt } from 'drizzle-orm';

// Complete test input with all fields including defaults
const testInput: CreateMarketEventInput = {
  title: 'Tech Market Boom',
  description: 'A significant boom in the technology sector driving up valuations',
  event_type: 'boom',
  impact_magnitude: 0.75,
  affected_industry: 'technology',
  duration_hours: 48,
};

describe('createMarketEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a market event', async () => {
    const result = await createMarketEvent(testInput);

    // Basic field validation
    expect(result.title).toEqual('Tech Market Boom');
    expect(result.description).toEqual(testInput.description);
    expect(result.event_type).toEqual('boom');
    expect(result.impact_magnitude).toEqual(0.75);
    expect(typeof result.impact_magnitude).toBe('number'); // Verify numeric conversion
    expect(result.affected_industry).toEqual('technology');
    expect(result.duration_hours).toEqual(48);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.expires_at).toBeInstanceOf(Date);

    // Verify expires_at is calculated correctly (48 hours from now)
    const now = new Date();
    const expectedExpiry = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const timeDiff = Math.abs(result.expires_at.getTime() - expectedExpiry.getTime());
    expect(timeDiff).toBeLessThan(5000); // Allow 5 seconds tolerance for test execution time
  });

  it('should save market event to database', async () => {
    const result = await createMarketEvent(testInput);

    // Query using proper drizzle syntax
    const marketEvents = await db.select()
      .from(marketEventsTable)
      .where(eq(marketEventsTable.id, result.id))
      .execute();

    expect(marketEvents).toHaveLength(1);
    const dbEvent = marketEvents[0];
    expect(dbEvent.title).toEqual('Tech Market Boom');
    expect(dbEvent.description).toEqual(testInput.description);
    expect(dbEvent.event_type).toEqual('boom');
    expect(parseFloat(dbEvent.impact_magnitude)).toEqual(0.75);
    expect(dbEvent.affected_industry).toEqual('technology');
    expect(dbEvent.duration_hours).toEqual(48);
    expect(dbEvent.is_active).toBe(true);
    expect(dbEvent.created_at).toBeInstanceOf(Date);
    expect(dbEvent.expires_at).toBeInstanceOf(Date);
  });

  it('should handle null affected_industry', async () => {
    const globalEventInput: CreateMarketEventInput = {
      title: 'Global Economic Crisis',
      description: 'A worldwide economic downturn affecting all industries',
      event_type: 'economic_crisis',
      impact_magnitude: -0.5,
      affected_industry: null,
      duration_hours: 72,
    };

    const result = await createMarketEvent(globalEventInput);

    expect(result.title).toEqual('Global Economic Crisis');
    expect(result.event_type).toEqual('economic_crisis');
    expect(result.impact_magnitude).toEqual(-0.5);
    expect(result.affected_industry).toBeNull();
    expect(result.duration_hours).toEqual(72);
  });

  it('should apply duration_hours default correctly', async () => {
    const inputWithDefaults: CreateMarketEventInput = {
      title: 'Market Crash',
      description: 'Sudden market downturn',
      event_type: 'crash',
      impact_magnitude: -0.8,
      affected_industry: 'finance',
      duration_hours: 24, // Default value explicitly set
    };

    const result = await createMarketEvent(inputWithDefaults);

    expect(result.duration_hours).toEqual(24);
    
    // Verify 24-hour expiration
    const now = new Date();
    const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const timeDiff = Math.abs(result.expires_at.getTime() - expectedExpiry.getTime());
    expect(timeDiff).toBeLessThan(5000); // Allow 5 seconds tolerance
  });

  it('should query market events by date range correctly', async () => {
    // Create test market event
    await createMarketEvent(testInput);

    // Test date filtering - use a time slightly before the event creation
    const beforeCreation = new Date(Date.now() - 1000); // 1 second before
    
    // Proper query building with correct TypeScript types
    const marketEvents = await db.select()
      .from(marketEventsTable)
      .where(gte(marketEventsTable.created_at, beforeCreation))
      .execute();

    expect(marketEvents.length).toBeGreaterThan(0);
    marketEvents.forEach(event => {
      expect(event.created_at).toBeInstanceOf(Date);
      expect(event.created_at >= beforeCreation).toBe(true);
    });
  });

  it('should handle different event types correctly', async () => {
    const eventTypes = ['boom', 'crash', 'competitor_action', 'regulation_change'] as const;
    const results = [];

    for (const eventType of eventTypes) {
      const input: CreateMarketEventInput = {
        title: `Test ${eventType}`,
        description: `Testing ${eventType} event type`,
        event_type: eventType,
        impact_magnitude: eventType === 'boom' ? 0.5 : -0.3,
        affected_industry: 'retail',
        duration_hours: 12,
      };

      const result = await createMarketEvent(input);
      results.push(result);
      
      expect(result.event_type).toEqual(eventType);
      expect(result.title).toEqual(`Test ${eventType}`);
    }

    // Verify all events were saved
    const allEvents = await db.select()
      .from(marketEventsTable)
      .execute();

    expect(allEvents).toHaveLength(4);
  });

  it('should handle active market events query', async () => {
    // Create an event that should be active
    await createMarketEvent(testInput);

    // Query active events
    const activeEvents = await db.select()
      .from(marketEventsTable)
      .where(eq(marketEventsTable.is_active, true))
      .execute();

    expect(activeEvents.length).toBeGreaterThan(0);
    activeEvents.forEach(event => {
      expect(event.is_active).toBe(true);
      expect(event.expires_at).toBeInstanceOf(Date);
      // Event should not be expired yet
      expect(event.expires_at.getTime()).toBeGreaterThan(Date.now());
    });
  });

  it('should handle impact magnitude bounds correctly', async () => {
    // Test maximum positive impact
    const maxImpactInput: CreateMarketEventInput = {
      title: 'Maximum Boom',
      description: 'Highest possible positive impact',
      event_type: 'innovation_breakthrough',
      impact_magnitude: 1.0,
      affected_industry: 'technology',
      duration_hours: 6,
    };

    const maxResult = await createMarketEvent(maxImpactInput);
    expect(maxResult.impact_magnitude).toEqual(1.0);

    // Test maximum negative impact
    const minImpactInput: CreateMarketEventInput = {
      title: 'Maximum Crash',
      description: 'Highest possible negative impact',
      event_type: 'crash',
      impact_magnitude: -1.0,
      affected_industry: 'finance',
      duration_hours: 6,
    };

    const minResult = await createMarketEvent(minImpactInput);
    expect(minResult.impact_magnitude).toEqual(-1.0);
  });
});