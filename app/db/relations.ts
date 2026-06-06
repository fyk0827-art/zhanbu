import { relations } from "drizzle-orm";
import { ageGroups, questions, questionTranslations, questionOptions, answers } from "./schema";

export const ageGroupsRelations = relations(ageGroups, ({ many }) => ({
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  ageGroup: one(ageGroups, {
    fields: [questions.ageGroupId],
    references: [ageGroups.id],
  }),
  translations: many(questionTranslations),
  options: many(questionOptions),
  answers: many(answers),
}));

export const questionTranslationsRelations = relations(questionTranslations, ({ one }) => ({
  question: one(questions, {
    fields: [questionTranslations.questionId],
    references: [questions.id],
  }),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));
