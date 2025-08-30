import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, businessesTable, investmentsTable } from '../db/schema';
import { type PlayerIdParam, type CreatePlayerInput, type CreateBusinessInput, type CreateInvestmentInput } from '../schema';
import { getPlayerInvestments } from '../handlers/get_player_investments';
import { eq } from 'drizzle-orm';

// Test data
const testPlayer: CreatePlayerInput = {
  username: 'investment_player',
  email: 'investor@test.com'
};

const testBusiness: CreateBusinessInput = {
  player_id: 1,
  name: 'Test Investment Business',
  industry: 'technology',
  monthly_income: 50000,
  monthly_expenses: 30000
};

const testInvestment1: CreateInvestmentInput = {
  player_id: 1,
  business_id: null,
  investment_type: 'stocks',
  title: 'Tech Stock Portfolio',
  description: 'Diversified technology stocks',
  amount_invested: 25000.50,
  expected_return: 3750.75,
  risk_level: 6,
  duration_months: 12
};

const testInvestment2: CreateInvestmentInput = {
  player_id: 1,
  business_id: 1,
  investment_type: 'marketing_campaign',
  title: 'Digital Marketing Campaign',
  description: 'Boost brand awareness through digital channels',
  amount_invested: 15000.25,
  expected_return: 22500.50,
  risk_level: 4,
  duration_months: 3
};

const testInvestment3: CreateInvestmentInput = {
  player_id: 1,
  business_id: null,
  investment_type: 'cryptocurrency',
  title: 'Bitcoin Investment',
  description: 'Long-term cryptocurrency investment',
  amount_invested: 10000.00,
  expected_return: 15000.00,
  risk_level: 9,
  duration_months: 24
};

