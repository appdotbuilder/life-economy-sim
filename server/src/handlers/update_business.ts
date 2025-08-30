import { db } from '../db';
import { businessesTable } from '../db/schema';
import { type UpdateBusinessInput, type Business } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBusiness = async (input: UpdateBusinessInput): Promise<Business> => {
  try {
    // Build the update object with only the fields that are provided
    const updateFields: any = {};
    
    if (input.name !== undefined) {
      updateFields.name = input.name;
    }
    
    if (input.monthly_income !== undefined) {
      updateFields.monthly_income = input.monthly_income.toString();
    }
    
    if (input.monthly_expenses !== undefined) {
      updateFields.monthly_expenses = input.monthly_expenses.toString();
    }
    
    if (input.employee_count !== undefined) {
      updateFields.employee_count = input.employee_count;
    }
    
    if (input.growth_rate !== undefined) {
      updateFields.growth_rate = input.growth_rate.toString();
    }
    
    if (input.market_share !== undefined) {
      updateFields.market_share = input.market_share.toString();
    }
    
    if (input.is_active !== undefined) {
      updateFields.is_active = input.is_active;
    }

    // Update business record
    const result = await db.update(businessesTable)
      .set(updateFields)
      .where(eq(businessesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Business with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const business = result[0];
    return {
      ...business,
      monthly_income: parseFloat(business.monthly_income),
      monthly_expenses: parseFloat(business.monthly_expenses),
      growth_rate: parseFloat(business.growth_rate),
      market_share: parseFloat(business.market_share)
    };
  } catch (error) {
    console.error('Business update failed:', error);
    throw error;
  }
};