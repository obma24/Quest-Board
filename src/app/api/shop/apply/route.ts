import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { userId, image } = await req.json();
    if (!userId || !image) return NextResponse.json({ error: 'missing' }, { status: 400 });
    await prisma.user.upsert({
      where: { id: userId },
      update: { badges: image },
      create: {
        id: userId,
        name: "",
        lastname: "",
        email: `${userId}@local`,
        level: 1,
        xp: 0,
        coins: 0,
        completedQuests: 0,
        dailyStreak: 0,
        badges: image,
        earnedBadges: [],
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 });
  }
}


