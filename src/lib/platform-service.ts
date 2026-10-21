import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { validateEnvironment } from "@/lib/env";
import { problemInput, profileInput, safeUrl } from "@/lib/validation";
import { briefProvider, ProviderUnavailable } from "./ai";
import { matchOpportunity } from "@/lib/matching";
const include = {
  category: true,
  engagement: true,
  organization: true,
  skills: { include: { skill: true } },
  hackathon: { include: { criteria: true } },
};
const limits = new Map<string, { time: number; count: number }>();
function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session
      ? await db.user.findUnique({
          where: { id: session.user.id },
          include: {
            profile: {
              include: {
                portfolio: {
                  include: { _count: { select: { projects: true } } },
                },
              },
            },
            _count: {
              select: {
                achievements: { where: { provenance: "ORGANIZER_CONFIRMED" } },
              },
            },
          },
        })
      : null;
    const view = req.nextUrl.searchParams.get("view");
    if (view === "dashboard") {
      if (!user) return fail("Sign in to open your workspace.", 401);
      const [
        posted,
        applications,
        saved,
        teams,
        registrations,
        submissions,
        achievements,
        contracts,
        invitations,
      ] = await Promise.all([
        db.problem.findMany({
          where: { ownerId: user.id },
          include: {
            ...include,
            applications: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        }),
        db.application.findMany({
          where: { userId: user.id },
          include: { problem: { include } },
        }),
        db.savedProblem.findMany({
          where: { userId: user.id },
          include: { problem: { include } },
        }),
        db.team.findMany({
          where: { members: { some: { userId: user.id, status: "ACTIVE" } } },
          include: {
            members: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        }),
        db.registration.findMany({
          where: { userId: user.id },
          include: { hackathon: { include: { problem: { include } } } },
        }),
        db.submission.findMany({ where: { userId: user.id } }),
        db.achievement.findMany({ where: { userId: user.id } }),
        db.contract.findMany({
          where: {
            OR: [
              { problem: { ownerId: user.id } },
              { application: { userId: user.id } },
            ],
          },
          include: {
            problem: true,
            application: { include: { user: { select: { name: true } } } },
            milestones: { include: { deliverables: true } },
          },
        }),
        db.invitation.findMany({
          where: { userId: user.id, status: "PENDING" },
          include: { team: true },
        }),
      ]);
      return NextResponse.json({
        user,
        posted,
        applications,
        saved,
        teams,
        registrations,
        submissions,
        achievements,
        contracts,
        invitations,
      });
    }
    if (view === "portfolio") {
      if (!user) return fail("Sign in to view your portfolio.", 401);
      return NextResponse.json({
        projects: await db.portfolioProject.findMany({
          where: { portfolio: { profile: { userId: user.id } } },
        }),
      });
    }
    if (view === "submissions") {
      if (!user) return fail("Sign in to review submissions.", 401);
      const problem = await db.problem.findUnique({
        where: { id: req.nextUrl.searchParams.get("id") || "" },
      });
      if (!problem || problem.ownerId !== user.id)
        return fail("Organizer access required.", 403);
      return NextResponse.json({
        submissions: await db.submission.findMany({
          where: { hackathon: { problemId: problem.id } },
          include: { user: { select: { name: true } }, scores: true },
        }),
      });
    }
    if (view === "results") {
      const p = await db.problem.findUnique({
        where: { id: req.nextUrl.searchParams.get("id") || "" },
        include: {
          hackathon: {
            include: {
              results: {
                include: {
                  submission: {
                    select: { title: true, user: { select: { name: true } } },
                  },
                },
              },
            },
          },
        },
      });
      if (p?.status !== "PUBLISHED" || !p.hackathon?.resultsPublished)
        return fail("Results are not published.", 404);
      return NextResponse.json({ results: p.hackathon.results });
    }
    if (view === "admin") {
      if (user?.role !== "ADMIN")
        return fail("Administrator access required.", 403);
      return NextResponse.json({
        reports: await db.report.findMany({ include: { problem: true } }),
        organizations: await db.organization.findMany(),
        problems: await db.problem.findMany({ include }),
        audits: await db.auditLog.findMany({
          take: 50,
          orderBy: { createdAt: "desc" },
        }),
      });
    }
    const [problems, categories, engagements, teams] = await Promise.all([
      db.problem.findMany({
        where: { status: "PUBLISHED" },
        include,
        orderBy: { createdAt: "desc" },
      }),
      db.category.findMany(),
      db.engagementModel.findMany(),
      db.team.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          skills: true,
          _count: { select: { members: { where: { status: "ACTIVE" } } } },
        },
      }),
    ]);
    return NextResponse.json({
      user,
      problems: problems.map((p) => ({
        ...p,
        match: matchOpportunity(
          {
            skills: user?.profile?.skills || "",
            interests: user?.profile?.interests || "",
            availability: user?.profile?.availability || "",
            experience: user?.profile?.experience || "Beginner",
            projectCount: user?.profile?.portfolio?._count.projects || 0,
            confirmedCount: user?._count.achievements || 0,
          },
          {
            skills: p.skills.map((s) => s.skill.name),
            title: p.title,
            category: p.category.name,
            difficulty: p.difficulty,
          },
        ),
      })),
      categories,
      engagements,
      teams,
      myTeams: user
        ? await db.team.findMany({
            where: { members: { some: { userId: user.id, status: "ACTIVE" } } },
            select: { id: true, name: true },
          })
        : [],
      savedIds: user
        ? (
            await db.savedProblem.findMany({
              where: { userId: user.id },
              select: { problemId: true },
            })
          ).map((s) => s.problemId)
        : [],
      organizations: user
        ? await db.organization.findMany({
            where: {
              members: {
                some: { userId: user.id, role: { in: ["OWNER", "ADMIN"] } },
              },
            },
            select: { id: true, name: true },
          })
        : [],
      aiConfigured: Boolean(process.env.AI_API_KEY),
      previewMode: process.env.RESOLV_PREVIEW_MODE === "examples",
    });
  } catch (e) {
    console.error("platform-read", e);
    return fail("Unable to load records. Check the database setup.", 503);
  }
}
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (
      origin &&
      origin !== new URL(validateEnvironment().BETTER_AUTH_URL).origin
    )
      return fail("Invalid request origin.", 403);
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return fail("Please sign in to continue.", 401);
    const user = await db.user.findUniqueOrThrow({
      where: { id: session.user.id },
    });
    const now = Date.now(),
      entry = limits.get(user.id);
    if (entry && now - entry.time < 60000 && entry.count >= 45)
      return fail("Too many requests. Try again in a minute.", 429);
    limits.set(user.id, {
      time: entry && now - entry.time < 60000 ? entry.time : now,
      count: entry && now - entry.time < 60000 ? entry.count + 1 : 1,
    });
    if (limits.size > 10000)
      for (const [key, value] of limits)
        if (now - value.time > 60000) limits.delete(key);
    const body = await req.json();
    const action = z.string().parse(body.action);
    let result: unknown = { ok: true };
    const id = () => z.string().min(1).parse(body.id);
    const own = async (problemId: string) => {
      const p = await db.problem.findUniqueOrThrow({
        where: { id: problemId },
      });
      if (p.ownerId !== user.id) throw new Error("Forbidden");
      return p;
    };
    const open = async (problemId: string) => {
      const p = await db.problem.findUniqueOrThrow({
        where: { id: problemId },
        include: { hackathon: true },
      });
      if (
        p.status !== "PUBLISHED" ||
        p.deadline < new Date() ||
        p.ownerId === user.id
      )
        throw new Error("This opportunity is not open for participation.");
      return p;
    };
    if (action === "profile") {
      const { name, role, ...data } = profileInput.parse(body);
      await db.$transaction([
        db.user.update({
          where: { id: user.id },
          data: { name, role: user.role === "ADMIN" ? "ADMIN" : role },
        }),
        db.profile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, ...data },
          update: data,
        }),
      ]);
    } else if (action === "problem") {
      if (!["COMPANY", "ADMIN"].includes(user.role))
        return fail(
          "Choose a company account in your profile to publish problems.",
          403,
        );
      const { id: problemId, skills, ...data } = problemInput.parse(body);
      if (new Date(data.deadline) <= new Date())
        return fail("Choose a future deadline.");
      if (data.organizationId) {
        const membership = await db.organizationMembership.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: data.organizationId,
            },
          },
        });
        if (!membership || !["OWNER", "ADMIN"].includes(membership.role))
          throw new Error("Forbidden");
      }
      if (problemId) {
        const current = await own(problemId);
        if (current.status === "REMOVED")
          return fail("Moderated listings cannot be republished.");
        const participation =
          (await db.application.count({ where: { problemId } })) +
          (await db.registration.count({
            where: { hackathon: { problemId } },
          }));
        if (
          participation &&
          (data.reward !== current.reward ||
            data.engagementId !== current.engagementId ||
            data.commercialUse !== current.commercialUse ||
            data.ipTerms !== current.ipTerms ||
            data.deadline !== current.deadline.toISOString() ||
            data.status !== current.status)
        )
          return fail(
            "Reward, engagement, deadline, rights and publication status are locked after participation.",
          );
      }
      result = await db.$transaction(async (tx) => {
        const p = problemId
          ? await tx.problem.update({
              where: { id: problemId },
              data: { ...data, deadline: new Date(data.deadline) },
            })
          : await tx.problem.create({
              data: {
                ...data,
                deadline: new Date(data.deadline),
                ownerId: user.id,
              },
            });
        await tx.problemSkill.deleteMany({ where: { problemId: p.id } });
        for (const name of [...new Set(skills)]) {
          const skill = await tx.skill.upsert({
            where: { name },
            create: { name },
            update: {},
          });
          await tx.problemSkill.create({
            data: { problemId: p.id, skillId: skill.id },
          });
        }
        const engagement = await tx.engagementModel.findUniqueOrThrow({
          where: { id: data.engagementId },
        });
        if (engagement.name === "Hackathon")
          await tx.hackathon.upsert({
            where: { problemId: p.id },
            create: {
              problemId: p.id,
              rules: data.evaluation,
              eligibility: "Open to all registered participants.",
              criteria: {
                create: [
                  { name: "Impact" },
                  { name: "Execution" },
                  { name: "Originality" },
                ],
              },
            },
            update: { rules: data.evaluation },
          });
        return p;
      });
    } else if (action === "save") {
      const p = await db.problem.findUniqueOrThrow({ where: { id: id() } });
      if (p.status !== "PUBLISHED")
        return fail("Opportunity unavailable.", 404);
      const key = { userId: user.id, problemId: p.id };
      const existing = await db.savedProblem.findUnique({
        where: { userId_problemId: key },
      });
      if (existing)
        await db.savedProblem.delete({ where: { userId_problemId: key } });
      else await db.savedProblem.create({ data: key });
    } else if (action === "apply") {
      await open(id());
      result = await db.application.create({
        data: {
          userId: user.id,
          problemId: id(),
          proposal: z.string().min(40).max(6000).parse(body.proposal),
          estimate: z
            .string()
            .max(200)
            .parse(body.estimate || ""),
        },
      });
    } else if (action === "application-status") {
      const a = await db.application.findUniqueOrThrow({ where: { id: id() } });
      await own(a.problemId);
      if (a.status === "ACCEPTED")
        return fail(
          "Accepted proposals cannot be changed. Manage the project in Projects.",
        );
      const status = z
        .enum(["SHORTLISTED", "ACCEPTED", "DECLINED"])
        .parse(body.status);
      await db.$transaction(async (tx) => {
        await tx.application.update({ where: { id: a.id }, data: { status } });
        if (status === "ACCEPTED")
          await tx.contract.upsert({
            where: { applicationId: a.id },
            create: { applicationId: a.id, problemId: a.problemId },
            update: {},
          });
        await tx.notification.create({
          data: {
            userId: a.userId,
            message: `Your application was ${status.toLowerCase()}.`,
          },
        });
      });
    } else if (action === "score") {
      const submission = await db.submission.findUniqueOrThrow({
        where: { id: id() },
        include: { hackathon: { include: { criteria: true, problem: true } } },
      });
      if (submission.hackathon.problem.ownerId !== user.id)
        throw new Error("Forbidden");
      if (submission.hackathon.resultsPublished)
        return fail("Published results are locked.");
      const scores = z
        .array(
          z.object({ criterionId: z.string(), value: z.number().int().min(0) }),
        )
        .min(1)
        .parse(body.scores);
      if (new Set(scores.map((s) => s.criterionId)).size !== scores.length)
        return fail("Duplicate criteria.");
      for (const score of scores) {
        const c = submission.hackathon.criteria.find(
          (c) => c.id === score.criterionId,
        );
        if (!c || score.value > c.maxScore)
          return fail("Invalid rubric score.");
      }
      await db.$transaction(
        scores.map((s) =>
          db.score.upsert({
            where: {
              criterionId_submissionId_judgeId: {
                criterionId: s.criterionId,
                submissionId: submission.id,
                judgeId: user.id,
              },
            },
            create: { ...s, submissionId: submission.id, judgeId: user.id },
            update: { value: s.value },
          }),
        ),
      );
    } else if (action === "publish-results") {
      const problem = await own(id());
      const hackathon = await db.hackathon.findUniqueOrThrow({
        where: { problemId: problem.id },
        include: { criteria: true, submissions: { include: { scores: true } } },
      });
      if (hackathon.resultsPublished)
        return fail("Results have already been published.");
      if (problem.deadline > new Date())
        return fail("Results can be published only after the deadline.");
      if (!hackathon.submissions.length)
        return fail("There are no submissions to rank.");
      if (
        hackathon.submissions.some((s) =>
          hackathon.criteria.some(
            (c) =>
              !s.scores.some(
                (score) =>
                  score.criterionId === c.id && score.judgeId === user.id,
              ),
          ),
        )
      )
        return fail(
          "Score every submission against every criterion before publishing.",
        );
      const ranked = [...hackathon.submissions].sort(
        (a, b) =>
          b.scores.reduce((n, s) => n + s.value, 0) -
            a.scores.reduce((n, s) => n + s.value, 0) ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      );
      await db.$transaction(async (tx) => {
        await tx.hackathon.update({
          where: { id: hackathon.id },
          data: { resultsPublished: true },
        });
        for (const [i, s] of ranked.entries()) {
          await tx.result.create({
            data: {
              hackathonId: hackathon.id,
              submissionId: s.id,
              rank: i + 1,
            },
          });
          await tx.achievement.create({
            data: {
              userId: s.userId,
              title: `${problem.title} — placed #${i + 1}`,
              provenance: "ORGANIZER_CONFIRMED",
              evidenceUrl: `/explore?problem=${problem.id}&results=1`,
            },
          });
        }
      });
    } else if (action === "register") {
      const p = await open(id());
      if (!p.hackathon) return fail("This is not a competition.");
      await db.registration.create({
        data: { userId: user.id, hackathonId: p.hackathon.id },
      });
    } else if (action === "submit") {
      const p = await open(id());
      if (!p.hackathon) return fail("Competition unavailable.");
      const hackathonId = p.hackathon.id;
      await db.registration.findUniqueOrThrow({
        where: { userId_hackathonId: { userId: user.id, hackathonId } },
      });
      const data = z
        .object({
          title: z.string().min(5).max(160),
          description: z.string().min(40).max(6000),
          github: safeUrl,
          demo: safeUrl,
          teamId: z.string().optional(),
        })
        .parse(body);
      if (!data.github && !data.demo)
        return fail("Add at least one project link.");
      if (data.teamId) {
        const m = await db.teamMembership.findUnique({
          where: { userId_teamId: { userId: user.id, teamId: data.teamId } },
        });
        if (m?.status !== "ACTIVE") throw new Error("Forbidden");
      }
      await db.submission.upsert({
        where: { userId_hackathonId: { userId: user.id, hackathonId } },
        create: { ...data, userId: user.id, hackathonId },
        update: data,
      });
    } else if (action === "team") {
      const data = z
        .object({
          name: z.string().min(3).max(80),
          description: z.string().min(20).max(1500),
          skills: z.string().max(500),
        })
        .parse(body);
      result = await db.team.create({
        data: {
          ...data,
          members: {
            create: { userId: user.id, role: "OWNER", status: "ACTIVE" },
          },
        },
      });
    } else if (action === "join-team")
      await db.teamMembership.create({
        data: { userId: user.id, teamId: id() },
      });
    else if (action === "team-member") {
      const teamId = id();
      const owner = await db.teamMembership.findUnique({
        where: { userId_teamId: { userId: user.id, teamId } },
      });
      if (owner?.role !== "OWNER" || owner.status !== "ACTIVE")
        throw new Error("Forbidden");
      await db.teamMembership.update({
        where: {
          userId_teamId: { userId: z.string().parse(body.userId), teamId },
        },
        data: { status: z.enum(["ACTIVE", "DECLINED"]).parse(body.status) },
      });
    } else if (action === "invite") {
      const member = await db.teamMembership.findUnique({
        where: { userId_teamId: { userId: user.id, teamId: id() } },
      });
      if (member?.role !== "OWNER" || member.status !== "ACTIVE")
        throw new Error("Forbidden");
      const invited = await db.user.findUnique({
        where: { email: z.email().parse(body.email) },
      });
      if (!invited) return fail("No account found for that email.");
      await db.invitation.upsert({
        where: { teamId_userId: { teamId: id(), userId: invited.id } },
        create: { teamId: id(), userId: invited.id },
        update: { status: "PENDING" },
      });
    } else if (action === "accept-invite") {
      const invite = await db.invitation.findUniqueOrThrow({
        where: { id: id() },
      });
      if (invite.userId !== user.id || invite.status !== "PENDING")
        throw new Error("Forbidden");
      await db.$transaction([
        db.invitation.update({
          where: { id: invite.id },
          data: { status: "ACCEPTED" },
        }),
        db.teamMembership.upsert({
          where: { userId_teamId: { userId: user.id, teamId: invite.teamId } },
          create: { userId: user.id, teamId: invite.teamId, status: "ACTIVE" },
          update: { status: "ACTIVE" },
        }),
      ]);
    } else if (action === "report")
      await db.report.create({
        data: {
          userId: user.id,
          problemId: id(),
          reason: z.string().min(10).max(2000).parse(body.reason),
        },
      });
    else if (action === "moderate") {
      if (user.role !== "ADMIN") throw new Error("Forbidden");
      await db.problem.update({
        where: { id: id() },
        data: { status: z.enum(["PUBLISHED", "REMOVED"]).parse(body.status) },
      });
    } else if (action === "organization") {
      if (user.role !== "COMPANY") throw new Error("Forbidden");
      result = await db.organization.create({
        data: {
          name: z.string().min(2).max(120).parse(body.name),
          description: z
            .string()
            .max(2000)
            .parse(body.description || ""),
          members: { create: { userId: user.id, role: "OWNER" } },
        },
      });
    } else if (action === "verify-organization") {
      if (user.role !== "ADMIN") throw new Error("Forbidden");
      await db.organization.update({
        where: { id: id() },
        data: {
          verification: z.enum(["VERIFIED", "REJECTED"]).parse(body.status),
        },
      });
    } else if (action === "contract-state") {
      const c = await db.contract.findUniqueOrThrow({
        where: { id: id() },
        include: { problem: true, application: true, milestones: true },
      });
      const status = z.enum(["ACTIVE", "COMPLETED"]).parse(body.status);
      if (status === "ACTIVE") {
        if (c.application.userId !== user.id) throw new Error("Forbidden");
        if (c.status !== "PROPOSED")
          return fail("This project is not awaiting confirmation.");
      } else {
        if (c.problem.ownerId !== user.id) throw new Error("Forbidden");
        if (
          c.status !== "ACTIVE" ||
          !c.milestones.length ||
          c.milestones.some((m) => m.status !== "COMPLETED")
        )
          return fail(
            "Complete and approve every milestone before closing the project.",
          );
      }
      await db.contract.update({ where: { id: c.id }, data: { status } });
    } else if (action === "milestone") {
      const c = await db.contract.findUniqueOrThrow({ where: { id: id() } });
      await own(c.problemId);
      if (c.status !== "ACTIVE")
        return fail(
          "The solver must confirm participation before milestones are added.",
        );
      await db.milestone.create({
        data: {
          contractId: c.id,
          title: z.string().min(5).max(200).parse(body.title),
          amount: z.number().int().min(0).max(100000000).parse(body.amount),
        },
      });
    } else if (action === "deliver") {
      const m = await db.milestone.findUniqueOrThrow({
        where: { id: id() },
        include: { contract: { include: { application: true } } },
      });
      if (m.contract.status !== "ACTIVE")
        return fail("This project is not active.");
      if (m.contract.application.userId !== user.id)
        throw new Error("Forbidden");
      await db.deliverable.create({
        data: {
          milestoneId: m.id,
          url: z
            .url()
            .refine((v) => /^https?:\/\//.test(v))
            .parse(body.url),
          notes: z.string().max(2000).parse(body.notes),
        },
      });
    } else if (action === "complete-milestone") {
      const m = await db.milestone.findUniqueOrThrow({
        where: { id: id() },
        include: { contract: true, deliverables: true },
      });
      await own(m.contract.problemId);
      if (m.contract.status !== "ACTIVE")
        return fail("This project is not active.");
      if (!m.deliverables.length)
        return fail("A deliverable is required before completion.");
      await db.milestone.update({
        where: { id: m.id },
        data: { status: "COMPLETED" },
      });
    } else if (action === "portfolio") {
      const data = z
        .object({
          title: z.string().min(5).max(160),
          url: z.url().refine((v) => /^https?:\/\//.test(v)),
          description: z.string().min(20).max(2000),
        })
        .parse(body);
      const profile = await db.profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });
      const portfolio = await db.portfolio.upsert({
        where: { profileId: profile.id },
        create: { profileId: profile.id },
        update: {},
      });
      await db.portfolioProject.create({
        data: { ...data, portfolioId: portfolio.id },
      });
    } else if (action === "ai-brief") {
      const description = z.string().min(30).max(6000).parse(body.description);
      try {
        result = { draft: await briefProvider.generate(description) };
      } catch (error) {
        if (error instanceof ProviderUnavailable)
          return fail(error.message, 503);
        throw error;
      }
    } else return fail("Unknown action.");
    await db.auditLog.create({
      data: {
        userId: user.id,
        action,
        entityId: typeof body.id === "string" ? body.id : user.id,
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError)
      return fail(
        e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      );
    if (e instanceof Error && e.message === "Forbidden")
      return fail("You do not have permission to perform this action.", 403);
    if (e && typeof e === "object" && "code" in e && e.code === "P2002")
      return fail("You have already completed this action.", 409);
    console.error("platform-write", e);
    return fail(
      "Could not complete this action. Check the record, deadline and required fields.",
    );
  }
}
