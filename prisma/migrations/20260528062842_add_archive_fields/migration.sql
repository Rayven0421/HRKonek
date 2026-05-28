-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Applicant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "position" TEXT NOT NULL,
    "expectedSalary" TEXT,
    "yearsOfExperience" TEXT,
    "sssNumber" TEXT,
    "pagibigNumber" TEXT,
    "philhealthNumber" TEXT,
    "tinNumber" TEXT,
    "resumeUrl" TEXT,
    "coverLetterUrl" TEXT,
    "otherDocsUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Applied',
    "convertedEmployeeId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Applicant" ("address", "appliedAt", "convertedEmployeeId", "coverLetterUrl", "createdAt", "email", "expectedSalary", "firstName", "id", "lastName", "otherDocsUrl", "pagibigNumber", "philhealthNumber", "phone", "position", "resumeUrl", "sssNumber", "status", "tinNumber", "updatedAt", "yearsOfExperience") SELECT "address", "appliedAt", "convertedEmployeeId", "coverLetterUrl", "createdAt", "email", "expectedSalary", "firstName", "id", "lastName", "otherDocsUrl", "pagibigNumber", "philhealthNumber", "phone", "position", "resumeUrl", "sssNumber", "status", "tinNumber", "updatedAt", "yearsOfExperience" FROM "Applicant";
DROP TABLE "Applicant";
ALTER TABLE "new_Applicant" RENAME TO "Applicant";
CREATE UNIQUE INDEX "Applicant_email_key" ON "Applicant"("email");
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "dateOfBirth" DATETIME,
    "tinNumber" TEXT,
    "sssNumber" TEXT,
    "philhealthNumber" TEXT,
    "pagibigNumber" TEXT,
    "department" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "employmentType" TEXT DEFAULT 'Regular',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "salary" REAL,
    "hireDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileImage" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Employee" ("address", "createdAt", "dateOfBirth", "department", "email", "employeeId", "employmentType", "firstName", "hireDate", "id", "lastName", "pagibigNumber", "philhealthNumber", "phone", "profileImage", "role", "salary", "sssNumber", "status", "tinNumber", "updatedAt") SELECT "address", "createdAt", "dateOfBirth", "department", "email", "employeeId", "employmentType", "firstName", "hireDate", "id", "lastName", "pagibigNumber", "philhealthNumber", "phone", "profileImage", "role", "salary", "sssNumber", "status", "tinNumber", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
