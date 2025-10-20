export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({}, { status: 200 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({});
  return NextResponse.json({
    id: user.id,
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    completedQuests: user.completedQuests,
    dailyStreak: user.dailyStreak,
    badges: user.badges as unknown as string | null,
    earnedBadges: user.earnedBadges ?? null,
  });
}

