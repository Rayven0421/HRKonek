import { prisma } from "@/lib/prisma";
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
    const existingEmployee = await prisma.employee.findUnique({ where: { email } });
    if (existingEmployee) {
      return NextResponse.json({ error: "Email already registered to another employee" }, { status: 400 });
    }

    // 4. Autogenerate Unique Employee ID (E001, E002...)
    // We fetch all employeeIds to find the highest one, ensuring no reuse even after deletions
    const employees = await prisma.employee.findMany({
      select: { employeeId: true },
      orderBy: { employeeId: 'desc' },
    });

    let nextIdNumber = 1;
    if (employees.length > 0) {
      const lastId = employees[0].employeeId;
      if (lastId && lastId.startsWith('E')) {
        const lastNumber = parseInt(lastId.substring(1));
        if (!isNaN(lastNumber)) {
          nextIdNumber = lastNumber + 1;
        }
      }
    }
    const generatedEmployeeId = `E${nextIdNumber.toString().padStart(3, '0')}`;

    // 5. Create Employee
    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        employeeId: generatedEmployeeId,
        department,
        role,
        status,
        salary: salary ? parseFloat(salary) : null,
        hireDate: new Date(hireDate),
      },
    });

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
