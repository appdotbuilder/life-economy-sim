import { db } from '../db';
import { employeesTable, businessesTable } from '../db/schema';
import { type CreateEmployeeInput, type Employee } from '../schema';
import { eq } from 'drizzle-orm';

// Helper function to generate AI-driven employee traits
const generateEmployeeTraits = (position: string) => {
  // Base traits with some randomization
  const baseProductivity = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  const baseMorale = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  
  // Position-specific adjustments
  const positionMultipliers: Record<string, { productivity: number; morale: number; experience: number }> = {
    'manager': { productivity: 1.1, morale: 1.0, experience: 3 },
    'developer': { productivity: 1.2, morale: 0.9, experience: 2 },
    'designer': { productivity: 1.0, morale: 1.1, experience: 2 },
    'salesperson': { productivity: 0.9, morale: 1.2, experience: 1 },
    'intern': { productivity: 0.7, morale: 1.3, experience: 1 },
    'senior': { productivity: 1.3, morale: 0.8, experience: 5 },
    'executive': { productivity: 1.2, morale: 1.1, experience: 7 }
  };

  // Find matching position keyword
  const positionLower = position.toLowerCase();
  let multiplier = { productivity: 1.0, morale: 1.0, experience: 1 };
  
  for (const [keyword, mult] of Object.entries(positionMultipliers)) {
    if (positionLower.includes(keyword)) {
      multiplier = mult;
      break;
    }
  }

  return {
    productivity_score: Math.min(2.0, Math.max(0.5, baseProductivity * multiplier.productivity)),
    morale_score: Math.min(2.0, Math.max(0.5, baseMorale * multiplier.morale)),
    experience_level: Math.min(10, Math.max(1, multiplier.experience + Math.floor(Math.random() * 2)))
  };
};

export const createEmployee = async (input: CreateEmployeeInput): Promise<Employee> => {
  try {
    // First verify that the business exists
    const business = await db.select()
      .from(businessesTable)
      .where(eq(businessesTable.id, input.business_id))
      .execute();

    if (business.length === 0) {
      throw new Error(`Business with ID ${input.business_id} not found`);
    }

    // Generate AI-driven traits
    const traits = generateEmployeeTraits(input.position);

    // Insert employee record
    const result = await db.insert(employeesTable)
      .values({
        business_id: input.business_id,
        name: input.name,
        position: input.position,
        salary: input.salary.toString(), // Convert number to string for numeric column
        productivity_score: traits.productivity_score.toString(),
        morale_score: traits.morale_score.toString(),
        experience_level: traits.experience_level
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const employee = result[0];
    return {
      ...employee,
      salary: parseFloat(employee.salary),
      productivity_score: parseFloat(employee.productivity_score),
      morale_score: parseFloat(employee.morale_score)
    };
  } catch (error) {
    console.error('Employee creation failed:', error);
    throw error;
  }
};