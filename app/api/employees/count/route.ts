import { prisma } from "@/lib/prisma";
import { Prisma } from '@/app/generated/prisma/client'
import { NextResponse } from "next/server";
import { requireApiAuth } from '@/lib/auth'

export async function GET() {
  const user = await requireApiAuth()
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    /* SQL: Count total employees for benefits dashboard */
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM Employee
    `
    const count = Number(countResult[0].count)
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
