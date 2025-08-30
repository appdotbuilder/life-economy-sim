import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, businessesTable } from '../db/schema';
import { type PlayerIdParam } from '../schema';
import { getPlayerBusinesses } from '../handlers/get_player_businesses';

describe('getPlayerBusinesses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when player has no businesses', async () => {
    // Create a player without businesses
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer',
        email: 'test@example.com',
      })
      .returning()
      .execute();

    const params: PlayerIdParam = { playerId: playerResult[0].id };

    const result = await getPlayerBusinesses(params);

    expect(result).toEqual([]);
  });

  it('should return all businesses for a specific player', async () => {
    // Create player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'businessowner',
        email: 'owner@example.com',
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create multiple businesses for this player
    const businessResults = await db.insert(businessesTable)
      .values([
        {
          player_id: playerId,
          name: 'Tech Startup',
          industry: 'technology',
          monthly_income: '15000.50',
          monthly_expenses: '8000.25',
          employee_count: 5,
          growth_rate: '0.1500',
          market_share: '0.0200'
        },
        {
          player_id: playerId,
          name: 'Healthcare Clinic',
          industry: 'healthcare',
          monthly_income: '25000.75',
          monthly_expenses: '12000.00',
          employee_count: 10,
          growth_rate: '0.0800',
          market_share: '0.0150'
        }
      ])
      .returning()
      .execute();

    const params: PlayerIdParam = { playerId };

    const result = await getPlayerBusinesses(params);

    expect(result).toHaveLength(2);
    
    // Verify numeric conversions
    expect(typeof result[0].monthly_income).toBe('number');
    expect(typeof result[0].monthly_expenses).toBe('number');
    expect(typeof result[0].growth_rate).toBe('number');
    expect(typeof result[0].market_share).toBe('number');
    
    // Check that both businesses are returned with correct numeric conversions
    const techBusiness = result.find(b => b.name === 'Tech Startup');
    const healthBusiness = result.find(b => b.name === 'Healthcare Clinic');
    
    expect(techBusiness).toBeDefined();
    expect(healthBusiness).toBeDefined();
    
    expect(techBusiness!.monthly_income).toBe(15000.50);
    expect(techBusiness!.monthly_expenses).toBe(8000.25);
    expect(techBusiness!.growth_rate).toBe(0.1500);
    expect(techBusiness!.market_share).toBe(0.0200);
    
    expect(healthBusiness!.monthly_income).toBe(25000.75);
    expect(healthBusiness!.monthly_expenses).toBe(12000.00);
    expect(healthBusiness!.growth_rate).toBe(0.0800);
    expect(healthBusiness!.market_share).toBe(0.0150);
  });

  it('should return businesses ordered by created_at descending', async () => {
    // Create player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'ordertester',
        email: 'order@example.com',
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create businesses with specific names to test ordering
    await db.insert(businessesTable)
      .values({
        player_id: playerId,
        name: 'First Business',
        industry: 'technology',
      })
      .execute();

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(businessesTable)
      .values({
        player_id: playerId,
        name: 'Second Business',
        industry: 'finance',
      })
      .execute();

    const params: PlayerIdParam = { playerId };

    const result = await getPlayerBusinesses(params);

    expect(result).toHaveLength(2);
    // Most recent should be first
    expect(result[0].name).toBe('Second Business');
    expect(result[1].name).toBe('First Business');
  });

  it('should not return businesses from other players', async () => {
    // Create two players
    const player1Result = await db.insert(playersTable)
      .values({
        username: 'player1',
        email: 'player1@example.com',
      })
      .returning()
      .execute();

    const player2Result = await db.insert(playersTable)
      .values({
        username: 'player2',
        email: 'player2@example.com',
      })
      .returning()
      .execute();

    const player1Id = player1Result[0].id;
    const player2Id = player2Result[0].id;

    // Create businesses for both players
    await db.insert(businessesTable)
      .values([
        {
          player_id: player1Id,
          name: 'Player 1 Business',
          industry: 'technology',
        },
        {
          player_id: player2Id,
          name: 'Player 2 Business',
          industry: 'finance',
        }
      ])
      .execute();

    const params: PlayerIdParam = { playerId: player1Id };

    const result = await getPlayerBusinesses(params);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Player 1 Business');
    expect(result[0].player_id).toBe(player1Id);
  });

  it('should include both active and inactive businesses', async () => {
    // Create player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'statustest',
        email: 'status@example.com',
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create active and inactive businesses
    await db.insert(businessesTable)
      .values([
        {
          player_id: playerId,
          name: 'Active Business',
          industry: 'technology',
          is_active: true
        },
        {
          player_id: playerId,
          name: 'Inactive Business',
          industry: 'finance',
          is_active: false
        }
      ])
      .execute();

    const params: PlayerIdParam = { playerId };

    const result = await getPlayerBusinesses(params);

    expect(result).toHaveLength(2);
    
    const activeCount = result.filter(b => b.is_active).length;
    const inactiveCount = result.filter(b => !b.is_active).length;
    
    expect(activeCount).toBe(1);
    expect(inactiveCount).toBe(1);
  });

  it('should handle nonexistent player gracefully', async () => {
    const params: PlayerIdParam = { playerId: 999999 };

    const result = await getPlayerBusinesses(params);

    expect(result).toEqual([]);
  });

  it('should return all business fields correctly', async () => {
    // Create player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'fieldtest',
        email: 'fields@example.com',
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create business with all fields populated
    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerId,
        name: 'Complete Business',
        industry: 'retail',
        monthly_income: '50000.99',
        monthly_expenses: '30000.50',
        employee_count: 25,
        growth_rate: '0.2500',
        market_share: '0.1000',
        is_active: true
      })
      .returning()
      .execute();

    const params: PlayerIdParam = { playerId };

    const result = await getPlayerBusinesses(params);

    expect(result).toHaveLength(1);
    
    const business = result[0];
    expect(business.id).toBeDefined();
    expect(business.player_id).toBe(playerId);
    expect(business.name).toBe('Complete Business');
    expect(business.industry).toBe('retail');
    expect(business.monthly_income).toBe(50000.99);
    expect(business.monthly_expenses).toBe(30000.50);
    expect(business.employee_count).toBe(25);
    expect(business.growth_rate).toBe(0.2500);
    expect(business.market_share).toBe(0.1000);
    expect(business.is_active).toBe(true);
    expect(business.created_at).toBeInstanceOf(Date);
  });
});