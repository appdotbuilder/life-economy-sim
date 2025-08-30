import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { employeesTable, businessesTable, playersTable } from '../db/schema';
import { type CreateEmployeeInput } from '../schema';
import { createEmployee } from '../handlers/create_employee';
import { eq } from 'drizzle-orm';

// Test data setup
let testPlayerId: number;
let testBusinessId: number;

const setupTestData = async () => {
  // Create test player first
  const playerResult = await db.insert(playersTable)
    .values({
      username: 'testplayer',
      email: 'test@example.com'
    })
    .returning()
    .execute();
  
  testPlayerId = playerResult[0].id;

  // Create test business
  const businessResult = await db.insert(businessesTable)
    .values({
      player_id: testPlayerId,
      name: 'Test Business',
      industry: 'technology'
    })
    .returning()
    .execute();

  testBusinessId = businessResult[0].id;
};

const testInput: CreateEmployeeInput = {
  business_id: 0, // Will be set in beforeEach
  name: 'John Developer',
  position: 'Software Developer',
  salary: 75000
};

describe('createEmployee', () => {
  beforeEach(async () => {
    await createDB();
    await setupTestData();
    testInput.business_id = testBusinessId;
  });

  afterEach(resetDB);

  it('should create an employee with basic information', async () => {
    const result = await createEmployee(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Developer');
    expect(result.position).toEqual('Software Developer');
    expect(result.salary).toEqual(75000);
    expect(result.business_id).toEqual(testBusinessId);
    expect(result.id).toBeDefined();
    expect(result.hired_at).toBeInstanceOf(Date);
    expect(result.is_active).toBe(true);

    // Numeric types should be numbers, not strings
    expect(typeof result.salary).toBe('number');
    expect(typeof result.productivity_score).toBe('number');
    expect(typeof result.morale_score).toBe('number');
    expect(typeof result.experience_level).toBe('number');
  });

  it('should generate AI-driven traits within valid ranges', async () => {
    const result = await createEmployee(testInput);

    // Validate trait ranges
    expect(result.productivity_score).toBeGreaterThanOrEqual(0.5);
    expect(result.productivity_score).toBeLessThanOrEqual(2.0);
    expect(result.morale_score).toBeGreaterThanOrEqual(0.5);
    expect(result.morale_score).toBeLessThanOrEqual(2.0);
    expect(result.experience_level).toBeGreaterThanOrEqual(1);
    expect(result.experience_level).toBeLessThanOrEqual(10);
  });

  it('should save employee to database correctly', async () => {
    const result = await createEmployee(testInput);

    // Query database to verify persistence
    const employees = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, result.id))
      .execute();

    expect(employees).toHaveLength(1);
    const employee = employees[0];
    
    expect(employee.name).toEqual('John Developer');
    expect(employee.position).toEqual('Software Developer');
    expect(parseFloat(employee.salary)).toEqual(75000);
    expect(employee.business_id).toEqual(testBusinessId);
    expect(employee.hired_at).toBeInstanceOf(Date);
    expect(employee.is_active).toBe(true);
  });

  it('should apply position-specific trait adjustments', async () => {
    // Test different positions
    const managerInput: CreateEmployeeInput = {
      business_id: testBusinessId,
      name: 'Jane Manager',
      position: 'Project Manager',
      salary: 85000
    };

    const internInput: CreateEmployeeInput = {
      business_id: testBusinessId,
      name: 'Bob Intern',
      position: 'Software Intern',
      salary: 35000
    };

    const manager = await createEmployee(managerInput);
    const intern = await createEmployee(internInput);

    // Manager should typically have higher experience level
    expect(manager.experience_level).toBeGreaterThanOrEqual(3);
    
    // Intern should have lower experience but higher morale tendency
    expect(intern.experience_level).toBeLessThanOrEqual(2);
    
    // Both should have valid trait ranges
    expect(manager.productivity_score).toBeGreaterThanOrEqual(0.5);
    expect(intern.productivity_score).toBeGreaterThanOrEqual(0.5);
  });

  it('should handle different salary amounts correctly', async () => {
    const highSalaryInput: CreateEmployeeInput = {
      business_id: testBusinessId,
      name: 'Senior Executive',
      position: 'Senior Executive',
      salary: 150000.50
    };

    const result = await createEmployee(highSalaryInput);

    expect(result.salary).toEqual(150000.50);
    expect(typeof result.salary).toBe('number');

    // Verify in database
    const dbEmployee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, result.id))
      .execute();

    expect(parseFloat(dbEmployee[0].salary)).toEqual(150000.50);
  });

  it('should throw error for non-existent business', async () => {
    const invalidInput: CreateEmployeeInput = {
      business_id: 99999, // Non-existent business ID
      name: 'Test Employee',
      position: 'Test Position',
      salary: 50000
    };

    await expect(createEmployee(invalidInput)).rejects.toThrow(/Business with ID 99999 not found/i);
  });

  it('should create multiple employees for same business', async () => {
    const employee1Input: CreateEmployeeInput = {
      business_id: testBusinessId,
      name: 'Alice Developer',
      position: 'Frontend Developer',
      salary: 70000
    };

    const employee2Input: CreateEmployeeInput = {
      business_id: testBusinessId,
      name: 'Bob Designer',
      position: 'UI Designer',
      salary: 65000
    };

    const employee1 = await createEmployee(employee1Input);
    const employee2 = await createEmployee(employee2Input);

    // Should have different IDs
    expect(employee1.id).not.toEqual(employee2.id);
    
    // Both should belong to same business
    expect(employee1.business_id).toEqual(testBusinessId);
    expect(employee2.business_id).toEqual(testBusinessId);

    // Verify both exist in database
    const allEmployees = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.business_id, testBusinessId))
      .execute();

    expect(allEmployees).toHaveLength(2);
  });

  it('should handle special characters in employee names and positions', async () => {
    const specialInput: CreateEmployeeInput = {
      business_id: testBusinessId,
      name: "Maria García-López",
      position: "Sr. Software Engineer & Tech Lead",
      salary: 95000
    };

    const result = await createEmployee(specialInput);

    expect(result.name).toEqual("Maria García-López");
    expect(result.position).toEqual("Sr. Software Engineer & Tech Lead");
    
    // Verify in database
    const dbEmployee = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, result.id))
      .execute();

    expect(dbEmployee[0].name).toEqual("Maria García-López");
    expect(dbEmployee[0].position).toEqual("Sr. Software Engineer & Tech Lead");
  });
});