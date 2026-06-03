import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/faqs", label: "FAQs" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/leads", label: "Leads" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-muted/30 flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <span className="text-sm font-semibold">Admin Panel</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1" aria-label="Admin navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-border">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
