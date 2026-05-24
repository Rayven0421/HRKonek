import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await request.json();

  try {
    const updatedApplicant = await prisma.applicant.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json(updatedApplicant);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update applicant' }, { status: 500 });
  }
}
