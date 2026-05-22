"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Employees", href: "/employees", icon: "👥" },
    { name: "Benefits", href: "/benefits", icon: "🎗️" },
    { name: "Applicants", href: "/applicants", icon: "📄" },
  ];

  return (
    <aside className="w-[220px] h-screen bg-[#1E3A8A] text-white flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full border border-white flex items-center justify-center font-bold">HR</div>
            <div>
                <div className="font-bold text-lg">HRKonek</div>
                <div className="text-xs text-blue-200">Management Portal</div>
            </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              isActive(link.href) ? "bg-[#152e6f]" : "hover:bg-[#152e6f]"
            }`}
          >
            <span>{link.icon}</span>
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <Link href="/" className="flex items-center gap-3 p-3 hover:bg-[#152e6f] rounded-lg">
          <span>🚪</span> Sign Out
        </Link>
      </div>
    </aside>
  );
}
