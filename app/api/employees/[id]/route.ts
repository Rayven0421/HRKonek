import { prisma } from "@/lib/prisma";
import { sanitizeRequired, sanitizeString, sanitizeNumber, sanitizeDate, sanitizeEmail, sanitizeEmployeeStatus, getFriendlyError } from '@/lib/sanitize'
import { requireApiAuth } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiAuth()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { message: 'Invalid request body — must be valid JSON' },
        { status: 400 }
      )
    }

    const existsRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM Employee WHERE id = ${id} LIMIT 1
    `
    if (!existsRows || existsRows.length === 0) {
      return Response.json({ message: 'Employee not found' }, { status: 404 })
    }

    const firstName = sanitizeString(body.firstName)
    const lastName = sanitizeString(body.lastName)
    const email = sanitizeEmail(body.email)
    const phone = sanitizeString(body.phone)
    const address = sanitizeString(body.address)
    const department = sanitizeString(body.department)
    const role = sanitizeString(body.role)
    const status = sanitizeEmployeeStatus(body.status)
    const salary = body.salary !== undefined ? sanitizeNumber(body.salary) : undefined
    const sssNumber = sanitizeString(body.sssNumber)
    const philhealthNumber = sanitizeString(body.philhealthNumber)
    const pagibigNumber = sanitizeString(body.pagibigNumber)
    const tinNumber = sanitizeString(body.tinNumber)
    const employmentType = sanitizeString(body.employmentType)
    const profileImage = sanitizeString(body.profileImage)
    const dateOfBirth = body.dateOfBirth ? sanitizeDate(body.dateOfBirth) : null
    const hireDate = body.hireDate ? sanitizeDate(body.hireDate) : null

    await prisma.$executeRaw`
      UPDATE Employee SET
        firstName        = COALESCE(${firstName ?? null}, firstName),
        lastName         = COALESCE(${lastName ?? null}, lastName),
        email            = COALESCE(${email ?? null}, email),
        phone            = COALESCE(${phone ?? null}, phone),
        address          = COALESCE(${address ?? null}, address),
        department       = COALESCE(${department ?? null}, department),
        role             = COALESCE(${role ?? null}, role),
        status           = COALESCE(${status ?? null}, status),
        salary           = COALESCE(${salary !== undefined ? salary : null}, salary),
        sssNumber        = COALESCE(${sssNumber ?? null}, sssNumber),
        philhealthNumber = COALESCE(${philhealthNumber ?? null}, philhealthNumber),
        pagibigNumber    = COALESCE(${pagibigNumber ?? null}, pagibigNumber),
        tinNumber        = COALESCE(${tinNumber ?? null}, tinNumber),
        employmentType   = COALESCE(${employmentType ?? null}, employmentType),
        profileImage     = COALESCE(${profileImage ?? null}, profileImage),
        dateOfBirth      = COALESCE(${dateOfBirth ?? null}, dateOfBirth),
        hireDate         = COALESCE(${hireDate ?? null}, hireDate),
        updatedAt        = ${new Date().toISOString()}
      WHERE id = ${id}
    `

    const updatedRows = await prisma.$queryRaw<Array<{
      id: string; firstName: string; lastName: string;
      email: string; phone: string | null;
      address: string | null; department: string;
      role: string; status: string; salary: number | null;
      hireDate: Date; employeeId: string | null;
      dateOfBirth: Date | null; tinNumber: string | null;
      sssNumber: string | null; philhealthNumber: string | null;
      pagibigNumber: string | null; employmentType: string | null;
      profileImage: string | null;
      createdAt: Date; updatedAt: Date;
    }>>`
      SELECT * FROM Employee WHERE id = ${id} LIMIT 1
    `
    const updated = updatedRows[0]

    return Response.json(updated)
  } catch (error) {
    console.error('PATCH Employee Error:', error)
    const { message, status } = getFriendlyError(error)
    return Response.json({ message }, { status })
  }
}
