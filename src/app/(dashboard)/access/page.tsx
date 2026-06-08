"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  name: string
  description: string | null
  modules: { moduleKey: string }[]
}

interface AllowedEmail {
  id: string
  email: string
  profileId: string
  createdAt: string
  profile: { name: string }
}

interface UserProfile {
  profile: {
    id: string
    name: string
  }
}

interface User {
  id: string
  name: string | null
  email: string
  role: string
  userProfiles: UserProfile[]
}

const MODULES_MAP = [
  { key: "dashboard", label: "🏠 Dashboard", desc: "Painel inicial com indicadores consolidados" },
  { key: "projects", label: "📁 Projetos", desc: "Visualização e gerenciamento de projetos SAP" },
  { key: "backlog", label: "📋 Backlog", desc: "Especificação de itens e escopo funcional/ABAP" },
  { key: "approvals", label: "✅ Aprovações", desc: "Aprovação de escopo técnica e comercial" },
  { key: "systems", label: "🖥️ Sistemas / Ambientes", desc: "Cadastro de arquitetura e ambientes do cliente" },
  { key: "estimates", label: "⏱️ Estimativas", desc: "Cálculo automático de esforços e horas SAP" },
  { key: "proposals", label: "📄 Propostas", desc: "Geração de propostas comerciais e PDFs" },
  { key: "jobseeker", label: "🔍 JobSeeker IA", desc: "Integração de busca de vagas com IA" },
  { key: "settings_partners", label: "🤝 Parceiros", desc: "Cadastros gerais de Clientes e Parceiros" },
  { key: "settings_modules", label: "⚙️ Módulos SAP", desc: "Cadastros de módulos funcionais SAP" },
  { key: "settings_effort", label: "📊 Tabela de Esforço", desc: "Configurações de horas padrão por complexidade" },
  { key: "settings_prices", label: "💰 Tabela de Preços", desc: "Configurações de preços de consultoria e dev" },
  { key: "access", label: "🔐 Gestão de Acessos", desc: "Controle de usuários, e-mails e matriz de acessos (ADM)" },
]

