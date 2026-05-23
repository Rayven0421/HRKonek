import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const saveFile = async (file: File | null) => {
      if (!file || file.size === 0) return null;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const filepath = path.join(process.cwd(), 'public/uploads', filename);
      await writeFile(filepath, buffer);
      return `/uploads/${filename}`;
    };

    const applicant = await prisma.applicant.create({
      data: {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        position: formData.get('position') as string,
        expectedSalary: formData.get('expectedSalary') as string,
        yearsOfExperience: formData.get('yearsOfExperience') as string,
        sssNumber: formData.get('sssNumber') as string,
        pagibigNumber: formData.get('pagibigNumber') as string,
        philhealthNumber: formData.get('philhealthNumber') as string,
        tinNumber: formData.get('tinNumber') as string,
        resumeUrl: await saveFile(formData.get('resume') as File),
        coverLetterUrl: await saveFile(formData.get('coverLetter') as File),
        otherDocsUrl: await saveFile(formData.get('other') as File),
      },
    });

    return NextResponse.json(applicant);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
