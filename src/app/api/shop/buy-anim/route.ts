import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { userId, cost } = await req.json();
    if (!userId || typeof cost !== 'number') return NextResponse.json({ error: 'missing' }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'no user' }, { status: 404 });
    if (user.coins < cost) return NextResponse.json({ error: 'not_enough_coins' }, { status: 400 });
    await prisma.user.update({ where: { id: userId }, data: { coins: { decrement: cost } } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 });
  }
}


