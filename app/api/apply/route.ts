import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/app/generated/prisma/client'
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const saveFile = async (file: File | null) => {
      if (!file || file.size === 0) return null;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      return `/uploads/${filename}`;
    };

    const email = formData.get('email') as string

    /* SQL: Check if applicant email already submitted */
    const existingRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM Applicant
      WHERE email = ${email}
      LIMIT 1
    `

    if (existingRows.length > 0) {
      return NextResponse.json({
        message: 'An application with this email already exists.'
      }, { status: 409 })
    }

    const newApplicantId = crypto.randomUUID()

    /* SQL: Insert new job application record */
    await prisma.$executeRaw`
      INSERT INTO Applicant (
        id, firstName, lastName, email, phone, address,
        position, expectedSalary, yearsOfExperience,
        sssNumber, pagibigNumber, philhealthNumber,
        tinNumber, resumeUrl, coverLetterUrl, otherDocsUrl,
        status, appliedAt, createdAt, updatedAt
      ) VALUES (
        ${newApplicantId},
        ${formData.get('firstName') as string},
        ${formData.get('lastName') as string},
        ${email},
        ${formData.get('phone') as string || null},
        ${formData.get('address') as string || null},
        ${formData.get('position') as string},
        ${(formData.get('expectedSalary') as string) || null},
        ${(formData.get('yearsOfExperience') as string) || null},
        ${(formData.get('sssNumber') as string) || null},
        ${(formData.get('pagibigNumber') as string) || null},
        ${(formData.get('philhealthNumber') as string) || null},
        ${(formData.get('tinNumber') as string) || null},
        ${await saveFile(formData.get('resume') as File) || null},
        ${await saveFile(formData.get('coverLetter') as File) || null},
        ${await saveFile(formData.get('other') as File) || null},
        'Applied',
        ${new Date().toISOString()},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `

    /* SQL: Return the created applicant record */
    const newApplicantRows = await prisma.$queryRaw<Array<{
      id: string; firstName: string; lastName: string;
      email: string | null; phone: string | null;
      address: string | null; position: string;
      expectedSalary: string | null;
      yearsOfExperience: string | null;
      sssNumber: string | null; pagibigNumber: string | null;
      philhealthNumber: string | null; tinNumber: string | null;
      resumeUrl: string | null; coverLetterUrl: string | null;
      otherDocsUrl: string | null; status: string;
      convertedEmployeeId: string | null;
      appliedAt: Date; createdAt: Date; updatedAt: Date;
    }>>`
      SELECT * FROM Applicant
      WHERE id = ${newApplicantId}
      LIMIT 1
    `
    const applicant = newApplicantRows[0]

    return NextResponse.json(applicant);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
