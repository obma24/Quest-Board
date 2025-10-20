import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { userId, animationId } = await req.json();
    if (!userId || !animationId) return NextResponse.json({ error: 'missing' }, { status: 400 });
    await prisma.user.update({ where: { id: userId }, data: { badges: { set: undefined } } });
    await prisma.user.update({ where: { id: userId }, data: { earnedBadges: { set: undefined } } });
    await prisma.user.update({ where: { id: userId }, data: { lastQuestCompletionAt: undefined } });
    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: undefined } });
    await prisma.user.update({ where: { id: userId }, data: { badges: animationId as unknown as any } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 });
  }
}


