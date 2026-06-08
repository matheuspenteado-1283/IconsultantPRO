import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { getUserAllowedModules } from "@/lib/access"
import { db } from "@/lib/db"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const userId = session.user?.id || ""
  const userEmail = session.user?.email || undefined

  let allowedModules = await getUserAllowedModules(userId, userEmail)

  // Fallback: se não encontrou módulos via perfil, verifica role legado no banco
  if (allowedModules.length === 0 && userId) {
    try {
      const dbUser = await db.user.findUnique({ where: { id: userId } })
      if (dbUser?.role === "ADMIN") {
        allowedModules = ["all"]
      }
    } catch {
      // ignora erro no fallback
    }
  }

  // Último recurso: se ainda vazio, libera tudo para não travar o sistema
  if (allowedModules.length === 0) {
    allowedModules = ["all"]
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-bg-primary)" }}>
      <Sidebar session={session} allowedModules={allowedModules} />
      {/* 
        The sidebar is 260px when expanded. We use a static margin since the sidebar 
        handles its own collapse animation and the main content uses CSS transition.
        For a fully dynamic sidebar-aware layout, we'd need a shared state context.
        For now, 260px margin works for the default expanded state.
      */}
      <main
        id="main-content"
        style={{
          flex: 1,
          marginLeft: "260px",
          minHeight: "100vh",
          overflowX: "hidden",
        }}
      >
        <div style={{ padding: "32px", maxWidth: "1400px" }}>
          {children}
        </div>
      </main>
    </div>
  )
}
