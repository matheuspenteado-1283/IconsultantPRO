"use client"

import { useState, useEffect, useCallback } from "react"

interface TokenData {
  id: string
  userId: string
  organizationId: string
  tokenType: string
  totalAllocated: number
  consumed: number
  autoRenew: boolean
  lastRenewedAt: string | null
  expiresAt: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string }
  renewalRequests: Array<{
    id: string
    requestedAt: string
    amount: number
    status: string
    notes: string | null
  }>
}

const TOKEN_LABELS: Record<string, string> = {
  CLAUDE: "Claude (Anthropic)",
  WHISPER: "Whisper (OpenAI)",
  VEXA: "Vexa Meeting Bot",
  EMAIL: "E-mail (Resend)",
}

const TOKEN_COLORS: Record<string, string> = {
  CLAUDE: "#a855f7",
  WHISPER: "#06b6d4",
  VEXA: "#f59e0b",
  EMAIL: "#10b981",
}

export default function AdminTokensPage() {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [editingToken, setEditingToken] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchTokens = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/tokens")
      if (res.status === 403) {
        setError("Acesso negado. Apenas administradores podem gerenciar tokens.")
        return
      }
      const data = await res.json()
      setTokens(data.tokens || [])
    } catch {
      setError("Erro ao carregar tokens.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  const handleUpdateAllocation = async (tokenId: string) => {
    setActionLoading(tokenId)
    try {
      const res = await fetch("/api/admin/tokens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-allocation", tokenId, totalAllocated: editValue }),
      })
      const data = await res.json()
      setToast({ type: res.ok ? "success" : "error", message: data.message })
      if (res.ok) {
        setEditingToken(null)
        fetchTokens()
      }
    } catch {
      setToast({ type: "error", message: "Erro ao atualizar alocação." })
    } finally {
      setActionLoading(null)
    }
  }

  const handleResolveRequest = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(requestId)
    try {
      const res = await fetch("/api/admin/tokens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve-request", requestId, status }),
      })
      const data = await res.json()
      setToast({ type: res.ok ? "success" : "error", message: data.message })
      if (res.ok) fetchTokens()
    } catch {
      setToast({ type: "error", message: "Erro ao resolver solicitação." })
    } finally {
      setActionLoading(null)
    }
  }

  const formatDateTime = (d: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "—")

  const pendingRequests = tokens.flatMap((t) => t.renewalRequests.map((r) => ({ ...r, token: t })))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)" }}>
          Controle de Tokens de Agentes
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Gerencie alocação de tokens para agentes de IA, renovações e consumo
        </p>
      </div>

      {error && (
        <div className="card" style={{ borderLeft: "4px solid #ef4444", padding: "16px", color: "#f87171", fontWeight: 600 }}>
          {error}
        </div>
      )}

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

      {pendingRequests.length > 0 && (
        <div className="card" style={{ borderLeft: "4px solid #f59e0b", padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "16px", color: "#fbbf24" }}>
            Solicitações de Renovação Pendentes ({pendingRequests.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  background: "rgba(245,158,11,0.05)",
                  border: "1px solid rgba(245,158,11,0.15)",
                  borderRadius: "8px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>
                    {req.token.user.name || req.token.user.email} — {TOKEN_LABELS[req.token.tokenType] || req.token.tokenType}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    Solicita +{req.amount} tokens | {formatDateTime(req.requestedAt)}
                    {req.notes && <> — Nota: {req.notes}</>}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                    Saldo atual: {req.token.totalAllocated - req.token.consumed} de {req.token.totalAllocated}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleResolveRequest(req.id, "APPROVED")}
                    className="btn-primary"
                    style={{ padding: "8px 16px", fontSize: "12px", background: "#059669" }}
                    disabled={actionLoading === req.id}
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleResolveRequest(req.id, "REJECTED")}
                    className="btn-secondary"
                    style={{ padding: "8px 16px", fontSize: "12px", color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                    disabled={actionLoading === req.id}
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>
          Carregando tokens...
        </div>
      ) : (
        <div className="table-wrapper card" style={{ padding: "20px" }}>
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Tipo</th>
                <th>Alocado</th>
                <th>Consumido</th>
                <th>Disponível</th>
                <th>%</th>
                <th>Última Renovação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => {
                const remaining = token.totalAllocated - token.consumed
                const pct = token.totalAllocated > 0 ? Math.round((remaining / token.totalAllocated) * 100) : 0
                return (
                  <tr key={token.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>{token.user.name || "—"}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{token.user.email}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: TOKEN_COLORS[token.tokenType] || "#64748b",
                          color: "#fff",
                        }}
                      >
                        {token.tokenType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{token.totalAllocated}</td>
                    <td style={{ color: "#f87171" }}>{token.consumed}</td>
                    <td style={{ fontWeight: 700, color: pct > 20 ? "#34d399" : "#f87171" }}>{remaining}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden", minWidth: "60px" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pct > 20 ? "#10b981" : "#ef4444", borderRadius: "3px" }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {formatDateTime(token.lastRenewedAt)}
                    </td>
                    <td>
                      {editingToken === token.id ? (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input
                            type="number"
                            className="input"
                            value={editValue}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            style={{ width: "80px", padding: "4px 8px", fontSize: "12px" }}
                            min={0}
                          />
                          <button
                            onClick={() => handleUpdateAllocation(token.id)}
                            className="btn-primary"
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                            disabled={actionLoading === token.id}
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingToken(null)}
                            className="btn-secondary"
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingToken(token.id); setEditValue(token.totalAllocated) }}
                          className="btn-secondary"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                        >
                          Ajustar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {tokens.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>
              Nenhum token configurado. Use o painel de Usuários para criar tokens iniciais.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
