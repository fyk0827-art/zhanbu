import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { payments, questions, ageGroups } from "@db/schema";
import { eq } from "drizzle-orm";

export const paymentRouter = createRouter({
  create: publicQuery
    .input(z.object({ questionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Get question and its price
      const [question] = await db
        .select()
        .from(questions)
        .where(eq(questions.id, input.questionId))
        .limit(1);

      if (!question) {
        throw new Error("Question not found");
      }

      const [ageGroup] = await db
        .select()
        .from(ageGroups)
        .where(eq(ageGroups.id, question.ageGroupId))
        .limit(1);

      if (!ageGroup) {
        throw new Error("Age group not found");
      }

      const amount = parseFloat(ageGroup.price as unknown as string);

      // Generate a payment token and store the payment record
      const paymentToken = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      const [result] = await db.insert(payments).values({
        questionId: input.questionId,
        amount: amount.toString(),
        currency: "USD",
        status: "pending",
        paymentToken,
      });

      // Simulate Stripe client secret - in production this would come from Stripe API
      const clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 15)}`;

      return {
        clientSecret,
        paymentId: Number(result.insertId),
        amount,
        currency: "USD",
        paymentToken,
      };
    }),

  verify: publicQuery
    .input(z.object({ paymentToken: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // In production: verify with Stripe API using paymentIntentId
      // Here we simulate a successful payment
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.paymentToken, input.paymentToken))
        .limit(1);

      if (!payment) {
        throw new Error("Payment not found");
      }

      // Update payment status to completed
      await db
        .update(payments)
        .set({ status: "completed" })
        .where(eq(payments.id, payment.id));

      return {
        status: "completed",
        paymentToken: input.paymentToken,
        amount: parseFloat(payment.amount as unknown as string),
      };
    }),
});
