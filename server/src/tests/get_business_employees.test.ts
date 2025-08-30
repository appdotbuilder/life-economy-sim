import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, businessesTable, employeesTable } from '../db/schema';
import { type BusinessIdParam } from '../schema';
import { getBusinessEmployees } from '../handlers/get_business_employees';
import { eq } from 'drizzle-orm';

describe('getBusinessEmployees', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return employees for a specific business', async () => {
    // Create prerequisite player and business
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer',
        email: 'test@example.com',
        total_wealth: '50000.00',
        experience_points: 100,
        level: 2
      })
      .returning()
      .execute();

    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerResult[0].id,
        name: 'Test Business',
        industry: 'technology',
        monthly_income: '15000.00',
        monthly_expenses: '8000.00',
        employee_count: 2
      })
      .returning()
      .execute();

    // Create test employees
    await db.insert(employeesTable)
      .values([
        {
          business_id: businessResult[0].id,
          name: 'Alice Johnson',
          position: 'Software Engineer',
          salary: '75000.00',
          productivity_score: '1.25',
          morale_score: '1.15',
          experience_level: 3,
          is_active: true
        },
        {
          business_id: businessResult[0].id,
          name: 'Bob Smith',
          position: 'Marketing Manager',
          salary: '65000.00',
          productivity_score: '1.10',
          morale_score: '0.95',
          experience_level: 2,
          is_active: true
        }
      ])
      .execute();

    const params: BusinessIdParam = { businessId: businessResult[0].id };
    const result = await getBusinessEmployees(params);

    expect(result).toHaveLength(2);
    
    // Verify first employee
    const alice = result.find(emp => emp.name === 'Alice Johnson');
    expect(alice).toBeDefined();
    expect(alice!.position).toEqual('Software Engineer');
    expect(alice!.salary).toEqual(75000);
    expect(typeof alice!.salary).toBe('number');
    expect(alice!.productivity_score).toEqual(1.25);
    expect(typeof alice!.productivity_score).toBe('number');
    expect(alice!.morale_score).toEqual(1.15);
    expect(typeof alice!.morale_score).toBe('number');
    expect(alice!.experience_level).toEqual(3);
    expect(alice!.is_active).toBe(true);
    expect(alice!.hired_at).toBeInstanceOf(Date);

    // Verify second employee
    const bob = result.find(emp => emp.name === 'Bob Smith');
    expect(bob).toBeDefined();
    expect(bob!.position).toEqual('Marketing Manager');
    expect(bob!.salary).toEqual(65000);
    expect(bob!.productivity_score).toEqual(1.10);
    expect(bob!.morale_score).toEqual(0.95);
    expect(bob!.experience_level).toEqual(2);
  });

  it('should return empty array for business with no employees', async () => {
    // Create prerequisite player and business without employees
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'emptyplayer',
        email: 'empty@example.com',
        total_wealth: '25000.00',
        experience_points: 50,
        level: 1
      })
      .returning()
      .execute();

    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerResult[0].id,
        name: 'Empty Business',
        industry: 'finance',
        monthly_income: '0.00',
        monthly_expenses: '1000.00'
      })
      .returning()
      .execute();

    const params: BusinessIdParam = { businessId: businessResult[0].id };
    const result = await getBusinessEmployees(params);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return only active employees by default', async () => {
    // Create prerequisite data
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'activeplayer',
        email: 'active@example.com'
      })
      .returning()
      .execute();

    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerResult[0].id,
        name: 'Mixed Status Business',
        industry: 'retail'
      })
      .returning()
      .execute();

    // Create both active and inactive employees
    await db.insert(employeesTable)
      .values([
        {
          business_id: businessResult[0].id,
          name: 'Active Employee',
          position: 'Sales Rep',
          salary: '45000.00',
          productivity_score: '1.00',
          morale_score: '1.00',
          experience_level: 1,
          is_active: true
        },
        {
          business_id: businessResult[0].id,
          name: 'Inactive Employee',
          position: 'Former Manager',
          salary: '60000.00',
          productivity_score: '0.80',
          morale_score: '0.70',
          experience_level: 5,
          is_active: false
        }
      ])
      .execute();

    const params: BusinessIdParam = { businessId: businessResult[0].id };
    const result = await getBusinessEmployees(params);

    // Should return both active and inactive employees (no filtering in current implementation)
    expect(result).toHaveLength(2);
    
    const activeEmployee = result.find(emp => emp.name === 'Active Employee');
    const inactiveEmployee = result.find(emp => emp.name === 'Inactive Employee');
    
    expect(activeEmployee).toBeDefined();
    expect(activeEmployee!.is_active).toBe(true);
    expect(inactiveEmployee).toBeDefined();
    expect(inactiveEmployee!.is_active).toBe(false);
  });

  it('should return empty array for non-existent business', async () => {
    const params: BusinessIdParam = { businessId: 99999 };
    const result = await getBusinessEmployees(params);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle employees with different performance metrics', async () => {
    // Create prerequisite data
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'perfplayer',
        email: 'perf@example.com'
      })
      .returning()
      .execute();

    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerResult[0].id,
        name: 'Performance Test Business',
        industry: 'manufacturing'
      })
      .returning()
      .execute();

    // Create employees with varied performance metrics
    await db.insert(employeesTable)
      .values([
        {
          business_id: businessResult[0].id,
          name: 'High Performer',
          position: 'Lead Developer',
          salary: '95000.00',
          productivity_score: '1.95',
          morale_score: '1.80',
          experience_level: 8,
          is_active: true
        },
        {
          business_id: businessResult[0].id,
          name: 'Low Performer',
          position: 'Junior Assistant',
          salary: '30000.00',
          productivity_score: '0.65',
          morale_score: '0.70',
          experience_level: 1,
          is_active: true
        }
      ])
      .execute();

    const params: BusinessIdParam = { businessId: businessResult[0].id };
    const result = await getBusinessEmployees(params);

    expect(result).toHaveLength(2);
    
    const highPerformer = result.find(emp => emp.name === 'High Performer');
    expect(highPerformer!.productivity_score).toEqual(1.95);
    expect(highPerformer!.morale_score).toEqual(1.80);
    expect(highPerformer!.salary).toEqual(95000);
    
    const lowPerformer = result.find(emp => emp.name === 'Low Performer');
    expect(lowPerformer!.productivity_score).toEqual(0.65);
    expect(lowPerformer!.morale_score).toEqual(0.70);
    expect(lowPerformer!.salary).toEqual(30000);
  });

  it('should verify employees are saved to database correctly', async () => {
    // Create prerequisite data
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'dbplayer',
        email: 'db@example.com'
      })
      .returning()
      .execute();

    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerResult[0].id,
        name: 'DB Test Business',
        industry: 'healthcare'
      })
      .returning()
      .execute();

    // Create test employee
    const insertResult = await db.insert(employeesTable)
      .values({
        business_id: businessResult[0].id,
        name: 'Database Tester',
        position: 'QA Engineer',
        salary: '70000.00',
        productivity_score: '1.30',
        morale_score: '1.20',
        experience_level: 4,
        is_active: true
      })
      .returning()
      .execute();

    // Query directly from database to verify storage
    const dbEmployee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, insertResult[0].id))
      .execute();

    expect(dbEmployee).toHaveLength(1);
    expect(dbEmployee[0].name).toEqual('Database Tester');
    expect(dbEmployee[0].business_id).toEqual(businessResult[0].id);
    
    // Now test handler
    const params: BusinessIdParam = { businessId: businessResult[0].id };
    const handlerResult = await getBusinessEmployees(params);

    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0].name).toEqual('Database Tester');
    expect(handlerResult[0].salary).toEqual(70000);
    expect(handlerResult[0].productivity_score).toEqual(1.30);
    expect(handlerResult[0].morale_score).toEqual(1.20);
  });
});