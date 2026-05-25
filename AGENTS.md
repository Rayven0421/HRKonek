<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# HRKonek — Agentic AI Coding Rules
## Project Overview
HRKonek is an HR Management System built with:
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4
- **Database**: Prisma 6 + SQLite (local)
- **Icons**: lucide-react (ONLY, no inline SVGs)
- **Charts**: recharts (wrapped in ResponsiveContainer)

---

## Color Scheme

| Token | Hex | Usage |
|---|---|---|
| Primary Navy | `#1E3A8A` | Sidebar, navbar, primary buttons |
| Primary Hover | `#152e6f` | Primary button hover state |
| Primary Light | `#152e6f` | Active nav hover |
| Blue Button | `#3B82F6` | Secondary buttons (Apply, Submit) |
| Blue Hover | `#2563EB` | Secondary button hover |

### Tailwind Color Reference
```
Primary button:     bg-[#1E3A8A] hover:bg-[#152e6f]
Secondary button:   bg-blue-500 hover:bg-blue-600
Approve button:     bg-green-600 hover:bg-green-700
Reject button:      bg-red-600 hover:bg-red-700
Outline button:     border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white
Page background:    bg-gray-50
Card background:    bg-white border border-gray-200 rounded-xl shadow-sm
```

### Status Badge Colors
```
Active:               bg-green-100 text-green-800
On Leave:             bg-orange-100 text-orange-800
Inactive:             bg-red-100 text-red-800
Applied:              bg-gray-100 text-gray-800
Under Review:         bg-yellow-100 text-yellow-800
Interview Scheduled:  bg-blue-100 text-blue-800
Pending Review:       bg-pink-100 text-pink-800
Hired:                bg-green-100 text-green-800
Rejected:             bg-red-100 text-red-800
```

### Text Colors
```
Page titles:          text-gray-900 font-bold
Page subtitles:       text-gray-500 text-sm
Section headings:     text-[#1E3A8A] font-bold
Labels above inputs:  text-gray-700 font-medium text-sm
Input text:           text-gray-900
Placeholder text:     placeholder-gray-400
Helper/hint text:     text-gray-500 text-xs
Error text:           text-red-600 text-xs font-medium
Table headers:        text-gray-500 font-semibold text-xs uppercase tracking-wider
Table cell primary:   text-gray-900 font-medium
Table cell secondary: text-gray-600
```

---

## Icons — lucide-react ONLY

**NEVER use inline SVG paths. ALWAYS use lucide-react.**

```tsx
// ✅ CORRECT
import { Bell, Users, LogOut } from "lucide-react"
<Bell className="w-5 h-5" />

// ❌ WRONG — never do this
<svg><path d="M..." /></svg>
```

### Icon Size Conventions
```
Navbar icons:         w-5 h-5
Button icons:         w-4 h-4
Sidebar nav icons:    w-5 h-5
Stat card icons:      w-6 h-6 (inside w-12 h-12 rounded-xl container)
Table action icons:   w-4 h-4
Large empty state:    w-8 h-8 opacity-40
```

### Icon Mapping for This Project
```
Dashboard nav:        <LayoutDashboard />
Employees nav:        <Users />
Benefits nav:         <Award />
Applicants nav:       <FileText />
Sign out:             <LogOut />
Hamburger menu:       <Menu />
Close drawer:         <X />
Bell/notification:    <Bell />
Admin user avatar:    <UserCircle />
Add/Plus:             <Plus />
Search:               <Search />
Filter:               <Filter />
Clear/remove:         <X />
Back arrow:           <ChevronLeft />
Next arrow:           <ChevronRight />
Upload file:          <Upload />
Document:             <FileText />
Eye (show):           <Eye />
Eye (hide):           <EyeOff />
Approve/check:        <Check />
Trending up:          <TrendingUp />
Clipboard:            <ClipboardList />
Briefcase:            <Briefcase />
```

---

## Layout Rules

