<p align="center">
  <img src="public/hrkonek-icon.png" alt="HRKonek" width="120" height="120" style="border-radius: 50%; border: 2px solid #1E3A8A;" />
</p>

<h1 align="center">HRKonek</h1>
<p align="center">
  <strong>A modern Human Resource Information System built with Next.js 15</strong>
  <br />
  Employee management · Applicant tracking · Benefits administration · Notifications
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-blue" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748" alt="Prisma 6" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57" alt="SQLite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
</p>

---

## Overview

**HRKonek** is a full-featured Human Resource Information System (HRIS) designed for Philippine-based organizations. It streamlines HR operations with modules for employee record management, applicant tracking, government-mandated benefits administration (SSS, PhilHealth, PAG-IBIG), a public job application portal, and a built-in notification system.

---

## Features

### Dashboard
- Key metrics at a glance (total employees, active/inactive/on-leave counts)
- Employee growth chart (6-month trend via recharts)
- Recent notifications feed
- Quick actions (add employee, manage applicants)

### Employee Management
- Complete employee database with search, filter, and pagination
- Add employees with detailed profile (government IDs, employment type, salary, profile image)
- Employee detail view with full profile information
- Employee status tracking (Active, On Leave, Inactive)
- Archive/restore employees with reason notes

### Applicant Tracking
- View and manage job applicants with search and pagination
- Status workflow: Applied → Under Review → Interview Scheduled → Pending Review → Hired / Rejected
- Approve/reject actions with status updates
- Convert applicants directly to employees
- Archive applicants with reason tracking
- Dedicated archived applicants view

### Benefits Administration
- **SSS** (Social Security System) — contribution table with PDF export
- **PhilHealth** — premium schedules
- **PAG-IBIG Fund** — housing contribution management
- Process monthly contributions per employee
- Bulk enrollment management
- Contribution transaction history

### Notifications
- Real-time in-app notification bell
- Notification read/unread tracking
- Mark all as read functionality
- Clear static notifications

### Public Job Application Portal
- Online application form for job seekers
- Philippine government ID number formatting (SSS, PhilHealth, Pag-IBIG, TIN)
- File upload support (resume, cover letter, documents)
- Client-side validation with real-time feedback

### Authentication & Admin
- Admin login with session-based authentication
- Admin profile page
- Admin settings page
- Secure password hashing

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **Database** | SQLite (via Prisma 6) |
| **Icons** | lucide-react |
| **Charts** | recharts |
| **PDF** | jsPDF + jspdf-autotable |

---

