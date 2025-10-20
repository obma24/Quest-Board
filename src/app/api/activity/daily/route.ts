import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json([]);

  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const logins = new Set<string>();
  if (user?.lastLoginAt) {
    logins.add(startOfDay(new Date(user.lastLoginAt)).toISOString());
  }

  const quests = await prisma.quest.findMany({
    where: { userId },
    select: { completedAt: true },
  });

  const completedByDay: Record<string, number> = {};
  for (const q of quests) {
    if (!q.completedAt) continue;
    const k = startOfDay(new Date(q.completedAt)).toISOString();
    completedByDay[k] = (completedByDay[k] || 0) + 1;
  }

  const result = days.map((d) => {
    const k = d.toISOString();
    return {
      date: k,
      logins: logins.has(k) ? 1 : 0,
      completed: completedByDay[k] || 0,
    };
  });

  return NextResponse.json(result);
}


