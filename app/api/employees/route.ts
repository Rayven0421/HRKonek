import { prisma } from "@/lib/prisma";
import { sanitizeRequired, sanitizeString, sanitizeNumber, sanitizeDate, sanitizeEmail, sanitizeEmployeeStatus, getFriendlyError } from '@/lib/sanitize'
import { createNotification } from '@/lib/notifications'
import { requireApiAuth } from '@/lib/auth'

export async function POST(request: Request) {
  const user = await requireApiAuth()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return Response.json(
        { message: 'Invalid request body — must be valid JSON' },
        { status: 400 }
      )
    }

    let firstName: string
    let lastName: string
    let email: string

    try {
      firstName = sanitizeRequired(body.firstName, 'First Name')
      lastName = sanitizeRequired(body.lastName, 'Last Name')
    } catch (err) {
      return Response.json(
        { message: err instanceof Error ? err.message : 'Name fields are required' },
        { status: 400 }
      )
    }

    const rawEmail = sanitizeEmail(body.email)
    if (!rawEmail) {
      return Response.json({ message: 'A valid email address is required' }, { status: 400 })
    }
    email = rawEmail

    const phone = sanitizeString(body.phone)
    const address = sanitizeString(body.address)

    let department: string
    let role: string
    try {
      department = sanitizeRequired(body.department, 'Department')
      role = sanitizeRequired(body.role, 'Position')
    } catch (err) {
      return Response.json(
        { message: err instanceof Error ? err.message : 'Required fields missing' },
        { status: 400 }
      )
    }

    const status = sanitizeEmployeeStatus(body.status) ?? 'Active'
    const salary = sanitizeNumber(body.salary)
    const hireDate = sanitizeDate(body.hireDate) ?? new Date().toISOString()

    const existingRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM Employee WHERE email = ${email} LIMIT 1
    `
    if (existingRows.length > 0) {
      return Response.json(
        { message: 'An employee with this email already exists' },
        { status: 409 }
      )
    }

    const duplicateNameRows = await prisma.$queryRaw<Array<{ id: string; email: string }>>`
      SELECT id, email FROM Employee
      WHERE firstName = ${firstName} AND lastName = ${lastName}
      LIMIT 1
    `
    if (duplicateNameRows.length > 0) {
      return Response.json(
        { message: `An employee named ${firstName} ${lastName} already exists (${duplicateNameRows[0].email}). Use a different email or edit the existing record.` },
        { status: 409 }
      )
    }

    const lastIdRows = await prisma.$queryRaw<{ employeeId: string | null }[]>`
      SELECT employeeId FROM Employee
      WHERE employeeId IS NOT NULL
        AND employeeId LIKE 'E%'
      ORDER BY CAST(SUBSTR(employeeId, 2) AS INTEGER) DESC
      LIMIT 1
    `
    let nextNumber = 1
    if (lastIdRows.length > 0 && lastIdRows[0].employeeId) {
      const lastNum = parseInt(lastIdRows[0].employeeId.replace('E', ''), 10)
      if (!isNaN(lastNum)) nextNumber = lastNum + 1
    }
    const generatedEmployeeId = `E${String(nextNumber).padStart(3, '0')}`

    const newEmployeeId = crypto.randomUUID()
    await prisma.$executeRaw`
      INSERT INTO Employee (
        id, firstName, lastName, email, phone, address,
        employeeId, department, role, status,
        salary, hireDate, createdAt, updatedAt
      ) VALUES (
        ${newEmployeeId}, ${firstName}, ${lastName}, ${email},
        ${phone ?? null}, ${address ?? null},
        ${generatedEmployeeId}, ${department}, ${role},
        ${status}, ${salary}, ${hireDate},
        ${new Date().toISOString()}, ${new Date().toISOString()}
      )
    `

    const newEmployeeRows = await prisma.$queryRaw<Array<{
      id: string; firstName: string; lastName: string;
      email: string; phone: string | null;
      address: string | null; department: string;
      role: string; status: string; salary: number | null;
      hireDate: Date; employeeId: string | null;
      createdAt: Date; updatedAt: Date;
    }>>`
      SELECT id, firstName, lastName, email, phone,
             address, department, role, status, salary,
             hireDate, employeeId, createdAt, updatedAt
      FROM Employee WHERE id = ${newEmployeeId} LIMIT 1
    `
    const employee = newEmployeeRows[0]

    await createNotification({
      type: 'new_employee',
      title: 'New Employee Added',
      message: `${firstName} ${lastName} has been added as a new employee.`,
      link: `/employees/${newEmployeeId}`
    })

    return Response.json(employee, { status: 201 })
  } catch (error) {
    console.error('Create employee error:', error)
    const { message, status } = getFriendlyError(error)
    return Response.json({ message }, { status })
  }
}

export async function GET(request: Request) {
  const user = await requireApiAuth()
  if (!user) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const url = new URL(request.url)
    const archived = url.searchParams.get('archived') === '1'

    const employees = await prisma.$queryRaw<Array<{
      id: string; firstName: string; lastName: string;
      email: string; phone: string | null;
      department: string; role: string; status: string;
      employeeId: string | null;
      archivedAt: Date | null;
      archiveReason: string | null; archiveNote: string | null;
    }>>`
      SELECT id, firstName, lastName, email, phone,
             department, role, status, employeeId,
             archivedAt, archiveReason, archiveNote
      FROM Employee
      WHERE isArchived = ${archived ? 1 : 0}
      ORDER BY archivedAt DESC, createdAt DESC
    `

    return Response.json(employees)
  } catch (error) {
    console.error('Get employees error:', error)
    return Response.json({ message: 'Something went wrong' }, { status: 500 })
  }
}
