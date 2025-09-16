import { createTRPCRouter, publicProcedure } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { analyzeIrisProcedure } from "./routes/iris/analyze/route";
import { getUserQuotaProcedure, updateUserQuotaProcedure } from "./routes/user/quota/route";
import { z } from "zod";

// Simple test procedure
const testProcedure = publicProcedure
  .input(z.object({ message: z.string().optional() }))
  .query(({ input }) => {
    return {
      success: true,
      message: `Backend is working! Received: ${input.message || 'no message'}`,
      timestamp: new Date().toISOString(),
    };
  });

export const appRouter = createTRPCRouter({
  test: testProcedure,
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  iris: createTRPCRouter({
    analyze: analyzeIrisProcedure,
  }),
  user: createTRPCRouter({
    getQuota: getUserQuotaProcedure,
    updateQuota: updateUserQuotaProcedure,
  }),
});

export type AppRouter = typeof appRouter;