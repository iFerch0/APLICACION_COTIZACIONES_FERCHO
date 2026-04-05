"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { FileText, Receipt, LayoutDashboard, Menu, X, Plus, Sun, Moon, FolderOpen, Settings, Users } from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/documentos", label: "Documentos", icon: FolderOpen },
  { href: "/cotizaciones/nueva", label: "Cotización", icon: FileText },
  { href: "/facturas/nueva", label: "Factura", icon: Receipt },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-9 h-9" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border-0)] bg-[var(--surface-1)] hover:border-amber-400/40 hover:bg-amber-400/5 text-[var(--text-1)] hover:text-amber-400 transition-all"
    >
      <Sun
        className={`w-4 h-4 absolute transition-all duration-300 ${
          isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
        }`}
      />
      <Moon
        className={`w-4 h-4 absolute transition-all duration-300 ${
          isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        }`}
      />
    </button>
  );
}

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--border-0)] backdrop-blur-md"
      style={{ backgroundColor: "var(--header-bg)" }}
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-10 h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
            <FileText className="w-4 h-4 text-[oklch(0.090_0.025_255)]" strokeWidth={2.5} />
          </div>
          <span className="text-[var(--text-0)] font-bold text-lg tracking-tight">
            Cotiza<span className="text-amber-400">Pro</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-amber-400/10 text-amber-400"
                    : "text-[var(--text-1)] hover:text-[var(--text-0)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/cotizaciones/nueva"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-400/20"
          >
            <Plus className="w-4 h-4" />
            Nueva Cotización
          </Link>
        </div>

        {/* Mobile actions */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-[var(--text-1)] hover:text-[var(--text-0)] rounded-xl hover:bg-[var(--surface-2)] transition-all"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--border-0)] bg-[var(--surface-1)] px-4 py-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-amber-400/10 text-amber-400"
                    : "text-[var(--text-1)] hover:text-[var(--text-0)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
          <Link
            href="/cotizaciones/nueva"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 w-full mt-2 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] text-sm font-bold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Cotización
          </Link>
        </div>
      )}
    </header>
  );
}
