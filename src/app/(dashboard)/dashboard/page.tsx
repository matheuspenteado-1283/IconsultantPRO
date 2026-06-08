import { auth } from "@/auth"
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
}

async function getDashboardData(organizationId: string) {
  const [projects, backlogItems, proposals, allBacklogItems] = await Promise.all([
    db.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: true },
    }),
    db.backlogItem.findMany({
      where: { project: { organizationId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { project: true, sapModule: true },
    }),
    db.proposal.findMany({
      where: { project: { organizationId } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.backlogItem.findMany({
      where: { project: { organizationId } },
      include: { sapModule: true, effortEstimates: true },
    }),
  ])

  const totalProjects = await db.project.count({ where: { organizationId } })
  const activeProjects = await db.project.count({ where: { organizationId, status: "IN_PROGRESS" } })
  const totalBacklog = await db.backlogItem.count({ where: { project: { organizationId } } })
  const openBacklog = await db.backlogItem.count({ where: { project: { organizationId }, status: "OPEN" } })

  return { projects, backlogItems, proposals, allBacklogItems, totalProjects, activeProjects, totalBacklog, openBacklog }
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PROSPECTING: { label: "Prospecção", color: "badge-yellow" },
  IN_PROGRESS: { label: "Em Andamento", color: "badge-green" },
  ON_HOLD: { label: "Suspenso", color: "badge-gray" },
  COMPLETED: { label: "Concluído", color: "badge-blue" },
  CANCELLED: { label: "Cancelado", color: "badge-red" },
}

const priorityLabels: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: "Crítica", color: "badge-red" },
  HIGH: { label: "Alta", color: "badge-yellow" },
  MEDIUM: { label: "Média", color: "badge-blue" },
  LOW: { label: "Baixa", color: "badge-gray" },
}

const proposalStatusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "badge-gray" },
  SENT: { label: "Enviada", color: "badge-blue" },
  APPROVED: { label: "Aprovada", color: "badge-green" },
  REJECTED: { label: "Recusada", color: "badge-red" },
  EXPIRED: { label: "Expirada", color: "badge-yellow" },
}

interface DashboardPageProps {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  const { error } = await searchParams

