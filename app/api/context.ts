import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { authenticateRequest } from "./kimi/auth";
import { verifyAdminToken } from "./admin-router";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: {
    id: number;
    name: string | null;
    email: string | null;
    avatar: string | null;
    role: string;
    unionId: string;
  };
  admin?: { id: number; username: string; role: string };
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try Kimi OAuth authentication
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // OAuth auth is optional
  }

  // Try admin token authentication
  try {
    const adminToken = opts.req.headers.get("x-admin-token");
    if (adminToken) {
      const payload = await verifyAdminToken(adminToken);
      if (payload) {
        ctx.admin = payload;
      }
    }
  } catch {
    // Admin auth is optional
  }

  return ctx;
}
