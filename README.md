<p align="center">
  <img src="public/hrkonek-icon.png" alt="HRKonek" width="120" height="120" style="border-radius: 50%; border: 2px solid #1E3A8A;" />
</p>

<h1 align="center">HRKonek</h1>
<p align="center">
  <strong>A modern Human Resource Information System built with Next.js</strong>
  <br />
  Employee management · Applicant tracking · Benefits administration
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748" alt="Prisma 6" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57" alt="SQLite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
</p>

---

## Overview

**HRKonek** is a full-featured Human Resource Information System (HRIS) designed for Philippine-based organizations. It streamlines HR operations with modules for employee record management, applicant tracking, government-mandated benefits administration (SSS, PhilHealth, PAG-IBIG), and a public job application portal.

---

## Features

### Dashboard
- Key metrics at a glance (total employees, pending tasks, benefit summaries)
- Employee growth chart (6-month trend)
- Recent activity feed
- Quick actions (add employee, generate report, export data)

### Employee Management
- Complete employee database with search and pagination
- Add employees with detailed profile (government IDs, employment type, salary)
- Employee detail view with full profile information
- Employee status tracking (Active, On Leave, Inactive)

### Applicant Tracking
- View and manage job applicants
- Status workflow: Applied → Under Review → Interview Scheduled → Pending Review → Hired / Rejected
- Approve/reject actions with status updates
- Convert applicants directly to employees

### Benefits Administration
- **SSS** (Social Security System) — contribution table, enrollment tracking
- **PhilHealth** — premium schedules and enrollment
- **PAG-IBIG Fund** — housing contribution management
- Contribution table viewer with CSV export
- Process monthly contributions
- Bulk enrollment management
- Adjustable benefit rates

### Public Job Application Portal
- Online application form for job seekers
- Philippine government ID number formatting (SSS, PhilHealth, Pag-IBIG, TIN)
- File upload support (resume, cover letter, documents)
- Client-side validation with real-time feedback

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

---

## Prerequisites

- **Node.js** 18.17 or later
- **npm** (comes with Node.js)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Rayven0421/hrkonek.git
cd hrkonek
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

The project includes a `.env` file configured for local SQLite. Ensure it contains:

```env
DATABASE_URL="file:C:/path/to/your/project/prisma/dev.db"
```

Adjust the path to match your absolute project location.

### 4. Generate the Prisma client and push the schema

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Login

Click **Login to HR Portal** on the login page to access the dashboard (authentication is a placeholder).

---

## Build & Production

```bash
npm run build
npm start
```

---

## Project Structure

```
hrkonek/
├── app/
│   ├── page.tsx                       Login page
│   ├── layout.tsx                     Root layout
│   ├── globals.css                    Tailwind globals
│   ├── dashboard/page.tsx             Dashboard overview
│   ├── employees/
│   │   ├── page.tsx                   Employee list
│   │   ├── new/page.tsx               Add employee form
│   │   └── [id]/page.tsx              Employee detail
│   ├── applicants/page.tsx            Applicant list
│   ├── benefits/page.tsx              Benefits management
│   ├── apply/page.tsx                 Public job application
│   └── api/
│       ├── employees/                 Employee CRUD API
│       ├── applicants/                Applicant status API
│       ├── benefits/
│       │   ├── enroll/                Bulk enrollment
│       │   └── process/               Process contributions
│       ├── apply/                     Job application submission
│       └── upload/                    File upload handler
├── components/
│   ├── Sidebar.tsx                    Navigation sidebar (desktop + mobile)
│   ├── DashboardClient.tsx            Dashboard client component
│   ├── EmployeeTable.tsx              Employee data table
│   ├── EmployeeDetailClient.tsx       Employee detail view
│   ├── BenefitsClient.tsx             Benefits client component
│   ├── ApplicantTable.tsx             Applicant data table
│   ├── HireFromApplicantPanel.tsx     Convert applicant to employee
│   └── GrowthChart.tsx                Employee growth chart
├── lib/
│   └── prisma.ts                      Prisma client singleton
├── prisma/
│   ├── schema.prisma                  Database schema
│   └── dev.db                         SQLite database file
└── public/uploads/                    Uploaded documents
```

---

## Database

**HRKonek** uses SQLite via Prisma ORM.

### Key Models

| Model | Description |
|---|---|
| **Employee** | Employee records with personal info, employment details, government IDs |
| **Applicant** | Job applicant records with application status workflow |

### Seed Data

The database ships with sample data. You can reset it at any time:

```bash
npx prisma db push --force-reset
```

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

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
