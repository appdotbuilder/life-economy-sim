import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  playersTable, 
  businessesTable, 
  marketEventsTable, 
  achievementsTable, 
  investmentsTable 
} from '../db/schema';
import { type PlayerIdParam } from '../schema';
import { getDashboardData } from '../handlers/get_dashboard_data';

const testPlayer = {
  username: 'dashboard_test_user',
  email: 'dashboard@test.com'
};

const testBusiness = {
  name: 'Test Tech Company',
  industry: 'technology' as const,
  monthly_income: 15000.50,
  monthly_expenses: 8500.25
};

const testMarketEvent = {
  title: 'Market Boom',
  description: 'Technology sector experiencing rapid growth',
  event_type: 'boom' as const,
  impact_magnitude: 0.75,
  affected_industry: 'technology' as const,
  duration_hours: 48
};

const testAchievement = {
  achievement_type: 'milestone' as const,
  title: 'First Business',
  description: 'Successfully launched your first business',
  icon: '🏢',
  experience_reward: 100
};

const testInvestment = {
  investment_type: 'stocks' as const,
  title: 'Tech Stock Portfolio',
  description: 'Diversified technology stock investments',
  amount_invested: 10000.00,
  expected_return: 2000.00,
  risk_level: 5,
  duration_months: 12
};

