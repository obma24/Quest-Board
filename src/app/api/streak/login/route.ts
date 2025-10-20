import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isYesterday(d: Date, now: Date) {
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  return isSameDay(d, y);
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "missing" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({});

  const now = new Date();
  let streak = user.dailyStreak || 0;
  const last = user.lastStreakAt ? new Date(user.lastStreakAt) : null;

  if (!last) {
    streak = 1;
  } else if (isSameDay(last, now)) {
    streak = user.dailyStreak || 1;
  } else if (isYesterday(last, now)) {
    streak = (user.dailyStreak || 0) + 1;
  } else {
    streak = 1;
  }

  let earned = Array.isArray(user.earnedBadges) ? (user.earnedBadges as unknown as string[]) : [];
  if (streak >= 7 && !earned.includes("7-day-streak")) {
    earned = [...earned, "7-day-streak"];
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyStreak: streak,
      lastStreakAt: now,
      lastLoginAt: now,
      earnedBadges: earned as unknown as any,
    },
  });

  return NextResponse.json({ ok: true, dailyStreak: streak, earnedBadges: earned });
}


