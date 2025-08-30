import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { businessPerformanceTable, businessesTable, playersTable } from '../db/schema';
import { type CreateBusinessPerformanceInput } from '../schema';
import { recordBusinessPerformance } from '../handlers/record_business_performance';
import { eq } from 'drizzle-orm';

describe('recordBusinessPerformance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should record business performance snapshot', async () => {
    // Create prerequisite player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer',
        email: 'test@example.com',
        total_wealth: '15000.00',
        experience_points: 100,
        level: 2,
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create prerequisite business
    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerId,
        name: 'Test Business',
        industry: 'technology',
        monthly_income: '5000.00',
        monthly_expenses: '3000.00',
        employee_count: 10,
        growth_rate: '0.0500',
        market_share: '0.0250',
      })
      .returning()
      .execute();

    const businessId = businessResult[0].id;

    // Test input with all numeric fields
    const testInput: CreateBusinessPerformanceInput = {
      business_id: businessId,
      income_snapshot: 6000.00,
      expenses_snapshot: 3500.50,
      employee_count_snapshot: 12,
      growth_rate_snapshot: 0.0750,
      market_share_snapshot: 0.0300,
    };

    const result = await recordBusinessPerformance(testInput);

    // Verify basic field values and types
    expect(result.business_id).toEqual(businessId);
    expect(result.income_snapshot).toEqual(6000.00);
    expect(typeof result.income_snapshot).toBe('number');
    expect(result.expenses_snapshot).toEqual(3500.50);
    expect(typeof result.expenses_snapshot).toBe('number');
    expect(result.employee_count_snapshot).toEqual(12);
    expect(result.growth_rate_snapshot).toEqual(0.0750);
    expect(typeof result.growth_rate_snapshot).toBe('number');
    expect(result.market_share_snapshot).toEqual(0.0300);
    expect(typeof result.market_share_snapshot).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.recorded_at).toBeInstanceOf(Date);
  });

  it('should save business performance record to database', async () => {
    // Create prerequisite player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer2',
        email: 'test2@example.com',
        total_wealth: '20000.00',
        experience_points: 150,
        level: 3,
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create prerequisite business
    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerId,
        name: 'Performance Test Business',
        industry: 'finance',
        monthly_income: '8000.00',
        monthly_expenses: '4000.00',
        employee_count: 15,
        growth_rate: '0.0800',
        market_share: '0.0400',
      })
      .returning()
      .execute();

    const businessId = businessResult[0].id;

    const testInput: CreateBusinessPerformanceInput = {
      business_id: businessId,
      income_snapshot: 8500.75,
      expenses_snapshot: 4200.25,
      employee_count_snapshot: 18,
      growth_rate_snapshot: 0.0900,
      market_share_snapshot: 0.0450,
    };

    const result = await recordBusinessPerformance(testInput);

    // Query database to verify record was saved
    const performanceRecords = await db.select()
      .from(businessPerformanceTable)
      .where(eq(businessPerformanceTable.id, result.id))
      .execute();

    expect(performanceRecords).toHaveLength(1);
    const savedRecord = performanceRecords[0];
    expect(savedRecord.business_id).toEqual(businessId);
    expect(parseFloat(savedRecord.income_snapshot)).toEqual(8500.75);
    expect(parseFloat(savedRecord.expenses_snapshot)).toEqual(4200.25);
    expect(savedRecord.employee_count_snapshot).toEqual(18);
    expect(parseFloat(savedRecord.growth_rate_snapshot)).toEqual(0.0900);
    expect(parseFloat(savedRecord.market_share_snapshot)).toEqual(0.0450);
    expect(savedRecord.recorded_at).toBeInstanceOf(Date);
  });

  it('should handle zero values correctly', async () => {
    // Create prerequisite player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'zeroplayer',
        email: 'zero@example.com',
        total_wealth: '1000.00',
        experience_points: 0,
        level: 1,
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create prerequisite business
    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerId,
        name: 'Zero Business',
        industry: 'retail',
        monthly_income: '0.00',
        monthly_expenses: '0.00',
        employee_count: 0,
        growth_rate: '0.0000',
        market_share: '0.0001',
      })
      .returning()
      .execute();

    const businessId = businessResult[0].id;

    // Test with zero values
    const testInput: CreateBusinessPerformanceInput = {
      business_id: businessId,
      income_snapshot: 0,
      expenses_snapshot: 0,
      employee_count_snapshot: 0,
      growth_rate_snapshot: 0,
      market_share_snapshot: 0,
    };

    const result = await recordBusinessPerformance(testInput);

    expect(result.income_snapshot).toEqual(0);
    expect(result.expenses_snapshot).toEqual(0);
    expect(result.employee_count_snapshot).toEqual(0);
    expect(result.growth_rate_snapshot).toEqual(0);
    expect(result.market_share_snapshot).toEqual(0);
    expect(result.business_id).toEqual(businessId);
  });

  it('should handle large decimal precision correctly', async () => {
    // Create prerequisite player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'precisionplayer',
        email: 'precision@example.com',
        total_wealth: '50000.00',
        experience_points: 500,
        level: 5,
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create prerequisite business
    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerId,
        name: 'Precision Business',
        industry: 'manufacturing',
        monthly_income: '12000.00',
        monthly_expenses: '8000.00',
        employee_count: 25,
        growth_rate: '0.1200',
        market_share: '0.0750',
      })
      .returning()
      .execute();

    const businessId = businessResult[0].id;

    // Test with high precision decimal values
    const testInput: CreateBusinessPerformanceInput = {
      business_id: businessId,
      income_snapshot: 12345.67,
      expenses_snapshot: 8976.54,
      employee_count_snapshot: 28,
      growth_rate_snapshot: 0.1234,
      market_share_snapshot: 0.0789,
    };

    const result = await recordBusinessPerformance(testInput);

    expect(result.income_snapshot).toEqual(12345.67);
    expect(result.expenses_snapshot).toEqual(8976.54);
    expect(result.growth_rate_snapshot).toEqual(0.1234);
    expect(result.market_share_snapshot).toEqual(0.0789);
  });

  it('should create performance records with current timestamp', async () => {
    // Create prerequisite player
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'timeplayer',
        email: 'time@example.com',
        total_wealth: '25000.00',
        experience_points: 250,
        level: 4,
      })
      .returning()
      .execute();

    const playerId = playerResult[0].id;

    // Create prerequisite business
    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerId,
        name: 'Time Business',
        industry: 'healthcare',
        monthly_income: '10000.00',
        monthly_expenses: '6000.00',
        employee_count: 20,
        growth_rate: '0.1000',
        market_share: '0.0500',
      })
      .returning()
      .execute();

    const businessId = businessResult[0].id;

    const beforeTime = new Date();
    
    const testInput: CreateBusinessPerformanceInput = {
      business_id: businessId,
      income_snapshot: 10500.00,
      expenses_snapshot: 6200.00,
      employee_count_snapshot: 22,
      growth_rate_snapshot: 0.1100,
      market_share_snapshot: 0.0550,
    };

    const result = await recordBusinessPerformance(testInput);
    
    const afterTime = new Date();

    expect(result.recorded_at).toBeInstanceOf(Date);
    expect(result.recorded_at.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(result.recorded_at.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});