describe('getDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch complete dashboard data for a player', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values({
        ...testPlayer,
        total_wealth: '50000.75',
        experience_points: 1500,
        level: 3
      })
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;

    // Create test business
    await db.insert(businessesTable)
      .values({
        player_id: playerId,
        ...testBusiness,
        monthly_income: testBusiness.monthly_income.toString(),
        monthly_expenses: testBusiness.monthly_expenses.toString(),
        employee_count: 10,
        growth_rate: '0.15',
        market_share: '0.05'
      })
      .execute();

    // Create test market event
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + testMarketEvent.duration_hours);
    
    await db.insert(marketEventsTable)
      .values({
        ...testMarketEvent,
        impact_magnitude: testMarketEvent.impact_magnitude.toString(),
        expires_at: expiresAt
      })
      .execute();

    // Create test achievement
    await db.insert(achievementsTable)
      .values({
        player_id: playerId,
        ...testAchievement
      })
      .execute();

    // Create test investment
    await db.insert(investmentsTable)
      .values({
        player_id: playerId,
        business_id: null,
        ...testInvestment,
        amount_invested: testInvestment.amount_invested.toString(),
        expected_return: testInvestment.expected_return.toString(),
        actual_return: '0.00'
      })
      .execute();

    const params: PlayerIdParam = { playerId };
    const result = await getDashboardData(params);

    // Verify player data
    expect(result.player.id).toEqual(playerId);
    expect(result.player.username).toEqual(testPlayer.username);
    expect(result.player.email).toEqual(testPlayer.email);
    expect(result.player.total_wealth).toEqual(50000.75);
    expect(result.player.experience_points).toEqual(1500);
    expect(result.player.level).toEqual(3);
    expect(result.player.created_at).toBeInstanceOf(Date);
    expect(result.player.last_active).toBeInstanceOf(Date);

    // Verify businesses data
    expect(result.businesses).toHaveLength(1);
    const business = result.businesses[0];
    expect(business.name).toEqual(testBusiness.name);
    expect(business.industry).toEqual(testBusiness.industry);
    expect(business.monthly_income).toEqual(testBusiness.monthly_income);
    expect(business.monthly_expenses).toEqual(testBusiness.monthly_expenses);
    expect(business.employee_count).toEqual(10);
    expect(business.growth_rate).toEqual(0.15);
    expect(business.market_share).toEqual(0.05);
    expect(business.is_active).toEqual(true);

    // Verify market events data
    expect(result.recent_market_events).toHaveLength(1);
    const marketEvent = result.recent_market_events[0];
    expect(marketEvent.title).toEqual(testMarketEvent.title);
    expect(marketEvent.event_type).toEqual(testMarketEvent.event_type);
    expect(marketEvent.impact_magnitude).toEqual(testMarketEvent.impact_magnitude);
    expect(marketEvent.affected_industry).toEqual(testMarketEvent.affected_industry);
    expect(marketEvent.is_active).toEqual(true);

    // Verify achievements data
    expect(result.recent_achievements).toHaveLength(1);
    const achievement = result.recent_achievements[0];
    expect(achievement.title).toEqual(testAchievement.title);
    expect(achievement.achievement_type).toEqual(testAchievement.achievement_type);
    expect(achievement.icon).toEqual(testAchievement.icon);
    expect(achievement.experience_reward).toEqual(testAchievement.experience_reward);

    // Verify investments data
    expect(result.active_investments).toHaveLength(1);
    const investment = result.active_investments[0];
    expect(investment.title).toEqual(testInvestment.title);
    expect(investment.investment_type).toEqual(testInvestment.investment_type);
    expect(investment.amount_invested).toEqual(testInvestment.amount_invested);
    expect(investment.expected_return).toEqual(testInvestment.expected_return);
    expect(investment.actual_return).toEqual(0);
    expect(investment.risk_level).toEqual(testInvestment.risk_level);
    expect(investment.is_completed).toEqual(false);
  });

  it('should throw error for non-existent player', async () => {
    const params: PlayerIdParam = { playerId: 999 };
    
    await expect(getDashboardData(params)).rejects.toThrow(/Player with ID 999 not found/i);
  });

  it('should return empty arrays when player has no associated data', async () => {
    // Create test player only
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;
    const params: PlayerIdParam = { playerId };
    
    const result = await getDashboardData(params);

    expect(result.player.id).toEqual(playerId);
    expect(result.businesses).toHaveLength(0);
    expect(result.recent_market_events).toHaveLength(0);
    expect(result.recent_achievements).toHaveLength(0);
    expect(result.active_investments).toHaveLength(0);
  });

  it('should only return active businesses', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;

    // Create active business
    await db.insert(businessesTable)
      .values({
        player_id: playerId,
        name: 'Active Business',
        industry: 'technology',
        monthly_income: '10000.00',
        monthly_expenses: '5000.00',
        is_active: true
      })
      .execute();

    // Create inactive business
    await db.insert(businessesTable)
      .values({
        player_id: playerId,
        name: 'Inactive Business',
        industry: 'finance',
        monthly_income: '8000.00',
        monthly_expenses: '4000.00',
        is_active: false
      })
      .execute();

    const params: PlayerIdParam = { playerId };
    const result = await getDashboardData(params);

    expect(result.businesses).toHaveLength(1);
    expect(result.businesses[0].name).toEqual('Active Business');
    expect(result.businesses[0].is_active).toEqual(true);
  });

  it('should only return active market events from last 7 days', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;

    // Create recent active market event
    const recentDate = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await db.insert(marketEventsTable)
      .values({
        title: 'Recent Event',
        description: 'A recent market event',
        event_type: 'boom',
        impact_magnitude: '0.5',
        affected_industry: null,
        duration_hours: 24,
        is_active: true,
        created_at: recentDate,
        expires_at: expiresAt
      })
      .execute();

    // Create old active market event (should be filtered out)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const oldExpiresAt = new Date();
    oldExpiresAt.setDate(oldExpiresAt.getDate() - 9);
    
    await db.insert(marketEventsTable)
      .values({
        title: 'Old Event',
        description: 'An old market event',
        event_type: 'crash',
        impact_magnitude: '-0.3',
        affected_industry: null,
        duration_hours: 24,
        is_active: true,
        created_at: oldDate,
        expires_at: oldExpiresAt
      })
      .execute();

    // Create recent inactive market event (should be filtered out)
    await db.insert(marketEventsTable)
      .values({
        title: 'Inactive Event',
        description: 'An inactive market event',
        event_type: 'boom',
        impact_magnitude: '0.4',
        affected_industry: null,
        duration_hours: 24,
        is_active: false,
        created_at: recentDate,
        expires_at: expiresAt
      })
      .execute();

    const params: PlayerIdParam = { playerId };
    const result = await getDashboardData(params);

    expect(result.recent_market_events).toHaveLength(1);
    expect(result.recent_market_events[0].title).toEqual('Recent Event');
    expect(result.recent_market_events[0].is_active).toEqual(true);
  });

  it('should only return active (not completed) investments', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;

    // Create active investment
    await db.insert(investmentsTable)
      .values({
        player_id: playerId,
        business_id: null,
        investment_type: 'stocks',
        title: 'Active Investment',
        description: 'An active investment',
        amount_invested: '5000.00',
        expected_return: '1000.00',
        actual_return: '0.00',
        risk_level: 5,
        duration_months: 12,
        is_completed: false
      })
      .execute();

    // Create completed investment
    await db.insert(investmentsTable)
      .values({
        player_id: playerId,
        business_id: null,
        investment_type: 'real_estate',
        title: 'Completed Investment',
        description: 'A completed investment',
        amount_invested: '10000.00',
        expected_return: '2000.00',
        actual_return: '2500.00',
        risk_level: 3,
        duration_months: 24,
        is_completed: true,
        completed_at: new Date()
      })
      .execute();

    const params: PlayerIdParam = { playerId };
    const result = await getDashboardData(params);

    expect(result.active_investments).toHaveLength(1);
    expect(result.active_investments[0].title).toEqual('Active Investment');
    expect(result.active_investments[0].is_completed).toEqual(false);
  });

  it('should limit recent achievements to 10 items', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;

    // Create 15 achievements
    const achievements = [];
    for (let i = 1; i <= 15; i++) {
      achievements.push({
        player_id: playerId,
        achievement_type: 'milestone' as const,
        title: `Achievement ${i}`,
        description: `Description for achievement ${i}`,
        icon: '🏆',
        experience_reward: 50
      });
    }

    await db.insert(achievementsTable)
      .values(achievements)
      .execute();

    const params: PlayerIdParam = { playerId };
    const result = await getDashboardData(params);

    expect(result.recent_achievements).toHaveLength(10);
    // Should be ordered by unlocked_at descending (most recent first)
    expect(result.recent_achievements[0].title).toMatch(/Achievement \d+/);
  });

  it('should limit recent market events to 5 items', async () => {
    // Create test player
    const playerResult = await db.insert(playersTable)
      .values(testPlayer)
      .returning()
      .execute();
    
    const playerId = playerResult[0].id;

    // Create 8 market events
    const events = [];
    for (let i = 1; i <= 8; i++) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      events.push({
        title: `Market Event ${i}`,
        description: `Description for event ${i}`,
        event_type: 'boom' as const,
        impact_magnitude: '0.5',
        affected_industry: null,
        duration_hours: 24,
        is_active: true,
        expires_at: expiresAt
      });
    }

    await db.insert(marketEventsTable)
      .values(events)
      .execute();

    const params: PlayerIdParam = { playerId };
    const result = await getDashboardData(params);

    expect(result.recent_market_events).toHaveLength(5);
    // Should be ordered by created_at descending (most recent first)
    expect(result.recent_market_events[0].title).toMatch(/Market Event \d+/);
  });
});