import { db } from '../db';
import { lifeChoicesTable } from '../db/schema';
import { type LifeChoice, type PlayerIdParam, type PaginationParams } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getPlayerLifeChoices(
    params: PlayerIdParam, 
    pagination: PaginationParams
): Promise<LifeChoice[]> {
    try {
        // Calculate offset for pagination
        const offset = (pagination.page - 1) * pagination.limit;

        // Query life choices for the player with pagination
        const results = await db.select()
            .from(lifeChoicesTable)
            .where(eq(lifeChoicesTable.player_id, params.playerId))
            .orderBy(desc(lifeChoicesTable.made_at))
            .limit(pagination.limit)
            .offset(offset)
            .execute();

        // Convert numeric fields back to numbers before returning
        return results.map(result => ({
            ...result,
            cost: parseFloat(result.cost),
            wealth_impact: parseFloat(result.wealth_impact),
            business_impact: parseFloat(result.business_impact)
        }));
    } catch (error) {
        console.error('Failed to fetch player life choices:', error);
        throw error;
    }
}