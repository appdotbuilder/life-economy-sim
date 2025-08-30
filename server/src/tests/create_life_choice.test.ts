import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { lifeChoicesTable, playersTable } from '../db/schema';
import { type CreateLifeChoiceInput } from '../schema';
import { createLifeChoice } from '../handlers/create_life_choice';
import { eq } from 'drizzle-orm';

// Test player data
const testPlayerData = {
  username: 'testplayer',
  email: 'test@example.com',
  total_wealth: '50000.00',
  experience_points: 100,
  level: 2
};

// Test input with all fields included
const testInput: CreateLifeChoiceInput = {
  player_id: 1, // Will be set after creating player
  choice_type: 'luxury_purchase',
  title: 'Buy Luxury Car',
  description: 'Purchase a high-end sports car to improve lifestyle',
  cost: 25000,
  wealth_impact: 5000,
  business_impact: 0.1,
  experience_gain: 50
};

describe('createLifeChoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a life choice', async () => {
    // Create test player first
    const playerResult = await db.insert(playersTable)
      .values(testPlayerData)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;
    const inputWithPlayerId = { ...testInput, player_id: playerId };

    const result = await createLifeChoice(inputWithPlayerId);

    // Verify basic fields
    expect(result.player_id).toEqual(playerId);
    expect(result.choice_type).toEqual('luxury_purchase');
    expect(result.title).toEqual('Buy Luxury Car');
    expect(result.description).toEqual('Purchase a high-end sports car to improve lifestyle');
    expect(result.cost).toEqual(25000);
    expect(result.wealth_impact).toEqual(5000);
    expect(result.business_impact).toEqual(0.1);
    expect(result.experience_gain).toEqual(50);
    expect(result.id).toBeDefined();
    expect(result.made_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.cost).toBe('number');
    expect(typeof result.wealth_impact).toBe('number');
    expect(typeof result.business_impact).toBe('number');
  });

  it('should save life choice to database', async () => {
    // Create test player first
    const playerResult = await db.insert(playersTable)
      .values(testPlayerData)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;
    const inputWithPlayerId = { ...testInput, player_id: playerId };

    const result = await createLifeChoice(inputWithPlayerId);

    // Query database to verify record was saved
    const lifeChoices = await db.select()
      .from(lifeChoicesTable)
      .where(eq(lifeChoicesTable.id, result.id))
      .execute();

    expect(lifeChoices).toHaveLength(1);
    expect(lifeChoices[0].player_id).toEqual(playerId);
    expect(lifeChoices[0].choice_type).toEqual('luxury_purchase');
    expect(lifeChoices[0].title).toEqual('Buy Luxury Car');
    expect(parseFloat(lifeChoices[0].cost)).toEqual(25000);
    expect(parseFloat(lifeChoices[0].wealth_impact)).toEqual(5000);
    expect(parseFloat(lifeChoices[0].business_impact)).toEqual(0.1);
    expect(lifeChoices[0].experience_gain).toEqual(50);
    expect(lifeChoices[0].made_at).toBeInstanceOf(Date);
  });

  it('should apply wealth and experience effects to player', async () => {
    // Create test player first
    const playerResult = await db.insert(playersTable)
      .values(testPlayerData)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;
    const inputWithPlayerId = { ...testInput, player_id: playerId };

    await createLifeChoice(inputWithPlayerId);

    // Verify player's wealth and experience were updated
    const updatedPlayers = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .execute();

    const updatedPlayer = updatedPlayers[0];
    
    // Expected wealth change: wealth_impact - cost = 5000 - 25000 = -20000
    // Original wealth: 50000, New wealth: 30000
    expect(parseFloat(updatedPlayer.total_wealth)).toEqual(30000);
    
    // Expected experience: original 100 + experience_gain 50 = 150
    expect(updatedPlayer.experience_points).toEqual(150);
    
    // Verify last_active was updated
    expect(updatedPlayer.last_active).toBeInstanceOf(Date);
  });

  it('should handle different choice types correctly', async () => {
    // Create test player first
    const playerResult = await db.insert(playersTable)
      .values(testPlayerData)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;

    const educationChoice: CreateLifeChoiceInput = {
      player_id: playerId,
      choice_type: 'education',
      title: 'MBA Program',
      description: 'Enroll in executive MBA program',
      cost: 15000,
      wealth_impact: 0,
      business_impact: 0.2,
      experience_gain: 100
    };

    const result = await createLifeChoice(educationChoice);

    expect(result.choice_type).toEqual('education');
    expect(result.title).toEqual('MBA Program');
    expect(result.cost).toEqual(15000);
    expect(result.business_impact).toEqual(0.2);
    expect(result.experience_gain).toEqual(100);
  });

  it('should handle zero impact values', async () => {
    // Create test player first
    const playerResult = await db.insert(playersTable)
      .values(testPlayerData)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;

    const neutralChoice: CreateLifeChoiceInput = {
      player_id: playerId,
      choice_type: 'family_time',
      title: 'Weekend Vacation',
      description: 'Spend time with family',
      cost: 2000,
      wealth_impact: 0,
      business_impact: 0,
      experience_gain: 0
    };

    const result = await createLifeChoice(neutralChoice);

    expect(result.wealth_impact).toEqual(0);
    expect(result.business_impact).toEqual(0);
    expect(result.experience_gain).toEqual(0);

    // Verify only cost was deducted from wealth (no wealth_impact)
    const updatedPlayers = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .execute();

    expect(parseFloat(updatedPlayers[0].total_wealth)).toEqual(48000); // 50000 - 2000
    expect(updatedPlayers[0].experience_points).toEqual(100); // No change
  });

  it('should throw error for non-existent player', async () => {
    const inputWithInvalidPlayer = { ...testInput, player_id: 999 };

    expect(createLifeChoice(inputWithInvalidPlayer)).rejects.toThrow(/Player with id 999 not found/i);
  });

  it('should handle negative wealth impact correctly', async () => {
    // Create test player first
    const playerResult = await db.insert(playersTable)
      .values(testPlayerData)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;

    const negativeImpactChoice: CreateLifeChoiceInput = {
      player_id: playerId,
      choice_type: 'health_wellness',
      title: 'Medical Treatment',
      description: 'Emergency medical procedure',
      cost: 10000,
      wealth_impact: -5000, // Additional loss beyond cost
      business_impact: -0.1,
      experience_gain: 10
    };

    const result = await createLifeChoice(negativeImpactChoice);

    expect(result.wealth_impact).toEqual(-5000);
    expect(result.business_impact).toEqual(-0.1);

    // Verify total wealth change: wealth_impact - cost = -5000 - 10000 = -15000
    // Original wealth: 50000, New wealth: 35000
    const updatedPlayers = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .execute();

    expect(parseFloat(updatedPlayers[0].total_wealth)).toEqual(35000);
    expect(updatedPlayers[0].experience_points).toEqual(110); // 100 + 10
  });
});