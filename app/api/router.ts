import { authRouter } from "./auth-router";
import { ageGroupRouter } from "./ageGroup-router";
import { questionRouter } from "./question-router";
import { answerRouter } from "./answer-router";
import { adminRouter } from "./admin-router";
import { paymentRouter } from "./payment-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  ageGroup: ageGroupRouter,
  question: questionRouter,
  answer: answerRouter,
  admin: adminRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
