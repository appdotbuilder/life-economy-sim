import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, businessesTable } from '../db/schema';
import { type PaginationParams } from '../schema';
import { getLeaderboard } from '../handlers/get_leaderboard';

// Test data
const testPlayers = [
  {
    username: 'WealthyPlayer1',
    email: 'wealthy1@test.com',
    total_wealth: '100000.00',
    experience_points: 5000,
    level: 10,
  },
  {
    username: 'WealthyPlayer2',
    email: 'wealthy2@test.com',
    total_wealth: '75000.00',
    experience_points: 3500,
    level: 8,
  },
  {
    username: 'ModeratePlayer',
    email: 'moderate@test.com',
    total_wealth: '50000.00',
    experience_points: 2000,
    level: 5,
  },
  {
    username: 'BeginnerPlayer',
    email: 'beginner@test.com',
    total_wealth: '10000.00',
    experience_points: 100,
    level: 1,
  },
];

const defaultPagination: PaginationParams = {
  page: 1,
  limit: 10,
};

describe('getLeaderboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return leaderboard ordered by total wealth', async () => {
    // Create test players
    for (const playerData of testPlayers) {
      await db.insert(playersTable).values(playerData).execute();
    }

    const result = await getLeaderboard(defaultPagination);

    expect(result).toHaveLength(4);
    
    // Verify ordering by total wealth (descending)
    expect(result[0].player.username).toEqual('WealthyPlayer1');
    expect(result[0].total_wealth).toEqual(100000);
    expect(result[0].rank).toEqual(1);
    expect(result[0].business_count).toEqual(0);

    expect(result[1].player.username).toEqual('WealthyPlayer2');
    expect(result[1].total_wealth).toEqual(75000);
    expect(result[1].rank).toEqual(2);

    expect(result[2].player.username).toEqual('ModeratePlayer');
    expect(result[2].total_wealth).toEqual(50000);
    expect(result[2].rank).toEqual(3);

    expect(result[3].player.username).toEqual('BeginnerPlayer');
    expect(result[3].total_wealth).toEqual(10000);
    expect(result[3].rank).toEqual(4);
  });

  it('should include business count for each player', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'BusinessOwner',
        email: 'owner@test.com',
        total_wealth: '200000.00',
        experience_points: 8000,
        level: 15,
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create businesses for the player
    await db.insert(businessesTable).values([
      {
        player_id: playerId,
        name: 'Tech Startup',
        industry: 'technology',
        monthly_income: '50000.00',
        monthly_expenses: '30000.00',
      },
      {
        player_id: playerId,
        name: 'Restaurant Chain',
        industry: 'food_service',
        monthly_income: '25000.00',
        monthly_expenses: '20000.00',
      },
    ]).execute();

    const result = await getLeaderboard(defaultPagination);

    expect(result).toHaveLength(1);
    expect(result[0].player.username).toEqual('BusinessOwner');
    expect(result[0].business_count).toEqual(2);
    expect(result[0].total_wealth).toEqual(200000);
    expect(typeof result[0].total_wealth).toBe('number');
  });

  it('should handle pagination correctly', async () => {
    // Create multiple test players
    for (let i = 1; i <= 15; i++) {
      await db.insert(playersTable).values({
        username: `Player${i}`,
        email: `player${i}@test.com`,
        total_wealth: `${100000 - (i * 1000)}.00`, // Decreasing wealth
        experience_points: 1000 * i,
        level: i,
      }).execute();
    }

    // Test first page
    const page1 = await getLeaderboard({ page: 1, limit: 5 });
    expect(page1).toHaveLength(5);
    expect(page1[0].rank).toEqual(1);
    expect(page1[0].player.username).toEqual('Player1');
    expect(page1[4].rank).toEqual(5);
    expect(page1[4].player.username).toEqual('Player5');

    // Test second page
    const page2 = await getLeaderboard({ page: 2, limit: 5 });
    expect(page2).toHaveLength(5);
    expect(page2[0].rank).toEqual(6);
    expect(page2[0].player.username).toEqual('Player6');
    expect(page2[4].rank).toEqual(10);
    expect(page2[4].player.username).toEqual('Player10');

    // Test third page
    const page3 = await getLeaderboard({ page: 3, limit: 5 });
    expect(page3).toHaveLength(5);
    expect(page3[0].rank).toEqual(11);
    expect(page3[0].player.username).toEqual('Player11');
    expect(page3[4].rank).toEqual(15);
    expect(page3[4].player.username).toEqual('Player15');
  });

  it('should return empty array when no players exist', async () => {
    const result = await getLeaderboard(defaultPagination);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle different limit values', async () => {
    // Create test players
    for (let i = 1; i <= 8; i++) {
      await db.insert(playersTable).values({
        username: `TestPlayer${i}`,
        email: `test${i}@test.com`,
        total_wealth: `${50000 + (i * 5000)}.00`,
        experience_points: i * 500,
        level: i,
      }).execute();
    }

    // Test with limit 3
    const limited = await getLeaderboard({ page: 1, limit: 3 });
    expect(limited).toHaveLength(3);
    expect(limited[0].player.username).toEqual('TestPlayer8'); // Highest wealth
    expect(limited[1].player.username).toEqual('TestPlayer7');
    expect(limited[2].player.username).toEqual('TestPlayer6');

    // Test with limit larger than available data
    const unlimited = await getLeaderboard({ page: 1, limit: 20 });
    expect(unlimited).toHaveLength(8);
  });

  it('should convert numeric fields to numbers correctly', async () => {
    // Create test player
    await db.insert(playersTable).values({
      username: 'NumericTest',
      email: 'numeric@test.com',
      total_wealth: '123456.78',
      experience_points: 9999,
      level: 20,
    }).execute();

    const result = await getLeaderboard(defaultPagination);

    expect(result).toHaveLength(1);
    expect(typeof result[0].total_wealth).toBe('number');
    expect(result[0].total_wealth).toEqual(123456.78);
    expect(typeof result[0].player.total_wealth).toBe('number');
    expect(result[0].player.total_wealth).toEqual(123456.78);
    expect(typeof result[0].business_count).toBe('number');
    expect(result[0].business_count).toEqual(0);
  });

  it('should handle players with and without businesses correctly', async () => {
    // Create player with businesses
    const player1Result = await db.insert(playersTable)
      .values({
        username: 'BusinessOwner',
        email: 'owner@test.com',
        total_wealth: '100000.00',
        experience_points: 5000,
        level: 10,
      })
      .returning()
      .execute();

    await db.insert(businessesTable).values({
      player_id: player1Result[0].id,
      name: 'Test Business',
      industry: 'technology',
      monthly_income: '10000.00',
      monthly_expenses: '5000.00',
    }).execute();

    // Create player without businesses
    await db.insert(playersTable).values({
      username: 'IndividualPlayer',
      email: 'individual@test.com',
      total_wealth: '80000.00',
      experience_points: 3000,
      level: 8,
    }).execute();

    const result = await getLeaderboard(defaultPagination);

    expect(result).toHaveLength(2);
    expect(result[0].player.username).toEqual('BusinessOwner');
    expect(result[0].business_count).toEqual(1);
    expect(result[1].player.username).toEqual('IndividualPlayer');
    expect(result[1].business_count).toEqual(0);
  });
});