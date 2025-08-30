import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type CreatePlayerInput } from '../schema';
import { createPlayer } from '../handlers/create_player';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreatePlayerInput = {
  username: 'testplayer',
  email: 'test@example.com'
};

const duplicateUsernameInput: CreatePlayerInput = {
  username: 'testplayer', // Same username as testInput
  email: 'different@example.com'
};

const duplicateEmailInput: CreatePlayerInput = {
  username: 'differentuser',
  email: 'test@example.com' // Same email as testInput
};

describe('createPlayer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a player with correct fields', async () => {
    const result = await createPlayer(testInput);

    // Basic field validation
    expect(result.username).toEqual('testplayer');
    expect(result.email).toEqual('test@example.com');
    expect(result.total_wealth).toEqual(10000.00);
    expect(result.experience_points).toEqual(0);
    expect(result.level).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.last_active).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result.total_wealth).toBe('number');
    expect(typeof result.experience_points).toBe('number');
    expect(typeof result.level).toBe('number');
  });

  it('should save player to database', async () => {
    const result = await createPlayer(testInput);

    // Query using proper drizzle syntax
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, result.id))
      .execute();

    expect(players).toHaveLength(1);
    expect(players[0].username).toEqual('testplayer');
    expect(players[0].email).toEqual('test@example.com');
    expect(parseFloat(players[0].total_wealth)).toEqual(10000.00);
    expect(players[0].experience_points).toEqual(0);
    expect(players[0].level).toEqual(1);
    expect(players[0].created_at).toBeInstanceOf(Date);
    expect(players[0].last_active).toBeInstanceOf(Date);
  });

  it('should reject duplicate username', async () => {
    // Create first player
    await createPlayer(testInput);

    // Try to create second player with same username
    await expect(createPlayer(duplicateUsernameInput))
      .rejects.toThrow(/unique constraint/i);
  });

  it('should reject duplicate email', async () => {
    // Create first player
    await createPlayer(testInput);

    // Try to create second player with same email
    await expect(createPlayer(duplicateEmailInput))
      .rejects.toThrow(/unique constraint/i);
  });

  it('should create multiple players with unique usernames and emails', async () => {
    const player1Input: CreatePlayerInput = {
      username: 'player1',
      email: 'player1@example.com'
    };

    const player2Input: CreatePlayerInput = {
      username: 'player2',
      email: 'player2@example.com'
    };

    const result1 = await createPlayer(player1Input);
    const result2 = await createPlayer(player2Input);

    // Verify both players were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.username).toEqual('player1');
    expect(result2.username).toEqual('player2');
    expect(result1.email).toEqual('player1@example.com');
    expect(result2.email).toEqual('player2@example.com');

    // Both should have default values
    expect(result1.total_wealth).toEqual(10000.00);
    expect(result2.total_wealth).toEqual(10000.00);
    expect(result1.level).toEqual(1);
    expect(result2.level).toEqual(1);
  });

  it('should set created_at and last_active to current time', async () => {
    const beforeCreation = new Date();
    const result = await createPlayer(testInput);
    const afterCreation = new Date();

    // Check that timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.last_active.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.last_active.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});