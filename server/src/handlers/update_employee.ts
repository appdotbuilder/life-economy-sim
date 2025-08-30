import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type UpdateEmployeeInput, type Employee } from '../schema';
import { eq } from 'drizzle-orm';

export const updateEmployee = async (input: UpdateEmployeeInput): Promise<Employee> => {
  try {
    // Build update object with only the fields that are provided
    const updateData: any = {};
    
    if (input.salary !== undefined) {
      updateData.salary = input.salary.toString();
    }
    
    if (input.productivity_score !== undefined) {
      updateData.productivity_score = input.productivity_score.toString();
    }
    
    if (input.morale_score !== undefined) {
      updateData.morale_score = input.morale_score.toString();
    }
    
    if (input.experience_level !== undefined) {
      updateData.experience_level = input.experience_level;
    }
    
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the employee record
    const result = await db.update(employeesTable)
      .set(updateData)
      .where(eq(employeesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Employee with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const employee = result[0];
    return {
      ...employee,
      salary: parseFloat(employee.salary),
      productivity_score: parseFloat(employee.productivity_score),
      morale_score: parseFloat(employee.morale_score)
    };
  } catch (error) {
    console.error('Employee update failed:', error);
    throw error;
  }
};