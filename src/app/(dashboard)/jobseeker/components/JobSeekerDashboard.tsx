"use client"

import { useState, useEffect } from "react"
import { searchJobsAI, generateFitAnalysis, generateApplicationMaterials, refreshJobs } from "../actions"

interface Contact {
  name: string
  role: string
  email: string
  linkedin: string
}

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  rate: string
  description: string
  fullDescription?: string
  url?: string
  contacts?: Contact[]
  modules: string[]
  source: string
  matchScore: number
}

interface JobSeekerDashboardProps {
  initialJobs: Job[]
}

type TabType = "FIT" | "DESC" | "COVER_EN" | "COVER_PT" | "EMAIL"

export default function JobSeekerDashboard({ initialJobs }: JobSeekerDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [query, setQuery] = useState("")
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  // Fit and Application state
  const [fitData, setFitData] = useState<{ strengths: string[]; gaps: string[] } | null>(null)
  const [materials, setMaterials] = useState<{ coverLetterEN: string; coverLetterPT: string; emailDraft: any } | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("FIT")
  const [copied, setCopied] = useState(false)
  const [draftCreated, setDraftCreated] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Refresh / Agent state
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshResult, setRefreshResult] = useState<{ scannedAt: string; sources: string[]; totalScanned: number } | null>(null)
  const [agentStep, setAgentStep] = useState(0)

  const agentSteps = [
    "🔍 Varrendo LinkedIn...",
    "📡 Consultando Otta e Indeed...",
    "🤖 Analisando match semântico...",
    "📊 Calculando aderência ao perfil...",
    "✅ Organizando resultados...",
  ]

  // Modules list for filtering
  const allModules = ["MM", "EWM", "ACM", "DRC", "SD", "WM"]

  // Trigger search when query or modules change
  useEffect(() => {
    const performSearch = async () => {
      setIsSearching(true)
      try {
        const results = await searchJobsAI(query, selectedModules)
        setJobs(results)
      } catch (err) {
        console.error("Search failed:", err)
      } finally {
        setIsSearching(false)
      }
    }

    const delayDebounce = setTimeout(() => {
      performSearch()
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query, selectedModules])

  // Fetch fit analysis and materials when active job changes
  useEffect(() => {
    if (!activeJobId) {
      setFitData(null)
      setMaterials(null)
      return
    }

    const fetchDetails = async () => {
      try {
        const fit = await generateFitAnalysis(activeJobId)
        const docs = await generateApplicationMaterials(activeJobId)
        setFitData(fit)
        setMaterials(docs)
        setActiveTab("FIT")
        setDraftCreated(false)
        setCopied(false)
      } catch (err) {
        console.error("Failed to load details:", err)
      }
    }

    fetchDetails()
  }, [activeJobId])

  // Agent step animation during refresh
  useEffect(() => {
    if (!isRefreshing) {
      setAgentStep(0)
      return
    }
    const interval = setInterval(() => {
      setAgentStep((prev) => (prev < agentSteps.length - 1 ? prev + 1 : prev))
    }, 400)
    return () => clearInterval(interval)
  }, [isRefreshing])

  const toggleModule = (mod: string) => {
    if (selectedModules.includes(mod)) {
      setSelectedModules(selectedModules.filter((m) => m !== mod))
    } else {
      setSelectedModules([...selectedModules, mod])
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setRefreshResult(null)
    try {
      const result = await refreshJobs(query, selectedModules)
      setJobs(result.jobs)
      setRefreshResult({
        scannedAt: result.scannedAt,
        sources: result.sources,
        totalScanned: result.totalScanned,
      })
      setActiveJobId(null)
    } catch (err) {
      console.error("Refresh failed:", err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const activeJob = jobs.find((j) => j.id === activeJobId)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateDraft = () => {
    setDraftCreated(true)
  }

  const avgMatch = jobs.length > 0
    ? Math.round(jobs.reduce((a, j) => a + j.matchScore, 0) / jobs.length * 10) / 10
    : 0
  const topMatch = jobs.length > 0
    ? Math.max(...jobs.map((j) => j.matchScore))
    : 0
  const topMatchJob = jobs.find((j) => j.matchScore === topMatch)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative" }}>

      {/* KPIs Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div className="kpi-card glow-blue">
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
            Vagas Recomendadas
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "8px", color: "#60a5fa" }}>
            {jobs.length} Vagas
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", marginTop: "4px" }}>
            Escopo: Europa &amp; EUA Fully Remote
          </span>
        </div>

        <div className="kpi-card glow-green">
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
            Aderência Média (Match)
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "8px", color: "#34d399" }}>
            {avgMatch}%
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", marginTop: "4px" }}>
            {topMatchJob ? `Aderência máxima: ${topMatch}% (${topMatchJob.company})` : "—"}
          </span>
        </div>

        <div className="kpi-card">
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>
            Taxa Média do Mercado
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "8px", color: "#fbbf24" }}>
            €850 / dia
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", display: "block", marginTop: "4px" }}>
            Seta metas premium (CLT: €110k/a)
          </span>
        </div>
      </div>

      {/* Agent Refresh Banner */}
      {isRefreshing && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span className="spinner" style={{ width: "20px", height: "20px", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#93c5fd", marginBottom: "4px" }}>
              🤖 Agente JobSeeker IA em execução...
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
              {agentSteps[agentStep]}
            </div>
            <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
              {agentSteps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: "3px",
                    flex: 1,
                    borderRadius: "2px",
                    background: i <= agentStep ? "#3b82f6" : "rgba(255,255,255,0.1)",
                    transition: "background 0.3s ease",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Refresh Success Banner */}
      {refreshResult && !isRefreshing && (
        <div
          style={{
            background: "rgba(5, 150, 105, 0.1)",
            border: "1px solid rgba(5, 150, 105, 0.25)",
            borderRadius: "12px",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "16px" }}>✅</span>
            <div>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#34d399" }}>
                {refreshResult.totalScanned} vagas analisadas em {refreshResult.sources.length} fontes
              </span>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {refreshResult.sources.join(" • ")}
              </div>
            </div>
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", flexShrink: 0 }}>
            {new Date(refreshResult.scannedAt).toLocaleTimeString("pt-PT")}
          </span>
        </div>
      )}

      {/* Main Console Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "24px" }}>

        {/* Search & Filters Column */}
        <div style={{ gridColumn: activeJobId ? "span 7" : "span 12", display: "flex", flexDirection: "column", gap: "20px", transition: "all 0.3s ease" }}>

          {/* Glass Search Card */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ position: "absolute", left: "16px", fontSize: "18px" }}>🔍</span>
              <input
                type="text"
                placeholder="Busque ativamente por cargo, empresa ou palavra-chave (ex: SAP EWM, BMW, Remote)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: "48px", height: "48px", flex: 1 }}
              />
              {isSearching && (
                <span className="spinner" style={{ position: "absolute", right: "140px", width: "18px", height: "18px" }} />
              )}

              {/* Refresh Agent Button */}
              <button
                type="button"
                id="btn-refresh-agent"
                onClick={handleRefresh}
                disabled={isRefreshing}
                style={{
                  marginLeft: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 18px",
                  height: "48px",
                  borderRadius: "10px",
                  background: isRefreshing
                    ? "rgba(59,130,246,0.1)"
                    : "linear-gradient(135deg, #1d4ed8, #7c3aed)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: isRefreshing ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
              >
                {isRefreshing ? (
                  <>
                    <span className="spinner" style={{ width: "14px", height: "14px" }} />
                    Buscando...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: "15px" }}>🤖</span>
                    Buscar Novas Vagas
                  </>
                )}
              </button>
            </div>

            {/* Modules filter checkboxes */}
            <div>
              <label className="input-label" style={{ marginBottom: "8px" }}>Filtrar por Módulos SAP</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {allModules.map((mod) => {
                  const active = selectedModules.includes(mod)
                  return (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => toggleModule(mod)}
                      className={active ? "badge badge-blue" : "badge badge-gray"}
                      style={{
                        padding: "6px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textTransform: "none",
                        border: active ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      {mod}
                    </button>
                  )
                })}
                {selectedModules.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedModules([])}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#f87171",
                      fontSize: "12px",
                      cursor: "pointer",
                      marginLeft: "8px",
                    }}
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Opportunities Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {jobs.map((job) => {
              const active = job.id === activeJobId
              return (
                <div
                  key={job.id}
                  onClick={() => setActiveJobId(job.id)}
                  className="card"
                  style={{
                    padding: "20px",
                    cursor: "pointer",
                    border: active ? "1px solid #3b82f6" : "1px solid var(--color-border)",
                    boxShadow: active ? "0 0 20px rgba(59, 130, 246, 0.15)" : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="badge badge-gray" style={{ background: "rgba(255,255,255,0.05)", textTransform: "none", fontSize: "10px" }}>
                        {job.source}
                      </span>
                      <span className="badge badge-blue" style={{ fontSize: "10px" }}>
                        {job.type}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "18px", fontWeight: 700, marginTop: "2px" }}>
                      {job.title}
                    </h3>

                    <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                      <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{job.company}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>

                    <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
                      {job.modules.map((m) => (
                        <span key={m} className="badge badge-purple" style={{ fontSize: "10px" }}>{m}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "50%",
                        border: `3px solid ${job.matchScore >= 95 ? "#059669" : "#3b82f6"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 800,
                        color: job.matchScore >= 95 ? "#34d399" : "#60a5fa",
                        background: "rgba(10, 15, 30, 0.6)",
                      }}
                    >
                      {job.matchScore}%
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#fbbf24" }}>
                      {job.rate.split(" ")[0]} {job.rate.split(" ")[1]}
                    </span>
                  </div>
                </div>
              )
            })}

            {jobs.length === 0 && (
              <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                📭 Nenhuma vaga correspondente encontrada. Tente redefinir a busca ou limpar os filtros.
              </div>
            )}
          </div>
        </div>

        {/* Dynamic AI Drawer / Fit Column */}
        {activeJobId && activeJob && (
          <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: "20px" }} className="animate-slide-in">
            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", position: "sticky", top: "100px" }}>

              {/* Drawer Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--color-border)", paddingBottom: "16px", marginBottom: "16px" }}>
                <div style={{ maxWidth: "80%" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "4px" }}>{activeJob.title}</h3>
                  <div style={{ fontSize: "14px", color: "var(--color-text-secondary)", fontWeight: 600 }}>{activeJob.company}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveJobId(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-text-secondary)",
                    fontSize: "20px",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Detail Tabs Nav */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "16px", gap: "2px", overflowX: "auto" }}>
                {(
                  [
                    { key: "FIT", label: "🤖 Fit", id: "tab-fit" },
                    { key: "DESC", label: "📋 Descrição", id: "tab-desc" },
                    { key: "COVER_EN", label: "📄 Cover (EN)", id: "tab-cover-en" },
                    { key: "COVER_PT", label: "📄 Carta (PT)", id: "tab-cover-pt" },
                    { key: "EMAIL", label: "✉️ Rascunho", id: "tab-email" },
                  ] as { key: TabType; label: string; id: string }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    id={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`btn-ghost ${activeTab === tab.key ? "active" : ""}`}
                    style={{
                      flex: "0 0 auto",
                      padding: "8px 10px",
                      fontSize: "11px",
                      fontWeight: activeTab === tab.key ? 700 : 500,
                      borderBottom: activeTab === tab.key ? "2px solid #3b82f6" : "2px solid transparent",
                      borderRadius: "4px 4px 0 0",
                      color: activeTab === tab.key ? "#60a5fa" : "var(--color-text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px", marginBottom: "16px" }}>

                {/* ── FIT TAB ── */}
                {activeTab === "FIT" && fitData && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "8px" }}>
                        Sobre a Oportunidade
                      </h4>
                      <p style={{ fontSize: "13px", color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                        {activeJob.description}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#34d399", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>🟢</span> Pontos Fortes e Diferenciais
                      </h4>
                      <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {fitData.strengths.map((str, idx) => (
                          <li key={idx} style={{ fontSize: "13px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                            {str}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {fitData.gaps.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#fbbf24", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>🟡</span> Gaps e Requisitos a Observar
                        </h4>
                        <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          {fitData.gaps.map((gap, idx) => (
                            <li key={idx} style={{ fontSize: "13px", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* ── DESCRIÇÃO TAB ── */}
                {activeTab === "DESC" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* Aviso IA */}
                    <div
                      style={{
                        background: "rgba(139,92,246,0.08)",
                        border: "1px solid rgba(139,92,246,0.2)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>🤖</span>
                      <p style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                        Esta é uma <strong style={{ color: "#a78bfa" }}>recomendação gerada por IA</strong> com base no seu perfil. Os links abaixo direcionam para a <strong>página de vagas da empresa no LinkedIn</strong> (filtrada por empresa) e para o <strong>portal oficial de carreiras</strong>, onde você encontrará as vagas abertas reais.
                      </p>
                    </div>

                    {/* Links da Vaga */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        🔗 Acessar Vagas da Empresa
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        {/* LinkedIn filtrado */}
                        {(activeJob as any).url && (
                          <a
                            href={(activeJob as any).url}
                            target="_blank"
                            rel="noopener noreferrer"
                            id={`btn-linkedin-${activeJob.id}`}
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              padding: "12px 16px",
                              background: "linear-gradient(135deg, rgba(10,102,194,0.2), rgba(10,102,194,0.1))",
                              border: "1px solid rgba(10,102,194,0.35)",
                              color: "#60a5fa",
                              borderRadius: "10px",
                              textDecoration: "none",
                              fontSize: "12px",
                              fontWeight: 700,
                              textAlign: "center" as const,
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>in</span>
                            Vagas no LinkedIn →
                          </a>
                        )}

                        {/* Portal de Carreiras */}
                        {(activeJob as any).careerPage && (
                          <a
                            href={(activeJob as any).careerPage}
                            target="_blank"
                            rel="noopener noreferrer"
                            id={`btn-career-${activeJob.id}`}
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              padding: "12px 16px",
                              background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",
                              border: "1px solid rgba(59,130,246,0.25)",
                              color: "#93c5fd",
                              borderRadius: "10px",
                              textDecoration: "none",
                              fontSize: "12px",
                              fontWeight: 700,
                              textAlign: "center" as const,
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>🌐</span>
                            Portal de Carreiras →
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Descrição Completa */}
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                        📄 Descrição Original da Vaga (gerada por IA)
                      </div>
                      <div
                        style={{
                          background: "rgba(10, 15, 30, 0.5)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "10px",
                          padding: "16px",
                          fontSize: "12px",
                          lineHeight: 1.8,
                          color: "var(--color-text-primary)",
                          whiteSpace: "pre-wrap",
                          fontFamily: "inherit",
                        }}
                      >
                        {activeJob.fullDescription || activeJob.description}
                      </div>
                    </div>

                    {/* Contatos */}
                    {activeJob.contacts && activeJob.contacts.length > 0 && (
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                          👤 Contatos para Candidatura
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {activeJob.contacts.map((contact: Contact, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "10px",
                                padding: "14px 16px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                                    {contact.name}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                                    {contact.role}
                                  </div>
                                </div>
                                {contact.linkedin && (
                                  <a
                                    href={contact.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Ver no LinkedIn"
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "5px 10px",
                                      background: "rgba(10, 102, 194, 0.15)",
                                      border: "1px solid rgba(10, 102, 194, 0.3)",
                                      borderRadius: "6px",
                                      color: "#60a5fa",
                                      textDecoration: "none",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                    }}
                                  >
                                    in LinkedIn
                                  </a>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "12px", color: "#93c5fd" }}>📧 {contact.email}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(contact.email)
                                    setCopied(true)
                                    setTimeout(() => setCopied(false), 2000)
                                  }}
                                  style={{
                                    background: "transparent",
                                    border: "1px solid var(--color-border)",
                                    color: "var(--color-text-muted)",
                                    fontSize: "10px",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                  }}
                                >
                                  {copied ? "✓" : "Copiar"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}


                {/* ── COVER LETTER TABS ── */}
                {(activeTab === "COVER_EN" || activeTab === "COVER_PT") && materials && (
                  <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeTab === "COVER_EN" ? materials.coverLetterEN : materials.coverLetterPT)}
                        className="btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "12px" }}
                      >
                        {copied ? "Copiado!" : "Copiar Texto"}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={activeTab === "COVER_EN" ? materials.coverLetterEN : materials.coverLetterPT}
                      className="input"
                      style={{
                        flex: 1,
                        fontSize: "12px",
                        lineHeight: 1.6,
                        fontFamily: "Courier, monospace",
                        background: "rgba(10, 15, 30, 0.4)",
                        height: "80%",
                        resize: "none",
                      }}
                    />
                  </div>
                )}

                {/* ── EMAIL TAB ── */}
                {activeTab === "EMAIL" && materials && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {draftCreated && (
                      <div
                        style={{
                          background: "rgba(5, 150, 105, 0.15)",
                          border: "1px solid rgba(5, 150, 105, 0.3)",
                          color: "#34d399",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      >
                        ✅ Rascunho criado com sucesso em <strong>matheus.penteado.pt@gmail.com</strong>!
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700 }}>Rascunho de E-mail de Candidatura</span>
                      <button
                        type="button"
                        onClick={handleCreateDraft}
                        className="btn-primary"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        disabled={draftCreated}
                      >
                        {draftCreated ? "Rascunho Criado" : "Salvar Rascunho"}
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div>
                        <label className="input-label" style={{ fontSize: "11px" }}>Assunto</label>
                        <input
                          type="text"
                          readOnly
                          value={materials.emailDraft.subject}
                          className="input"
                          style={{ fontSize: "12px", background: "rgba(10, 15, 30, 0.4)" }}
                        />
                      </div>
                      <div>
                        <label className="input-label" style={{ fontSize: "11px" }}>Corpo</label>
                        <textarea
                          readOnly
                          rows={12}
                          value={materials.emailDraft.body}
                          className="input"
                          style={{ fontSize: "12px", background: "rgba(10, 15, 30, 0.4)", resize: "none", lineHeight: 1.6 }}
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Footer Status indicator */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Aderência Semântica:</span>
                <span className="badge badge-green" style={{ fontSize: "12px", fontWeight: 700 }}>
                  Match Excelente ({activeJob.matchScore}%)
                </span>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
