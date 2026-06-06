import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { answers, questionTranslations } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const answerRouter = createRouter({
  // Public: submit a multiple-choice answer
  submit: publicQuery
    .input(
      z.object({
        questionId: z.number(),
        respondentAge: z.number().int().min(0).max(120),
        selectedOption: z.string().length(1).regex(/^[A-D]$/),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const [result] = await db.insert(answers).values({
        questionId: input.questionId,
        respondentAge: input.respondentAge,
        selectedOption: input.selectedOption,
      });

      return { id: Number(result.insertId), message: "Answer submitted" };
    }),

  // Admin: list all answers
  adminList: adminQuery
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.pageSize;

      const rows = await db
        .select({
          id: answers.id,
          questionId: answers.questionId,
          respondentAge: answers.respondentAge,
          selectedOption: answers.selectedOption,
          createdAt: answers.createdAt,
        })
        .from(answers)
        .orderBy(desc(answers.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      const [countResult] = await db
        .select({ count: sql`COUNT(*)` as any })
        .from(answers);
      const total = Number(countResult?.count || 0);

      // Get question titles
      const results = [];
      for (const row of rows) {
        const [qt] = await db
          .select()
          .from(questionTranslations)
          .where(eq(questionTranslations.questionId, row.questionId))
          .limit(1);

        results.push({
          id: row.id,
          questionId: row.questionId,
          questionTitle: qt?.title || `Question #${row.questionId}`,
          respondentAge: row.respondentAge,
          selectedOption: row.selectedOption,
          createdAt: row.createdAt,
        });
      }

      return { items: results, total, page: input.page, pageSize: input.pageSize };
    }),
});
