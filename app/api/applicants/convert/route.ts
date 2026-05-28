import { prisma } from '@/lib/prisma';
import { sanitizeRequired, sanitizeString, sanitizeNumber, sanitizeDate, sanitizeEmail, getFriendlyError } from '@/lib/sanitize'
import { createNotification } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return Response.json({ success: false, error: 'Invalid request body' }, { status: 400 })
    }

    const applicantId = body.applicantId as string
    if (!applicantId) {
      return Response.json({ success: false, error: 'Applicant ID is required' }, { status: 400 })
    }

    const employeeData = body.employeeData as Record<string, unknown> | undefined
    if (!employeeData) {
      return Response.json({ success: false, error: 'Employee data is required' }, { status: 400 })
    }

    let firstName: string
    let lastName: string
    let email: string

    try {
      firstName = sanitizeRequired(employeeData.firstName, 'First Name')
      lastName = sanitizeRequired(employeeData.lastName, 'Last Name')
    } catch (err) {
      return Response.json({
        success: false,
        error: err instanceof Error ? err.message : 'Name fields are required'
      }, { status: 400 })
    }

    const rawEmail = sanitizeEmail(employeeData.email)
    if (!rawEmail) {
      return Response.json({ success: false, error: 'A valid email is required' }, { status: 400 })
    }
    email = rawEmail

    const phone = sanitizeString(employeeData.phone)
    const position = sanitizeRequired(employeeData.position, 'Position')
    const department = sanitizeRequired(employeeData.department, 'Department')
    const employmentType = sanitizeString(employeeData.employmentType) ?? 'Regular'
    const startDate = sanitizeDate(employeeData.startDate) ?? new Date().toISOString()
    const salary = sanitizeNumber(employeeData.salary)
    const sssNumber = sanitizeString(employeeData.sssNumber)
    const philhealthNumber = sanitizeString(employeeData.philhealthNumber)
    const pagibigNumber = sanitizeString(employeeData.pagibigNumber)
    const tinNumber = sanitizeString(employeeData.tinNumber)

    const newEmployeeId = crypto.randomUUID()
    const displayId = `E${Date.now().toString().slice(-4)}`

    await prisma.$executeRaw`
      INSERT INTO Employee (
        id, firstName, lastName, email, phone,
        role, department, status, hireDate, salary,
        sssNumber, philhealthNumber, pagibigNumber,
        tinNumber, employmentType, employeeId,
        createdAt, updatedAt
      ) VALUES (
        ${newEmployeeId}, ${firstName}, ${lastName}, ${email},
        ${phone || null}, ${position}, ${department},
        'Active', ${startDate}, ${salary},
        ${sssNumber || null}, ${philhealthNumber || null},
        ${pagibigNumber || null}, ${tinNumber || null},
        ${employmentType}, ${displayId},
        ${new Date().toISOString()}, ${new Date().toISOString()}
      )
    `

    await prisma.$executeRaw`
      UPDATE Applicant
      SET status = 'Hired',
          convertedEmployeeId = ${newEmployeeId},
          updatedAt = ${new Date().toISOString()}
      WHERE id = ${applicantId}
    `

    await createNotification({
      type: 'new_employee',
      title: 'Applicant Converted to Employee',
      message: `${firstName} ${lastName} has been hired and added as an employee.`,
      link: `/employees/${newEmployeeId}`
    })

    return Response.json({
      success: true,
      employeeId: newEmployeeId,
      employeeName: `${firstName} ${lastName}`,
    })
  } catch (error) {
    console.error('Convert applicant error:', error)
    const { message } = getFriendlyError(error)
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
