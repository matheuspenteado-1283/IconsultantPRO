"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Session } from "next-auth"

interface NavItem {
  href: string
  icon: string
  label: string
  group?: string
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/projects", icon: "📁", label: "Projetos", group: "Gestão" },
  { href: "/backlog", icon: "📋", label: "Backlog", group: "Gestão" },
  { href: "/approvals", icon: "✅", label: "Aprovações", group: "Gestão" },
  { href: "/systems", icon: "🖥️", label: "Sistemas / Ambientes", group: "Gestão" },
  { href: "/estimates/effort", icon: "⏱️", label: "Est. de Esforço", group: "Financeiro" },
  { href: "/estimates/financial", icon: "💰", label: "Est. Financeira", group: "Financeiro" },
  { href: "/proposals", icon: "📄", label: "Propostas", group: "Financeiro" },
  { href: "/jobseeker", icon: "🔍", label: "JobSeeker IA", group: "IA" },
  { href: "/meetings", icon: "🎙️", label: "Reuniões", group: "IA" },
  { href: "/settings/partners", icon: "🤝", label: "Parceiros", group: "Cadastros" },
  { href: "/settings/modules", icon: "⚙️", label: "Módulos SAP", group: "Cadastros" },
  { href: "/settings/effort", icon: "📊", label: "Tabela de Esforço", group: "Cadastros" },
  { href: "/settings/prices", icon: "💰", label: "Tabela de Preços", group: "Cadastros" },
  { href: "/access", icon: "🔐", label: "Gestão de Acessos", group: "Configurações" },
]

interface SidebarProps {
  session: Session | null
  allowedModules?: string[]
}

function getModuleKeyFromHref(href: string): string {
  if (href === "/dashboard") return "dashboard"
  if (href === "/projects") return "projects"
  if (href === "/backlog") return "backlog"
  if (href === "/approvals") return "approvals"
  if (href === "/systems") return "systems"
  if (href === "/estimates/effort") return "estimates_effort"
  if (href === "/estimates/financial") return "estimates_financial"
  if (href === "/proposals") return "proposals"
  if (href === "/jobseeker") return "jobseeker"
  if (href === "/meetings") return "meetings"
  if (href === "/settings/partners") return "settings_partners"
  if (href === "/settings/modules") return "settings_modules"
  if (href === "/settings/effort") return "settings_effort"
  if (href === "/settings/prices") return "settings_prices"
  if (href === "/access") return "access"
  return ""
}

export function Sidebar({ session, allowedModules }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const userModules = allowedModules || []
  const filteredNavItems = navItems.filter((item) => {
    const key = getModuleKeyFromHref(item.href)
    if (!key) return true
    
    if (userModules.includes("all")) return true
    
    // Check specific or general settings permission
    if (key.startsWith("settings_") && userModules.includes("settings")) {
      return true
    }
    if (key === "estimates_effort" && userModules.includes("estimates")) {
      return true
    }
    
    return userModules.includes(key)
  })

  const groups = filteredNavItems.reduce((acc, item) => {
    const group = item.group || "Principal"
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  const w = collapsed ? 72 : 260

  return (
    <div
      style={{
        width: `${w}px`,
        height: "100vh",
        background: "var(--color-bg-secondary)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 40,
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        overflowX: "hidden",
        overflowY: "hidden",
      }}
    >
      <Link
        href="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "20px 20px",
          borderBottom: "1px solid var(--color-border)",
          minHeight: "72px",
          textDecoration: "none",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <img
          src="/logo_iconsultant_dark.png"
          alt="Iconsultant Pro Logo"
          style={{
            height: "36px",
            maxWidth: "36px",
            objectFit: "contain",
            flexShrink: 0,
          }}
        />
        {!collapsed && (
          <span
            style={{
              fontWeight: 800,
              fontSize: "16px",
              background: "var(--gradient-brand)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              whiteSpace: "nowrap",
            }}
          >
            Iconsultant Pro
          </span>
        )}
      </Link>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "12px 10px",
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          minHeight: 0,
        }}
      >
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            {!collapsed && (
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--color-text-muted)",
                  padding: "12px 8px 4px",
                  marginTop: "4px",
                }}
              >
                {group}
              </div>
            )}
            {collapsed && <div style={{ height: "8px" }} />}
            {items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: collapsed ? "10px 18px" : "10px 12px",
                    borderRadius: "8px",
                    color: isActive ? "#60a5fa" : "var(--color-text-secondary)",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.15s ease",
                    background: isActive ? "rgba(30,64,175,0.15)" : "transparent",
                    border: isActive
                      ? "1px solid rgba(30,64,175,0.25)"
                      : "1px solid transparent",
                    justifyContent: collapsed ? "center" : "flex-start",
                  }}
                >
                  <span style={{ fontSize: "16px", flexShrink: 0, lineHeight: 1 }}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 10px",
          borderTop: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        {/* User info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            marginBottom: "4px",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "var(--gradient-brand)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {session?.user?.name || "Usuário"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                Consultor SAP
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Sair" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: collapsed ? "10px 18px" : "10px 12px",
            borderRadius: "8px",
            color: "var(--color-text-secondary)",
            background: "transparent",
            border: "1px solid transparent",
            cursor: "pointer",
            width: "100%",
            fontSize: "14px",
            fontWeight: 500,
            justifyContent: collapsed ? "center" : "flex-start",
            transition: "all 0.15s ease",
          }}
        >
          <span style={{ fontSize: "16px", flexShrink: 0 }}>🚪</span>
          {!collapsed && <span>Sair</span>}
        </button>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "8px",
            marginTop: "4px",
            borderRadius: "8px",
            color: "var(--color-text-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "18px",
            transition: "all 0.15s ease",
          }}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>
    </div>
  )
}
