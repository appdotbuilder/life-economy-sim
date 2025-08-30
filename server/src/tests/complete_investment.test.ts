import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, investmentsTable } from '../db/schema';
import { type CompleteInvestmentInput } from '../schema';
import { completeInvestment } from '../handlers/complete_investment';
import { eq } from 'drizzle-orm';

describe('completeInvestment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should complete an investment and update player wealth', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer',
        email: 'test@example.com',
        total_wealth: '50000.00'
      })
      .returning()
      .execute();

    const player = playerResult[0];

    // Create test investment
    const investmentResult = await db.insert(investmentsTable)
      .values({
        player_id: player.id,
        business_id: null,
        investment_type: 'stocks',
        title: 'Tech Stocks',
        description: 'Investment in technology stocks',
        amount_invested: '10000.00',
        expected_return: '1500.00',
        risk_level: 5,
        duration_months: 12
      })
      .returning()
      .execute();

    const investment = investmentResult[0];

    const input: CompleteInvestmentInput = {
      id: investment.id,
      actual_return: 2000.00
    };

    // Complete the investment
    const result = await completeInvestment(input);

    // Verify the investment was marked as completed
    expect(result.id).toBe(investment.id);
    expect(result.actual_return).toBe(2000.00);
    expect(typeof result.actual_return).toBe('number');
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);

    // Verify numeric conversions
    expect(typeof result.amount_invested).toBe('number');
    expect(typeof result.expected_return).toBe('number');
    expect(result.amount_invested).toBe(10000.00);
    expect(result.expected_return).toBe(1500.00);

    // Verify player wealth was updated
    const updatedPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, player.id))
      .execute();

    expect(parseFloat(updatedPlayer[0].total_wealth)).toBe(52000.00); // 50000 + 2000
  });

  it('should handle negative actual returns', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer2',
        email: 'test2@example.com',
        total_wealth: '30000.00'
      })
      .returning()
      .execute();

    const player = playerResult[0];

    // Create test investment
    const investmentResult = await db.insert(investmentsTable)
      .values({
        player_id: player.id,
        investment_type: 'cryptocurrency',
        title: 'Crypto Investment',
        description: 'High risk crypto investment',
        amount_invested: '5000.00',
        expected_return: '2000.00',
        risk_level: 9,
        duration_months: 6
      })
      .returning()
      .execute();

    const investment = investmentResult[0];

    const input: CompleteInvestmentInput = {
      id: investment.id,
      actual_return: -1500.00 // Loss
    };

    // Complete the investment
    const result = await completeInvestment(input);

    // Verify the investment shows the loss
    expect(result.actual_return).toBe(-1500.00);
    expect(result.is_completed).toBe(true);

    // Verify player wealth was decreased
    const updatedPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, player.id))
      .execute();

    expect(parseFloat(updatedPlayer[0].total_wealth)).toBe(28500.00); // 30000 - 1500
  });

  it('should save completed investment to database', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer3',
        email: 'test3@example.com',
        total_wealth: '25000.00'
      })
      .returning()
      .execute();

    const player = playerResult[0];

    // Create test investment
    const investmentResult = await db.insert(investmentsTable)
      .values({
        player_id: player.id,
        investment_type: 'marketing_campaign',
        title: 'Marketing Campaign',
        description: 'Digital marketing investment',
        amount_invested: '3000.00',
        expected_return: '800.00',
        risk_level: 3,
        duration_months: 3
      })
      .returning()
      .execute();

    const investment = investmentResult[0];

    const input: CompleteInvestmentInput = {
      id: investment.id,
      actual_return: 950.00
    };

    // Complete the investment
    await completeInvestment(input);

    // Query the database directly to verify the changes
    const completedInvestment = await db.select()
      .from(investmentsTable)
      .where(eq(investmentsTable.id, investment.id))
      .execute();

    expect(completedInvestment).toHaveLength(1);
    expect(parseFloat(completedInvestment[0].actual_return)).toBe(950.00);
    expect(completedInvestment[0].is_completed).toBe(true);
    expect(completedInvestment[0].completed_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent investment', async () => {
    const input: CompleteInvestmentInput = {
      id: 999,
      actual_return: 1000.00
    };

    await expect(completeInvestment(input)).rejects.toThrow(/Investment with id 999 not found/i);
  });

  it('should throw error for already completed investment', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer4',
        email: 'test4@example.com',
        total_wealth: '40000.00'
      })
      .returning()
      .execute();

    const player = playerResult[0];

    // Create already completed investment
    const investmentResult = await db.insert(investmentsTable)
      .values({
        player_id: player.id,
        investment_type: 'real_estate',
        title: 'Real Estate Investment',
        description: 'Property investment',
        amount_invested: '15000.00',
        expected_return: '3000.00',
        actual_return: '2500.00',
        risk_level: 4,
        duration_months: 24,
        is_completed: true,
        completed_at: new Date()
      })
      .returning()
      .execute();

    const investment = investmentResult[0];

    const input: CompleteInvestmentInput = {
      id: investment.id,
      actual_return: 3500.00
    };

    await expect(completeInvestment(input)).rejects.toThrow(/Investment with id .* is already completed/i);
  });

  it('should handle zero actual return', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer5',
        email: 'test5@example.com',
        total_wealth: '20000.00'
      })
      .returning()
      .execute();

    const player = playerResult[0];

    // Create test investment
    const investmentResult = await db.insert(investmentsTable)
      .values({
        player_id: player.id,
        investment_type: 'research_development',
        title: 'R&D Investment',
        description: 'Research and development project',
        amount_invested: '8000.00',
        expected_return: '2000.00',
        risk_level: 6,
        duration_months: 18
      })
      .returning()
      .execute();

    const investment = investmentResult[0];

    const input: CompleteInvestmentInput = {
      id: investment.id,
      actual_return: 0.00 // Break-even
    };

    // Complete the investment
    const result = await completeInvestment(input);

    // Verify the investment shows zero return
    expect(result.actual_return).toBe(0.00);
    expect(result.is_completed).toBe(true);

    // Verify player wealth remains unchanged
    const updatedPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, player.id))
      .execute();

    expect(parseFloat(updatedPlayer[0].total_wealth)).toBe(20000.00); // No change
  });

  it('should preserve all investment fields during completion', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer6',
        email: 'test6@example.com',
        total_wealth: '35000.00'
      })
      .returning()
      .execute();

    const player = playerResult[0];

    // Create test investment with business_id
    const investmentResult = await db.insert(investmentsTable)
      .values({
        player_id: player.id,
        business_id: 1, // Assuming business exists or nullable
        investment_type: 'business_expansion',
        title: 'Business Expansion',
        description: 'Expanding operations to new markets',
        amount_invested: '12000.00',
        expected_return: '4000.00',
        risk_level: 7,
        duration_months: 15
      })
      .returning()
      .execute();

    const investment = investmentResult[0];

    const input: CompleteInvestmentInput = {
      id: investment.id,
      actual_return: 3500.00
    };

    // Complete the investment
    const result = await completeInvestment(input);

    // Verify all original fields are preserved
    expect(result.player_id).toBe(player.id);
    expect(result.business_id).toBe(1);
    expect(result.investment_type).toBe('business_expansion');
    expect(result.title).toBe('Business Expansion');
    expect(result.description).toBe('Expanding operations to new markets');
    expect(result.amount_invested).toBe(12000.00);
    expect(result.expected_return).toBe(4000.00);
    expect(result.risk_level).toBe(7);
    expect(result.duration_months).toBe(15);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify completion fields
    expect(result.actual_return).toBe(3500.00);
    expect(result.is_completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
  });
});