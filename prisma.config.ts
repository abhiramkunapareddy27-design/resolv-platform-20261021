import "dotenv/config";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";
const connection = process.env.DATABASE_URL || "file:./prisma/dev.db";
const postgres = /^postgres(ql)?:/.test(connection);
export default defineConfig({
  schema: postgres ? "prisma/schema.postgresql.prisma" : "prisma/schema.prisma",
  migrations: {
    path: postgres ? "prisma/postgresql-migrations" : "prisma/migrations",
  },
  datasource: {
    url: postgres
      ? connection
      : "file:" + resolve(connection.replace(/^file:/, "")),
  },
});
