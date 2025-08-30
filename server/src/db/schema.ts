import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const businessIndustryEnum = pgEnum('business_industry', [
  'technology', 'finance', 'healthcare', 'retail', 'manufacturing', 'real_estate', 'entertainment', 'food_service'
]);

export const marketEventTypeEnum = pgEnum('market_event_type', [
  'boom', 'crash', 'competitor_action', 'economic_crisis', 'regulation_change', 'innovation_breakthrough'
]);

export const investmentTypeEnum = pgEnum('investment_type', [
  'stocks', 'marketing_campaign', 'business_expansion', 'real_estate', 'cryptocurrency', 'research_development'
]);

export const achievementTypeEnum = pgEnum('achievement_type', [
  'milestone', 'streak', 'badge', 'special_event'
]);

export const lifeChoiceTypeEnum = pgEnum('life_choice_type', [
  'luxury_purchase', 'networking_event', 'education', 'health_wellness', 'family_time', 'savings_investment'
]);

// Players table
export const playersTable = pgTable('players', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  total_wealth: numeric('total_wealth', { precision: 15, scale: 2 }).notNull().default('10000.00'),
  experience_points: integer('experience_points').notNull().default(0),
  level: integer('level').notNull().default(1),
  created_at: timestamp('created_at').defaultNow().notNull(),
  last_active: timestamp('last_active').defaultNow().notNull(),
});

