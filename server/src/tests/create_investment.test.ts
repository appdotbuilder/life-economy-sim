import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { investmentsTable, playersTable, businessesTable } from '../db/schema';
import { type CreateInvestmentInput } from '../schema';
import { createInvestment } from '../handlers/create_investment';
import { eq } from 'drizzle-orm';

describe('createInvestment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test player and business for dependent tests
  const setupTestData = async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer',
        email: 'test@example.com',
        total_wealth: '50000.00',
        experience_points: 100,
        level: 2,
      })
      .returning()
      .execute();

    // Create test business
    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerResult[0].id,
        name: 'Test Business',
        industry: 'technology',
        monthly_income: '5000.00',
        monthly_expenses: '3000.00',
      })
      .returning()
      .execute();

    return {
      player: playerResult[0],
      business: businessResult[0],
    };
  };

  it('should create an investment with all required fields', async () => {
    const { player, business } = await setupTestData();

    const testInput: CreateInvestmentInput = {
      player_id: player.id,
      business_id: business.id,
      investment_type: 'stocks',
      title: 'Tech Stock Portfolio',
      description: 'Investment in various technology stocks',
      amount_invested: 10000,
      expected_return: 1200,
      risk_level: 6,
      duration_months: 24,
    };

    const result = await createInvestment(testInput);

    // Verify basic field validation
    expect(result.player_id).toEqual(player.id);
    expect(result.business_id).toEqual(business.id);
    expect(result.investment_type).toEqual('stocks');
    expect(result.title).toEqual('Tech Stock Portfolio');
    expect(result.description).toEqual(testInput.description);
    expect(result.amount_invested).toEqual(10000);
    expect(result.expected_return).toEqual(1200);
    expect(result.actual_return).toEqual(0);
    expect(result.risk_level).toEqual(6);
    expect(result.duration_months).toEqual(24);
    expect(result.is_completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();

    // Verify numeric types are correct
    expect(typeof result.amount_invested).toBe('number');
    expect(typeof result.expected_return).toBe('number');
    expect(typeof result.actual_return).toBe('number');
  });

  it('should create an investment without business_id (personal investment)', async () => {
    const { player } = await setupTestData();

    const testInput: CreateInvestmentInput = {
      player_id: player.id,
      business_id: null,
      investment_type: 'real_estate',
      title: 'Downtown Property',
      description: 'Investment in commercial real estate',
      amount_invested: 25000,
      expected_return: 3000,
      risk_level: 4,
      duration_months: 36,
    };

    const result = await createInvestment(testInput);

    expect(result.player_id).toEqual(player.id);
    expect(result.business_id).toBeNull();
    expect(result.investment_type).toEqual('real_estate');
    expect(result.amount_invested).toEqual(25000);
    expect(result.expected_return).toEqual(3000);
  });

  it('should calculate expected return when not provided (default 0)', async () => {
    const { player, business } = await setupTestData();

    const testInput: CreateInvestmentInput = {
      player_id: player.id,
      business_id: business.id,
      investment_type: 'marketing_campaign',
      title: 'Digital Marketing Campaign',
      description: 'Investment in online advertising',
      amount_invested: 5000,
      expected_return: 0, // Default value - should be calculated
      risk_level: 7,
      duration_months: 12,
    };

    const result = await createInvestment(testInput);

    // Verify expected return was calculated
    expect(result.expected_return).toBeGreaterThan(0);
    
    // Expected calculation: 5000 * (7/10) * (12/12) * 0.08 = 280
    const expectedCalculation = 5000 * (7/10) * (12/12) * 0.08;
    expect(result.expected_return).toBeCloseTo(expectedCalculation, 2);
  });

  it('should save investment to database', async () => {
    const { player } = await setupTestData();

    const testInput: CreateInvestmentInput = {
      player_id: player.id,
      business_id: null,
      investment_type: 'cryptocurrency',
      title: 'Crypto Portfolio',
      description: 'Diversified cryptocurrency investment',
      amount_invested: 8000,
      expected_return: 1600,
      risk_level: 9,
      duration_months: 18,
    };

    const result = await createInvestment(testInput);

    // Query database to verify investment was saved
    const investments = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, result.id))
      .execute();

    expect(investments).toHaveLength(1);
    const savedInvestment = investments[0];
    
    expect(savedInvestment.player_id).toEqual(player.id);
    expect(savedInvestment.investment_type).toEqual('cryptocurrency');
    expect(savedInvestment.title).toEqual('Crypto Portfolio');
    expect(parseFloat(savedInvestment.amount_invested)).toEqual(8000);
    expect(parseFloat(savedInvestment.expected_return)).toEqual(1600);
    expect(savedInvestment.risk_level).toEqual(9);
    expect(savedInvestment.is_completed).toEqual(false);
    expect(savedInvestment.created_at).toBeInstanceOf(Date);
  });

  it('should reject investment for non-existent player', async () => {
    const testInput: CreateInvestmentInput = {
      player_id: 999999, // Non-existent player
      business_id: null,
      investment_type: 'stocks',
      title: 'Invalid Investment',
      description: 'This should fail',
      amount_invested: 1000,
      expected_return: 100,
      risk_level: 5,
      duration_months: 12,
    };

    await expect(createInvestment(testInput)).rejects.toThrow(/Player with ID 999999 does not exist/i);
  });

  it('should reject investment for non-existent business', async () => {
    const { player } = await setupTestData();

    const testInput: CreateInvestmentInput = {
      player_id: player.id,
      business_id: 999999, // Non-existent business
      investment_type: 'business_expansion',
      title: 'Expansion Investment',
      description: 'This should fail',
      amount_invested: 15000,
      expected_return: 2000,
      risk_level: 5,
      duration_months: 24,
    };

    await expect(createInvestment(testInput)).rejects.toThrow(/Business with ID 999999 does not exist/i);
  });

  it('should reject investment when business does not belong to player', async () => {
    const { player } = await setupTestData();

    // Create another player and their business
    const otherPlayerResult = await db.insert(playersTable)
      .values({
        username: 'otherplayer',
        email: 'other@example.com',
      })
      .returning()
      .execute();

    const otherBusinessResult = await db.insert(businessesTable)
      .values({
        player_id: otherPlayerResult[0].id,
        name: 'Other Business',
        industry: 'finance',
      })
      .returning()
      .execute();

    const testInput: CreateInvestmentInput = {
      player_id: player.id,
      business_id: otherBusinessResult[0].id, // Business belongs to different player
      investment_type: 'business_expansion',
      title: 'Invalid Business Investment',
      description: 'This should fail',
      amount_invested: 5000,
      expected_return: 500,
      risk_level: 3,
      duration_months: 12,
    };

    await expect(createInvestment(testInput)).rejects.toThrow(/Business with ID .* does not belong to player/i);
  });

  it('should handle edge case with minimum risk level and duration', async () => {
    const { player } = await setupTestData();

    const testInput: CreateInvestmentInput = {
      player_id: player.id,
      business_id: null,
      investment_type: 'research_development',
      title: 'Low Risk R&D',
      description: 'Conservative research investment',
      amount_invested: 1000,
      expected_return: 0, // Will be calculated
      risk_level: 1, // Minimum risk
      duration_months: 1, // Minimum duration
    };

    const result = await createInvestment(testInput);

    expect(result.risk_level).toEqual(1);
    expect(result.duration_months).toEqual(1);
    
    // Expected calculation: 1000 * (1/10) * (1/12) * 0.08 ≈ 0.67
    const expectedCalculation = 1000 * (1/10) * (1/12) * 0.08;
    expect(result.expected_return).toBeCloseTo(expectedCalculation, 2);
  });

  it('should handle edge case with maximum risk level', async () => {
    const { player } = await setupTestData();

    const testInput: CreateInvestmentInput = {
      player_id: player.id,
      business_id: null,
      investment_type: 'cryptocurrency',
      title: 'High Risk Crypto',
      description: 'Very risky cryptocurrency venture',
      amount_invested: 2000,
      expected_return: 0, // Will be calculated
      risk_level: 10, // Maximum risk
      duration_months: 6,
    };

    const result = await createInvestment(testInput);

    expect(result.risk_level).toEqual(10);
    
    // Expected calculation: 2000 * (10/10) * (6/12) * 0.08 = 80
    const expectedCalculation = 2000 * (10/10) * (6/12) * 0.08;
    expect(result.expected_return).toBeCloseTo(expectedCalculation, 2);
  });
});