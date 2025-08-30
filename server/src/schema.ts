import { z } from 'zod';

// Enums
export const businessIndustryEnum = z.enum([
  'technology', 'finance', 'healthcare', 'retail', 'manufacturing', 'real_estate', 'entertainment', 'food_service'
]);

export const marketEventTypeEnum = z.enum([
  'boom', 'crash', 'competitor_action', 'economic_crisis', 'regulation_change', 'innovation_breakthrough'
]);

export const investmentTypeEnum = z.enum([
  'stocks', 'marketing_campaign', 'business_expansion', 'real_estate', 'cryptocurrency', 'research_development'
]);

export const achievementTypeEnum = z.enum([
  'milestone', 'streak', 'badge', 'special_event'
]);

export const lifeChoiceTypeEnum = z.enum([
  'luxury_purchase', 'networking_event', 'education', 'health_wellness', 'family_time', 'savings_investment'
]);

// Player schemas
export const playerSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  total_wealth: z.number(),
  experience_points: z.number().int(),
  level: z.number().int(),
  created_at: z.coerce.date(),
  last_active: z.coerce.date(),
});

export type Player = z.infer<typeof playerSchema>;

export const createPlayerInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
});

export type CreatePlayerInput = z.infer<typeof createPlayerInputSchema>;

export const updatePlayerInputSchema = z.object({
  id: z.number(),
  total_wealth: z.number().optional(),
  experience_points: z.number().int().optional(),
  level: z.number().int().optional(),
  last_active: z.coerce.date().optional(),
});

export type UpdatePlayerInput = z.infer<typeof updatePlayerInputSchema>;

// Business schemas
export const businessSchema = z.object({
  id: z.number(),
  player_id: z.number(),
  name: z.string(),
  industry: businessIndustryEnum,
  monthly_income: z.number(),
  monthly_expenses: z.number(),
  employee_count: z.number().int(),
  growth_rate: z.number(),
  market_share: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
});

export type Business = z.infer<typeof businessSchema>;

export const createBusinessInputSchema = z.object({
  player_id: z.number(),
  name: z.string().min(1).max(100),
  industry: businessIndustryEnum,
  monthly_income: z.number().nonnegative().default(0),
  monthly_expenses: z.number().nonnegative().default(0),
});

export type CreateBusinessInput = z.infer<typeof createBusinessInputSchema>;

export const updateBusinessInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  monthly_income: z.number().nonnegative().optional(),
  monthly_expenses: z.number().nonnegative().optional(),
  employee_count: z.number().int().nonnegative().optional(),
  growth_rate: z.number().optional(),
  market_share: z.number().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessInputSchema>;

// Employee schemas
export const employeeSchema = z.object({
  id: z.number(),
  business_id: z.number(),
  name: z.string(),
  position: z.string(),
  salary: z.number(),
  productivity_score: z.number(),
  morale_score: z.number(),
  experience_level: z.number().int(),
  hired_at: z.coerce.date(),
  is_active: z.boolean(),
});

export type Employee = z.infer<typeof employeeSchema>;

