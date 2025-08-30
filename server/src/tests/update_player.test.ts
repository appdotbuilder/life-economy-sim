import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type UpdatePlayerInput } from '../schema';
import { updatePlayer } from '../handlers/update_player';
import { eq } from 'drizzle-orm';

describe('updatePlayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update player total wealth', async () => {
    // Create a test player first
    const [createdPlayer] = await db.insert(playersTable)
      .values({
        username: 'testplayer',
        email: 'test@example.com',
        total_wealth: '10000.00',
        experience_points: 0,
        level: 1
      })
      .returning()
      .execute();

    const updateInput: UpdatePlayerInput = {
      id: createdPlayer.id,
      total_wealth: 25000.50
    };

    const result = await updatePlayer(updateInput);

    expect(result.id).toBe(createdPlayer.id);
    expect(result.username).toBe('testplayer');
    expect(result.email).toBe('test@example.com');
    expect(result.total_wealth).toBe(25000.50);
    expect(typeof result.total_wealth).toBe('number');
    expect(result.experience_points).toBe(0);
    expect(result.level).toBe(1);
  });

  it('should update player experience points and level', async () => {
    // Create a test player first
    const [createdPlayer] = await db.insert(playersTable)
      .values({
        username: 'levelup_player',
        email: 'levelup@example.com',
        total_wealth: '15000.00',
        experience_points: 100,
        level: 1
      })
      .returning()
      .execute();

    const updateInput: UpdatePlayerInput = {
      id: createdPlayer.id,
      experience_points: 1500,
      level: 5
    };

    const result = await updatePlayer(updateInput);

    expect(result.id).toBe(createdPlayer.id);
    expect(result.experience_points).toBe(1500);
    expect(result.level).toBe(5);
    expect(result.total_wealth).toBe(15000); // Should remain unchanged
    expect(typeof result.total_wealth).toBe('number');
  });

  it('should update last_active timestamp', async () => {
    // Create a test player first
    const [createdPlayer] = await db.insert(playersTable)
      .values({
        username: 'active_player',
        email: 'active@example.com',
        total_wealth: '20000.00',
        experience_points: 500,
        level: 2
      })
      .returning()
      .execute();

    const newActiveTime = new Date('2024-01-15T10:30:00Z');
    const updateInput: UpdatePlayerInput = {
      id: createdPlayer.id,
      last_active: newActiveTime
    };

    const result = await updatePlayer(updateInput);

    expect(result.id).toBe(createdPlayer.id);
    expect(result.last_active).toEqual(newActiveTime);
    expect(result.total_wealth).toBe(20000); // Should remain unchanged
    expect(result.experience_points).toBe(500); // Should remain unchanged
    expect(result.level).toBe(2); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    // Create a test player first
    const [createdPlayer] = await db.insert(playersTable)
      .values({
        username: 'multi_update_player',
        email: 'multi@example.com',
        total_wealth: '5000.00',
        experience_points: 200,
        level: 1
      })
      .returning()
      .execute();

    const newActiveTime = new Date('2024-02-01T14:45:00Z');
    const updateInput: UpdatePlayerInput = {
      id: createdPlayer.id,
      total_wealth: 75000.25,
      experience_points: 2500,
      level: 8,
      last_active: newActiveTime
    };

    const result = await updatePlayer(updateInput);

    expect(result.id).toBe(createdPlayer.id);
    expect(result.username).toBe('multi_update_player');
    expect(result.email).toBe('multi@example.com');
    expect(result.total_wealth).toBe(75000.25);
    expect(typeof result.total_wealth).toBe('number');
    expect(result.experience_points).toBe(2500);
    expect(result.level).toBe(8);
    expect(result.last_active).toEqual(newActiveTime);
  });

  it('should save updates to database correctly', async () => {
    // Create a test player first
    const [createdPlayer] = await db.insert(playersTable)
      .values({
        username: 'persistence_test',
        email: 'persist@example.com',
        total_wealth: '12000.00',
        experience_points: 300,
        level: 2
      })
      .returning()
      .execute();

    const updateInput: UpdatePlayerInput = {
      id: createdPlayer.id,
      total_wealth: 18500.75,
      experience_points: 850
    };

    await updatePlayer(updateInput);

    // Verify the changes were persisted to database
    const [updatedPlayerFromDB] = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, createdPlayer.id))
      .execute();

    expect(updatedPlayerFromDB).toBeDefined();
    expect(parseFloat(updatedPlayerFromDB.total_wealth)).toBe(18500.75);
    expect(updatedPlayerFromDB.experience_points).toBe(850);
    expect(updatedPlayerFromDB.level).toBe(2); // Should remain unchanged
    expect(updatedPlayerFromDB.username).toBe('persistence_test');
  });

  it('should handle partial updates correctly', async () => {
    // Create a test player first
    const [createdPlayer] = await db.insert(playersTable)
      .values({
        username: 'partial_update',
        email: 'partial@example.com',
        total_wealth: '30000.00',
        experience_points: 1000,
        level: 4
      })
      .returning()
      .execute();

    // Update only wealth
    const updateInput: UpdatePlayerInput = {
      id: createdPlayer.id,
      total_wealth: 45000.00
    };

    const result = await updatePlayer(updateInput);

    expect(result.total_wealth).toBe(45000.00);
    expect(result.experience_points).toBe(1000); // Should remain unchanged
    expect(result.level).toBe(4); // Should remain unchanged
    expect(result.username).toBe('partial_update'); // Should remain unchanged
  });

  it('should throw error when player does not exist', async () => {
    const updateInput: UpdatePlayerInput = {
      id: 999999, // Non-existent player ID
      total_wealth: 50000.00
    };

    await expect(updatePlayer(updateInput)).rejects.toThrow(/Player with id 999999 not found/i);
  });

  it('should handle zero values correctly', async () => {
    // Create a test player first
    const [createdPlayer] = await db.insert(playersTable)
      .values({
        username: 'zero_test',
        email: 'zero@example.com',
        total_wealth: '50000.00',
        experience_points: 2000,
        level: 5
      })
      .returning()
      .execute();

    const updateInput: UpdatePlayerInput = {
      id: createdPlayer.id,
      total_wealth: 0,
      experience_points: 0,
      level: 1
    };

    const result = await updatePlayer(updateInput);

    expect(result.total_wealth).toBe(0);
    expect(typeof result.total_wealth).toBe('number');
    expect(result.experience_points).toBe(0);
    expect(result.level).toBe(1);
  });
});