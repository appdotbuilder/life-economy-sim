import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, playerWealthHistoryTable } from '../db/schema';
import { type CreatePlayerWealthHistoryInput } from '../schema';
import { recordPlayerWealth } from '../handlers/record_player_wealth';
import { eq } from 'drizzle-orm';

describe('recordPlayerWealth', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPlayerId: number;

  beforeEach(async () => {
    // Create a test player first
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'test_player',
        email: 'test@example.com',
        total_wealth: '50000.00',
        experience_points: 1500,
        level: 3
      })
      .returning()
      .execute();
    
    testPlayerId = playerResult[0].id;
  });

  it('should record player wealth history', async () => {
    const testInput: CreatePlayerWealthHistoryInput = {
      player_id: testPlayerId,
      total_wealth_snapshot: 75000.50,
      level_snapshot: 4,
      experience_points_snapshot: 2000
    };

    const result = await recordPlayerWealth(testInput);

    // Basic field validation
    expect(result.player_id).toEqual(testPlayerId);
    expect(result.total_wealth_snapshot).toEqual(75000.50);
    expect(result.level_snapshot).toEqual(4);
    expect(result.experience_points_snapshot).toEqual(2000);
    expect(result.id).toBeDefined();
    expect(result.recorded_at).toBeInstanceOf(Date);
    
    // Verify numeric type conversion
    expect(typeof result.total_wealth_snapshot).toBe('number');
  });

  it('should save wealth record to database', async () => {
    const testInput: CreatePlayerWealthHistoryInput = {
      player_id: testPlayerId,
      total_wealth_snapshot: 100000.75,
      level_snapshot: 5,
      experience_points_snapshot: 3000
    };

    const result = await recordPlayerWealth(testInput);

    // Query using proper drizzle syntax
    const wealthRecords = await db.select()
      .from(playerWealthHistoryTable)
      .where(eq(playerWealthHistoryTable.id, result.id))
      .execute();

    expect(wealthRecords).toHaveLength(1);
    expect(wealthRecords[0].player_id).toEqual(testPlayerId);
    expect(parseFloat(wealthRecords[0].total_wealth_snapshot)).toEqual(100000.75);
    expect(wealthRecords[0].level_snapshot).toEqual(5);
    expect(wealthRecords[0].experience_points_snapshot).toEqual(3000);
    expect(wealthRecords[0].recorded_at).toBeInstanceOf(Date);
  });

  it('should handle large wealth values', async () => {
    const testInput: CreatePlayerWealthHistoryInput = {
      player_id: testPlayerId,
      total_wealth_snapshot: 9999999999.99,
      level_snapshot: 100,
      experience_points_snapshot: 1000000
    };

    const result = await recordPlayerWealth(testInput);

    expect(result.total_wealth_snapshot).toEqual(9999999999.99);
    expect(result.level_snapshot).toEqual(100);
    expect(result.experience_points_snapshot).toEqual(1000000);
  });

  it('should handle zero wealth values', async () => {
    const testInput: CreatePlayerWealthHistoryInput = {
      player_id: testPlayerId,
      total_wealth_snapshot: 0,
      level_snapshot: 1,
      experience_points_snapshot: 0
    };

    const result = await recordPlayerWealth(testInput);

    expect(result.total_wealth_snapshot).toEqual(0);
    expect(result.level_snapshot).toEqual(1);
    expect(result.experience_points_snapshot).toEqual(0);
  });

  it('should handle decimal precision correctly', async () => {
    const testInput: CreatePlayerWealthHistoryInput = {
      player_id: testPlayerId,
      total_wealth_snapshot: 12345.67,
      level_snapshot: 10,
      experience_points_snapshot: 5000
    };

    const result = await recordPlayerWealth(testInput);

    expect(result.total_wealth_snapshot).toEqual(12345.67);
    
    // Verify precision is maintained in database
    const dbRecord = await db.select()
      .from(playerWealthHistoryTable)
      .where(eq(playerWealthHistoryTable.id, result.id))
      .execute();
    
    expect(parseFloat(dbRecord[0].total_wealth_snapshot)).toEqual(12345.67);
  });

  it('should create multiple wealth history records for same player', async () => {
    const testInput1: CreatePlayerWealthHistoryInput = {
      player_id: testPlayerId,
      total_wealth_snapshot: 10000,
      level_snapshot: 2,
      experience_points_snapshot: 500
    };

    const testInput2: CreatePlayerWealthHistoryInput = {
      player_id: testPlayerId,
      total_wealth_snapshot: 20000,
      level_snapshot: 3,
      experience_points_snapshot: 1000
    };

    const result1 = await recordPlayerWealth(testInput1);
    const result2 = await recordPlayerWealth(testInput2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.total_wealth_snapshot).toEqual(10000);
    expect(result2.total_wealth_snapshot).toEqual(20000);

    // Verify both records exist in database
    const allRecords = await db.select()
      .from(playerWealthHistoryTable)
      .where(eq(playerWealthHistoryTable.player_id, testPlayerId))
      .execute();

    expect(allRecords).toHaveLength(2);
  });

  it('should throw error for non-existent player', async () => {
    const testInput: CreatePlayerWealthHistoryInput = {
      player_id: 999999, // Non-existent player ID
      total_wealth_snapshot: 50000,
      level_snapshot: 5,
      experience_points_snapshot: 1000
    };

    expect(recordPlayerWealth(testInput)).rejects.toThrow(/Player with id 999999 not found/i);
  });

  it('should record timestamp correctly', async () => {
    const beforeRecord = new Date();
    
    const testInput: CreatePlayerWealthHistoryInput = {
      player_id: testPlayerId,
      total_wealth_snapshot: 25000,
      level_snapshot: 2,
      experience_points_snapshot: 750
    };

    const result = await recordPlayerWealth(testInput);
    const afterRecord = new Date();

    expect(result.recorded_at.getTime()).toBeGreaterThanOrEqual(beforeRecord.getTime());
    expect(result.recorded_at.getTime()).toBeLessThanOrEqual(afterRecord.getTime());
  });
});