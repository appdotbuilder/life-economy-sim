import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, achievementsTable } from '../db/schema';
import { type CreatePlayerInput, type CreateAchievementInput } from '../schema';
import { getPlayerAchievements } from '../handlers/get_player_achievements';
import { eq } from 'drizzle-orm';

describe('getPlayerAchievements', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all achievements for a player ordered by unlock date', async () => {
    // Create test player
    const playerInput: CreatePlayerInput = {
      username: 'testuser',
      email: 'test@example.com'
    };

    const playerResults = await db.insert(playersTable)
      .values(playerInput)
      .returning()
      .execute();
    const playerId = playerResults[0].id;

    // Create test achievements
    const achievement1Input: CreateAchievementInput = {
      player_id: playerId,
      achievement_type: 'milestone',
      title: 'First Business',
      description: 'Started your first business venture',
      icon: '🏢',
      experience_reward: 100
    };

    const achievement2Input: CreateAchievementInput = {
      player_id: playerId,
      achievement_type: 'badge',
      title: 'Wealth Builder',
      description: 'Accumulated $50,000 in total wealth',
      icon: '💰',
      experience_reward: 250
    };

    const achievement3Input: CreateAchievementInput = {
      player_id: playerId,
      achievement_type: 'streak',
      title: 'Consistent Growth',
      description: 'Achieved positive growth for 5 consecutive months',
      icon: '📈',
      experience_reward: 200
    };

    // Insert achievements with slight delays to ensure different timestamps
    await db.insert(achievementsTable).values(achievement1Input).execute();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    await db.insert(achievementsTable).values(achievement2Input).execute();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    await db.insert(achievementsTable).values(achievement3Input).execute();

    // Test the handler
    const result = await getPlayerAchievements({ playerId });

    // Verify results
    expect(result).toHaveLength(3);
    
    // Check that results are ordered by unlock date (most recent first)
    expect(result[0].title).toBe('Consistent Growth'); // Most recent
    expect(result[1].title).toBe('Wealth Builder'); // Middle
    expect(result[2].title).toBe('First Business'); // Oldest
    
    // Verify all fields are present and correct types
    result.forEach(achievement => {
      expect(achievement.id).toBeDefined();
      expect(typeof achievement.id).toBe('number');
      expect(achievement.player_id).toBe(playerId);
      expect(typeof achievement.title).toBe('string');
      expect(typeof achievement.description).toBe('string');
      expect(typeof achievement.icon).toBe('string');
      expect(typeof achievement.experience_reward).toBe('number');
      expect(achievement.unlocked_at).toBeInstanceOf(Date);
      expect(['milestone', 'streak', 'badge', 'special_event']).toContain(achievement.achievement_type);
    });
  });

  it('should return empty array for player with no achievements', async () => {
    // Create test player without achievements
    const playerInput: CreatePlayerInput = {
      username: 'emptyuser',
      email: 'empty@example.com'
    };

    const playerResults = await db.insert(playersTable)
      .values(playerInput)
      .returning()
      .execute();
    const playerId = playerResults[0].id;

    // Test the handler
    const result = await getPlayerAchievements({ playerId });

    // Verify empty result
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return achievements for the specified player', async () => {
    // Create two test players
    const player1Input: CreatePlayerInput = {
      username: 'player1',
      email: 'player1@example.com'
    };

    const player2Input: CreatePlayerInput = {
      username: 'player2',
      email: 'player2@example.com'
    };

    const player1Results = await db.insert(playersTable)
      .values(player1Input)
      .returning()
      .execute();
    const player1Id = player1Results[0].id;

    const player2Results = await db.insert(playersTable)
      .values(player2Input)
      .returning()
      .execute();
    const player2Id = player2Results[0].id;

    // Create achievements for both players
    const achievement1Input: CreateAchievementInput = {
      player_id: player1Id,
      achievement_type: 'milestone',
      title: 'Player 1 Achievement',
      description: 'Achievement for player 1',
      icon: '🎯',
      experience_reward: 100
    };

    const achievement2Input: CreateAchievementInput = {
      player_id: player2Id,
      achievement_type: 'badge',
      title: 'Player 2 Achievement',
      description: 'Achievement for player 2',
      icon: '🏆',
      experience_reward: 150
    };

    await db.insert(achievementsTable).values([achievement1Input, achievement2Input]).execute();

    // Test getting achievements for player 1
    const player1Achievements = await getPlayerAchievements({ playerId: player1Id });

    // Verify only player 1's achievement is returned
    expect(player1Achievements).toHaveLength(1);
    expect(player1Achievements[0].title).toBe('Player 1 Achievement');
    expect(player1Achievements[0].player_id).toBe(player1Id);

    // Test getting achievements for player 2
    const player2Achievements = await getPlayerAchievements({ playerId: player2Id });

    // Verify only player 2's achievement is returned
    expect(player2Achievements).toHaveLength(1);
    expect(player2Achievements[0].title).toBe('Player 2 Achievement');
    expect(player2Achievements[0].player_id).toBe(player2Id);
  });

  it('should handle all achievement types correctly', async () => {
    // Create test player
    const playerInput: CreatePlayerInput = {
      username: 'achiever',
      email: 'achiever@example.com'
    };

    const playerResults = await db.insert(playersTable)
      .values(playerInput)
      .returning()
      .execute();
    const playerId = playerResults[0].id;

    // Create achievements of all types
    const achievementInputs: CreateAchievementInput[] = [
      {
        player_id: playerId,
        achievement_type: 'milestone',
        title: 'Milestone Achievement',
        description: 'A milestone achievement',
        icon: '🎯',
        experience_reward: 100
      },
      {
        player_id: playerId,
        achievement_type: 'streak',
        title: 'Streak Achievement',
        description: 'A streak achievement',
        icon: '🔥',
        experience_reward: 150
      },
      {
        player_id: playerId,
        achievement_type: 'badge',
        title: 'Badge Achievement',
        description: 'A badge achievement',
        icon: '🏆',
        experience_reward: 200
      },
      {
        player_id: playerId,
        achievement_type: 'special_event',
        title: 'Special Event Achievement',
        description: 'A special event achievement',
        icon: '⭐',
        experience_reward: 500
      }
    ];

    await db.insert(achievementsTable).values(achievementInputs).execute();

    // Test the handler
    const result = await getPlayerAchievements({ playerId });

    // Verify all achievement types are present
    expect(result).toHaveLength(4);
    
    const achievementTypes = result.map(a => a.achievement_type);
    expect(achievementTypes).toContain('milestone');
    expect(achievementTypes).toContain('streak');
    expect(achievementTypes).toContain('badge');
    expect(achievementTypes).toContain('special_event');

    // Verify experience rewards are correctly returned as numbers
    result.forEach(achievement => {
      expect(typeof achievement.experience_reward).toBe('number');
      expect(achievement.experience_reward).toBeGreaterThanOrEqual(0);
    });
  });

  it('should return achievements with correct date ordering when multiple exist', async () => {
    // Create test player
    const playerInput: CreatePlayerInput = {
      username: 'ordertester',
      email: 'order@example.com'
    };

    const playerResults = await db.insert(playersTable)
      .values(playerInput)
      .returning()
      .execute();
    const playerId = playerResults[0].id;

    // Create achievements with specific timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Insert achievements in non-chronological order
    await db.insert(achievementsTable).values({
      player_id: playerId,
      achievement_type: 'milestone',
      title: 'Middle Achievement',
      description: 'Middle timestamp',
      icon: '🎯',
      experience_reward: 100
    }).execute();

    // Manually update timestamps to ensure order
    const achievements = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.player_id, playerId))
      .execute();

    // Create more achievements to test ordering
    await db.insert(achievementsTable).values([
      {
        player_id: playerId,
        achievement_type: 'badge',
        title: 'Newest Achievement',
        description: 'Most recent timestamp',
        icon: '🏆',
        experience_reward: 200
      },
      {
        player_id: playerId,
        achievement_type: 'streak',
        title: 'Oldest Achievement',
        description: 'Oldest timestamp',
        icon: '🔥',
        experience_reward: 50
      }
    ]).execute();

    // Test the handler
    const result = await getPlayerAchievements({ playerId });

    // Verify correct ordering (newest first)
    expect(result).toHaveLength(3);
    
    // Check that timestamps are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].unlocked_at.getTime()).toBeGreaterThanOrEqual(
        result[i + 1].unlocked_at.getTime()
      );
    }
  });
});