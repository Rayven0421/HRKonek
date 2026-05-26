# SQL Queries Used in HRKonek

> All queries are executed through **Prisma ORM** (no raw SQL).  
> Prisma translates these into SQLite-compatible SQL statements at runtime.

---

## 1. `app/dashboard/page.tsx`

**Line 7** — `prisma.employee.count()`
```sql
SELECT COUNT(*) FROM Employee
```

**Line 9** — `prisma.applicant.count({ where: { status: "Applied" } })`
```sql
SELECT COUNT(*) FROM Applicant WHERE status = 'Applied'
```

**Line 13** — `prisma.employee.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })`
```sql
SELECT * FROM Employee ORDER BY createdAt DESC LIMIT 5
```

**Line 18** — `prisma.employee.findMany({ select: { ...fields }, orderBy: { createdAt: 'asc' } })`
```sql
SELECT id, firstName, lastName, department, role, status, createdAt, salary
FROM Employee ORDER BY createdAt ASC
```

**Line 27** — `prisma.applicant.findMany({ select: { ...fields }, orderBy: { appliedAt: 'desc' } })`
```sql
SELECT id, firstName, lastName, position, status, appliedAt
FROM Applicant ORDER BY appliedAt DESC
```

---

## 2. `app/employees/page.tsx`

**Line 10** — `prisma.employee.findMany({ orderBy: { createdAt: 'desc' } })`
```sql
SELECT * FROM Employee ORDER BY createdAt DESC
```

---

## 3. `app/employees/[id]/page.tsx`

**Line 13** — `prisma.employee.findUnique({ where: { id } })`
```sql
SELECT * FROM Employee WHERE id = '<id>' LIMIT 1
```

**Line 18** — `prisma.contributionRecord.findMany({ where: { employeeId: id }, select: { month, year, type } })`
```sql
SELECT month, year, type FROM ContributionRecord WHERE employeeId = '<id>'
```

---

## 4. `app/applicants/page.tsx`

**Line 10** — `prisma.applicant.findMany({ orderBy: { appliedAt: 'asc' } })`
```sql
SELECT * FROM Applicant ORDER BY appliedAt ASC
```

---

## 5. `app/benefits/page.tsx`

**Line 46** — `prisma.employee.findMany({ select: { ...fields } })`
```sql
SELECT id, firstName, lastName, salary, status, sssNumber, philhealthNumber,
       pagibigNumber, hireDate, createdAt FROM Employee
```

**Line 86** — `prisma.employee.findMany({ select: { ...fields }, orderBy: { hireDate: 'desc' }, take: 8 })`
```sql
SELECT id, firstName, lastName, salary, sssNumber, philhealthNumber,
       pagibigNumber, hireDate, createdAt
FROM Employee ORDER BY hireDate DESC LIMIT 8
```

**Line 103** — `prisma.contributionRecord.findMany({ where: { employeeId: { in: recentIds } }, select: { employeeId, type } })`
```sql
SELECT employeeId, type FROM ContributionRecord WHERE employeeId IN ('<id1>', '<id2>', ...)
```

---

## 6. `app/api/employees/route.ts`

**Line 37** — `prisma.employee.findUnique({ where: { email } })`
```sql
SELECT * FROM Employee WHERE email = '<email>' LIMIT 1
```

**Line 44** — `prisma.employee.findMany({ select: { employeeId: true }, orderBy: { employeeId: 'desc' } })`
```sql
SELECT employeeId FROM Employee ORDER BY employeeId DESC
```

**Line 62** — `prisma.employee.create({ data: { ... } })`
```sql
INSERT INTO Employee (firstName, lastName, email, phone, address, employeeId,
                      department, role, status, salary, hireDate)
VALUES ('<fn>', '<ln>', '<email>', '<phone>', '<addr>', '<empId>',
        '<dept>', '<role>', '<status>', <salary>, '<hireDate>')
```

---

## 7. `app/api/employees/[id]/route.ts`

**Line 11** — `prisma.employee.update({ where: { id }, data: { ... } })`
```sql
UPDATE Employee SET ... WHERE id = '<id>'
```

---

## 8. `app/api/employees/count/route.ts`

**Line 6** — `prisma.employee.count()`
```sql
SELECT COUNT(*) FROM Employee
```

---

## 9. `app/api/applicants/[id]/route.ts`

**Line 12** — `prisma.applicant.update({ where: { id }, data: { status } })`
```sql
UPDATE Applicant SET status = '<newStatus>' WHERE id = '<id>'
```

---

## 10. `app/api/applicants/convert/route.ts`

**Line 8** — `prisma.employee.create({ data: { ... } })`
```sql
INSERT INTO Employee (firstName, lastName, email, phone, role, department,
                      status, hireDate, salary, sssNumber, philhealthNumber,
                      pagibigNumber, tinNumber, employmentType)
VALUES ('<fn>', '<ln>', '<email>', '<phone>', '<role>', '<dept>',
        'Active', '<hireDate>', <salary>, '<sss>', '<ph>', '<pi>', '<tin>', '<type>')
```

**Line 27** — `prisma.applicant.update({ where: { id: applicantId }, data: { status: 'Hired', convertedEmployeeId } })`
```sql
UPDATE Applicant SET status = 'Hired', convertedEmployeeId = '<empId>' WHERE id = '<applicantId>'
```

---

## 11. `app/api/benefits/enroll/route.ts`

**Line 16** — `prisma.employee.findMany({ select: { id, sssNumber, philhealthNumber, pagibigNumber } })`
```sql
SELECT id, sssNumber, philhealthNumber, pagibigNumber FROM Employee
```

**Line 54** — `prisma.employee.update({ where: { id: emp.id }, data: updateData })` (in loop)
```sql
UPDATE Employee SET sssNumber = '<val>', philhealthNumber = '<val>', pagibigNumber = '<val>'
WHERE id = '<empId>'
```

---

## 12. `app/api/benefits/process/route.ts`

**Line 22** — `prisma.employee.findMany({ select: { ...fields }, where: { status: 'Active' } })`
```sql
SELECT id, sssNumber, philhealthNumber, pagibigNumber FROM Employee WHERE status = 'Active'
```

**Line 47** — `prisma.contributionRecord.createMany({ data: records })`
```sql
INSERT INTO ContributionRecord (employeeId, type, month, year)
VALUES ('<id1>', '<type1>', '<month>', '<year>'),
       ('<id2>', '<type2>', '<month>', '<year>'),
       ...
```

---

## 13. `app/api/apply/route.ts`

**Line 20** — `prisma.applicant.create({ data: { ... } })`
```sql
INSERT INTO Applicant (firstName, lastName, email, phone, address, position,
                       expectedSalary, yearsOfExperience, sssNumber, pagibigNumber,
                       philhealthNumber, tinNumber, resumeUrl, coverLetterUrl, otherDocsUrl)
VALUES ('<fn>', '<ln>', '<email>', '<phone>', '<addr>', '<pos>',
        '<salary>', '<yrs>', '<sss>', '<pi>', '<ph>', '<tin>',
        '<resume>', '<cover>', '<other>')
```

---

## Summary

| Prisma Method | Count |
|---|---|
| `findMany` | 12 |
| `findUnique` | 2 |
| `count` | 3 |
| `create` | 3 |
| `createMany` | 1 |
| `update` | 4 |
| **Total** | **25** |

**Source:** 13 files across `app/` and `app/api/` directories.  
**Raw SQL:** None — all queries use Prisma's query builder (no `$queryRaw`/`$executeRaw`).
