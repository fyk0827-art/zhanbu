import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  decimal,
  boolean,
  index,
  uniqueIndex,
  char,
} from "drizzle-orm/mysql-core";

// Age Groups table
export const ageGroups = mysqlTable("age_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  minAge: int("min_age").notNull(),
  maxAge: int("max_age").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AgeGroup = typeof ageGroups.$inferSelect;
export type InsertAgeGroup = typeof ageGroups.$inferInsert;

// Questions table
export const questions = mysqlTable("questions", {
  id: serial("id").primaryKey(),
  ageGroupId: bigint("age_group_id", { mode: "number", unsigned: true }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_questions_age_group").on(table.ageGroupId),
]);

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

// Question Translations table
export const questionTranslations = mysqlTable("question_translations", {
  id: serial("id").primaryKey(),
  questionId: bigint("question_id", { mode: "number", unsigned: true }).notNull(),
  languageCode: varchar("language_code", { length: 10 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
}, (table) => [
  uniqueIndex("idx_qt_question_lang").on(table.questionId, table.languageCode),
]);

export type QuestionTranslation = typeof questionTranslations.$inferSelect;
export type InsertQuestionTranslation = typeof questionTranslations.$inferInsert;

// Question Options table (A/B/C/D choices)
export const questionOptions = mysqlTable("question_options", {
  id: serial("id").primaryKey(),
  questionId: bigint("question_id", { mode: "number", unsigned: true }).notNull(),
  optionKey: char("option_key", { length: 1 }).notNull(), // A, B, C, D
  optionText: varchar("option_text", { length: 255 }).notNull(),
}, (table) => [
  uniqueIndex("idx_qo_question_key").on(table.questionId, table.optionKey),
]);

export type QuestionOption = typeof questionOptions.$inferSelect;
export type InsertQuestionOption = typeof questionOptions.$inferInsert;

// Answers table (stores selected option)
export const answers = mysqlTable("answers", {
  id: serial("id").primaryKey(),
  questionId: bigint("question_id", { mode: "number", unsigned: true }).notNull(),
  respondentAge: int("respondent_age").notNull(),
  selectedOption: char("selected_option", { length: 1 }).notNull(), // A, B, C, D
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_answers_question").on(table.questionId),
]);

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = typeof answers.$inferInsert;

// Payments table (kept for compatibility)
export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  questionId: bigint("question_id", { mode: "number", unsigned: true }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: varchar("status", { length: 20 }).default("completed").notNull(),
  paymentToken: varchar("payment_token", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Admin Users table
export const adminUsers = mysqlTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
