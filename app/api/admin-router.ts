import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { TRPCError } from "@trpc/server";
import { getDb } from "./queries/connection";
import { adminUsers } from "@db/schema";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { compareSync } from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "qa-collector-admin-secret-key-2026"
);

async function createToken(payload: { id: number; username: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return payload as unknown as { id: number; username: string; role: string };
  } catch {
    return null;
  }
}

export const adminRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, input.username))
        .limit(1);

      if (!admin) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      const isValid = compareSync(input.password, admin.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      const token = await createToken({
        id: admin.id,
        username: admin.username,
        role: admin.role,
      });

      return { token, role: admin.role };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("x-admin-token");
    if (!authHeader) return null;

    const payload = await verifyAdminToken(authHeader);
    if (!payload) return null;

    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };
  }),
});
