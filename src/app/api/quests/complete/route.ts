import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { questId, userId } = await req.json();
  if (!questId || !userId) return NextResponse.json({ error: "missing" }, { status: 400 });
  const quest = await prisma.quest.update({ where: { id: questId }, data: { completed: true, completedAt: new Date() } });
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: quest.xp },
      coins: { increment: quest.coins },
      completedQuests: { increment: 1 },
    },
  });
  function getXpForLevel(level: number) {
    if (level === 1) return 250;
    return 600 + (level * 200);
  }
  
  let currentLevel = updated.level;
  let remainingXp = updated.xp;
  let totalLevelsGained = 0;
  
  while (remainingXp >= getXpForLevel(currentLevel)) {
    remainingXp -= getXpForLevel(currentLevel);
    currentLevel++;
    totalLevelsGained++;
  }
  
  if (totalLevelsGained > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        level: currentLevel,
        xp: remainingXp,
        coins: { increment: totalLevelsGained * 50 },
      },
    });
  }

  const now = new Date();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    function isSameDay(a: Date, b: Date) {
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }
    function isYesterday(d: Date, base: Date) {
      const y = new Date(base);
      y.setDate(base.getDate() - 1);
      return isSameDay(d, y);
    }
    let streak = user.dailyStreak || 0;
    const last = user.lastStreakAt ? new Date(user.lastStreakAt) : null;
    if (!last) streak = 1;
    else if (isSameDay(last, now)) streak = user.dailyStreak || 1;
    else if (isYesterday(last, now)) streak = (user.dailyStreak || 0) + 1;
    else streak = 1;

    let earned = Array.isArray(user.earnedBadges) ? (user.earnedBadges as unknown as string[]) : [];
    if (streak >= 7 && !earned.includes("7-day-streak")) earned = [...earned, "7-day-streak"];
    if ((user.completedQuests + 1) >= 10 && !earned.includes("10-quests")) earned = [...earned, "10-quests"];
    if (quest.frequency === "WEEKLY" && !earned.includes("weekly-quest")) earned = [...earned, "weekly-quest"];

    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyStreak: streak,
        lastStreakAt: now,
        lastQuestCompletionAt: now,
        earnedBadges: earned as unknown as Prisma.InputJsonValue,
      },
    });
  }

  try {
    if (quest.frequency === "DAILY" || quest.frequency === "WEEKLY") {
      function addDays(date: Date, days: number) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
      }
      let nextDue: Date | null = null;
      if (quest.dueAt) {
        nextDue = addDays(quest.dueAt, quest.frequency === "DAILY" ? 1 : 7);
      } else {
        const now = new Date();
        const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0);
        nextDue = addDays(base, quest.frequency === "DAILY" ? 1 : 7);
      }
      await prisma.quest.create({
        data: {
          userId,
          title: quest.title,
          description: quest.description || "",
          frequency: quest.frequency,
          dueAt: nextDue,
          xp: quest.xp,
          coins: quest.coins,
        },
      });
    }
  } catch {}
  return NextResponse.json({ ok: true });
}

