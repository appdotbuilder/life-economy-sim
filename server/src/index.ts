import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Schema imports
import {
  createPlayerInputSchema,
  playerIdParamSchema,
  updatePlayerInputSchema,
  createBusinessInputSchema,
  updateBusinessInputSchema,
  businessIdParamSchema,
  createEmployeeInputSchema,
  updateEmployeeInputSchema,
  createMarketEventInputSchema,
  createLifeChoiceInputSchema,
  createInvestmentInputSchema,
  completeInvestmentInputSchema,
  createAchievementInputSchema,
  createBusinessPerformanceInputSchema,
  createPlayerWealthHistoryInputSchema,
  paginationParamsSchema,
} from './schema';

// Handler imports
import { createPlayer } from './handlers/create_player';
import { getPlayer } from './handlers/get_player';
import { updatePlayer } from './handlers/update_player';
import { createBusiness } from './handlers/create_business';
import { getPlayerBusinesses } from './handlers/get_player_businesses';
import { updateBusiness } from './handlers/update_business';
import { createEmployee } from './handlers/create_employee';
import { getBusinessEmployees } from './handlers/get_business_employees';
import { updateEmployee } from './handlers/update_employee';
import { getActiveMarketEvents } from './handlers/get_active_market_events';
import { createMarketEvent } from './handlers/create_market_event';
import { createLifeChoice } from './handlers/create_life_choice';
import { getPlayerLifeChoices } from './handlers/get_player_life_choices';
import { createInvestment } from './handlers/create_investment';
import { getPlayerInvestments } from './handlers/get_player_investments';
import { completeInvestment } from './handlers/complete_investment';
import { createAchievement } from './handlers/create_achievement';
import { getPlayerAchievements } from './handlers/get_player_achievements';
import { recordBusinessPerformance } from './handlers/record_business_performance';
import { getBusinessPerformanceHistory } from './handlers/get_business_performance_history';
import { recordPlayerWealth } from './handlers/record_player_wealth';
import { getPlayerWealthHistory } from './handlers/get_player_wealth_history';
import { getDashboardData } from './handlers/get_dashboard_data';
import { getLeaderboard } from './handlers/get_leaderboard';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Player management
  createPlayer: publicProcedure
    .input(createPlayerInputSchema)
    .mutation(({ input }) => createPlayer(input)),

  getPlayer: publicProcedure
    .input(playerIdParamSchema)
    .query(({ input }) => getPlayer(input)),

  updatePlayer: publicProcedure
    .input(updatePlayerInputSchema)
    .mutation(({ input }) => updatePlayer(input)),

  // Business management
  createBusiness: publicProcedure
    .input(createBusinessInputSchema)
    .mutation(({ input }) => createBusiness(input)),

  getPlayerBusinesses: publicProcedure
    .input(playerIdParamSchema)
    .query(({ input }) => getPlayerBusinesses(input)),

  updateBusiness: publicProcedure
    .input(updateBusinessInputSchema)
    .mutation(({ input }) => updateBusiness(input)),

  // Employee management
  createEmployee: publicProcedure
    .input(createEmployeeInputSchema)
    .mutation(({ input }) => createEmployee(input)),

  getBusinessEmployees: publicProcedure
    .input(businessIdParamSchema)
    .query(({ input }) => getBusinessEmployees(input)),

  updateEmployee: publicProcedure
    .input(updateEmployeeInputSchema)
    .mutation(({ input }) => updateEmployee(input)),

  // Market events
  getActiveMarketEvents: publicProcedure
    .query(() => getActiveMarketEvents()),

  createMarketEvent: publicProcedure
    .input(createMarketEventInputSchema)
    .mutation(({ input }) => createMarketEvent(input)),

  // Life choices
  createLifeChoice: publicProcedure
    .input(createLifeChoiceInputSchema)
    .mutation(({ input }) => createLifeChoice(input)),

  getPlayerLifeChoices: publicProcedure
    .input(playerIdParamSchema.merge(paginationParamsSchema))
    .query(({ input }) => {
      const { playerId, ...pagination } = input;
      return getPlayerLifeChoices({ playerId }, pagination);
    }),

  // Investments
  createInvestment: publicProcedure
    .input(createInvestmentInputSchema)
    .mutation(({ input }) => createInvestment(input)),

  getPlayerInvestments: publicProcedure
    .input(playerIdParamSchema)
    .query(({ input }) => getPlayerInvestments(input)),

  completeInvestment: publicProcedure
    .input(completeInvestmentInputSchema)
    .mutation(({ input }) => completeInvestment(input)),

  // Achievements
  createAchievement: publicProcedure
    .input(createAchievementInputSchema)
    .mutation(({ input }) => createAchievement(input)),

  getPlayerAchievements: publicProcedure
    .input(playerIdParamSchema)
    .query(({ input }) => getPlayerAchievements(input)),

  // Performance tracking
  recordBusinessPerformance: publicProcedure
    .input(createBusinessPerformanceInputSchema)
    .mutation(({ input }) => recordBusinessPerformance(input)),

  getBusinessPerformanceHistory: publicProcedure
    .input(businessIdParamSchema.merge(paginationParamsSchema))
    .query(({ input }) => {
      const { businessId, ...pagination } = input;
      return getBusinessPerformanceHistory({ businessId }, pagination);
    }),

  recordPlayerWealth: publicProcedure
    .input(createPlayerWealthHistoryInputSchema)
    .mutation(({ input }) => recordPlayerWealth(input)),

  getPlayerWealthHistory: publicProcedure
    .input(playerIdParamSchema.merge(paginationParamsSchema))
    .query(({ input }) => {
      const { playerId, ...pagination } = input;
      return getPlayerWealthHistory({ playerId }, pagination);
    }),

  // Dashboard and analytics
  getDashboardData: publicProcedure
    .input(playerIdParamSchema)
    .query(({ input }) => getDashboardData(input)),

  getLeaderboard: publicProcedure
    .input(paginationParamsSchema)
    .query(({ input }) => getLeaderboard(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`LifeEconomy TRPC server listening at port: ${port}`);
  console.log(`Available routes: ${Object.keys(appRouter._def.procedures).length} procedures`);
}

start();