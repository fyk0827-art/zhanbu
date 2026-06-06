import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { adminUsers } from "@db/schema";

type DbUser = {
  id: number;
  unionId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt: Date;
};

// In-memory store for OAuth users (since we removed the users table)
const oauthUsers = new Map<string, DbUser>();

export async function findUserByUnionId(unionId: string): Promise<DbUser | undefined> {
  return oauthUsers.get(unionId);
}

export async function upsertUser(data: {
  unionId: string;
  name?: string;
  avatar?: string;
  lastSignInAt?: Date;
}): Promise<DbUser> {
  const existing = oauthUsers.get(data.unionId);
  if (existing) {
    existing.name = data.name || existing.name;
    existing.avatar = data.avatar || existing.avatar;
    existing.lastSignInAt = data.lastSignInAt || new Date();
    existing.updatedAt = new Date();
    oauthUsers.set(data.unionId, existing);
    return existing;
  }
  const newUser: DbUser = {
    id: oauthUsers.size + 1,
    unionId: data.unionId,
    name: data.name || null,
    email: null,
    avatar: data.avatar || null,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignInAt: data.lastSignInAt || new Date(),
  };
  oauthUsers.set(data.unionId, newUser);
  return newUser;
}

export async function findAdminByUsername(username: string) {
  const db = getDb();
  return db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
}