### Page Layout Pattern (use on EVERY page)
```tsx
// Root: locks to viewport, no full-page scroll
<div className="flex h-screen overflow-hidden bg-gray-50">
  <Sidebar />  {/* handles mobile drawer internally */}

  <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

    {/* Navbar: never scrolls away */}
    <header className="flex-shrink-0 h-16 bg-[#1E3A8A] flex items-center justify-between px-4 sm:px-8 shadow-md z-10">
      <div className="w-8 lg:hidden" />  {/* spacer for mobile hamburger */}
      <div className="hidden lg:block ...">Management Portal</div>
      {/* right side: bell + user */}
    </header>

    {/* Only this scrolls */}
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      {/* page content */}
    </main>

  </div>
</div>
```

### Sidebar Behavior
- Desktop (`lg+`): permanent, always visible, `hidden lg:flex`
- Mobile: hamburger button (top-left fixed) opens a slide-in drawer
- Hamburger button: `fixed top-4 left-4 z-40 bg-[#1E3A8A]`
- Drawer: `fixed left-0 top-0 z-50 w-[240px]` with `translate-x` transition
- Active nav item: `bg-white/20 text-white font-semibold`
- Inactive nav item: `text-white/75 hover:bg-white/10`

### Responsive Breakpoints
```
Mobile first. Always add sm:, lg: variants.
- Padding:     p-4 sm:p-6 lg:p-8
- Grid cols:   grid-cols-1 sm:grid-cols-3
- Text sizes:  text-xl sm:text-2xl
- Hide on sm:  hidden sm:block
- Hide on lg:  hidden lg:block / lg:hidden
```

---

## Input & Form Styling

```tsx
// Standard input
<input className="w-full px-3 py-2.5 border border-gray-300 rounded-lg 
  text-gray-900 placeholder-gray-400 text-sm bg-white
  focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 
  focus:border-[#1E3A8A] transition-all" />

// Standard label
<label className="block text-sm font-medium text-gray-700 mb-1">
  Field Name<span className="text-blue-600">*</span>
</label>

// Search input (with icon)
<div className="relative flex-1">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 
    w-4 h-4 text-gray-400 pointer-events-none" />
  <input className="w-full pl-9 pr-9 ..." />
  {/* X clear button when has text */}
  {searchTerm && (
    <button onClick={clearSearch} 
      className="absolute right-3 top-1/2 -translate-y-1/2 
        text-gray-400 hover:text-gray-600">
      <X className="w-4 h-4" />
    </button>
  )}
</div>
```

---

## Card / Container Styling

```tsx
// Standard white card
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">

// Table wrapper card
<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

// Stat card
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 
  flex items-center justify-between">
```

---

## Database (Prisma)

- **Client path**: `import { prisma } from '@/lib/prisma'`
- **SQLite file**: `prisma/dev.db`
- **DATABASE_URL**: `file:C:/Users/rayve/Desktop/HRKonek/hrkonek/prisma/dev.db`
- Add `export const dynamic = 'force-dynamic'` to EVERY page that uses Prisma
- Never create `new PrismaClient()` directly in pages — always import from `@/lib/prisma`

### Models
```
Employee:  id, firstName, lastName, email, phone, department, 
           role, status, hireDate, salary, address, employeeId, 
           createdAt, updatedAt

Applicant: id, firstName, lastName, email, phone, address,
           position, expectedSalary, yearsOfExperience,
           sssNumber, pagibigNumber, philhealthNumber, tinNumber,
           resumeUrl, coverLetterUrl, otherDocsUrl,
           status, appliedAt, createdAt, updatedAt
```

### Employee Status Values
`"Active"` | `"On Leave"` | `"Inactive"`

### Applicant Status Values
`"Applied"` | `"Under Review"` | `"Interview Scheduled"` | 
`"Pending Review"` | `"Hired"` | `"Rejected"`

---

## Charts (recharts)

Always wrap in `ResponsiveContainer` with a fixed-height parent:

