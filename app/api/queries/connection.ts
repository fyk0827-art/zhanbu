import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

function parseDbUrl(url: string) {
  const cleanUrl = url.replace("mysql://", "");
  const atIndex = cleanUrl.lastIndexOf("@");
  const credentials = cleanUrl.substring(0, atIndex);
  const rest = cleanUrl.substring(atIndex + 1);
  const colonIndex = credentials.indexOf(":");
  const user = credentials.substring(0, colonIndex);
  const password = credentials.substring(colonIndex + 1);
  const [hostPort, database] = rest.split("/");
  const [host, portStr] = hostPort.split(":");
  return { host, port: parseInt(portStr), user, password, database: database.split("?")[0] };
}

function createPool() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is required");
  const config = parseDbUrl(dbUrl);
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 15000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
  });
}

const pool = createPool();

export const db = drizzle(pool, { mode: "planetscale", schema: fullSchema });

export function getDb() {
  return db;
}
