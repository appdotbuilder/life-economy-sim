import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, businessesTable, employeesTable } from '../db/schema';
import { type UpdateEmployeeInput } from '../schema';
import { updateEmployee } from '../handlers/update_employee';
import { eq } from 'drizzle-orm';

describe('updateEmployee', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let playerId: number;
  let businessId: number;
  let employeeId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const playerResult = await db.insert(playersTable)
      .values({
        username: 'testplayer',
        email: 'test@example.com',
      })
      .returning()
      .execute();
    playerId = playerResult[0].id;

    const businessResult = await db.insert(businessesTable)
      .values({
        player_id: playerId,
        name: 'Test Business',
        industry: 'technology',
      })
      .returning()
      .execute();
    businessId = businessResult[0].id;

    const employeeResult = await db.insert(employeesTable)
      .values({
        business_id: businessId,
        name: 'John Doe',
        position: 'Developer',
        salary: '50000.00',
        productivity_score: '1.00',
        morale_score: '1.00',
        experience_level: 1,
      })
      .returning()
      .execute();
    employeeId = employeeResult[0].id;
  });

  it('should update employee salary', async () => {
    const input: UpdateEmployeeInput = {
      id: employeeId,
      salary: 60000.00,
    };

    const result = await updateEmployee(input);

    expect(result.id).toEqual(employeeId);
    expect(result.salary).toEqual(60000.00);
    expect(typeof result.salary).toBe('number');
    expect(result.name).toEqual('John Doe');
    expect(result.position).toEqual('Developer');
  });

  it('should update employee productivity score', async () => {
    const input: UpdateEmployeeInput = {
      id: employeeId,
      productivity_score: 1.5,
    };

    const result = await updateEmployee(input);

    expect(result.id).toEqual(employeeId);
    expect(result.productivity_score).toEqual(1.5);
    expect(typeof result.productivity_score).toBe('number');
  });

  it('should update employee morale score', async () => {
    const input: UpdateEmployeeInput = {
      id: employeeId,
      morale_score: 1.8,
    };

    const result = await updateEmployee(input);

    expect(result.id).toEqual(employeeId);
    expect(result.morale_score).toEqual(1.8);
    expect(typeof result.morale_score).toBe('number');
  });

  it('should update employee experience level', async () => {
    const input: UpdateEmployeeInput = {
      id: employeeId,
      experience_level: 5,
    };

    const result = await updateEmployee(input);

    expect(result.id).toEqual(employeeId);
    expect(result.experience_level).toEqual(5);
  });

  it('should update employee active status', async () => {
    const input: UpdateEmployeeInput = {
      id: employeeId,
      is_active: false,
    };

    const result = await updateEmployee(input);

    expect(result.id).toEqual(employeeId);
    expect(result.is_active).toBe(false);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateEmployeeInput = {
      id: employeeId,
      salary: 75000.00,
      productivity_score: 1.8,
      morale_score: 1.6,
      experience_level: 8,
      is_active: false,
    };

    const result = await updateEmployee(input);

    expect(result.id).toEqual(employeeId);
    expect(result.salary).toEqual(75000.00);
    expect(result.productivity_score).toEqual(1.8);
    expect(result.morale_score).toEqual(1.6);
    expect(result.experience_level).toEqual(8);
    expect(result.is_active).toBe(false);
  });

  it('should save updates to database', async () => {
    const input: UpdateEmployeeInput = {
      id: employeeId,
      salary: 65000.00,
      productivity_score: 1.7,
    };

    await updateEmployee(input);

    // Verify the changes were saved to database
    const employees = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .execute();

    expect(employees).toHaveLength(1);
    expect(parseFloat(employees[0].salary)).toEqual(65000.00);
    expect(parseFloat(employees[0].productivity_score)).toEqual(1.7);
  });

  it('should not update fields that are not provided', async () => {
    const input: UpdateEmployeeInput = {
      id: employeeId,
      salary: 55000.00,
    };

    const result = await updateEmployee(input);

    // Original values should remain unchanged
    expect(result.productivity_score).toEqual(1.00);
    expect(result.morale_score).toEqual(1.00);
    expect(result.experience_level).toEqual(1);
    expect(result.is_active).toBe(true);
    expect(result.name).toEqual('John Doe');
    expect(result.position).toEqual('Developer');
  });

  it('should throw error for non-existent employee', async () => {
    const input: UpdateEmployeeInput = {
      id: 99999,
      salary: 60000.00,
    };

    expect(updateEmployee(input)).rejects.toThrow(/Employee with id 99999 not found/i);
  });

  it('should update only specified fields and preserve others', async () => {
    const input: UpdateEmployeeInput = {
      id: employeeId,
      experience_level: 3,
      is_active: false,
    };

    const result = await updateEmployee(input);

    // Updated fields
    expect(result.experience_level).toEqual(3);
    expect(result.is_active).toBe(false);
    
    // Preserved fields
    expect(result.salary).toEqual(50000.00);
    expect(result.productivity_score).toEqual(1.00);
    expect(result.morale_score).toEqual(1.00);
    expect(result.name).toEqual('John Doe');
    expect(result.position).toEqual('Developer');
  });
});