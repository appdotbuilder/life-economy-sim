import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { businessesTable, playersTable } from '../db/schema';
import { type CreateBusinessInput, type CreatePlayerInput } from '../schema';
import { createBusiness } from '../handlers/create_business';
import { eq } from 'drizzle-orm';

// Test data
const testPlayer: CreatePlayerInput = {
  username: 'businessowner',
  email: 'owner@example.com'
};

const testBusinessInput: CreateBusinessInput = {
  player_id: 1, // Will be updated after player creation
  name: 'TechCorp Inc',
  industry: 'technology',
  monthly_income: 5000,
  monthly_expenses: 3000
};

describe('createBusiness', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a business with all required fields', async () => {
    // Create prerequisite player
    const playerResult = await db.insert(playersTable)
      .values({
        username: testPlayer.username,
        email: testPlayer.email
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;
    const businessInput = { ...testBusinessInput, player_id: playerId };

    const result = await createBusiness(businessInput);

    // Basic field validation
    expect(result.name).toEqual('TechCorp Inc');
    expect(result.industry).toEqual('technology');
    expect(result.player_id).toEqual(playerId);
    expect(result.monthly_income).toEqual(5000);
    expect(result.monthly_expenses).toEqual(3000);
    expect(result.employee_count).toEqual(0);
    expect(result.growth_rate).toEqual(0.0001);
    expect(result.market_share).toEqual(0.0001);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(typeof result.monthly_income).toBe('number');
    expect(typeof result.monthly_expenses).toBe('number');
    expect(typeof result.growth_rate).toBe('number');
    expect(typeof result.market_share).toBe('number');
  });

  it('should save business to database correctly', async () => {
    // Create prerequisite player
    const playerResult = await db.insert(playersTable)
      .values({
        username: testPlayer.username,
        email: testPlayer.email
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;
    const businessInput = { ...testBusinessInput, player_id: playerId };

    const result = await createBusiness(businessInput);

    // Query database to verify data was saved correctly
    const businesses = await db.select()
      .from(businessesTable)
      .where(eq(businessesTable.id, result.id))
      .execute();

    expect(businesses).toHaveLength(1);
    const dbBusiness = businesses[0];
    expect(dbBusiness.name).toEqual('TechCorp Inc');
    expect(dbBusiness.industry).toEqual('technology');
    expect(dbBusiness.player_id).toEqual(playerId);
    expect(parseFloat(dbBusiness.monthly_income)).toEqual(5000);
    expect(parseFloat(dbBusiness.monthly_expenses)).toEqual(3000);
    expect(dbBusiness.employee_count).toEqual(0);
    expect(parseFloat(dbBusiness.growth_rate)).toEqual(0.0001);
    expect(parseFloat(dbBusiness.market_share)).toEqual(0.0001);
    expect(dbBusiness.is_active).toEqual(true);
    expect(dbBusiness.created_at).toBeInstanceOf(Date);
  });

  it('should create business with default values for optional fields', async () => {
    // Create prerequisite player
    const playerResult = await db.insert(playersTable)
      .values({
        username: testPlayer.username,
        email: testPlayer.email
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;
    const minimalBusinessInput: CreateBusinessInput = {
      player_id: playerId,
      name: 'Minimal Business',
      industry: 'retail',
      monthly_income: 0, // Default value from Zod schema
      monthly_expenses: 0 // Default value from Zod schema
    };

    const result = await createBusiness(minimalBusinessInput);

    expect(result.name).toEqual('Minimal Business');
    expect(result.industry).toEqual('retail');
    expect(result.monthly_income).toEqual(0);
    expect(result.monthly_expenses).toEqual(0);
    expect(result.employee_count).toEqual(0);
    expect(result.growth_rate).toEqual(0.0001);
    expect(result.market_share).toEqual(0.0001);
    expect(result.is_active).toEqual(true);
  });

  it('should handle different industry types correctly', async () => {
    // Create prerequisite player
    const playerResult = await db.insert(playersTable)
      .values({
        username: testPlayer.username,
        email: testPlayer.email
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    const industries = ['finance', 'healthcare', 'manufacturing', 'real_estate'] as const;
    
    for (const industry of industries) {
      const businessInput: CreateBusinessInput = {
        player_id: playerId,
        name: `${industry} Business`,
        industry: industry,
        monthly_income: 1000,
        monthly_expenses: 500
      };

      const result = await createBusiness(businessInput);
      expect(result.industry).toEqual(industry);
      expect(result.name).toEqual(`${industry} Business`);
    }
  });

  it('should throw error when player does not exist', async () => {
    const invalidBusinessInput: CreateBusinessInput = {
      player_id: 9999, // Non-existent player ID
      name: 'Invalid Business',
      industry: 'technology',
      monthly_income: 1000,
      monthly_expenses: 500
    };

    await expect(createBusiness(invalidBusinessInput)).rejects.toThrow(/Player with id 9999 not found/i);
  });

  it('should create multiple businesses for same player', async () => {
    // Create prerequisite player
    const playerResult = await db.insert(playersTable)
      .values({
        username: testPlayer.username,
        email: testPlayer.email
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create first business
    const business1Input: CreateBusinessInput = {
      player_id: playerId,
      name: 'First Business',
      industry: 'technology',
      monthly_income: 2000,
      monthly_expenses: 1000
    };

    // Create second business
    const business2Input: CreateBusinessInput = {
      player_id: playerId,
      name: 'Second Business',
      industry: 'finance',
      monthly_income: 3000,
      monthly_expenses: 1500
    };

    const result1 = await createBusiness(business1Input);
    const result2 = await createBusiness(business2Input);

    expect(result1.player_id).toEqual(playerId);
    expect(result2.player_id).toEqual(playerId);
    expect(result1.name).toEqual('First Business');
    expect(result2.name).toEqual('Second Business');
    expect(result1.industry).toEqual('technology');
    expect(result2.industry).toEqual('finance');

    // Verify both are in database
    const allBusinesses = await db.select()
      .from(businessesTable)
      .where(eq(businessesTable.player_id, playerId))
      .execute();

    expect(allBusinesses).toHaveLength(2);
  });
});