"use client"

import { useState, useEffect, useCallback } from "react"

interface AccessLogEntry {
  id: string
  userId: string
  email: string
  path: string
  action: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string }
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  PAGE_VIEW: "Visualização",
  API_CALL: "API",
  FILE_DOWNLOAD: "Download",
  EXPORT: "Exportação",
  TOKEN_CONSUMPTION: "Consumo Token",
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "badge-green",
  LOGOUT: "badge-gray",
  PAGE_VIEW: "badge-blue",
  API_CALL: "badge-purple",
  FILE_DOWNLOAD: "badge-yellow",
  EXPORT: "badge-orange",
  TOKEN_CONSUMPTION: "badge-red",
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AccessLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [actionFilter, setActionFilter] = useState<string>("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "50")
      if (actionFilter) params.set("action", actionFilter)
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)

      const res = await fetch(`/api/admin/logs?${params}`)
      if (res.status === 403) {
        setError("Acesso negado. Apenas administradores podem visualizar logs.")
        return
      }
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      setError("Erro ao carregar logs de acesso.")
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter, startDate, endDate])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const formatDateTime = (d: string) => new Date(d).toLocaleString("pt-BR")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-text-primary)" }}>
          Log de Acessos
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Histórico completo de acessos dos usuários com data, hora e ações realizadas
        </p>
      </div>

      {error && (
        <div className="card" style={{ borderLeft: "4px solid #ef4444", padding: "16px", color: "#f87171", fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: "20px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label className="input-label">Ação</label>
          <select className="input" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1) }} style={{ width: "160px" }}>
            <option value="">Todas</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label">Data Início</label>
          <input type="date" className="input" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} style={{ width: "160px" }} />
        </div>
        <div>
          <label className="input-label">Data Fim</label>
          <input type="date" className="input" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} style={{ width: "160px" }} />
        </div>
        <button className="btn-secondary" onClick={() => { setActionFilter(""); setStartDate(""); setEndDate(""); setPage(1) }} style={{ padding: "8px 16px" }}>
          Limpar Filtros
        </button>
      </div>

      <div className="card" style={{ padding: "16px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
        Total de registros: <strong style={{ color: "var(--color-text-primary)" }}>{total}</strong> | Página {page} de {totalPages}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>
          Carregando logs...
        </div>
      ) : (
        <div className="table-wrapper card" style={{ padding: "16px" }}>
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Caminho</th>
                <th>Ação</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>{formatDateTime(log.createdAt)}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>{log.user.name || "—"}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{log.email}</div>
                  </td>
                  <td style={{ fontSize: "12px", fontFamily: "monospace" }}>{log.path}</td>
                  <td>
                    <span className={`badge ${ACTION_COLORS[log.action] || "badge-gray"}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                    {log.ipAddress || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--color-text-muted)" }}>
              Nenhum log de acesso encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button
            className="btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: "8px 16px" }}
          >
            Anterior
          </button>
          <button
            className="btn-secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ padding: "8px 16px" }}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
