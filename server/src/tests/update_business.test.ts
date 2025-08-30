import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, businessesTable } from '../db/schema';
import { type UpdateBusinessInput } from '../schema';
import { updateBusiness } from '../handlers/update_business';
import { eq } from 'drizzle-orm';

describe('updateBusiness', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPlayerId: number;
  let testBusinessId: number;

  beforeEach(async () => {
    // Create a test player first
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    testPlayerId = playerResult[0].id;

    // Create a test business
    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: testPlayerId,
        name: 'Test Business',
        industry: 'technology',
        monthly_income: '10000.00',
        monthly_expenses: '5000.00',
        employee_count: 10,
        growth_rate: '0.1000',
        market_share: '0.0500',
        is_active: true
      })
      .returning()
      .execute();
    testBusinessId = businessResult[0].id;
  });

  it('should update business name', async () => {
    const input: UpdateBusinessInput = {
      id: testBusinessId,
      name: 'Updated Business Name'
    };

    const result = await updateBusiness(input);

    expect(result.name).toEqual('Updated Business Name');
    expect(result.id).toEqual(testBusinessId);
    expect(result.player_id).toEqual(testPlayerId);
    
    // Verify other fields remain unchanged
    expect(result.monthly_income).toEqual(10000);
    expect(result.monthly_expenses).toEqual(5000);
    expect(result.employee_count).toEqual(10);
    expect(result.growth_rate).toEqual(0.1);
    expect(result.market_share).toEqual(0.05);
    expect(result.is_active).toEqual(true);
  });

  it('should update financial metrics', async () => {
    const input: UpdateBusinessInput = {
      id: testBusinessId,
      monthly_income: 25000.50,
      monthly_expenses: 12000.75
    };

    const result = await updateBusiness(input);

    expect(result.monthly_income).toEqual(25000.50);
    expect(result.monthly_expenses).toEqual(12000.75);
    expect(typeof result.monthly_income).toEqual('number');
    expect(typeof result.monthly_expenses).toEqual('number');
    
    // Verify other fields remain unchanged
    expect(result.name).toEqual('Test Business');
    expect(result.employee_count).toEqual(10);
  });

  it('should update employee count', async () => {
    const input: UpdateBusinessInput = {
      id: testBusinessId,
      employee_count: 25
    };

    const result = await updateBusiness(input);

    expect(result.employee_count).toEqual(25);
    expect(result.name).toEqual('Test Business');
    expect(result.monthly_income).toEqual(10000);
  });

  it('should update growth rate and market share', async () => {
    const input: UpdateBusinessInput = {
      id: testBusinessId,
      growth_rate: 0.25,
      market_share: 0.15
    };

    const result = await updateBusiness(input);

    expect(result.growth_rate).toEqual(0.25);
    expect(result.market_share).toEqual(0.15);
    expect(typeof result.growth_rate).toEqual('number');
    expect(typeof result.market_share).toEqual('number');
  });

  it('should update business active status', async () => {
    const input: UpdateBusinessInput = {
      id: testBusinessId,
      is_active: false
    };

    const result = await updateBusiness(input);

    expect(result.is_active).toEqual(false);
    
    // Verify other fields remain unchanged
    expect(result.name).toEqual('Test Business');
    expect(result.monthly_income).toEqual(10000);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateBusinessInput = {
      id: testBusinessId,
      name: 'Multi-Updated Business',
      monthly_income: 30000,
      employee_count: 50,
      growth_rate: 0.3,
      is_active: false
    };

    const result = await updateBusiness(input);

    expect(result.name).toEqual('Multi-Updated Business');
    expect(result.monthly_income).toEqual(30000);
    expect(result.employee_count).toEqual(50);
    expect(result.growth_rate).toEqual(0.3);
    expect(result.is_active).toEqual(false);
    
    // Verify unchanged fields
    expect(result.monthly_expenses).toEqual(5000);
    expect(result.market_share).toEqual(0.05);
  });

  it('should persist changes to database', async () => {
    const input: UpdateBusinessInput = {
      id: testBusinessId,
      name: 'Database Persistent Business',
      monthly_income: 40000
    };

    await updateBusiness(input);

    // Query database directly to verify persistence
    const businesses = await db.select()
      .from(businessesTable)
      .where(eq(businessesTable.id, testBusinessId))
      .execute();

    expect(businesses).toHaveLength(1);
    expect(businesses[0].name).toEqual('Database Persistent Business');
    expect(parseFloat(businesses[0].monthly_income)).toEqual(40000);
  });

  it('should handle zero values correctly', async () => {
    const input: UpdateBusinessInput = {
      id: testBusinessId,
      monthly_income: 0,
      monthly_expenses: 0,
      employee_count: 0,
      growth_rate: 0,
      market_share: 0
    };

    const result = await updateBusiness(input);

    expect(result.monthly_income).toEqual(0);
    expect(result.monthly_expenses).toEqual(0);
    expect(result.employee_count).toEqual(0);
    expect(result.growth_rate).toEqual(0);
    expect(result.market_share).toEqual(0);
  });

  it('should throw error when business does not exist', async () => {
    const input: UpdateBusinessInput = {
      id: 99999,
      name: 'Non-existent Business'
    };

    await expect(updateBusiness(input)).rejects.toThrow(/Business with id 99999 not found/i);
  });

  it('should handle partial updates without affecting other fields', async () => {
    // First, set some specific values
    await updateBusiness({
      id: testBusinessId,
      name: 'Specific Name',
      monthly_income: 15000,
      employee_count: 20,
      growth_rate: 0.2
    });

    // Then update only one field
    const result = await updateBusiness({
      id: testBusinessId,
      monthly_expenses: 7500
    });

    // Verify only monthly_expenses changed
    expect(result.name).toEqual('Specific Name');
    expect(result.monthly_income).toEqual(15000);
    expect(result.monthly_expenses).toEqual(7500);
    expect(result.employee_count).toEqual(20);
    expect(result.growth_rate).toEqual(0.2);
  });
});