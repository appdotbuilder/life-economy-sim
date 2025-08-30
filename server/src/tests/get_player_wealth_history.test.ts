import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, playerWealthHistoryTable } from '../db/schema';
import { type PlayerIdParam, type PaginationParams } from '../schema';
import { getPlayerWealthHistory } from '../handlers/get_player_wealth_history';
import { eq } from 'drizzle-orm';

describe('getPlayerWealthHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for non-existent player', async () => {
    const params: PlayerIdParam = { playerId: 999 };
    const pagination: PaginationParams = { page: 1, limit: 10 };

    const result = await getPlayerWealthHistory(params, pagination);

    expect(result).toEqual([]);
  });

  it('should return wealth history for a player', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        total_wealth: '15000.50',
        experience_points: 500,
        level: 2
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create wealth history records with different timestamps
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    await db.insert(playerWealthHistoryTable)
      .values([
        {
          player_id: playerId,
          recorded_at: twoDaysAgo,
          total_wealth_snapshot: '10000.00',
          level_snapshot: 1,
          experience_points_snapshot: 0
        },
        {
          player_id: playerId,
          recorded_at: yesterday,
          total_wealth_snapshot: '12500.25',
          level_snapshot: 1,
          experience_points_snapshot: 250
        },
        {
          player_id: playerId,
          recorded_at: now,
          total_wealth_snapshot: '15000.50',
          level_snapshot: 2,
          experience_points_snapshot: 500
        }
      ])
      .execute();

    const params: PlayerIdParam = { playerId };
    const pagination: PaginationParams = { page: 1, limit: 10 };

    const result = await getPlayerWealthHistory(params, pagination);

    // Should return records in descending order by recorded_at (most recent first)
    expect(result).toHaveLength(3);
    expect(result[0].player_id).toEqual(playerId);
    expect(result[0].total_wealth_snapshot).toEqual(15000.50);
    expect(typeof result[0].total_wealth_snapshot).toBe('number');
    expect(result[0].level_snapshot).toEqual(2);
    expect(result[0].experience_points_snapshot).toEqual(500);
    expect(result[0].recorded_at).toBeInstanceOf(Date);

    // Verify ordering (most recent first)
    expect(result[0].recorded_at.getTime()).toBeGreaterThan(result[1].recorded_at.getTime());
    expect(result[1].recorded_at.getTime()).toBeGreaterThan(result[2].recorded_at.getTime());
  });

  it('should handle pagination correctly', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create 5 wealth history records
    const wealthRecords = [];
    for (let i = 0; i < 5; i++) {
      wealthRecords.push({
        player_id: playerId,
        recorded_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // i days ago
        total_wealth_snapshot: (10000 + i * 1000).toString(),
        level_snapshot: 1 + Math.floor(i / 2),
        experience_points_snapshot: i * 100
      });
    }

    await db.insert(playerWealthHistoryTable)
      .values(wealthRecords)
      .execute();

    // Test first page with limit 2
    const params: PlayerIdParam = { playerId };
    const firstPagePagination: PaginationParams = { page: 1, limit: 2 };
    
    const firstPageResult = await getPlayerWealthHistory(params, firstPagePagination);
    
    expect(firstPageResult).toHaveLength(2);
    expect(firstPageResult[0].total_wealth_snapshot).toEqual(10000); // Most recent
    expect(firstPageResult[1].total_wealth_snapshot).toEqual(11000); // Second most recent

    // Test second page
    const secondPagePagination: PaginationParams = { page: 2, limit: 2 };
    
    const secondPageResult = await getPlayerWealthHistory(params, secondPagePagination);
    
    expect(secondPageResult).toHaveLength(2);
    expect(secondPageResult[0].total_wealth_snapshot).toEqual(12000);
    expect(secondPageResult[1].total_wealth_snapshot).toEqual(13000);

    // Test third page (should have 1 record)
    const thirdPagePagination: PaginationParams = { page: 3, limit: 2 };
    
    const thirdPageResult = await getPlayerWealthHistory(params, thirdPagePagination);
    
    expect(thirdPageResult).toHaveLength(1);
    expect(thirdPageResult[0].total_wealth_snapshot).toEqual(14000);
  });

  it('should filter by player_id correctly', async () => {
    // Create two test players
    const player1Result = await db.insert(playersTable)
      .values({
        username: 'testuser1',
        email: 'test1@example.com'
      })
      .returning()
      .execute();

    const player2Result = await db.insert(playersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com'
      })
      .returning()
      .execute();

    const player1Id = player1Result[0].id;
    const player2Id = player2Result[0].id;

    // Create wealth history for both players
    await db.insert(playerWealthHistoryTable)
      .values([
        {
          player_id: player1Id,
          total_wealth_snapshot: '10000.00',
          level_snapshot: 1,
          experience_points_snapshot: 0
        },
        {
          player_id: player1Id,
          total_wealth_snapshot: '15000.00',
          level_snapshot: 2,
          experience_points_snapshot: 500
        },
        {
          player_id: player2Id,
          total_wealth_snapshot: '20000.00',
          level_snapshot: 3,
          experience_points_snapshot: 1000
        }
      ])
      .execute();

    // Query for player 1
    const params1: PlayerIdParam = { playerId: player1Id };
    const pagination: PaginationParams = { page: 1, limit: 10 };
    
    const result1 = await getPlayerWealthHistory(params1, pagination);
    
    expect(result1).toHaveLength(2);
    result1.forEach(record => {
      expect(record.player_id).toEqual(player1Id);
    });

    // Query for player 2
    const params2: PlayerIdParam = { playerId: player2Id };
    
    const result2 = await getPlayerWealthHistory(params2, pagination);
    
    expect(result2).toHaveLength(1);
    expect(result2[0].player_id).toEqual(player2Id);
    expect(result2[0].total_wealth_snapshot).toEqual(20000.00);
  });

  it('should handle numeric conversion correctly', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Insert wealth history with decimal values
    await db.insert(playerWealthHistoryTable)
      .values({
        player_id: playerId,
        total_wealth_snapshot: '12345.67',
        level_snapshot: 5,
        experience_points_snapshot: 2500
      })
      .execute();

    const params: PlayerIdParam = { playerId };
    const pagination: PaginationParams = { page: 1, limit: 10 };

    const result = await getPlayerWealthHistory(params, pagination);

    expect(result).toHaveLength(1);
    expect(result[0].total_wealth_snapshot).toEqual(12345.67);
    expect(typeof result[0].total_wealth_snapshot).toBe('number');
    expect(result[0].level_snapshot).toEqual(5);
    expect(result[0].experience_points_snapshot).toEqual(2500);
  });

  it('should save to database correctly', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Insert wealth history
    const insertResult = await db.insert(playerWealthHistoryTable)
      .values({
        player_id: playerId,
        total_wealth_snapshot: '25000.50',
        level_snapshot: 3,
        experience_points_snapshot: 750
      })
      .returning()
      .execute();

    expect(insertResult).toHaveLength(1);

    // Verify data was saved correctly by querying directly
    const savedRecords = await db.select()
      .from(playerWealthHistoryTable)
      .where(eq(playerWealthHistoryTable.player_id, playerId))
      .execute();

    expect(savedRecords).toHaveLength(1);
    expect(savedRecords[0].player_id).toEqual(playerId);
    expect(savedRecords[0].total_wealth_snapshot).toEqual('25000.50'); // Still string in DB
    expect(savedRecords[0].level_snapshot).toEqual(3);
    expect(savedRecords[0].experience_points_snapshot).toEqual(750);
    expect(savedRecords[0].recorded_at).toBeInstanceOf(Date);
  });
});