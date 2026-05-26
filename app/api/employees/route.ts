import { prisma } from "@/lib/prisma";
import { Prisma } from '@/app/generated/prisma/client'
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      address, 
      department, 
      role, 
      status, 
      hireDate, 
      salary 
    } = body;

    // 1. Basic Sanity & Required Fields Check
    if (!firstName || !lastName || !email || !department || !role || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Server-side Validation (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const phoneRegex = /^(\+63\s?|0)9\d{9}$/;
    if (phone && !phoneRegex.test(phone)) {
      return NextResponse.json({ error: "Invalid Philippines phone number format (+639... or 09...)" }, { status: 400 });
    }

    // 3. Unique Email Check
    /* SQL: Check if email already exists (unique constraint) */
    const existingRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM Employee
      WHERE email = ${email}
      LIMIT 1`
    const existingEmployee = existingRows[0] ?? null
    if (existingEmployee) {
      return NextResponse.json({ error: "Email already registered to another employee" }, { status: 400 });
    }

    // 4. Autogenerate Unique Employee ID (E001, E002...)
    /* SQL: Get highest employee ID for auto-increment display ID generation */
    const lastEmployeeRows = await prisma.$queryRaw<Array<{ employeeId: string | null }>>`
      SELECT employeeId FROM Employee
      WHERE employeeId IS NOT NULL
      ORDER BY employeeId DESC
      LIMIT 1
    `

    let nextIdNumber = 1;
    if (lastEmployeeRows.length > 0) {
      const lastId = lastEmployeeRows[0].employeeId;
      if (lastId && lastId.startsWith('E')) {
        const lastNumber = parseInt(lastId.substring(1));
        if (!isNaN(lastNumber)) {
          nextIdNumber = lastNumber + 1;
        }
      }
    }
    const generatedEmployeeId = `E${nextIdNumber.toString().padStart(3, '0')}`;

    // 5. Create Employee
    /* SQL: Insert new employee record */
    const newEmployeeId = crypto.randomUUID()
    await prisma.$executeRaw`
      INSERT INTO Employee (
        id, firstName, lastName, email, phone, address,
        employeeId, department, role, status,
        salary, hireDate, createdAt, updatedAt
      ) VALUES (
        ${newEmployeeId},
        ${firstName},
        ${lastName},
        ${email},
        ${phone ?? null},
        ${address ?? null},
        ${generatedEmployeeId},
        ${department},
        ${role},
        ${status ?? 'Active'},
        ${salary ? parseFloat(salary) : null},
        ${hireDate ? new Date(hireDate).toISOString() : new Date().toISOString()},
        ${new Date().toISOString()},
        ${new Date().toISOString()}
      )
    `

    /* SQL: Retrieve the newly created employee */
    const newEmployeeRows = await prisma.$queryRaw<Array<{
      id: string; firstName: string; lastName: string;
      email: string; phone: string | null;
      address: string | null; department: string;
      role: string; status: string; salary: number | null;
      hireDate: Date; employeeId: string | null;
      dateOfBirth: Date | null; tinNumber: string | null;
      sssNumber: string | null;
      philhealthNumber: string | null;
      pagibigNumber: string | null;
      employmentType: string | null;
      profileImage: string | null;
      createdAt: Date; updatedAt: Date;
    }>>`
      SELECT * FROM Employee
      WHERE id = ${newEmployeeId}
      LIMIT 1
    `
    const employee = newEmployeeRows[0]

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An internal server error occurred";
    console.error("API Error:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
