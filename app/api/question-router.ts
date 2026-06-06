import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { questions, questionTranslations, ageGroups, questionOptions } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";

export const questionRouter = createRouter({
  // Public: list questions with options, randomly ordered, limited
  list: publicQuery
    .input(
      z.object({
        ageGroupId: z.number().optional(),
        language: z.string().default("en"),
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = input.ageGroupId
        ? eq(questions.ageGroupId, input.ageGroupId)
        : undefined;

      // Get questions with translations, randomly ordered
      const rows = await db
        .select({
          id: questions.id,
          ageGroupId: questions.ageGroupId,
          isActive: questions.isActive,
          createdAt: questions.createdAt,
          ageGroupName: ageGroups.name,
          ageGroupMinAge: ageGroups.minAge,
          ageGroupMaxAge: ageGroups.maxAge,
          translationTitle: questionTranslations.title,
          translationDescription: questionTranslations.description,
        })
        .from(questions)
        .innerJoin(ageGroups, eq(questions.ageGroupId, ageGroups.id))
        .leftJoin(
          questionTranslations,
          and(
            eq(questionTranslations.questionId, questions.id),
            eq(questionTranslations.languageCode, input.language)
          )
        )
        .where(conditions)
        .orderBy(sql`RAND()`)
        .limit(input.limit);

      // Get options for each question
      const result = [];
      for (const row of rows) {
        let title = row.translationTitle;
        let description = row.translationDescription;

        // Fallback to English if requested language not found
        if (!title && input.language !== "en") {
          const [enTrans] = await db
            .select()
            .from(questionTranslations)
            .where(
              and(
                eq(questionTranslations.questionId, row.id),
                eq(questionTranslations.languageCode, "en")
              )
            )
            .limit(1);
          if (enTrans) {
            title = enTrans.title;
            description = enTrans.description;
          }
        }

        const opts = await db
          .select()
          .from(questionOptions)
          .where(eq(questionOptions.questionId, row.id))
          .orderBy(questionOptions.optionKey);

        result.push({
          id: row.id,
          ageGroupId: row.ageGroupId,
          title: title || `Question #${row.id}`,
          description: description || "",
          isActive: row.isActive,
          createdAt: row.createdAt,
          ageGroup: {
            name: row.ageGroupName,
            minAge: row.ageGroupMinAge,
            maxAge: row.ageGroupMaxAge,
          },
          options: opts.map((o) => ({
            key: o.optionKey,
            text: o.optionText,
          })),
        });
      }

      return result;
    }),

  // Admin: list all questions with options
  adminList: adminQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: questions.id,
        ageGroupId: questions.ageGroupId,
        isActive: questions.isActive,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
        ageGroupName: ageGroups.name,
      })
      .from(questions)
      .innerJoin(ageGroups, eq(questions.ageGroupId, ageGroups.id))
      .orderBy(sql`RAND()`);

    const result = [];
    for (const row of rows) {
      const translations = await db
        .select()
        .from(questionTranslations)
        .where(eq(questionTranslations.questionId, row.id));

      const opts = await db
        .select()
        .from(questionOptions)
        .where(eq(questionOptions.questionId, row.id))
        .orderBy(questionOptions.optionKey);

      result.push({
        id: row.id,
        ageGroupId: row.ageGroupId,
        ageGroupName: row.ageGroupName,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        translations: translations.map((t) => ({
          languageCode: t.languageCode,
          title: t.title,
          description: t.description,
        })),
        options: opts.map((o) => ({
          key: o.optionKey,
          text: o.optionText,
        })),
      });
    }
    return result;
  }),

  // Admin: create question with options
  create: adminQuery
    .input(
      z.object({
        ageGroupId: z.number(),
        isActive: z.boolean().default(true),
        translations: z.array(
          z.object({
            languageCode: z.string(),
            title: z.string().min(1),
            description: z.string().nullable().optional(),
          })
        ),
        options: z.array(
          z.object({
            key: z.string().length(1),
            text: z.string().min(1),
          })
        ).min(2).max(6),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Insert question
      const [result] = await db.insert(questions).values({
        ageGroupId: input.ageGroupId,
        isActive: input.isActive,
      });
      const questionId = Number(result.insertId);

      // Insert translations
      for (const trans of input.translations) {
        await db.insert(questionTranslations).values({
          questionId,
          languageCode: trans.languageCode,
          title: trans.title,
          description: trans.description || null,
        });
      }

      // Insert options
      for (const opt of input.options) {
        await db.insert(questionOptions).values({
          questionId,
          optionKey: opt.key,
          optionText: opt.text,
        });
      }

      return { id: questionId };
    }),

  // Admin: update question with options
  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        ageGroupId: z.number().optional(),
        isActive: z.boolean().optional(),
        translations: z
          .array(
            z.object({
              languageCode: z.string(),
              title: z.string().min(1),
              description: z.string().nullable().optional(),
            })
          )
          .optional(),
        options: z
          .array(
            z.object({
              key: z.string().length(1),
              text: z.string().min(1),
            })
          )
          .min(2)
          .max(6)
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, translations, options, ...data } = input;

      const updateData: Record<string, unknown> = {};
      if (data.ageGroupId !== undefined) updateData.ageGroupId = data.ageGroupId;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      if (Object.keys(updateData).length > 0) {
        await db.update(questions).set(updateData).where(eq(questions.id, id));
      }

      if (translations && translations.length > 0) {
        await db.delete(questionTranslations).where(eq(questionTranslations.questionId, id));
        for (const trans of translations) {
          await db.insert(questionTranslations).values({
            questionId: id,
            languageCode: trans.languageCode,
            title: trans.title,
            description: trans.description || null,
          });
        }
      }

      if (options && options.length > 0) {
        await db.delete(questionOptions).where(eq(questionOptions.questionId, id));
        for (const opt of options) {
          await db.insert(questionOptions).values({
            questionId: id,
            optionKey: opt.key,
            optionText: opt.text,
          });
        }
      }

      return { success: true };
    }),

  // Admin: delete question
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(questionOptions).where(eq(questionOptions.questionId, input.id));
      await db.delete(questionTranslations).where(eq(questionTranslations.questionId, input.id));
      await db.delete(questions).where(eq(questions.id, input.id));
      return { success: true };
    }),
});