// Businesses table
export const businessesTable = pgTable('businesses', {
  id: serial('id').primaryKey(),
  player_id: integer('player_id').notNull(),
  name: text('name').notNull(),
  industry: businessIndustryEnum('industry').notNull(),
  monthly_income: numeric('monthly_income', { precision: 12, scale: 2 }).notNull().default('0.00'),
  monthly_expenses: numeric('monthly_expenses', { precision: 12, scale: 2 }).notNull().default('0.00'),
  employee_count: integer('employee_count').notNull().default(0),
  growth_rate: numeric('growth_rate', { precision: 5, scale: 4 }).notNull().default('0.0000'), // Percentage as decimal
  market_share: numeric('market_share', { precision: 5, scale: 4 }).notNull().default('0.0001'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Employees table
export const employeesTable = pgTable('employees', {
  id: serial('id').primaryKey(),
  business_id: integer('business_id').notNull(),
  name: text('name').notNull(),
  position: text('position').notNull(),
  salary: numeric('salary', { precision: 10, scale: 2 }).notNull(),
  productivity_score: numeric('productivity_score', { precision: 3, scale: 2 }).notNull().default('1.00'),
  morale_score: numeric('morale_score', { precision: 3, scale: 2 }).notNull().default('1.00'),
  experience_level: integer('experience_level').notNull().default(1),
  hired_at: timestamp('hired_at').defaultNow().notNull(),
  is_active: boolean('is_active').notNull().default(true),
});

// Market Events table
export const marketEventsTable = pgTable('market_events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  event_type: marketEventTypeEnum('event_type').notNull(),
  impact_magnitude: numeric('impact_magnitude', { precision: 3, scale: 2 }).notNull(), // -1.0 to 1.0
  affected_industry: businessIndustryEnum('affected_industry'),
  duration_hours: integer('duration_hours').notNull().default(24),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  expires_at: timestamp('expires_at').notNull(),
});

// Life Choices table
export const lifeChoicesTable = pgTable('life_choices', {
  id: serial('id').primaryKey(),
  player_id: integer('player_id').notNull(),
  choice_type: lifeChoiceTypeEnum('choice_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  wealth_impact: numeric('wealth_impact', { precision: 10, scale: 2 }).notNull().default('0.00'),
  business_impact: numeric('business_impact', { precision: 3, scale: 2 }).notNull().default('0.00'),
  experience_gain: integer('experience_gain').notNull().default(0),
  made_at: timestamp('made_at').defaultNow().notNull(),
});

// Investments table
export const investmentsTable = pgTable('investments', {
  id: serial('id').primaryKey(),
  player_id: integer('player_id').notNull(),
  business_id: integer('business_id'),
  investment_type: investmentTypeEnum('investment_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  amount_invested: numeric('amount_invested', { precision: 12, scale: 2 }).notNull(),
  expected_return: numeric('expected_return', { precision: 12, scale: 2 }).notNull().default('0.00'),
  actual_return: numeric('actual_return', { precision: 12, scale: 2 }).notNull().default('0.00'),
  risk_level: integer('risk_level').notNull().default(1), // 1-10 scale
  duration_months: integer('duration_months').notNull().default(12),
  is_completed: boolean('is_completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at'),
});

// Achievements table
export const achievementsTable = pgTable('achievements', {
  id: serial('id').primaryKey(),
  player_id: integer('player_id').notNull(),
  achievement_type: achievementTypeEnum('achievement_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  experience_reward: integer('experience_reward').notNull().default(0),
  unlocked_at: timestamp('unlocked_at').defaultNow().notNull(),
});

// Business Performance History table
export const businessPerformanceTable = pgTable('business_performance_history', {
  id: serial('id').primaryKey(),
  business_id: integer('business_id').notNull(),
  recorded_at: timestamp('recorded_at').defaultNow().notNull(),
  income_snapshot: numeric('income_snapshot', { precision: 12, scale: 2 }).notNull(),
  expenses_snapshot: numeric('expenses_snapshot', { precision: 12, scale: 2 }).notNull(),
  employee_count_snapshot: integer('employee_count_snapshot').notNull(),
  growth_rate_snapshot: numeric('growth_rate_snapshot', { precision: 5, scale: 4 }).notNull(),
  market_share_snapshot: numeric('market_share_snapshot', { precision: 5, scale: 4 }).notNull(),
});

// Player Wealth History table
export const playerWealthHistoryTable = pgTable('player_wealth_history', {
  id: serial('id').primaryKey(),
  player_id: integer('player_id').notNull(),
  recorded_at: timestamp('recorded_at').defaultNow().notNull(),
  total_wealth_snapshot: numeric('total_wealth_snapshot', { precision: 15, scale: 2 }).notNull(),
  level_snapshot: integer('level_snapshot').notNull(),
  experience_points_snapshot: integer('experience_points_snapshot').notNull(),
});

// Relations
export const playersRelations = relations(playersTable, ({ many }) => ({
  businesses: many(businessesTable),
  lifeChoices: many(lifeChoicesTable),
  investments: many(investmentsTable),
  achievements: many(achievementsTable),
  wealthHistory: many(playerWealthHistoryTable),
}));

export const businessesRelations = relations(businessesTable, ({ one, many }) => ({
  player: one(playersTable, {
    fields: [businessesTable.player_id],
    references: [playersTable.id],
  }),
  employees: many(employeesTable),
  investments: many(investmentsTable),
  performanceHistory: many(businessPerformanceTable),
}));

export const employeesRelations = relations(employeesTable, ({ one }) => ({
  business: one(businessesTable, {
    fields: [employeesTable.business_id],
    references: [businessesTable.id],
  }),
}));

export const lifeChoicesRelations = relations(lifeChoicesTable, ({ one }) => ({
  player: one(playersTable, {
    fields: [lifeChoicesTable.player_id],
    references: [playersTable.id],
  }),
}));

export const investmentsRelations = relations(investmentsTable, ({ one }) => ({
  player: one(playersTable, {
    fields: [investmentsTable.player_id],
    references: [playersTable.id],
  }),
  business: one(businessesTable, {
    fields: [investmentsTable.business_id],
    references: [businessesTable.id],
  }),
}));

export const achievementsRelations = relations(achievementsTable, ({ one }) => ({
  player: one(playersTable, {
    fields: [achievementsTable.player_id],
    references: [playersTable.id],
  }),
}));

export const businessPerformanceRelations = relations(businessPerformanceTable, ({ one }) => ({
  business: one(businessesTable, {
    fields: [businessPerformanceTable.business_id],
    references: [businessesTable.id],
  }),
}));

export const playerWealthHistoryRelations = relations(playerWealthHistoryTable, ({ one }) => ({
  player: one(playersTable, {
    fields: [playerWealthHistoryTable.player_id],
    references: [playersTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  players: playersTable,
  businesses: businessesTable,
  employees: employeesTable,
  marketEvents: marketEventsTable,
  lifeChoices: lifeChoicesTable,
  investments: investmentsTable,
  achievements: achievementsTable,
  businessPerformance: businessPerformanceTable,
  playerWealthHistory: playerWealthHistoryTable,
};