export default function AccessPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"users" | "matrix">("users")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data State
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([])
  const [users, setUsers] = useState<User[]>([])

  // Form State
  const [newEmail, setNewEmail] = useState("")
  const [selectedProfileId, setSelectedProfileId] = useState("")

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/access")
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/dashboard?error=access-denied")
          return
        }
        throw new Error("Falha ao buscar dados de acessos.")
      }
      const data = await res.json()
      setProfiles(data.profiles)
      setAllowedEmails(data.allowedEmails)
      setUsers(data.users)

      // Set default selected profile in form if any exists
      if (data.profiles.length > 0 && !selectedProfileId) {
        // Prefer CONSULTANT or first one
        const consultant = data.profiles.find((p: Profile) => p.name === "CONSULTANT")
        setSelectedProfileId(consultant ? consultant.id : data.profiles[0].id)
      }
    } catch (err: any) {
      setError(err.message || "Erro desconhecido.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || !selectedProfileId) return

    try {
      setActionLoading(true)
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-allowed-email",
          email: newEmail,
          profileId: selectedProfileId,
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        showToast(result.message || "Erro ao autorizar e-mail.", "error")
      } else {
        showToast("E-mail autorizado com sucesso!")
        setNewEmail("")
        // Refresh data
        fetchData()
      }
    } catch {
      showToast("Erro de rede. Tente novamente.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteAllowedEmail = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta autorização? O usuário não conseguirá se cadastrar caso ainda não o tenha feito.")) return

    try {
      setActionLoading(true)
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-allowed-email",
          id,
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        showToast(result.message || "Erro ao remover autorização.", "error")
      } else {
        showToast("Autorização de e-mail removida!")
        fetchData()
      }
    } catch {
      showToast("Erro ao remover. Tente novamente.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, profileId: string) => {
    try {
      setActionLoading(true)
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-user-profile",
          userId,
          profileId,
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        showToast(result.message || "Erro ao atualizar perfil.", "error")
      } else {
        showToast("Perfil do usuário atualizado com sucesso!")
        fetchData()
      }
    } catch {
      showToast("Erro ao atualizar perfil.", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleModule = async (profileId: string, moduleKey: string, isChecked: boolean) => {
    const profile = profiles.find((p) => p.id === profileId)
    if (!profile) return

    // Special safety check: ADM_SIST cannot be edited
    if (profile.name === "ADM_SIST") {
      showToast("O perfil ADM_SIST possui acesso total obrigatório e inalterável.", "error")
      return
    }

    let updatedModules = profile.modules.map((m) => m.moduleKey)

    if (isChecked) {
      if (!updatedModules.includes(moduleKey)) {
        updatedModules.push(moduleKey)
      }
    } else {
      updatedModules = updatedModules.filter((key) => key !== moduleKey)
    }

    try {
      // Optimistic update of local UI state
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id === profileId) {
            return {
              ...p,
              modules: updatedModules.map((key) => ({ moduleKey: key })),
            }
          }
          return p
        })
      )

      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-profile-modules",
          profileId,
          moduleKeys: updatedModules,
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        showToast(result.message || "Erro ao salvar alterações da matriz.", "error")
        // Rollback on error
        fetchData()
      } else {
        showToast(`Acessos do perfil ${profile.name} salvos com sucesso!`)
      }
    } catch {
      showToast("Erro ao salvar matriz. Tente novamente.", "error")
      fetchData()
    }
  }

  if (loading && profiles.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column", gap: "16px" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", borderWidth: "3px" }} />
        <p style={{ color: "var(--color-text-secondary)", fontSize: "15px" }}>Carregando configurações de acesso...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
        <h2 style={{ color: "var(--color-error)", marginBottom: "12px" }}>⚠️ Erro ao Carregar Acessos</h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "20px" }}>{error}</p>
        <button onClick={fetchData} className="btn-primary">Tentar Novamente</button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <style>{`
        .access-header { margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; }
        .access-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
        .access-header p { color: var(--color-text-secondary); font-size: 15px; }

        .tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--color-border); margin-bottom: 32px; }
        .tab-btn {
          padding: 12px 20px;
          color: var(--color-text-secondary);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.15s ease;
        }
        .tab-btn:hover { color: var(--color-text-primary); }
        .tab-btn.active {
          color: #60a5fa;
          border-bottom-color: #3b82f6;
        }

        .matrix-table { width: 100%; border-collapse: collapse; }
        .matrix-checkbox {
          width: 18px;
          height: 18px;
          accent-color: #3b82f6;
          cursor: pointer;
        }
        .matrix-checkbox:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .module-cell { font-weight: 600; color: var(--color-text-primary); }
        .module-cell span { display: block; font-weight: 400; font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
        
        .invite-form-grid { display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: flex-end; }
        @media (max-width: 768px) { .invite-form-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div className="access-header">
        <div>
          <h1>Gestão de Acessos 🔐</h1>
          <p>Gerencie quem tem autorização para usar o Iconsultant Pro e controle dinamicamente as permissões de cada perfil.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          onClick={() => setActiveTab("users")}
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
        >
          👥 Usuários & Convites
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`tab-btn ${activeTab === "matrix" ? "active" : ""}`}
        >
          📊 Matriz de Permissões
        </button>
      </div>

      {/* Dynamic Tab Content */}
      {activeTab === "users" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Card: Authorize New Email */}
          <div className="card">
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>📧 Pré-cadastrar Novo E-mail</h3>
            <form onSubmit={handleAddEmail} className="invite-form-grid">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="input-label">Endereço de E-mail</label>
                <input
                  type="email"
                  className="input"
                  placeholder="exemplo@empresa.com.br"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="input-label">Perfil de Acesso Padrão</label>
                <select
                  className="input"
                  required
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.description || "Sem descrição"}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={actionLoading || !newEmail}
                style={{ padding: "11px 24px" }}
              >
                {actionLoading ? "Processando..." : "Autorizar Acesso →"}
              </button>
            </form>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
            {/* Registered Users */}
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>👥 Usuários Ativos ({users.length})</h3>
              
              {users.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)", fontSize: "14px" }}>
                  Nenhum usuário ativo encontrado.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome / E-mail</th>
                        <th>Perfil Atual</th>
                        <th style={{ width: "160px" }}>Alterar Perfil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const currentProfile = user.userProfiles?.[0]?.profile;
                        return (
                          <tr key={user.id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: "14px" }}>{user.name || "Sem Nome"}</div>
                              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{user.email}</div>
                            </td>
                            <td>
                              <span className={`badge ${
                                currentProfile?.name === "ADM_SIST" ? "badge-red" : 
                                currentProfile?.name === "MANAGER" ? "badge-blue" :
                                currentProfile?.name === "CONSULTANT" ? "badge-green" : "badge-gray"
                              }`}>
                                {currentProfile?.name || "Nenhum"}
                              </span>
                            </td>
                            <td>
                              <select
                                className="input"
                                style={{ padding: "6px 10px", fontSize: "12px" }}
                                value={currentProfile?.id || ""}
                                disabled={actionLoading || user.email === "matheus.penteado.pt@gmail.com"}
                                onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                              >
                                <option value="" disabled>Selecione...</option>
                                {profiles.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pre-authorized Pending Invitations */}
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>✉️ Convites Pendentes ({allowedEmails.filter(e => !users.some(u => u.email === e.email)).length})</h3>
              
              {allowedEmails.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)", fontSize: "14px" }}>
                  Nenhum e-mail pré-cadastrado no momento.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>E-mail</th>
                        <th>Perfil</th>
                        <th style={{ width: "50px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {allowedEmails.map((allowed) => {
                        const isRegistered = users.some((u) => u.email.toLowerCase() === allowed.email.toLowerCase())
                        return (
                          <tr key={allowed.id} style={{ opacity: isRegistered ? 0.45 : 1 }}>
                            <td>
                              <div style={{ fontWeight: 500, fontSize: "13px" }}>{allowed.email}</div>
                              <div style={{ fontSize: "10px", color: isRegistered ? "#10b981" : "var(--color-text-muted)" }}>
                                {isRegistered ? "✓ Registrado" : "Aguardando cadastro..."}
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-gray" style={{ fontSize: "10px" }}>{allowed.profile?.name}</span>
                            </td>
                            <td>
                              {!isRegistered && (
                                <button
                                  onClick={() => handleDeleteAllowedEmail(allowed.id)}
                                  className="btn-ghost"
                                  title="Remover Autorização"
                                  disabled={actionLoading}
                                  style={{ padding: "4px 8px", color: "#f87171" }}
                                >
                                  🗑️
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Tab: Permissions Matrix */
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "4px" }}>📊 Configuração da Matriz de Acessos</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>Defina a quais módulos cada tipo de perfil tem acesso imediato no sistema. As alterações são sincronizadas em tempo real.</p>
            </div>
            {actionLoading && <div className="spinner" style={{ borderTopColor: "#3b82f6" }} />}
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: "260px" }}>Módulo do Sistema</th>
                  {profiles.map((p) => (
                    <th key={p.id} style={{ textAlign: "center" }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES_MAP.map((mod) => (
                  <tr key={mod.key}>
                    <td className="module-cell">
                      {mod.label}
                      <span>{mod.desc}</span>
                    </td>
                    {profiles.map((p) => {
                      const hasAccess = p.name === "ADM_SIST" || p.name === "MANAGER" || p.modules.some((pm) => pm.moduleKey === mod.key)
                      const isAlwaysAllowed = p.name === "ADM_SIST" || p.name === "MANAGER"
                      
                      return (
                        <td key={p.id} style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            className="matrix-checkbox"
                            checked={hasAccess}
                            disabled={isAlwaysAllowed || actionLoading}
                            onChange={(e) => handleToggleModule(p.id, mod.key, e.target.checked)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Action Toast Notification */}
      {toast && (
        <div className="toast" style={{ borderColor: toast.type === "error" ? "rgba(220,38,38,0.4)" : "rgba(16,185,129,0.4)" }}>
          <span style={{ fontSize: "16px" }}>{toast.type === "error" ? "⚠️" : "✅"}</span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
