import { db } from '../db';
import { employeesTable } from '../db/schema';
import { type Employee, type BusinessIdParam } from '../schema';
import { eq } from 'drizzle-orm';

export const getBusinessEmployees = async (params: BusinessIdParam): Promise<Employee[]> => {
  try {
    const results = await db.select()
      .from(employeesTable)
      .where(eq(employeesTable.business_id, params.businessId))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(employee => ({
      ...employee,
      salary: parseFloat(employee.salary),
      productivity_score: parseFloat(employee.productivity_score),
      morale_score: parseFloat(employee.morale_score)
    }));
  } catch (error) {
    console.error('Get business employees failed:', error);
    throw error;
  }
};