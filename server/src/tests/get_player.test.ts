import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type PlayerIdParam } from '../schema';
import { getPlayer } from '../handlers/get_player';

describe('getPlayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch a player by ID', async () => {
    // Create test player
    const testPlayer = await db.insert(playersTable)
      .values({
        username: 'test_player',
        email: 'test@example.com',
        total_wealth: '25000.50',
        experience_points: 750,
        level: 5,
      })
      .returning()
      .execute();

    const playerId = testPlayer[0].id;
    const params: PlayerIdParam = { playerId };

    const result = await getPlayer(params);

    // Verify all fields are returned correctly
    expect(result.id).toEqual(playerId);
    expect(result.username).toEqual('test_player');
    expect(result.email).toEqual('test@example.com');
    expect(result.total_wealth).toEqual(25000.50);
    expect(typeof result.total_wealth).toBe('number'); // Ensure numeric conversion
    expect(result.experience_points).toEqual(750);
    expect(result.level).toEqual(5);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.last_active).toBeInstanceOf(Date);
  });

  it('should fetch player with default values', async () => {
    // Create player with minimal required fields (using defaults)
    const testPlayer = await db.insert(playersTable)
      .values({
        username: 'minimal_player',
        email: 'minimal@example.com',
      })
      .returning()
      .execute();

    const playerId = testPlayer[0].id;
    const params: PlayerIdParam = { playerId };

    const result = await getPlayer(params);

    // Verify default values are applied
    expect(result.id).toEqual(playerId);
    expect(result.username).toEqual('minimal_player');
    expect(result.email).toEqual('minimal@example.com');
    expect(result.total_wealth).toEqual(10000.00); // Default wealth
    expect(result.experience_points).toEqual(0); // Default XP
    expect(result.level).toEqual(1); // Default level
  });

  it('should throw error when player does not exist', async () => {
    const params: PlayerIdParam = { playerId: 99999 };

    await expect(getPlayer(params)).rejects.toThrow(/Player with id 99999 not found/i);
  });

  it('should handle large wealth values correctly', async () => {
    // Test with a large wealth value to ensure numeric conversion works
    const testPlayer = await db.insert(playersTable)
      .values({
        username: 'wealthy_player',
        email: 'wealthy@example.com',
        total_wealth: '1234567890.99',
        experience_points: 999999,
        level: 100,
      })
      .returning()
      .execute();

    const playerId = testPlayer[0].id;
    const params: PlayerIdParam = { playerId };

    const result = await getPlayer(params);

    expect(result.total_wealth).toEqual(1234567890.99);
    expect(typeof result.total_wealth).toBe('number');
    expect(result.experience_points).toEqual(999999);
    expect(result.level).toEqual(100);
  });

  it('should preserve exact timestamp values', async () => {
    const specificDate = new Date('2024-01-15T10:30:00Z');
    
    const testPlayer = await db.insert(playersTable)
      .values({
        username: 'timestamp_player',
        email: 'timestamp@example.com',
        created_at: specificDate,
        last_active: specificDate,
      })
      .returning()
      .execute();

    const playerId = testPlayer[0].id;
    const params: PlayerIdParam = { playerId };

    const result = await getPlayer(params);

    // Verify timestamps are preserved correctly
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.last_active).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toEqual(specificDate.getTime());
    expect(result.last_active.getTime()).toEqual(specificDate.getTime());
  });
});