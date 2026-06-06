import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { ageGroups } from "@db/schema";
import { eq, asc } from "drizzle-orm";

export const ageGroupRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const groups = await db.select().from(ageGroups).orderBy(asc(ageGroups.sortOrder));
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      minAge: g.minAge,
      maxAge: g.maxAge,
      price: parseFloat(g.price as unknown as string),
      sortOrder: g.sortOrder,
    }));
  }),

  create: adminQuery
    .input(
      z.object({
        name: z.string().min(1).max(100),
        minAge: z.number().int().min(0),
        maxAge: z.number().int().min(0),
        price: z.number().positive(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(ageGroups).values({
        name: input.name,
        minAge: input.minAge,
        maxAge: input.maxAge,
        price: input.price.toString(),
        sortOrder: input.sortOrder ?? 0,
      });
      return { id: Number(result.insertId) };
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        minAge: z.number().int().min(0).optional(),
        maxAge: z.number().int().min(0).optional(),
        price: z.number().positive().optional(),
        sortOrder: z.number().int().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.minAge !== undefined) updateData.minAge = data.minAge;
      if (data.maxAge !== undefined) updateData.maxAge = data.maxAge;
      if (data.price !== undefined) updateData.price = data.price.toString();
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

      await db.update(ageGroups).set(updateData).where(eq(ageGroups.id, id));
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(ageGroups).where(eq(ageGroups.id, input.id));
      return { success: true };
    }),

  setUnifiedPrice: adminQuery
    .input(z.object({ price: z.number().positive() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(ageGroups).set({ price: input.price.toString() });
      return { success: true };
    }),
});
