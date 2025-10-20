export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const quests = await prisma.quest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quests);
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || "failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, description, frequency, dueAt } = body || {};

    if (!userId || !title || !frequency) {
      return NextResponse.json({ error: "missing" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        name: "",
        lastname: "",
        email: `${userId}@local`,
        badges: `https://api.dicebear.com/9.x/rings/svg?seed=Default&backgroundType=gradientLinear&radius=50&backgroundColor=d6d6d6&ringColor=9e9e9e&color=9e9e9e`,
      },
    });

    function defaultsForFrequency(f: string) {
      if (f === "DAILY") return { xp: 50, coins: 5 };
      if (f === "WEEKLY") return { xp: 120, coins: 12 };
      if (f === "ONCE") return { xp: 80, coins: 8 };
      return { xp: 50, coins: 5 };
    }
    const rewards = defaultsForFrequency(frequency);

    const quest = await prisma.quest.create({
      data: {
        userId,
        title,
        description: description || "",
        frequency,
        dueAt: dueAt ? new Date(dueAt) : null,
        xp: rewards.xp,
        coins: rewards.coins,
      },
    });

    return NextResponse.json(quest, { status: 201 });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || "failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const questId = body?.questId || new URL(req.url).searchParams.get("questId");
    if (!questId) return NextResponse.json({ error: "missing" }, { status: 400 });
    await prisma.quest.delete({ where: { id: String(questId) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || "failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { questId } = body || {};
    if (!questId) return NextResponse.json({ error: "missing" }, { status: 400 });

    if (Object.prototype.hasOwnProperty.call(body, "completed")) {
      const completed: boolean = !!body.completed;
      const quest = await prisma.quest.update({ where: { id: questId }, data: { completed, completedAt: completed ? new Date() : null } });

      if (completed && (quest.frequency === "DAILY" || quest.frequency === "WEEKLY")) {
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
            userId: quest.userId,
            title: quest.title,
            description: quest.description || "",
            frequency: quest.frequency,
            dueAt: nextDue,
            xp: quest.xp,
            coins: quest.coins,
          },
        });
      }
      return NextResponse.json(quest);
    }

    const updateData: Record<string, unknown> = {};
    if (typeof body.title === "string") updateData.title = body.title;
    if (typeof body.description === "string") updateData.description = body.description;
    if (typeof body.frequency === "string") updateData.frequency = body.frequency;
    if (body.dueAt === null || typeof body.dueAt === "string") updateData.dueAt = body.dueAt ? new Date(body.dueAt) : null;

    const quest = await prisma.quest.update({ where: { id: questId }, data: updateData });
    return NextResponse.json(quest);
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || "failed" }, { status: 500 });
  }
}