export const createEmployeeInputSchema = z.object({
  business_id: z.number(),
  name: z.string().min(1).max(100),
  position: z.string().min(1).max(100),
  salary: z.number().positive(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeInputSchema>;

export const updateEmployeeInputSchema = z.object({
  id: z.number(),
  salary: z.number().positive().optional(),
  productivity_score: z.number().min(0).max(2).optional(),
  morale_score: z.number().min(0).max(2).optional(),
  experience_level: z.number().int().min(1).max(10).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeInputSchema>;

// Market Event schemas
export const marketEventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  event_type: marketEventTypeEnum,
  impact_magnitude: z.number(),
  affected_industry: businessIndustryEnum.nullable(),
  duration_hours: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  expires_at: z.coerce.date(),
});

export type MarketEvent = z.infer<typeof marketEventSchema>;

export const createMarketEventInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  event_type: marketEventTypeEnum,
  impact_magnitude: z.number().min(-1).max(1),
  affected_industry: businessIndustryEnum.nullable(),
  duration_hours: z.number().int().positive().default(24),
});

export type CreateMarketEventInput = z.infer<typeof createMarketEventInputSchema>;

// Life Choice schemas
export const lifeChoiceSchema = z.object({
  id: z.number(),
  player_id: z.number(),
  choice_type: lifeChoiceTypeEnum,
  title: z.string(),
  description: z.string(),
  cost: z.number(),
  wealth_impact: z.number(),
  business_impact: z.number(),
  experience_gain: z.number().int(),
  made_at: z.coerce.date(),
});

export type LifeChoice = z.infer<typeof lifeChoiceSchema>;

export const createLifeChoiceInputSchema = z.object({
  player_id: z.number(),
  choice_type: lifeChoiceTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  cost: z.number().nonnegative(),
  wealth_impact: z.number().default(0),
  business_impact: z.number().min(-1).max(1).default(0),
  experience_gain: z.number().int().nonnegative().default(0),
});

export type CreateLifeChoiceInput = z.infer<typeof createLifeChoiceInputSchema>;

// Investment schemas
export const investmentSchema = z.object({
  id: z.number(),
  player_id: z.number(),
  business_id: z.number().nullable(),
  investment_type: investmentTypeEnum,
  title: z.string(),
  description: z.string(),
  amount_invested: z.number(),
  expected_return: z.number(),
  actual_return: z.number(),
  risk_level: z.number().int(),
  duration_months: z.number().int(),
  is_completed: z.boolean(),
  created_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable(),
});

export type Investment = z.infer<typeof investmentSchema>;

export const createInvestmentInputSchema = z.object({
  player_id: z.number(),
  business_id: z.number().nullable(),
  investment_type: investmentTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  amount_invested: z.number().positive(),
  expected_return: z.number().default(0),
  risk_level: z.number().int().min(1).max(10).default(1),
  duration_months: z.number().int().positive().default(12),
});

export type CreateInvestmentInput = z.infer<typeof createInvestmentInputSchema>;

export const completeInvestmentInputSchema = z.object({
  id: z.number(),
  actual_return: z.number(),
});

export type CompleteInvestmentInput = z.infer<typeof completeInvestmentInputSchema>;

// Achievement schemas
export const achievementSchema = z.object({
  id: z.number(),
  player_id: z.number(),
  achievement_type: achievementTypeEnum,
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  experience_reward: z.number().int(),
  unlocked_at: z.coerce.date(),
});

export type Achievement = z.infer<typeof achievementSchema>;

export const createAchievementInputSchema = z.object({
  player_id: z.number(),
  achievement_type: achievementTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  icon: z.string().min(1).max(50),
  experience_reward: z.number().int().nonnegative().default(0),
});

export type CreateAchievementInput = z.infer<typeof createAchievementInputSchema>;

// Business Performance History schemas
export const businessPerformanceSchema = z.object({
  id: z.number(),
  business_id: z.number(),
  recorded_at: z.coerce.date(),
  income_snapshot: z.number(),
  expenses_snapshot: z.number(),
  employee_count_snapshot: z.number().int(),
  growth_rate_snapshot: z.number(),
  market_share_snapshot: z.number(),
});

export type BusinessPerformance = z.infer<typeof businessPerformanceSchema>;

export const createBusinessPerformanceInputSchema = z.object({
  business_id: z.number(),
  income_snapshot: z.number(),
  expenses_snapshot: z.number(),
  employee_count_snapshot: z.number().int(),
  growth_rate_snapshot: z.number(),
  market_share_snapshot: z.number(),
});

export type CreateBusinessPerformanceInput = z.infer<typeof createBusinessPerformanceInputSchema>;

// Player Wealth History schemas
export const playerWealthHistorySchema = z.object({
  id: z.number(),
  player_id: z.number(),
  recorded_at: z.coerce.date(),
  total_wealth_snapshot: z.number(),
  level_snapshot: z.number().int(),
  experience_points_snapshot: z.number().int(),
});

export type PlayerWealthHistory = z.infer<typeof playerWealthHistorySchema>;

export const createPlayerWealthHistoryInputSchema = z.object({
  player_id: z.number(),
  total_wealth_snapshot: z.number(),
  level_snapshot: z.number().int(),
  experience_points_snapshot: z.number().int(),
});

export type CreatePlayerWealthHistoryInput = z.infer<typeof createPlayerWealthHistoryInputSchema>;

// Composite schemas for dashboard data
export const dashboardDataSchema = z.object({
  player: playerSchema,
  businesses: z.array(businessSchema),
  recent_market_events: z.array(marketEventSchema),
  recent_achievements: z.array(achievementSchema),
  active_investments: z.array(investmentSchema),
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;

export const leaderboardEntrySchema = z.object({
  rank: z.number().int(),
  player: playerSchema,
  total_wealth: z.number(),
  business_count: z.number().int(),
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

export const leaderboardSchema = z.array(leaderboardEntrySchema);

export type Leaderboard = z.infer<typeof leaderboardSchema>;

// Query parameter schemas
export const playerIdParamSchema = z.object({
  playerId: z.coerce.number(),
});

export type PlayerIdParam = z.infer<typeof playerIdParamSchema>;

export const businessIdParamSchema = z.object({
  businessId: z.coerce.number(),
});

export type BusinessIdParam = z.infer<typeof businessIdParamSchema>;

export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;