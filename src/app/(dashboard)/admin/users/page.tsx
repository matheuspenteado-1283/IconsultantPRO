"use client"

import { useState, useEffect, useCallback } from "react"

interface UserData {
  id: string
  name: string | null
  email: string
  role: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  organizationId: string | null
  userProfiles: Array<{ profile: { id: string; name: string } }>
  agentTokens: Array<{
    id: string
    tokenType: string
    totalAllocated: number
    consumed: number
    autoRenew: boolean
    lastRenewedAt: string | null
  }>
  _count: { accessLogs: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      if (res.status === 403) {
        setToast({ type: "error", message: "Acesso negado. Apenas administradores podem gerenciar usuários." })
        setUsers([])
        return
      }
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      setToast({ type: "error", message: "Erro ao carregar usuários." })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleToggleEnabled = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-enabled", userId }),
      })
      const data = await res.json()
      setToast({ type: res.ok ? "success" : "error", message: data.message })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, enabled: !u.enabled } : u))
        )
      }
    } catch {
      setToast({ type: "error", message: "Erro ao alterar status do usuário." })
    } finally {
      setActionLoading(null)
    }
  }

  const handleEnsureTokens = async (userId: string) => {
    setActionLoading(userId)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ensure-tokens", userId }),
      })
      const data = await res.json()
      setToast({ type: res.ok ? "success" : "error", message: data.message })
      if (res.ok) fetchUsers()
    } catch {
      setToast({ type: "error", message: "Erro ao criar tokens." })
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR")
  const formatDateTime = (d: string) => new Date(d).toLocaleString("pt-BR")

  const tokenColors: Record<string, string> = {
    CLAUDE: "#a855f7",
    WHISPER: "#06b6d4",
    VEXA: "#f59e0b",
    EMAIL: "#10b981",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)" }}>
          Controle de Usuários
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Gerencie usuários habilitados, tokens de agentes e visualize acessos
        </p>
      </div>

      {toast && (
        <div
          className="card animate-fade-in"
          style={{
            borderLeft: `4px solid ${toast.type === "success" ? "#10b981" : "#ef4444"}`,
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: 600,
            color: toast.type === "success" ? "#34d399" : "#f87171",
            background: "rgba(30,41,59,0.6)",
          }}
          onClick={() => setToast(null)}
        >
          {toast.message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>
          Carregando usuários...
        </div>
      ) : (
        <div className="table-wrapper card" style={{ padding: "24px" }}>
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Tokens</th>
                <th>Acessos</th>
                <th>Criado em</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ opacity: user.enabled ? 1 : 0.5 }}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{user.name || "—"}</div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{user.email}</div>
                  </td>
                  <td>
                    {user.userProfiles.map((up) => (
                      <span
                        key={up.profile.id}
                        className="badge badge-blue"
                        style={{ display: "inline-block", marginRight: "4px" }}
                      >
                        {up.profile.name}
                      </span>
                    )) || <span className="badge badge-gray">—</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {user.agentTokens.length > 0 ? (
                        user.agentTokens.map((t) => {
                          const remaining = t.totalAllocated - t.consumed
                          const pct = t.totalAllocated > 0 ? Math.round((remaining / t.totalAllocated) * 100) : 0
                          return (
                            <span
                              key={t.id}
                              title={`${t.tokenType}: ${remaining}/${t.totalAllocated} disponíveis`}
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 600,
                                background: tokenColors[t.tokenType] || "#64748b",
                                color: "#fff",
                              }}
                            >
                              {t.tokenType} {pct}%
                            </span>
                          )
                        })
                      ) : (
                        <span className="badge badge-gray">Sem tokens</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue">{user._count.accessLogs}</span>
                  </td>
                  <td style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td>
                    <span
                      className={`badge ${user.enabled ? "badge-green" : "badge-red"}`}
                    >
                      {user.enabled ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleToggleEnabled(user.id)}
                        className={user.enabled ? "btn-secondary" : "btn-primary"}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          background: user.enabled ? "rgba(239,68,68,0.15)" : undefined,
                          borderColor: user.enabled ? "rgba(239,68,68,0.3)" : undefined,
                          color: user.enabled ? "#f87171" : undefined,
                        }}
                        disabled={actionLoading === user.id}
                      >
                        {user.enabled ? "Desabilitar" : "Habilitar"}
                      </button>
                      {user.agentTokens.length === 0 && (
                        <button
                          onClick={() => handleEnsureTokens(user.id)}
                          className="btn-secondary"
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                          disabled={actionLoading === user.id}
                        >
                          Criar Tokens
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
          Informações do Módulo
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
          <div>
            <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>Usuários Habilitados</div>
            <div>{users.filter((u) => u.enabled).length} de {users.length}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>Total de Tokens Alocados</div>
            <div>{users.reduce((sum, u) => sum + u.agentTokens.reduce((s, t) => s + t.totalAllocated, 0), 0)}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>Total de Acessos Registrados</div>
            <div>{users.reduce((sum, u) => sum + u._count.accessLogs, 0)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
