import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, businessesTable, businessPerformanceTable } from '../db/schema';
import { type BusinessIdParam, type PaginationParams } from '../schema';
import { getBusinessPerformanceHistory } from '../handlers/get_business_performance_history';

// Test data
const testPlayer = {
  username: 'testplayer',
  email: 'test@example.com',
};

const testBusiness = {
  name: 'Test Business',
  industry: 'technology' as const,
  monthly_income: '10000.00',
  monthly_expenses: '5000.00',
};

const testParams: BusinessIdParam = {
  businessId: 1,
};

const defaultPagination: PaginationParams = {
  page: 1,
  limit: 10,
};

describe('getBusinessPerformanceHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no performance history exists', async () => {
    // Create player and business but no performance history
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();

    const businessResult = await db.insert(businessesTable)
      .values({
        ...testBusiness,
        player_id: playerResult[0].id,
      })
      .returning()
      .execute();

    const result = await getBusinessPerformanceHistory(
      { businessId: businessResult[0].id },
      defaultPagination
    );

    expect(result).toEqual([]);
  });

  it('should return performance history for a business', async () => {
    // Create player and business
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();

    const businessResult = await db.insert(businessesTable)
      .values({
        ...testBusiness,
        player_id: playerResult[0].id,
      })
      .returning()
      .execute();

    const businessId = businessResult[0].id;

    // Create performance history records
    const performanceData = [
      {
        business_id: businessId,
        income_snapshot: '12000.50',
        expenses_snapshot: '7500.25',
        employee_count_snapshot: 3,
        growth_rate_snapshot: '0.0800',
        market_share_snapshot: '0.0150',
      },
      {
        business_id: businessId,
        income_snapshot: '13500.75',
        expenses_snapshot: '8000.00',
        employee_count_snapshot: 4,
        growth_rate_snapshot: '0.1200',
        market_share_snapshot: '0.0180',
      }
    ];

    await db.insert(businessPerformanceTable)
      .values(performanceData)
      .execute();

    const result = await getBusinessPerformanceHistory(
      { businessId },
      defaultPagination
    );

    expect(result).toHaveLength(2);
    expect(result[0].business_id).toBe(businessId);
    
    // Verify numeric conversions
    expect(typeof result[0].income_snapshot).toBe('number');
    expect(typeof result[0].expenses_snapshot).toBe('number');
    expect(typeof result[0].growth_rate_snapshot).toBe('number');
    expect(typeof result[0].market_share_snapshot).toBe('number');
    
    // Since we're ordering by recorded_at DESC, and both records were inserted at nearly the same time,
    // we need to check that we got both records with correct numeric conversions
    const incomes = result.map(r => r.income_snapshot).sort((a, b) => b - a);
    const expenses = result.map(r => r.expenses_snapshot).sort((a, b) => b - a);
    
    expect(incomes).toEqual([13500.75, 12000.5]);
    expect(expenses).toEqual([8000, 7500.25]);
    
    // Verify first record (could be either one due to timing)
    expect([12000.5, 13500.75]).toContain(result[0].income_snapshot);
    expect([7500.25, 8000]).toContain(result[0].expenses_snapshot);
  });

  it('should return results ordered by recorded_at descending (newest first)', async () => {
    // Create player and business
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();

    const businessResult = await db.insert(businessesTable)
      .values({
        ...testBusiness,
        player_id: playerResult[0].id,
      })
      .returning()
      .execute();

    const businessId = businessResult[0].id;

    // Create performance history with specific timestamps
    const oldDate = new Date('2024-01-01');
    const recentDate = new Date('2024-01-15');

    await db.insert(businessPerformanceTable)
      .values([
        {
          business_id: businessId,
          recorded_at: oldDate,
          income_snapshot: '10000.00',
          expenses_snapshot: '6000.00',
          employee_count_snapshot: 2,
          growth_rate_snapshot: '0.0500',
          market_share_snapshot: '0.0100',
        },
        {
          business_id: businessId,
          recorded_at: recentDate,
          income_snapshot: '15000.00',
          expenses_snapshot: '8000.00',
          employee_count_snapshot: 5,
          growth_rate_snapshot: '0.1500',
          market_share_snapshot: '0.0200',
        }
      ])
      .execute();

    const result = await getBusinessPerformanceHistory(
      { businessId },
      defaultPagination
    );

    expect(result).toHaveLength(2);
    // First result should be the most recent
    expect(result[0].recorded_at.getTime()).toBe(recentDate.getTime());
    expect(result[0].income_snapshot).toBeCloseTo(15000.00);
    
    // Second result should be the older one
    expect(result[1].recorded_at.getTime()).toBe(oldDate.getTime());
    expect(result[1].income_snapshot).toBeCloseTo(10000.00);
  });

  it('should handle pagination correctly', async () => {
    // Create player and business
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();

    const businessResult = await db.insert(businessesTable)
      .values({
        ...testBusiness,
        player_id: playerResult[0].id,
      })
      .returning()
      .execute();

    const businessId = businessResult[0].id;

    // Create 5 performance history records
    const performanceRecords = Array.from({ length: 5 }, (_, i) => ({
      business_id: businessId,
      recorded_at: new Date(2024, 0, i + 1), // January 1-5, 2024
      income_snapshot: `${10000 + i * 1000}.00`,
      expenses_snapshot: `${5000 + i * 500}.00`,
      employee_count_snapshot: i + 1,
      growth_rate_snapshot: `0.0${i + 1}00`,
      market_share_snapshot: `0.01${i}0`,
    }));

    await db.insert(businessPerformanceTable)
      .values(performanceRecords)
      .execute();

    // Test first page with limit 2
    const firstPage = await getBusinessPerformanceHistory(
      { businessId },
      { page: 1, limit: 2 }
    );

    expect(firstPage).toHaveLength(2);
    // Should get the most recent records (Jan 5 and Jan 4)
    expect(firstPage[0].employee_count_snapshot).toBe(5); // Most recent
    expect(firstPage[1].employee_count_snapshot).toBe(4);

    // Test second page
    const secondPage = await getBusinessPerformanceHistory(
      { businessId },
      { page: 2, limit: 2 }
    );

    expect(secondPage).toHaveLength(2);
    expect(secondPage[0].employee_count_snapshot).toBe(3);
    expect(secondPage[1].employee_count_snapshot).toBe(2);

    // Test third page
    const thirdPage = await getBusinessPerformanceHistory(
      { businessId },
      { page: 3, limit: 2 }
    );

    expect(thirdPage).toHaveLength(1);
    expect(thirdPage[0].employee_count_snapshot).toBe(1); // Oldest record
  });

  it('should return empty array for non-existent business', async () => {
    const result = await getBusinessPerformanceHistory(
      { businessId: 9999 }, // Non-existent business ID
      defaultPagination
    );

    expect(result).toEqual([]);
  });

  it('should handle business with large performance history dataset', async () => {
    // Create player and business
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();

    const businessResult = await db.insert(businessesTable)
      .values({
        ...testBusiness,
        player_id: playerResult[0].id,
      })
      .returning()
      .execute();

    const businessId = businessResult[0].id;

    // Create 50 performance history records
    const performanceRecords = Array.from({ length: 50 }, (_, i) => ({
      business_id: businessId,
      recorded_at: new Date(2024, 0, i + 1),
      income_snapshot: `${10000 + i * 100}.00`,
      expenses_snapshot: `${5000 + i * 50}.00`,
      employee_count_snapshot: Math.floor(i / 5) + 1,
      growth_rate_snapshot: `0.${String(i + 10).padStart(4, '0')}`,
      market_share_snapshot: `0.${String(i + 100).padStart(4, '0')}`,
    }));

    await db.insert(businessPerformanceTable)
      .values(performanceRecords)
      .execute();

    // Test with default pagination
    const result = await getBusinessPerformanceHistory(
      { businessId },
      { page: 1, limit: 10 }
    );

    expect(result).toHaveLength(10);
    // Verify it returns most recent records
    expect(result[0].employee_count_snapshot).toBe(10); // Record 50: floor(49/5) + 1 = 10
    expect(result[9].employee_count_snapshot).toBe(9);  // Record 41: floor(40/5) + 1 = 9
  });

  it('should handle edge case pagination parameters', async () => {
    // Create player and business
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();

    const businessResult = await db.insert(businessesTable)
      .values({
        ...testBusiness,
        player_id: playerResult[0].id,
      })
      .returning()
      .execute();

    const businessId = businessResult[0].id;

    // Create 3 performance records
    await db.insert(businessPerformanceTable)
      .values([
        {
          business_id: businessId,
          income_snapshot: '10000.00',
          expenses_snapshot: '5000.00',
          employee_count_snapshot: 1,
          growth_rate_snapshot: '0.0100',
          market_share_snapshot: '0.0100',
        },
        {
          business_id: businessId,
          income_snapshot: '11000.00',
          expenses_snapshot: '5500.00',
          employee_count_snapshot: 2,
          growth_rate_snapshot: '0.0200',
          market_share_snapshot: '0.0110',
        },
        {
          business_id: businessId,
          income_snapshot: '12000.00',
          expenses_snapshot: '6000.00',
          employee_count_snapshot: 3,
          growth_rate_snapshot: '0.0300',
          market_share_snapshot: '0.0120',
        }
      ])
      .execute();

    // Test requesting page beyond available data
    const result = await getBusinessPerformanceHistory(
      { businessId },
      { page: 5, limit: 10 }
    );

    expect(result).toEqual([]);

    // Test with limit larger than available data
    const allResults = await getBusinessPerformanceHistory(
      { businessId },
      { page: 1, limit: 100 }
    );

    expect(allResults).toHaveLength(3);
  });
});