```tsx
// Parent div must have explicit height
<div className="w-full h-52 sm:h-56">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <XAxis dataKey="month" />
      <YAxis />
      <Bar dataKey="count" fill="#1E3A8A" radius={[4,4,0,0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
```

---

## File Structure

```
hrkonek/
├── app/
│   ├── page.tsx                    ← Login
│   ├── layout.tsx                  ← Root layout
│   ├── globals.css                 ← Tailwind globals
│   ├── generated/prisma/           ← Prisma generated client (auto)
│   ├── dashboard/page.tsx          ← Dashboard
│   ├── employees/
│   │   ├── page.tsx                ← Employee list
│   │   ├── new/page.tsx            ← Add employee form
│   │   └── [id]/page.tsx           ← Employee detail
│   ├── applicants/page.tsx         ← Applicant list
│   ├── benefits/page.tsx           ← Benefits
│   ├── apply/page.tsx              ← Public job application form
│   └── api/
│       ├── employees/
│       │   ├── route.ts            ← GET/POST employees
│       │   ├── [id]/route.ts       ← GET/PATCH/DELETE employee
│       │   └── count/route.ts      ← GET employee count
│       ├── applicants/
│       │   ├── [id]/route.ts       ← PATCH applicant status
│       │   └── convert/route.ts    ← Convert applicant → employee
│       ├── apply/route.ts          ← POST job application
│       └── upload/route.ts         ← POST file upload
├── components/
│   ├── Sidebar.tsx                 ← Shared sidebar + mobile drawer
│   ├── EmployeeTable.tsx           ← Client component with search/pagination
│   ├── EmployeeDetailClient.tsx    ← Client component for employee detail
│   ├── ApplicantTable.tsx          ← Client component with approve/reject
│   ├── HireFromApplicantPanel.tsx  ← Panel to hire applicant as employee
│   └── GrowthChart.tsx             ← recharts bar chart
├── lib/
│   └── prisma.ts                   ← Prisma singleton
└── prisma/
    ├── schema.prisma
    ├── prisma.config.ts
    └── dev.db
```

---

## Component Rules

### Server vs Client Components
```
Server (no "use client"):   page.tsx files that fetch from Prisma
Client ("use client"):      EmployeeTable, ApplicantTable, Sidebar,
                            any component with useState/useEffect
```

### Empty States (tables/lists)
- Never return early with a full-page empty state
- Empty state must be a `<tr><td colSpan={n}>` inside the table body
- Always keep search bar visible above the empty state
- Include a "Clear search" button when search term is active

### Pagination
- 10 items per page default
- Show `Showing X–Y of Z items` text
- Hide pagination entirely when results = 0
- Reset to page 1 when search term changes

---

## Naming Conventions

```
Pages:       lowercase with hyphens  (employees/new, apply)
Components:  PascalCase              (EmployeeTable, Sidebar)
API routes:  lowercase               (api/employees, api/apply)
Variables:   camelCase               (totalEmployees, searchTerm)
DB models:   PascalCase              (Employee, Applicant)
```

---

## Do's and Don'ts

### ✅ Always Do
- Use `lucide-react` for all icons
- Use `export const dynamic = 'force-dynamic'` on DB pages
- Import Prisma from `@/lib/prisma` never instantiate directly
- Use `h-screen overflow-hidden` on root, `overflow-y-auto` on main
- Add `flex-shrink-0` to navbar so it never scrolls away
- Add `w-8 lg:hidden` spacer in navbar for mobile hamburger
- Use responsive padding: `p-4 sm:p-6 lg:p-8`

### ❌ Never Do
- Never use inline SVG paths for icons
- Never use `min-h-screen` on page root (causes sidebar cut-off)
- Never create `new PrismaClient()` outside `lib/prisma.ts`
- Never hardcode mock/fake data — use real DB queries
- Never use `position: fixed` inside scrollable containers
- Never use `@prisma/client` import — use `@/app/generated/prisma/client`

<!-- END:nextjs-agent-rules -->

