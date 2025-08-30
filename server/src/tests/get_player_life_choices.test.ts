import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, lifeChoicesTable } from '../db/schema';
import { type CreatePlayerInput, type CreateLifeChoiceInput } from '../schema';
import { getPlayerLifeChoices } from '../handlers/get_player_life_choices';

// Test data
const testPlayer: CreatePlayerInput = {
    username: 'lifechoicetester',
    email: 'lifechoice@test.com'
};

const baseLifeChoice: CreateLifeChoiceInput = {
    player_id: 1,
    choice_type: 'networking_event',
    title: 'Tech Conference Attendance',
    description: 'Attended a major technology conference to network with industry leaders',
    cost: 2500.00,
    wealth_impact: 0,
    business_impact: 0.10,
    experience_gain: 50
};

describe('getPlayerLifeChoices', () => {
    let playerId: number;

    beforeEach(async () => {
        await createDB();
        
        // Create test player
        const playerResult = await db.insert(playersTable)
            .values({
                username: testPlayer.username,
                email: testPlayer.email
            })
            .returning()
            .execute();
        
        playerId = playerResult[0].id;
    });

    afterEach(resetDB);

    it('should return empty array for player with no life choices', async () => {
        const result = await getPlayerLifeChoices(
            { playerId }, 
            { page: 1, limit: 10 }
        );

        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
    });

    it('should return player life choices ordered by most recent first', async () => {
        // Create multiple life choices at different times
        const lifeChoice1 = await db.insert(lifeChoicesTable)
            .values({
                player_id: playerId,
                choice_type: baseLifeChoice.choice_type,
                title: 'First Choice',
                description: baseLifeChoice.description,
                cost: baseLifeChoice.cost.toString(),
                wealth_impact: baseLifeChoice.wealth_impact.toString(),
                business_impact: baseLifeChoice.business_impact.toString(),
                experience_gain: baseLifeChoice.experience_gain,
                made_at: new Date('2024-01-01')
            })
            .returning()
            .execute();

        const lifeChoice2 = await db.insert(lifeChoicesTable)
            .values({
                player_id: playerId,
                choice_type: 'luxury_purchase',
                title: 'Second Choice',
                description: baseLifeChoice.description,
                cost: '95000.00',
                wealth_impact: '-95000.00',
                business_impact: '0.10',
                experience_gain: baseLifeChoice.experience_gain,
                made_at: new Date('2024-01-02')
            })
            .returning()
            .execute();

        const lifeChoice3 = await db.insert(lifeChoicesTable)
            .values({
                player_id: playerId,
                choice_type: 'education',
                title: 'Third Choice',
                description: baseLifeChoice.description,
                cost: '5000.00',
                wealth_impact: baseLifeChoice.wealth_impact.toString(),
                business_impact: baseLifeChoice.business_impact.toString(),
                experience_gain: baseLifeChoice.experience_gain,
                made_at: new Date('2024-01-03')
            })
            .returning()
            .execute();

        const result = await getPlayerLifeChoices(
            { playerId }, 
            { page: 1, limit: 10 }
        );

        expect(result).toHaveLength(3);
        
        // Verify ordering (most recent first)
        expect(result[0].title).toBe('Third Choice');
        expect(result[1].title).toBe('Second Choice');
        expect(result[2].title).toBe('First Choice');

        // Verify numeric field conversions
        expect(typeof result[0].cost).toBe('number');
        expect(typeof result[0].wealth_impact).toBe('number');
        expect(typeof result[0].business_impact).toBe('number');
        expect(result[0].cost).toBe(5000.00);
        
        expect(result[1].cost).toBe(95000.00);
        expect(result[1].wealth_impact).toBe(-95000.00);
        expect(result[1].business_impact).toBe(0.10);
    });

    it('should handle pagination correctly', async () => {
        // Create 5 life choices
        for (let i = 1; i <= 5; i++) {
            await db.insert(lifeChoicesTable)
                .values({
                    player_id: playerId,
                    choice_type: baseLifeChoice.choice_type,
                    title: `Life Choice ${i}`,
                    description: baseLifeChoice.description,
                    cost: (1000 * i).toString(),
                    wealth_impact: baseLifeChoice.wealth_impact.toString(),
                    business_impact: baseLifeChoice.business_impact.toString(),
                    experience_gain: baseLifeChoice.experience_gain,
                    made_at: new Date(`2024-01-0${i}`)
                })
                .returning()
                .execute();
        }

        // Test first page with limit 2
        const page1 = await getPlayerLifeChoices(
            { playerId }, 
            { page: 1, limit: 2 }
        );

        expect(page1).toHaveLength(2);
        expect(page1[0].title).toBe('Life Choice 5'); // Most recent
        expect(page1[1].title).toBe('Life Choice 4');

        // Test second page with limit 2
        const page2 = await getPlayerLifeChoices(
            { playerId }, 
            { page: 2, limit: 2 }
        );

        expect(page2).toHaveLength(2);
        expect(page2[0].title).toBe('Life Choice 3');
        expect(page2[1].title).toBe('Life Choice 2');

        // Test third page with limit 2
        const page3 = await getPlayerLifeChoices(
            { playerId }, 
            { page: 3, limit: 2 }
        );

        expect(page3).toHaveLength(1);
        expect(page3[0].title).toBe('Life Choice 1'); // Oldest
    });

    it('should return empty array when page exceeds available data', async () => {
        // Create only 2 life choices
        await db.insert(lifeChoicesTable)
            .values([
                {
                    player_id: playerId,
                    choice_type: baseLifeChoice.choice_type,
                    title: 'Choice 1',
                    description: baseLifeChoice.description,
                    cost: baseLifeChoice.cost.toString(),
                    wealth_impact: baseLifeChoice.wealth_impact.toString(),
                    business_impact: baseLifeChoice.business_impact.toString(),
                    experience_gain: baseLifeChoice.experience_gain
                },
                {
                    player_id: playerId,
                    choice_type: baseLifeChoice.choice_type,
                    title: 'Choice 2',
                    description: baseLifeChoice.description,
                    cost: baseLifeChoice.cost.toString(),
                    wealth_impact: baseLifeChoice.wealth_impact.toString(),
                    business_impact: baseLifeChoice.business_impact.toString(),
                    experience_gain: baseLifeChoice.experience_gain
                }
            ])
            .execute();

        const result = await getPlayerLifeChoices(
            { playerId }, 
            { page: 5, limit: 10 }
        );

        expect(result).toHaveLength(0);
    });

    it('should only return life choices for the specified player', async () => {
        // Create another test player
        const otherPlayerResult = await db.insert(playersTable)
            .values({
                username: 'otherplayer',
                email: 'other@test.com'
            })
            .returning()
            .execute();
        
        const otherPlayerId = otherPlayerResult[0].id;

        // Create life choices for both players
        await db.insert(lifeChoicesTable)
            .values([
                {
                    player_id: playerId,
                    choice_type: baseLifeChoice.choice_type,
                    title: 'Player 1 Choice',
                    description: baseLifeChoice.description,
                    cost: baseLifeChoice.cost.toString(),
                    wealth_impact: baseLifeChoice.wealth_impact.toString(),
                    business_impact: baseLifeChoice.business_impact.toString(),
                    experience_gain: baseLifeChoice.experience_gain
                },
                {
                    player_id: otherPlayerId,
                    choice_type: baseLifeChoice.choice_type,
                    title: 'Player 2 Choice',
                    description: baseLifeChoice.description,
                    cost: baseLifeChoice.cost.toString(),
                    wealth_impact: baseLifeChoice.wealth_impact.toString(),
                    business_impact: baseLifeChoice.business_impact.toString(),
                    experience_gain: baseLifeChoice.experience_gain
                }
            ])
            .execute();

        const result = await getPlayerLifeChoices(
            { playerId }, 
            { page: 1, limit: 10 }
        );

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Player 1 Choice');
        expect(result[0].player_id).toBe(playerId);
    });

    it('should handle all life choice types correctly', async () => {
        const lifeChoiceTypes = [
            'luxury_purchase',
            'networking_event',
            'education',
            'health_wellness',
            'family_time',
            'savings_investment'
        ];

        // Create a life choice for each type
        for (let i = 0; i < lifeChoiceTypes.length; i++) {
            await db.insert(lifeChoicesTable)
                .values({
                    player_id: playerId,
                    choice_type: lifeChoiceTypes[i] as any,
                    title: `${lifeChoiceTypes[i]} Choice`,
                    description: baseLifeChoice.description,
                    cost: ((i + 1) * 1000).toString(),
                    wealth_impact: (i * 100).toString(),
                    business_impact: (i * 0.05).toString(),
                    experience_gain: baseLifeChoice.experience_gain
                })
                .execute();
        }

        const result = await getPlayerLifeChoices(
            { playerId }, 
            { page: 1, limit: 10 }
        );

        expect(result).toHaveLength(6);
        
        // Verify all types are present
        const returnedTypes = result.map(choice => choice.choice_type);
        lifeChoiceTypes.forEach(type => {
            expect(returnedTypes).toContain(type);
        });

        // Verify data structure is complete
        result.forEach(choice => {
            expect(choice.id).toBeDefined();
            expect(choice.player_id).toBe(playerId);
            expect(choice.choice_type).toBeDefined();
            expect(choice.title).toBeDefined();
            expect(choice.description).toBeDefined();
            expect(typeof choice.cost).toBe('number');
            expect(typeof choice.wealth_impact).toBe('number');
            expect(typeof choice.business_impact).toBe('number');
            expect(typeof choice.experience_gain).toBe('number');
            expect(choice.made_at).toBeInstanceOf(Date);
        });
    });
});