  if (!orgId) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Configurando sua organização...</p>
      </div>
    )
  }

  const data = await getDashboardData(orgId)

  // 1. Process Backlog Status Counts
  const statusCounts = {
    OPEN: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    DONE: 0,
    CANCELLED: 0,
  }
  let totalBkl = 0
  data.allBacklogItems.forEach((item) => {
    if (statusCounts[item.status] !== undefined) {
      statusCounts[item.status]++
      totalBkl++
    }
  })

  // 2. Process SAP Module effort
  const moduleHours: Record<string, { code: string; name: string; hours: number }> = {}
  let maxModuleHours = 0
  data.allBacklogItems.forEach((item) => {
    const code = item.sapModule?.code || "Outros"
    const name = item.sapModule?.name || "Sem Módulo SAP"
    const hours = item.effortEstimates.reduce((sum, est) => sum + est.hours, 0)
    
    if (!moduleHours[code]) {
      moduleHours[code] = { code, name, hours: 0 }
    }
    moduleHours[code].hours += hours
  })
  
  const moduleList = Object.values(moduleHours)
    .filter(m => m.hours > 0 || m.code !== "Outros")
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5)

  moduleList.forEach(m => {
    if (m.hours > maxModuleHours) maxModuleHours = m.hours
  })

  // 3. Process Type Distribution
  const typeLabels: Record<string, string> = {
    CONFIGURATION: "Configuração",
    WRICEF: "WRICEF / Dev",
    CONSULTING: "Consultoria",
    TRAINING: "Treinamento",
    GUIDANCE: "Orientação",
  }
  const typeCounts: Record<string, number> = {
    CONFIGURATION: 0,
    WRICEF: 0,
    CONSULTING: 0,
    TRAINING: 0,
    GUIDANCE: 0,
  }
  data.allBacklogItems.forEach((item) => {
    if (typeCounts[item.type] !== undefined) {
      typeCounts[item.type]++
    }
  })

  // Calculations for Donut Chart (SVG)
  const donutRadius = 50
  const donutCircumference = 2 * Math.PI * donutRadius // ~314.16
  
  // Percentages and offsets
  const statusPercentages = {
    DONE: totalBkl > 0 ? (statusCounts.DONE / totalBkl) * 100 : 0,
    IN_PROGRESS: totalBkl > 0 ? (statusCounts.IN_PROGRESS / totalBkl) * 100 : 0,
    REVIEW: totalBkl > 0 ? (statusCounts.REVIEW / totalBkl) * 100 : 0,
    OPEN: totalBkl > 0 ? (statusCounts.OPEN / totalBkl) * 100 : 0,
    CANCELLED: totalBkl > 0 ? (statusCounts.CANCELLED / totalBkl) * 100 : 0,
  }

  const arcDone = (statusPercentages.DONE / 100) * donutCircumference
  const arcInProgress = (statusPercentages.IN_PROGRESS / 100) * donutCircumference
  const arcReview = (statusPercentages.REVIEW / 100) * donutCircumference
  const arcOpen = (statusPercentages.OPEN / 100) * donutCircumference
  const arcCancelled = (statusPercentages.CANCELLED / 100) * donutCircumference

  const kpis = [
    { icon: "📁", label: "Total de Projetos", value: data.totalProjects, sub: `${data.activeProjects} em andamento`, color: "rgba(59,130,246,0.12)" },
    { icon: "📋", label: "Itens de Backlog", value: data.totalBacklog, sub: `${data.openBacklog} em aberto`, color: "rgba(6,182,212,0.12)" },
    { icon: "📄", label: "Propostas Comerciais", value: data.proposals.length, sub: "emitidas no sistema", color: "rgba(16,185,129,0.12)" },
    { icon: "⏱️", label: "Esforço Estimado", value: data.allBacklogItems.reduce((acc, i) => acc + i.effortEstimates.reduce((s, e) => s + e.hours, 0), 0), sub: "horas consolidadas", color: "rgba(139,92,246,0.12)" },
  ]

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val)
  }

  return (
    <div className="animate-fade-in">
      <style>{`
        .dashboard-header { margin-bottom: 32px; }
        .dashboard-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
        .dashboard-header p { color: var(--color-text-secondary); font-size: 15px; }
        
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .kpi-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 16px; }
        .kpi-value { font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
        .kpi-label { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 4px; }
        .kpi-sub { font-size: 12px; color: var(--color-text-muted); }
        
        .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
        @media (max-width: 1024px) { .analytics-grid { grid-template-columns: 1fr; } }
        
        .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        @media (max-width: 1024px) { .section-grid { grid-template-columns: 1fr; } }
        
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .section-title { font-size: 16px; font-weight: 700; }
        .section-link { font-size: 13px; color: #60a5fa; text-decoration: none; }
        .section-link:hover { text-decoration: underline; }
        .empty-state { text-align: center; padding: 32px 16px; color: var(--color-text-muted); font-size: 14px; }
        
        .quick-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 32px; }
        .quick-action { 
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 16px;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--color-text-secondary);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        .quick-action:hover {
          background: var(--color-bg-card-hover);
          border-color: rgba(59,130,246,0.3);
          color: var(--color-text-primary);
          transform: translateY(-1px);
        }
        .list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(30,41,59,0.5);
          gap: 12px;
        }
        .list-item:last-child { border-bottom: none; }
        .list-item-name { font-size: 14px; font-weight: 500; margin-bottom: 3px; }
        .list-item-sub { font-size: 12px; color: var(--color-text-muted); }

        /* Chart visual details */
        .bar-chart-container { display: flex; flexDirection: column; gap: 14px; }
        .bar-item { display: flex; flex-direction: column; gap: 4px; }
        .bar-header { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; }
        .bar-track { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; width: 100%; }
        .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
      `}</style>

      {/* Header */}
      <div className="dashboard-header">
        <h1>Olá, {(session?.user?.name || "").split(" ")[0]} 👋</h1>
        <p>Aqui está o resumo e os indicadores analíticos das suas atividades SAP</p>
      </div>

      {error === "access-denied" && (
        <div 
          className="animate-fade-in"
          style={{
            background: "rgba(220, 38, 38, 0.12)",
            border: "1px solid rgba(220, 38, 38, 0.35)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            boxShadow: "0 0 20px rgba(220, 38, 38, 0.15)",
          }}
        >
          <div style={{ fontSize: "28px" }}>🔐</div>
          <div>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#f87171", marginBottom: "2px" }}>Acesso Negado</h4>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
              Seu perfil de acesso atual não possui permissões suficientes para entrar no módulo solicitado. Entre em contato com o administrador do sistema para solicitar permissão.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div className="kpi-icon" style={{ background: kpi.color }}>{kpi.icon}</div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: "12px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Ações Rápidas</h2>
      </div>
      <div className="quick-actions">
        {[
          { href: "/projects/new", icon: "📁", label: "Novo Projeto" },
          { href: "/backlog/new", icon: "📋", label: "Novo Backlog" },
          { href: "/proposals/new", icon: "📄", label: "Nova Proposta" },
          { href: "/jobseeker", icon: "🔍", label: "Buscar Vagas" },
          { href: "/settings/partners/new", icon: "🤝", label: "Novo Parceiro" },
          { href: "/estimates", icon: "⏱️", label: "Estimar Esforço" },
        ].map((action) => (
          <Link key={action.href} href={action.href} className="quick-action">
            <span style={{ fontSize: "20px" }}>{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>

      {/* Analytics Charts Section */}
      <div style={{ marginBottom: "12px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>📊 Gráficos e Métricas de Escopo</h2>
      </div>
      <div className="analytics-grid">
        
        {/* Ring Chart: Backlog Status */}
        <div className="card" style={{ display: "flex", flexDirection: "column", justifySelf: "stretch" }}>
          <h3 className="section-title" style={{ marginBottom: "20px" }}>📋 Distribuição de Status do Backlog</h3>
          
          {totalBkl === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
              Insira itens de backlog para gerar o gráfico de status.
            </div>
          ) : (
            <div style={{ display: "flex", gap: "24px", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap" }}>
              <div style={{ position: "relative", width: "130px", height: "130px" }}>
                <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                  {/* Background Track */}
                  <circle cx="60" cy="60" r={donutRadius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                  
                  {/* Segment: DONE (Green) */}
                  {arcDone > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeDasharray={`${arcDone} ${donutCircumference}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Segment: IN_PROGRESS (Blue) */}
                  {arcInProgress > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="12"
                      strokeDasharray={`${arcInProgress} ${donutCircumference}`}
                      strokeDashoffset={`-${arcDone}`}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Segment: REVIEW (Yellow) */}
                  {arcReview > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#fbbf24"
                      strokeWidth="12"
                      strokeDasharray={`${arcReview} ${donutCircumference}`}
                      strokeDashoffset={`-${arcDone + arcInProgress}`}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Segment: OPEN (Gray) */}
                  {arcOpen > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#64748b"
                      strokeWidth="12"
                      strokeDasharray={`${arcOpen} ${donutCircumference}`}
                      strokeDashoffset={`-${arcDone + arcInProgress + arcReview}`}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Segment: CANCELLED (Red) */}
                  {arcCancelled > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={donutRadius}
                      fill="transparent"
                      stroke="#ef4444"
                      strokeWidth="12"
                      strokeDasharray={`${arcCancelled} ${donutCircumference}`}
                      strokeDashoffset={`-${arcDone + arcInProgress + arcReview + arcOpen}`}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                {/* Centered label */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "20px", fontWeight: 800 }}>{totalBkl}</span>
                  <span style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Itens</span>
                </div>
              </div>

              {/* Legends list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: "160px" }}>
                {[
                  { label: "Concluído", value: statusCounts.DONE, percent: statusPercentages.DONE, color: "#10b981" },
                  { label: "Em Progresso", value: statusCounts.IN_PROGRESS, percent: statusPercentages.IN_PROGRESS, color: "#3b82f6" },
                  { label: "Em Revisão", value: statusCounts.REVIEW, percent: statusPercentages.REVIEW, color: "#fbbf24" },
                  { label: "Aberto", value: statusCounts.OPEN, percent: statusPercentages.OPEN, color: "#64748b" },
                  { label: "Cancelado", value: statusCounts.CANCELLED, percent: statusPercentages.CANCELLED, color: "#ef4444" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color }} />
                      <span style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{item.value} <span style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>({item.percent.toFixed(0)}%)</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart: Effort by SAP Module */}
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: "20px" }}>⏱️ Esforço de Consultoria por Módulo SAP</h3>
          
          {moduleList.length === 0 || maxModuleHours === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
              Cadastre e estime itens de backlog para gerar o gráfico por módulos.
            </div>
          ) : (
            <div className="bar-chart-container">
              {moduleList.map((mod, index) => {
                const widthPercent = maxModuleHours > 0 ? (mod.hours / maxModuleHours) * 100 : 0
                const colors = [
                  "linear-gradient(90deg, #3b82f6, #60a5fa)",
                  "linear-gradient(90deg, #10b981, #34d399)",
                  "linear-gradient(90deg, #8b5cf6, #a78bfa)",
                  "linear-gradient(90deg, #fbbf24, #fcd34d)",
                  "linear-gradient(90deg, #ec4899, #f472b6)"
                ]
                const barColor = colors[index % colors.length]

                return (
                  <div key={mod.code} className="bar-item">
                    <div className="bar-header">
                      <span style={{ color: "var(--color-text-primary)" }}>{mod.code} — <span style={{ color: "var(--color-text-muted)", fontSize: "11px", fontWeight: "normal" }}>{mod.name}</span></span>
                      <span style={{ color: "#60a5fa" }}>{mod.hours}h</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${widthPercent}%`, background: barColor }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Recent Data Grid */}
      <div className="section-grid">
        
        {/* Recent Projects */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">📁 Projetos Recentes</span>
            <Link href="/projects" className="section-link">Ver todos →</Link>
          </div>
          {data.projects.length === 0 ? (
            <div className="empty-state">
              Nenhum projeto ainda.<br />
              <Link href="/projects/new" style={{ color: "#60a5fa", textDecoration: "none" }}>Criar primeiro projeto →</Link>
            </div>
          ) : (
            data.projects.map((project) => {
              const status = statusLabels[project.status] || { label: project.status, color: "badge-gray" }
              return (
                <div key={project.id} className="list-item">
                  <div>
                    <div className="list-item-name">{project.name}</div>
                    <div className="list-item-sub">{project.client?.name || "Sem cliente"}</div>
                  </div>
                  <span className={`badge ${status.color}`}>{status.label}</span>
                </div>
              )
            })
          )}
        </div>

        {/* Recent Proposals */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">📄 Propostas Recentes</span>
            <Link href="/proposals" className="section-link">Ver todas →</Link>
          </div>
          {data.proposals.length === 0 ? (
            <div className="empty-state">
              Nenhuma proposta ainda.<br />
              <Link href="/proposals/new" style={{ color: "#60a5fa", textDecoration: "none" }}>Criar primeira proposta →</Link>
            </div>
          ) : (
            data.proposals.map((prop) => {
              const status = proposalStatusLabels[prop.status] || { label: prop.status, color: "badge-gray" }
              return (
                <div key={prop.id} className="list-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="list-item-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {prop.title}
                    </div>
                    <div className="list-item-sub">Valor comercial: <strong style={{ color: "#34d399" }}>{formatBRL(prop.finalPrice)}</strong></div>
                  </div>
                  <span className={`badge ${status.color}`}>{status.label}</span>
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}
