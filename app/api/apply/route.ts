import { prisma } from '@/lib/prisma';
import { sanitizeRequired, sanitizeString, sanitizeEmail, getFriendlyError } from '@/lib/sanitize'
import { createNotification } from '@/lib/notifications'
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return Response.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const saveFile = async (file: File | null) => {
      if (!file || file.size === 0) return null;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = file.name.replace(/[^\w.\-() ]/g, '_');
      const filename = `${Date.now()}-${safeName}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      return `/uploads/${filename}`;
    };

    const firstName = sanitizeString(formData.get('firstName') as string)
    if (!firstName) {
      return Response.json({ error: 'First name is required' }, { status: 400 })
    }

    const lastName = sanitizeString(formData.get('lastName') as string)
    if (!lastName) {
      return Response.json({ error: 'Last name is required' }, { status: 400 })
    }

    const email = sanitizeEmail(formData.get('email') as string)
    if (!email) {
      return Response.json({ error: 'A valid email address is required' }, { status: 400 })
    }

    const phone = sanitizeString(formData.get('phone') as string)
    const address = sanitizeString(formData.get('address') as string)
    
    const position = sanitizeString(formData.get('position') as string)
    if (!position) {
      return Response.json({ error: 'Position is required' }, { status: 400 })
    }

    const expectedSalary = sanitizeString(formData.get('expectedSalary') as string)
    const yearsOfExperience = sanitizeString(formData.get('yearsOfExperience') as string)
    const sssNumber = sanitizeString(formData.get('sssNumber') as string)
    const pagibigNumber = sanitizeString(formData.get('pagibigNumber') as string)
    const philhealthNumber = sanitizeString(formData.get('philhealthNumber') as string)
    const tinNumber = sanitizeString(formData.get('tinNumber') as string)

    const existingRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM Applicant WHERE email = ${email} LIMIT 1
    `
    if (existingRows.length > 0) {
      return Response.json({ message: 'An application with this email already exists.' }, { status: 409 })
    }

    const newApplicantId = crypto.randomUUID()

    await prisma.$executeRaw`
      INSERT INTO Applicant (
        id, firstName, lastName, email, phone, address,
        position, expectedSalary, yearsOfExperience,
        sssNumber, pagibigNumber, philhealthNumber,
        tinNumber, resumeUrl, coverLetterUrl, otherDocsUrl,
        status, appliedAt, createdAt, updatedAt
      ) VALUES (
        ${newApplicantId}, ${firstName}, ${lastName}, ${email},
        ${phone ?? null}, ${address ?? null}, ${position},
        ${expectedSalary ?? null}, ${yearsOfExperience ?? null},
        ${sssNumber ?? null}, ${pagibigNumber ?? null},
        ${philhealthNumber ?? null}, ${tinNumber ?? null},
        ${await saveFile(formData.get('resume') as File) || null},
        ${await saveFile(formData.get('coverLetter') as File) || null},
        ${await saveFile(formData.get('other') as File) || null},
        'Applied',
        ${new Date().toISOString()},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `

    await createNotification({
      type: 'new_application',
      title: 'New Job Application',
      message: `${firstName} ${lastName} applied for ${position}.`,
      link: '/applicants'
    })

    return Response.json({ success: true, message: 'Application submitted successfully' })
  } catch (error) {
    console.error('Apply error:', error)
    const { message } = getFriendlyError(error)
    return Response.json({ error: message }, { status: 500 })
  }
}
