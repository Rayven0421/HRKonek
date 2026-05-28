-- CreateTable
CREATE TABLE "Employee" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContributionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContributionRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Applicant" (
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
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "ContributionRecord_employeeId_idx" ON "ContributionRecord"("employeeId");

-- CreateIndex
CREATE INDEX "ContributionRecord_month_year_idx" ON "ContributionRecord"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_email_key" ON "Applicant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");

-- CreateIndex
CREATE INDEX "AdminSession_token_idx" ON "AdminSession"("token");

