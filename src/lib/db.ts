import { resolve } from "node:path";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { db?: PrismaClient };
const connection = process.env.DATABASE_URL || "file:./prisma/dev.db";
export const isPostgres = /^postgres(ql)?:/.test(connection);
export const db =
  globalDb.db ??
  new PrismaClient({
    adapter: isPostgres
      ? new PrismaPg({ connectionString: connection })
      : new PrismaLibSql({
          url:
            "file:" +
            resolve(/*turbopackIgnore: true*/ connection.replace(/^file:/, "")),
        }),
  });
if (process.env.NODE_ENV !== "production") globalDb.db = db;
