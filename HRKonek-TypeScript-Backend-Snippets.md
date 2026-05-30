# HRKonek TypeScript Backend Code Snippets

## 1. Prisma Schema — `prisma/schema.prisma`

Database models: Employee, Applicant, ContributionRecord, Notification, AdminUser, AdminSession.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Employee {
  id                  String               @id @default(uuid())
  employeeId          String?              @unique
  firstName           String
  lastName            String
  email               String               @unique
  phone               String?
  address             String?
  dateOfBirth         DateTime?
  tinNumber           String?
  sssNumber           String?
  philhealthNumber    String?
  pagibigNumber       String?
  department          String
  role                String
  employmentType      String?              @default("Regular")
  status              String               @default("Active")
  salary              Float?
  hireDate            DateTime             @default(now())
  profileImage        String?
  isArchived          Boolean              @default(false)
  archivedAt          DateTime?
  archiveReason       String?
  archiveNote         String?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  contributionRecords ContributionRecord[]
}

model ContributionRecord {
  id         String   @id @default(uuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
  type       String
  month      String
  year       String
  createdAt  DateTime @default(now())

  @@index([employeeId])
  @@index([month, year])
}

model Applicant {
  id                  String   @id @default(uuid())
  applicantId         String?  @unique
  firstName           String
  lastName            String
  email               String   @unique
  phone               String?
  address             String?
  position            String
  expectedSalary      String?
  yearsOfExperience   String?
  sssNumber           String?
  pagibigNumber       String?
  philhealthNumber    String?
  tinNumber           String?
  resumeUrl           String?
  coverLetterUrl      String?
  otherDocsUrl        String?
  status              String   @default("Applied")
  convertedEmployeeId String?
  isArchived          Boolean  @default(false)
  archivedAt          DateTime?
  archiveReason       String?
  archiveNote         String?
  appliedAt           DateTime @default(now())
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Notification {
  id        String   @id @default(uuid())
  type      String
  title     String
  message   String
  isRead    Boolean  @default(false)
  link      String?
  createdAt DateTime @default(now())
}

model AdminUser {
  id           String         @id @default(uuid())
  email        String         @unique
  username     String         @unique
  passwordHash String
  name         String
  role         String         @default("admin")
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  sessions     AdminSession[]
}

model AdminSession {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  createdAt DateTime  @default(now())
  user      AdminUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}
```

---

## 2. Prisma Client Singleton — `lib/prisma.ts`

```typescript
import { PrismaClient } from '@/app/generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma
```

---

## 3. Auth Middleware — `middleware.ts`

Protects all routes except public paths (`/`, `/apply`) and API routes (which handle auth internally).

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'hrkonek_session'

const publicPaths = new Set(['/', '/apply'])
const STATIC_EXT = /\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff2?|ttf|eot|otf|mp4|webm|pdf)$/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next/') || STATIC_EXT.test(pathname))
    return NextResponse.next()

  if (pathname.startsWith('/api/'))
    return NextResponse.next()

  if (publicPaths.has(pathname))
    return NextResponse.next()

  const session = request.cookies.get(SESSION_COOKIE)
  if (!session?.value) {
    const loginUrl = new URL('/', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
```

---

## 4. Employees — `app/api/employees/route.ts`

**GET** — fetch all active or archived employees with raw SQL:
```typescript
export async function GET(request: Request) {
  const user = await requireApiAuth()
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const archived = url.searchParams.get('archived') === '1'

  const employees = await prisma.$queryRaw<Array<{...}>>`
    SELECT id, firstName, lastName, email, phone,
           department, role, status, employeeId,
           archivedAt, archiveReason, archiveNote
    FROM Employee
    WHERE isArchived = ${archived ? 1 : 0}
    ORDER BY archivedAt DESC, createdAt DESC
  `
  return Response.json(employees)
}
```

**POST** — create employee with duplicate detection + auto-generated ID (`E001`, `E002`, ...):
```typescript
export async function POST(request: Request) {
  const user = await requireApiAuth()
  // ... sanitize inputs ...

  // Check duplicate email
  const existingRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM Employee WHERE email = ${email} LIMIT 1
  `
  if (existingRows.length > 0)
    return Response.json({ message: 'An employee with this email already exists' }, { status: 409 })

  // Auto-generate employee ID (E001, E002, ...)
  const lastIdRows = await prisma.$queryRaw<{ employeeId: string | null }[]>`
    SELECT employeeId FROM Employee WHERE employeeId IS NOT NULL
      AND employeeId LIKE 'E%'
    ORDER BY CAST(SUBSTR(employeeId, 2) AS INTEGER) DESC LIMIT 1
  `
  const generatedEmployeeId = `E${String(nextNumber).padStart(3, '0')}`

  await prisma.$executeRaw`
    INSERT INTO Employee (id, firstName, lastName, email, ..., employeeId, ...)
    VALUES (${newEmployeeId}, ${firstName}, ${lastName}, ...)
  `

  await createNotification({
    type: 'new_employee',
    title: 'New Employee Added',
    message: `${firstName} ${lastName} has been added as a new employee.`,
    link: `/employees/${newEmployeeId}`
  })

  return Response.json(employee, { status: 201 })
}
```

---

## 5. Employee Detail — `app/api/employees/[id]/route.ts`

**PATCH** — partial update using `COALESCE` pattern (only update provided fields):
```typescript
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiAuth()
  const { id } = await params

  const existsRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM Employee WHERE id = ${id} LIMIT 1
  `
  if (!existsRows || existsRows.length === 0)
    return Response.json({ message: 'Employee not found' }, { status: 404 })

  await prisma.$executeRaw`
    UPDATE Employee SET
      firstName   = COALESCE(${firstName ?? null}, firstName),
      lastName    = COALESCE(${lastName ?? null}, lastName),
      email       = COALESCE(${email ?? null}, email),
      department  = COALESCE(${department ?? null}, department),
      role        = COALESCE(${role ?? null}, role),
      status      = COALESCE(${status ?? null}, status),
      salary      = COALESCE(${salary}, salary),
      updatedAt   = ${new Date().toISOString()}
    WHERE id = ${id}
  `
  return Response.json(updated)
}
```

---

## 6. Employee Count — `app/api/employees/count/route.ts`

```typescript
export async function GET() {
  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM Employee WHERE isArchived = 0
  `
  const count = Number(countResult[0].count)
  return NextResponse.json({ count })
}
```

---

## 7. Applicants — `app/api/applicants/[id]/route.ts`

**GET** — fetch applicants (active/archived):
```typescript
export async function GET(request: Request) {
  const user = await requireApiAuth()
  const url = new URL(request.url)
  const archived = url.searchParams.get('archived') === '1'

  const applicants = await prisma.$queryRaw<Array<{...}>>`
    SELECT id, firstName, lastName, position, status, applicantId, archivedAt
    FROM Applicant
    WHERE isArchived = ${archived ? 1 : 0}
    ORDER BY archivedAt DESC, createdAt DESC
  `
  return Response.json(applicants)
}
```

**PATCH** — update status (triggers notifications for "Hired" or "Interview Scheduled"):
```typescript
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const newStatus = sanitizeApplicantStatus(body.status)

  await prisma.$executeRaw`
    UPDATE Applicant SET status = ${newStatus}, updatedAt = ${new Date().toISOString()}
    WHERE id = ${id}
  `

  if (newStatus === 'Hired') {
    await createNotification({
      type: 'status_changed', title: 'Applicant Hired',
      message: `${applicant.firstName} ${applicant.lastName} has been marked as Hired.`,
      link: '/applicants'
    })
  }
  return Response.json(updatedApplicant)
}
```

---

## 8. Convert Applicant → Employee — `app/api/applicants/convert/route.ts`

Transactional: creates an Employee record, updates Applicant status to "Hired", stores the relationship.

```typescript
export async function POST(request: Request) {
  const user = await requireApiAuth()

  // Create employee with auto-generated ID
  const newEmployeeId = crypto.randomUUID()
  const displayId = `E${String(nextNumber).padStart(3, '0')}`

  await prisma.$executeRaw`
    INSERT INTO Employee (id, firstName, lastName, email, ..., employeeId, ...)
    VALUES (${newEmployeeId}, ${firstName}, ${lastName}, ${email}, ..., ${displayId}, ...)
  `

  // Mark applicant as hired with reference to new employee
  await prisma.$executeRaw`
    UPDATE Applicant
    SET status = 'Hired', convertedEmployeeId = ${newEmployeeId}, updatedAt = ${new Date().toISOString()}
    WHERE id = ${applicantId}
  `

  return Response.json({ success: true, employeeId: newEmployeeId })
}
```

---

## 9. Public Job Application — `app/api/apply/route.ts`

Public endpoint (no auth) accepting multipart form data with file uploads.

```typescript
export async function POST(request: Request) {
  const formData = await request.formData()

  // File saving helper
  const saveFile = async (file: File | null) => {
    if (!file || file.size === 0) return null
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name.replace(/[^\w.\-() ]/g, '_')}`
    const uploadDir = path.join(process.cwd(), 'public/uploads')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)
    return `/uploads/${filename}`
  }

  // Validate required fields, check duplicate email
  const existingRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM Applicant WHERE email = ${email} LIMIT 1
  `
  if (existingRows.length > 0)
    return Response.json({ message: 'An application with this email already exists.' }, { status: 409 })

  // Auto-generate applicant ID (A001, A002, ...)
  const newDisplayId = `A${String(nextAppNum).padStart(3, '0')}`

  await prisma.$executeRaw`
    INSERT INTO Applicant (id, applicantId, firstName, lastName, email, ..., resumeUrl, ...)
    VALUES (${newApplicantId}, ${newDisplayId}, ${firstName}, ${lastName}, ${email}, ...,
            ${await saveFile(resumeFile)}, ...)
  `

  return Response.json({ success: true, message: 'Application submitted successfully' })
}
```

---

## 10. File Upload — `app/api/upload/route.ts`

Auth-protected image upload with type/size validation.

```typescript
export async function POST(request: NextRequest) {
  const user = await requireApiAuth()
  const formData = await request.formData()
  const file = formData.get('file') as File

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type))
    return Response.json({ error: 'Only JPG, PNG, or WEBP files allowed' }, { status: 400 })

  if (file.size > 2 * 1024 * 1024)
    return Response.json({ error: 'File must be under 2MB' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `profile-${Date.now()}.${file.name.split('.').pop()}`

  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), buffer)

  return Response.json({ filename })
}
```

---

## 11. Bulk Benefits Enrollment — `app/api/benefits/enroll/route.ts`

Enrolls all active employees (or only those missing numbers) in SSS/PhilHealth/PAG-IBIG.

```typescript
export async function POST(request: Request) {
  const user = await requireApiAuth()

  const employees = await prisma.$queryRaw<Array<{...}>>`
    SELECT id, sssNumber, philhealthNumber, pagibigNumber
    FROM Employee WHERE isArchived = 0
  `

  // Filter to only employees missing selected benefits
  let targets = employees
  if (scope === 'new') {
    targets = employees.filter(e =>
      (benefits.sss && !e.sssNumber) ||
      (benefits.philhealth && !e.philhealthNumber) ||
      (benefits.pagibig && !e.pagibigNumber)
    )
  }

  let enrolled = 0
  for (const emp of targets) {
    if (benefits.sss && !emp.sssNumber) {
      await prisma.$executeRaw`
        UPDATE Employee SET sssNumber = ${sssVal}, updatedAt = ${new Date().toISOString()}
        WHERE id = ${emp.id}
      `
      enrolled++
    }
    // Same pattern for philhealth and pagibig...
  }

  return Response.json({ success: true, enrolled, message: `${enrolled} employees enrolled` })
}
```

---

## 12. Process Contributions — `app/api/benefits/process/route.ts`

Creates `ContributionRecord` entries per employee per benefit per month, with duplicate-month detection.

```typescript
export async function POST(request: Request) {
  const activeEmployees = await prisma.$queryRaw<Array<{...}>>`
    SELECT id, sssNumber, philhealthNumber, pagibigNumber
    FROM Employee WHERE status = 'Active' AND isArchived = 0
  `

  // Prevent duplicate processing for the same month/year
  const duplicateCheck = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM ContributionRecord
    WHERE month = ${month} AND year = ${year}
  `
  if (Number(duplicateCheck[0].count) > 0)
    return Response.json({
      message: `Contributions for ${month} ${year} have already been processed.`
    }, { status: 409 })

  let recordsCreated = 0
  for (const emp of activeEmployees) {
    if (benefits.sss && emp.sssNumber) {
      await prisma.$executeRaw`
        INSERT INTO ContributionRecord (id, employeeId, type, month, year, createdAt)
        VALUES (${crypto.randomUUID()}, ${emp.id}, 'SSS', ${month}, ${year}, ${new Date().toISOString()})
      `
      recordsCreated++
    }
    // Same pattern for PhilHealth and PAG-IBIG...
  }

  return Response.json({
    success: true,
    message: `Contributions processed for ${month} ${year}`,
    recordsCreated,
  })
}
```

---

## 13. Dashboard Server Page — `app/dashboard/page.tsx`

Fetches aggregated stats from DB and passes to client component.

```typescript
import { prisma } from "@/lib/prisma"
import { requireAuth } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireAuth()

  const [employeeCount] = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM Employee WHERE isArchived = 0
  `
  const [activeCount] = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM Employee WHERE status = 'Active' AND isArchived = 0
  `
  const [applicantCount] = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM Applicant WHERE isArchived = 0
  `
  const [pendingCount] = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM Applicant
    WHERE isArchived = 0 AND status NOT IN ('Hired', 'Rejected')
  `
  const [onLeaveCount] = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM Employee WHERE status = 'On Leave' AND isArchived = 0
  `

  // Growth data grouped by month
  const growthData = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
    SELECT strftime('%Y-%m', hireDate) as month, COUNT(*) as count
    FROM Employee WHERE hireDate IS NOT NULL AND isArchived = 0
    GROUP BY strftime('%Y-%m', hireDate)
    ORDER BY month ASC LIMIT 12
  `
  // Recent notifications
  const notifications = await prisma.$queryRaw<Array<{...}>>`
    SELECT * FROM Notification ORDER BY createdAt DESC LIMIT 5
  `

  return <DashboardClient stats={{ employeeCount, activeCount, ... }} growthData={...} notifications={...} user={...} />
}
```

---

## 14. Dashboard Client Component — `components/DashboardClient.tsx`

Dashboard component receiving server-fetched data as props:

```typescript
'use client'
import { LayoutDashboard, Users, Award, FileText, TrendingUp, Briefcase, ClipboardList, Bell, Search } from 'lucide-react'

export function DashboardClient({ stats, growthData, notifications, user }: Props) {
  const statCards = [
    { label: 'Total Employees', value: Number(stats.employeeCount), icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Employees', value: Number(stats.activeCount), icon: Briefcase, color: 'bg-green-100 text-green-600' },
    { label: 'On Leave', value: Number(stats.onLeaveCount), icon: ClipboardList, color: 'bg-orange-100 text-orange-600' },
    { label: 'Pending Applicants', value: Number(stats.pendingCount), icon: FileText, color: 'bg-purple-100 text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
              <p className="text-gray-900 text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Growth chart - wrapped in ResponsiveContainer */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-[#1E3A8A] font-bold mb-4">Employee Growth</h3>
        <div className="w-full h-52 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growthData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Bar dataKey="count" fill="#1E3A8A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
```

---

## 15. Employee List — `app/employees/page.tsx`

Server page that fetches employees and passes to `EmployeeTable`.

```typescript
import { prisma } from "@/lib/prisma"
import { requireAuth } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const user = await requireAuth()

  const employees = await prisma.$queryRaw<Array<{...}>>`
    SELECT id, firstName, lastName, email, phone,
           department, role, status, employeeId
    FROM Employee WHERE isArchived = 0
    ORDER BY createdAt DESC
  `

  return <EmployeeTable employees={employees} user={user} />
}
```

---

## 16. Add Employee — `app/employees/new/page.tsx`

Server-rendered form page (data submitted via `POST /api/employees`).

```typescript
import { requireAuth } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export default async function NewEmployeePage() {
  const user = await requireAuth()
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <form method="POST" action="/api/employees">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label>First Name<span className="text-blue-600">*</span></label>
            <input name="firstName" required />
          </div>
          <div>
            <label>Last Name<span className="text-blue-600">*</span></label>
            <input name="lastName" required />
          </div>
          {/* ... more fields ... */}
        </div>
        <button type="submit" className="bg-[#1E3A8A] hover:bg-[#152e6f] text-white px-6 py-2.5 rounded-lg">
          Add Employee
        </button>
      </form>
    </div>
  )
}
```

---

## API Routes Summary

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET | `/api/employees` | List employees | ✓ |
| POST | `/api/employees` | Create employee | ✓ |
| PATCH | `/api/employees/[id]` | Update employee | ✓ |
| GET | `/api/employees/count` | Employee count | ✓ |
| GET | `/api/applicants/[id]` | List applicants | ✓ |
| PATCH | `/api/applicants/[id]` | Update applicant status | ✓ |
| POST | `/api/applicants/convert` | Convert applicant → employee | ✓ |
| POST | `/api/apply` | Public job application | ✗ |
| POST | `/api/upload` | Upload profile image | ✓ |
| POST | `/api/benefits/enroll` | Bulk benefits enrollment | ✓ |
| POST | `/api/benefits/process` | Process monthly contributions | ✓ |

All API routes use `requireApiAuth()` for protection except `/api/apply` (public job application form).

All database queries use raw SQL via `prisma.$queryRaw` / `prisma.$executeRaw` with parameterized queries (no SQL injection risk).
