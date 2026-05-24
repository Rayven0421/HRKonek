"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Users, Award, FileText, LogOut, Menu, X } from "lucide-react";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: "Employees", href: "/employees", icon: <Users className="w-5 h-5" /> },
  { name: "Benefits", href: "/benefits", icon: <Award className="w-5 h-5" /> },
  { name: "Applicants", href: "/applicants", icon: <FileText className="w-5 h-5" /> },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex flex-col h-full bg-[#1E3A8A] text-white">
      {/* Brand */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-white/60 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
            HR
          </div>
          <div>
            <div className="font-bold text-base text-white leading-tight">HRKonek</div>
            <div className="text-white/60 text-xs">Management Portal</div>
          </div>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-white/70 hover:text-white p-1 rounded transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2 space-y-1">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
              isActive(link.href)
                ? "bg-white/20 text-white"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            {link.icon}
            {link.name}
          </Link>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-white/10">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Link>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar: always visible on lg+ ── */}
      <aside className="hidden lg:flex lg:flex-col w-[220px] h-screen flex-shrink-0 sticky top-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile: hamburger button in top-left ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-[#1E3A8A] text-white p-2 rounded-lg shadow-lg print:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile: backdrop ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: drawer slides in from left ── */}
      <div
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-[240px] transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </div>
    </>
  );
}