describe('getPlayerInvestments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all investments for a player', async () => {
    // Create test player
    const [player] = await db.insert(playersTable)
      .values({
        username: testPlayer.username,
        email: testPlayer.email
      })
      .returning()
      .execute();

    // Create test business
    await db.insert(businessesTable)
      .values({
        ...testBusiness,
        player_id: player.id,
        monthly_income: testBusiness.monthly_income.toString(),
        monthly_expenses: testBusiness.monthly_expenses.toString()
      })
      .execute();

    // Create test investments
    await db.insert(investmentsTable)
      .values([
        {
          ...testInvestment1,
          player_id: player.id,
          amount_invested: testInvestment1.amount_invested.toString(),
          expected_return: testInvestment1.expected_return.toString()
        },
        {
          ...testInvestment2,
          player_id: player.id,
          amount_invested: testInvestment2.amount_invested.toString(),
          expected_return: testInvestment2.expected_return.toString()
        },
        {
          ...testInvestment3,
          player_id: player.id,
          amount_invested: testInvestment3.amount_invested.toString(),
          expected_return: testInvestment3.expected_return.toString()
        }
      ])
      .execute();

    // Test the handler
    const params: PlayerIdParam = { playerId: player.id };
    const result = await getPlayerInvestments(params);

    expect(result).toHaveLength(3);

    // Verify all investments belong to the player
    result.forEach(investment => {
      expect(investment.player_id).toBe(player.id);
    });

    // Verify numeric field conversions
    result.forEach(investment => {
      expect(typeof investment.amount_invested).toBe('number');
      expect(typeof investment.expected_return).toBe('number');
      expect(typeof investment.actual_return).toBe('number');
    });

    // Verify specific investment details
    const stockInvestment = result.find(inv => inv.investment_type === 'stocks');
    expect(stockInvestment).toBeDefined();
    expect(stockInvestment!.title).toBe('Tech Stock Portfolio');
    expect(stockInvestment!.amount_invested).toBe(25000.50);
    expect(stockInvestment!.expected_return).toBe(3750.75);
    expect(stockInvestment!.business_id).toBeNull();
    expect(stockInvestment!.risk_level).toBe(6);
    expect(stockInvestment!.duration_months).toBe(12);
    expect(stockInvestment!.is_completed).toBe(false);

    const marketingInvestment = result.find(inv => inv.investment_type === 'marketing_campaign');
    expect(marketingInvestment).toBeDefined();
    expect(marketingInvestment!.business_id).toBe(1);
    expect(marketingInvestment!.amount_invested).toBe(15000.25);
  });

  it('should return empty array for player with no investments', async () => {
    // Create test player without investments
    const [player] = await db.insert(playersTable)
      .values({
        username: testPlayer.username,
        email: testPlayer.email
      })
      .returning()
      .execute();

    const params: PlayerIdParam = { playerId: player.id };
    const result = await getPlayerInvestments(params);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent player', async () => {
    const params: PlayerIdParam = { playerId: 99999 };
    const result = await getPlayerInvestments(params);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should order investments by creation date (newest first)', async () => {
    // Create test player
    const [player] = await db.insert(playersTable)
      .values({
        username: testPlayer.username,
        email: testPlayer.email
      })
      .returning()
      .execute();

    // Create investments at different times by inserting them separately
    const [investment1] = await db.insert(investmentsTable)
      .values({
        ...testInvestment1,
        player_id: player.id,
        amount_invested: testInvestment1.amount_invested.toString(),
        expected_return: testInvestment1.expected_return.toString()
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const [investment2] = await db.insert(investmentsTable)
      .values({
        ...testInvestment2,
        player_id: player.id,
        amount_invested: testInvestment2.amount_invested.toString(),
        expected_return: testInvestment2.expected_return.toString()
      })
      .returning()
      .execute();

    const params: PlayerIdParam = { playerId: player.id };
    const result = await getPlayerInvestments(params);

    expect(result).toHaveLength(2);
    
    // Should be ordered by creation date desc (newest first)
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    
    // The second investment (investment2) should be first due to desc ordering
    expect(result[0].investment_type).toBe('marketing_campaign');
    expect(result[1].investment_type).toBe('stocks');
  });

  it('should include both active and completed investments', async () => {
    // Create test player
    const [player] = await db.insert(playersTable)
      .values({
        username: testPlayer.username,
        email: testPlayer.email
      })
      .returning()
      .execute();

    // Create active investment
    await db.insert(investmentsTable)
      .values({
        ...testInvestment1,
        player_id: player.id,
        amount_invested: testInvestment1.amount_invested.toString(),
        expected_return: testInvestment1.expected_return.toString(),
        is_completed: false
      })
      .execute();

    // Create completed investment
    await db.insert(investmentsTable)
      .values({
        ...testInvestment2,
        player_id: player.id,
        amount_invested: testInvestment2.amount_invested.toString(),
        expected_return: testInvestment2.expected_return.toString(),
        actual_return: '18750.00',
        is_completed: true,
        completed_at: new Date()
      })
      .execute();

    const params: PlayerIdParam = { playerId: player.id };
    const result = await getPlayerInvestments(params);

    expect(result).toHaveLength(2);

    const activeInvestment = result.find(inv => !inv.is_completed);
    const completedInvestment = result.find(inv => inv.is_completed);

    expect(activeInvestment).toBeDefined();
    expect(completedInvestment).toBeDefined();
    
    expect(activeInvestment!.actual_return).toBe(0);
    expect(activeInvestment!.completed_at).toBeNull();
    
    expect(completedInvestment!.actual_return).toBe(18750.00);
    expect(completedInvestment!.completed_at).toBeInstanceOf(Date);
  });

  it('should not return investments from other players', async () => {
    // Create two test players
    const [player1] = await db.insert(playersTable)
      .values({
        username: 'player1',
        email: 'player1@test.com'
      })
      .returning()
      .execute();

    const [player2] = await db.insert(playersTable)
      .values({
        username: 'player2',
        email: 'player2@test.com'
      })
      .returning()
      .execute();

    // Create investments for both players
    await db.insert(investmentsTable)
      .values([
        {
          ...testInvestment1,
          player_id: player1.id,
          amount_invested: testInvestment1.amount_invested.toString(),
          expected_return: testInvestment1.expected_return.toString()
        },
        {
          ...testInvestment2,
          player_id: player2.id,
          amount_invested: testInvestment2.amount_invested.toString(),
          expected_return: testInvestment2.expected_return.toString()
        }
      ])
      .execute();

    // Fetch investments for player1 only
    const params: PlayerIdParam = { playerId: player1.id };
    const result = await getPlayerInvestments(params);

    expect(result).toHaveLength(1);
    expect(result[0].player_id).toBe(player1.id);
    expect(result[0].investment_type).toBe('stocks');
    
    // Verify no investments from player2 are included
    result.forEach(investment => {
      expect(investment.player_id).not.toBe(player2.id);
    });
  });
});