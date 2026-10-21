import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db, isPostgres } from "./db";
import { validateEnvironment } from "./env";
const env = validateEnvironment();
export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: isPostgres ? "postgresql" : "sqlite",
  }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true, minPasswordLength: 12 },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "STUDENT", input: false },
    },
  },
  rateLimit: { enabled: true, window: 60, max: 30 },
  trustedOrigins: [new URL(env.BETTER_AUTH_URL).origin],
});
