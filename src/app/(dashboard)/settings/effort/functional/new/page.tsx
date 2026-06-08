import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import { createFunctionalEffort } from "@/app/(dashboard)/settings/effort/actions"
import FormSubmitButton from "@/components/FormSubmitButton"

export const metadata: Metadata = { title: "Novo Esforço Funcional" }

export default async function NewFunctionalEffortPage() {
  const modules = await db.sapModule.findMany({
    where: { active: true },
    orderBy: { code: "asc" },
  })

  const complexityLabels: Record<string, string> = {
    SIMPLE: "Simples", MEDIUM: "Médio", COMPLEX: "Complexo", VERY_COMPLEX: "Muito Complexo",
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <Link href="/settings/effort" style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          ← Voltar para Esforços
        </Link>
        <h1 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "6px" }}>👨‍💼 Novo Esforço Funcional</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Cadastre um esforço funcional padrão associado a um módulo SAP</p>
      </div>

      <div className="card">
        <form action={createFunctionalEffort as any} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label className="input-label" htmlFor="moduleId">Módulo SAP *</label>
            <select id="moduleId" name="moduleId" className="input" required>
              <option value="">Selecione um módulo...</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label" htmlFor="activityType">Tipo de Atividade *</label>
              <input
                id="activityType"
                name="activityType"
                type="text"
                className="input"
                placeholder="Ex: Configuração de BP, Customizing"
                required
              />
            </div>
            <div>
              <label className="input-label" htmlFor="complexity">Complexidade *</label>
              <select id="complexity" name="complexity" className="input" required>
                {Object.entries(complexityLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="standardHours">Horas Padrão *</label>
            <input
              id="standardHours"
              name="standardHours"
              type="number"
              step="0.5"
              min="0.5"
              className="input"
              placeholder="Ex: 24.0"
              required
            />
          </div>

          <div>
            <label className="input-label" htmlFor="description">Descrição (opcional)</label>
            <input
              id="description"
              name="description"
              type="text"
              className="input"
              placeholder="Ex: Mapeamento e configuração funcional de processos fiscais"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <Link href="/settings/effort" className="btn-secondary">Cancelar</Link>
            <FormSubmitButton label="Salvar Esforço" />
          </div>
        </form>
      </div>
    </div>
  )
}
