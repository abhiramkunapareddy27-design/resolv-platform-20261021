import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const people = await db.user.findMany({
      where: {
        ...(id ? { id } : {}),
        profile: {
          is: {
            OR: [
              { bio: { not: "" } },
              { skills: { not: "" } },
              { portfolio: { is: { projects: { some: {} } } } },
            ],
          },
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        profile: {
          select: {
            bio: true,
            skills: true,
            interests: true,
            experience: true,
            availability: true,
            github: true,
            linkedin: true,
            website: true,
            portfolio: {
              select: {
                projects: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    url: true,
                    provenance: true,
                  },
                },
              },
            },
          },
        },
        achievements: {
          where: { provenance: "ORGANIZER_CONFIRMED" },
          select: {
            id: true,
            title: true,
            provenance: true,
            evidenceUrl: true,
          },
        },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: id ? 1 : 100,
    });
    return NextResponse.json({ people });
  } catch (error) {
    console.error(
      "talent-read",
      error instanceof Error ? error.name : "unknown",
    );
    return NextResponse.json(
      { error: "Talent profiles could not be loaded." },
      { status: 503 },
    );
  }
}
