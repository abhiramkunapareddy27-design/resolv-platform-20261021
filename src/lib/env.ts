import { z } from "zod";
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.url().optional(),
  AI_MODEL: z.string().optional(),
});
export function validateEnvironment(
  environment: Record<string, string | undefined> = process.env,
) {
  const result = schema.safeParse({
    ...environment,
    BETTER_AUTH_URL:
      environment.BETTER_AUTH_URL || environment.RENDER_EXTERNAL_URL,
  });
  if (!result.success)
    throw new Error(
      `Invalid environment configuration: ${result.error.issues.map((i) => i.path.join(".")).join(", ")}`,
    );
  return result.data;
}
