import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { achievementsTable, playersTable } from '../db/schema';
import { type CreateAchievementInput, type CreatePlayerInput } from '../schema';
import { createAchievement } from '../handlers/create_achievement';
import { eq } from 'drizzle-orm';

// Test player data
const testPlayer: CreatePlayerInput = {
  username: 'testplayer',
  email: 'test@example.com'
};

// Test achievement input
const testAchievement: CreateAchievementInput = {
  player_id: 1, // Will be set after player creation
  achievement_type: 'milestone',
  title: 'First Business',
  description: 'Congratulations on starting your first business!',
  icon: 'trophy',
  experience_reward: 100
};

describe('createAchievement', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test player
  const createTestPlayer = async (): Promise<number> => {
    const result = await db.insert(playersTable)
      .values({
        username: testPlayer.username,
        email: testPlayer.email
      })
      .returning()
      .execute();
    
    return result[0].id;
  };

  it('should create an achievement', async () => {
    const playerId = await createTestPlayer();
    const input = { ...testAchievement, player_id: playerId };

    const result = await createAchievement(input);

    // Verify basic achievement fields
    expect(result.player_id).toEqual(playerId);
    expect(result.achievement_type).toEqual('milestone');
    expect(result.title).toEqual('First Business');
    expect(result.description).toEqual('Congratulations on starting your first business!');
    expect(result.icon).toEqual('trophy');
    expect(result.experience_reward).toEqual(100);
    expect(result.id).toBeDefined();
    expect(result.unlocked_at).toBeInstanceOf(Date);
  });

  it('should save achievement to database', async () => {
    const playerId = await createTestPlayer();
    const input = { ...testAchievement, player_id: playerId };

    const result = await createAchievement(input);

    // Query database to verify achievement was saved
    const achievements = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.id, result.id))
      .execute();

    expect(achievements).toHaveLength(1);
    expect(achievements[0].player_id).toEqual(playerId);
    expect(achievements[0].title).toEqual('First Business');
    expect(achievements[0].description).toEqual('Congratulations on starting your first business!');
    expect(achievements[0].icon).toEqual('trophy');
    expect(achievements[0].experience_reward).toEqual(100);
    expect(achievements[0].unlocked_at).toBeInstanceOf(Date);
  });

  it('should update player experience points when achievement has reward', async () => {
    const playerId = await createTestPlayer();
    const input = { ...testAchievement, player_id: playerId, experience_reward: 250 };

    // Get initial player state
    const initialPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .execute();
    
    const initialExperience = initialPlayer[0].experience_points;

    await createAchievement(input);

    // Verify player experience was updated
    const updatedPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .execute();

    expect(updatedPlayer[0].experience_points).toEqual(initialExperience + 250);
  });

  it('should not update player experience points when reward is zero', async () => {
    const playerId = await createTestPlayer();
    const input = { ...testAchievement, player_id: playerId, experience_reward: 0 };

    // Get initial player state
    const initialPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .execute();
    
    const initialExperience = initialPlayer[0].experience_points;

    await createAchievement(input);

    // Verify player experience was not changed
    const updatedPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .execute();

    expect(updatedPlayer[0].experience_points).toEqual(initialExperience);
  });

  it('should create achievements with different types', async () => {
    const playerId = await createTestPlayer();
    
    const achievements = [
      { ...testAchievement, player_id: playerId, achievement_type: 'milestone' as const, title: 'Milestone Achievement' },
      { ...testAchievement, player_id: playerId, achievement_type: 'streak' as const, title: 'Streak Achievement' },
      { ...testAchievement, player_id: playerId, achievement_type: 'badge' as const, title: 'Badge Achievement' },
      { ...testAchievement, player_id: playerId, achievement_type: 'special_event' as const, title: 'Special Event Achievement' }
    ];

    const results = await Promise.all(
      achievements.map(achievement => createAchievement(achievement))
    );

    expect(results).toHaveLength(4);
    expect(results[0].achievement_type).toEqual('milestone');
    expect(results[1].achievement_type).toEqual('streak');
    expect(results[2].achievement_type).toEqual('badge');
    expect(results[3].achievement_type).toEqual('special_event');

    // Verify all were saved to database
    const savedAchievements = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.player_id, playerId))
      .execute();

    expect(savedAchievements).toHaveLength(4);
  });

  it('should handle achievements with zero experience reward', async () => {
    const playerId = await createTestPlayer();
    const inputWithZeroReward: CreateAchievementInput = {
      player_id: playerId,
      achievement_type: 'badge',
      title: 'Zero Reward Achievement',
      description: 'This achievement has zero experience reward',
      icon: 'star',
      experience_reward: 0
    };

    const result = await createAchievement(inputWithZeroReward);

    expect(result.experience_reward).toEqual(0);
  });

  it('should throw error for non-existent player', async () => {
    const input = { ...testAchievement, player_id: 999 };

    await expect(createAchievement(input)).rejects.toThrow(/Player with id 999 does not exist/i);
  });

  it('should handle large experience rewards correctly', async () => {
    const playerId = await createTestPlayer();
    const largeReward = 10000;
    const input = { ...testAchievement, player_id: playerId, experience_reward: largeReward };

    // Get initial player state
    const initialPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .execute();
    
    const initialExperience = initialPlayer[0].experience_points;

    const result = await createAchievement(input);

    expect(result.experience_reward).toEqual(largeReward);

    // Verify player experience was updated correctly
    const updatedPlayer = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .execute();

    expect(updatedPlayer[0].experience_points).toEqual(initialExperience + largeReward);
  });

  it('should preserve achievement unlocked_at timestamp', async () => {
    const playerId = await createTestPlayer();
    const input = { ...testAchievement, player_id: playerId };

    const beforeCreation = new Date();
    const result = await createAchievement(input);
    const afterCreation = new Date();

    expect(result.unlocked_at).toBeInstanceOf(Date);
    expect(result.unlocked_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.unlocked_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});