## Requirements

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | 18.17+ (v24.16.0 tested) | [Download](https://nodejs.org) |
| **npm** | Comes with Node.js | Use `npm`, not yarn/pnpm |
| **Operating System** | Windows / macOS / Linux | Fully cross-platform |
| **Database** | None (SQLite built-in) | No external DB server needed |
| **Disk Space** | ~500 MB | node_modules + project files |

---

## Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/Rayven0421/hrkonek.git
cd hrkonek

# 2. Install dependencies
npm install

# 3. Update .env — edit DATABASE_URL to match your absolute project path
#    DATABASE_URL="file:C:/Your/Actual/Path/hrkonek/prisma/dev.db"

# 4. Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# 5. Build the project
npm run build
```

Open [http://localhost:3000](http://localhost:3000) and log in with the admin credentials. If no admin user exists, run the seed endpoint or register via the app.

---

## Running the Project

### Option A — Desktop App (Windows, recommended)

Use the C# WinForms launcher with a WebView2 window (no browser tab needed).

1. **Build** the web app whenever you make changes:
   ```bash
   build.bat
   ```
   Or double-click `build.bat` in File Explorer.

2. **Launch** by double-clicking `HRKonek.exe` in the project root.

The launcher automatically starts `next start` on port 3000 and opens the app in a native window. Close the window to stop the server.

> **Requirements**: .NET 10 Runtime, Node.js, WebView2 Runtime (pre-installed on Windows 11 / recent Windows 10).

### Option B — Command line

```bash
npm run dev        # Development server → http://localhost:3000
npm run build      # Production build
npm start          # Production server
npm run lint       # Run ESLint
```

---

## Project Structure

```
hrkonek/
├── app/
│   ├── page.tsx                           Login page
│   ├── layout.tsx                         Root layout
│   ├── globals.css                        Tailwind globals
│   ├── favicon.ico
│   ├── admin/
│   │   ├── profile/page.tsx               Admin profile
│   │   └── settings/page.tsx              Admin settings
│   ├── applicants/
│   │   ├── page.tsx                       Applicant list
│   │   ├── loading.tsx
│   │   └── archive/page.tsx               Archived applicants
│   ├── apply/page.tsx                     Public job application form
│   ├── benefits/
│   │   ├── page.tsx                       Benefits management
│   │   └── loading.tsx
│   ├── dashboard/
│   │   ├── page.tsx                       Dashboard overview
│   │   └── loading.tsx
│   ├── employees/
│   │   ├── page.tsx                       Employee list
│   │   ├── loading.tsx
│   │   ├── [id]/page.tsx                  Employee detail
│   │   ├── [id]/loading.tsx
│   │   ├── new/page.tsx                   Add employee form
│   │   └── archive/page.tsx               Archived employees
│   ├── api/
│   │   ├── applicants/
│   │   │   ├── route.ts                   GET/POST applicants
│   │   │   ├── [id]/route.ts              PATCH applicant status
│   │   │   ├── [id]/archive/route.ts      Archive/restore applicant
│   │   │   └── convert/route.ts           Convert applicant → employee
│   │   ├── apply/route.ts                 POST job application
│   │   ├── auth/
│   │   │   ├── login/route.ts             POST login
│   │   │   ├── logout/route.ts            POST logout
│   │   │   └── me/route.ts                GET current user
│   │   ├── benefits/
│   │   │   ├── enroll/route.ts            POST bulk enrollment
│   │   │   ├── process/route.ts           POST process contributions
│   │   │   └── transactions/route.ts      GET contribution history
│   │   ├── employees/
│   │   │   ├── route.ts                   GET/POST employees
│   │   │   ├── [id]/route.ts              GET/PATCH/DELETE employee
│   │   │   ├── [id]/archive/route.ts      Archive/restore employee
│   │   │   └── count/route.ts             GET employee count
│   │   ├── notifications/
│   │   │   ├── route.ts                   GET notifications
│   │   │   ├── [id]/route.ts              PATCH notification read
│   │   │   ├── read-all/route.ts          POST mark all read
│   │   │   └── clear-static/route.ts      POST clear static notifications
│   │   ├── seed/route.ts                  POST seed database
│   │   └── upload/route.ts                POST file upload
│   └── generated/prisma/                  Prisma generated client (auto)
├── components/
│   ├── Sidebar.tsx                        Navigation sidebar (desktop + mobile)
│   ├── NavbarUserMenu.tsx                 User dropdown menu
│   ├── NotificationBell.tsx               Notification bell with badge
│   ├── DashboardClient.tsx                Dashboard client component
│   ├── EmployeeTable.tsx                  Employee data table
│   ├── EmployeeDetailClient.tsx           Employee detail view
│   ├── ApplicantTable.tsx                 Applicant data table
│   ├── ApplicantArchiveClient.tsx         Archived applicant list
│   ├── BenefitsClient.tsx                 Benefits client component
│   ├── HireFromApplicantPanel.tsx         Convert applicant to employee
│   ├── GrowthChart.tsx                    Employee growth chart (recharts)
│   └── SearchableSelect.tsx               Searchable dropdown select
├── lib/
│   ├── prisma.ts                          Prisma client singleton
│   ├── auth.ts                            Authentication helpers
│   ├── constants.ts                       App constants & enums
│   ├── notifications.ts                   Notification helpers
│   └── sanitize.ts                        Input sanitization
├── prisma/
│   ├── schema.prisma                      Database schema
│   ├── dev.db                             SQLite database file
│   ├── migrations_init.sql                Initial migration SQL
│   └── migrations/
│       ├── migration_lock.toml
│       └── 202605*/migration.sql          Migration history
├── public/
│   ├── hrkonek-icon.png                   App icon
│   ├── hrkonek-logo-top-sidebar.jpg       Sidebar logo
│   ├── file.svg / globe.svg / next.svg    Static assets
│   └── uploads/                           Uploaded documents & images
├── middleware.ts                          Next.js middleware (auth guard)
├── next.config.ts                         Next.js configuration
├── prisma.config.ts                       Prisma configuration
├── postcss.config.mjs                     PostCSS config
├── tailwind.config.ts                     Tailwind CSS config
├── tsconfig.json                          TypeScript config
└── eslint.config.mjs                      ESLint config
```

---

## Database

**HRKonek** uses SQLite via Prisma ORM with the following models:

| Model | Description |
|---|---|
| **Employee** | Employee records with personal info, government IDs, employment details, archive support |
| **Applicant** | Job applicant records with application status workflow and archive support |
| **ContributionRecord** | SSS/PhilHealth/PAG-IBIG contribution history per employee |
| **Notification** | In-app notifications with read/unread tracking |
| **AdminUser** | Admin accounts with hashed passwords |
| **AdminSession** | Login session tokens |
| **SystemCounter** | Auto-incrementing ID counters |

---

## License

This project is licensed under the MIT License.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  Built with ❤️ for Philippine HR teams
</p>
