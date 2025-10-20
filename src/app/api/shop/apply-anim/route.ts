import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { userId, animationId } = await req.json();
    if (!userId || !animationId) return NextResponse.json({ error: 'missing' }, { status: 400 });
    // Just store the selected animation id on the user in a JSON/text field
    await prisma.user.update({ where: { id: userId }, data: { badges: animationId as unknown as Prisma.InputJsonValue } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message || 'failed' }, { status: 500 });
  }
}


