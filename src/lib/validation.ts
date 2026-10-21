import { z } from "zod";
export const safeUrl = z.union([
  z.literal(""),
  z.url().refine((v) => /^https?:\/\//.test(v), "Use an http or https URL"),
]);
export const problemInput = z.object({
  id: z.string().optional(),
  organizationId: z.string().optional(),
  title: z.string().trim().min(8).max(160),
  brief: z.string().trim().min(60).max(12000),
  deliverables: z.string().min(10).max(4000),
  evaluation: z.string().min(10).max(4000),
  categoryId: z.string(),
  engagementId: z.string(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  reward: z.string().min(3).max(120),
  deadline: z.iso.datetime(),
  skills: z.array(z.string().trim().min(1).max(50)).max(12),
  commercialUse: z.boolean(),
  ipTerms: z.string().min(20).max(2000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});
export const profileInput = z.object({
  name: z.string().min(2).max(80),
  role: z.enum(["STUDENT", "FREELANCER", "COMPANY"]),
  bio: z.string().max(2000),
  skills: z.string().max(500),
  interests: z.string().max(500),
  experience: z
    .enum(["Beginner", "Intermediate", "Advanced"])
    .default("Beginner"),
  availability: z.string().max(150),
  github: safeUrl,
  linkedin: safeUrl,
  website: safeUrl,
});
