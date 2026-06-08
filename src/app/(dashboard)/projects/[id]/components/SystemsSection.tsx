'use client'
import { useState, useTransition } from 'react'
import EditModal from './EditModal'
import { updateSystem, deleteSystem, addSystem } from '../actions'
import FormSubmitButton from '@/components/FormSubmitButton'
import CsvImportButton from '@/components/CsvImportButton'
import { importSystemsCsv } from '../csv-actions'

type SystemEnv = {
  id: string
  name: string
  systemId: string | null
  environment: string
  version: string | null
  notes: string | null
}

const envBadges: Record<string, string> = {
  DEV: 'badge-blue',
  QAS: 'badge-yellow',
  PRD: 'badge-red',
  SBX: 'badge-gray',
  SANDBOX: 'badge-gray',
}

export default function SystemsSection({
  systems,
  projectId,
}: {
  systems: SystemEnv[]
  projectId: string
}) {
  const [editingItem, setEditingItem] = useState<SystemEnv | null>(null)
  const [isPending, startTransition] = useTransition()

  const addWithId = addSystem.bind(null, projectId)

  async function handleEdit(formData: FormData) {
    if (!editingItem) return
    startTransition(async () => {
      await updateSystem(projectId, editingItem.id, formData)
      setEditingItem(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSystem(projectId, id)
    })
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>🖥️ Sistemas e Ambientes SAP</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {systems.map(sys => (
          <div
            key={sys.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--color-border)',
              padding: '12px',
              borderRadius: '8px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '14px' }}>{sys.name}</strong>
                <span className={`badge ${envBadges[sys.environment] || 'badge-gray'}`}>
                  {sys.environment}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                ID: {sys.systemId || '—'} | Versão: {sys.version || '—'}
              </div>
              {sys.notes && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Nota: {sys.notes}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: '#60a5fa', fontSize: '12px' }}
                onClick={() => setEditingItem(sys)}
              >
                ✏️ Editar
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: '#f87171', fontSize: '12px' }}
                onClick={() => handleDelete(sys.id)}
                disabled={isPending}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
        {systems.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Nenhum ambiente SAP cadastrado para este projeto.
          </p>
        )}
      </div>

      {/* Add form */}
      <form
        action={addWithId as any}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '16px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          + Cadastrar Ambiente
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input name="name" className="input" placeholder="Nome (Ex: ECC PRD, S4H DEV)" required />
          <select name="environment" className="input" required>
            <option value="DEV">Desenvolvimento (DEV)</option>
            <option value="QAS">Qualidade (QAS)</option>
            <option value="PRD">Produção (PRD)</option>
            <option value="SBX">Sandbox (SBX)</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input name="systemId" className="input" placeholder="ID do Sistema (Ex: SID, Host)" />
          <input name="version" className="input" placeholder="Versão (Ex: EHP8, S4 2023)" />
        </div>
        <input name="notes" className="input" placeholder="Observações rápidas de acesso" />
        <FormSubmitButton label="Adicionar Ambiente" className="btn-secondary" />
      </form>

      {/* CSV Import */}
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--color-border)' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
          Carga em massa via CSV:
        </span>
        <CsvImportButton
          templateFilename="sistemas_template.csv"
          templateHeaders={['name', 'systemId', 'environment', 'version', 'notes']}
          templateExample={['ECC PRD', 'SID001', 'PRD', 'EHP8', 'Acesso via VPN']}
          onImport={(csv) => importSystemsCsv(projectId, csv)}
        />
      </div>

      {/* Edit modal */}
      <EditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="✏️ Editar Sistema/Ambiente"
      >
        {editingItem && (
          <form
            action={handleEdit}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">Nome *</label>
                <input name="name" className="input" defaultValue={editingItem.name} required />
              </div>
              <div>
                <label className="input-label">Ambiente</label>
                <select name="environment" className="input" defaultValue={editingItem.environment}>
                  <option value="DEV">Desenvolvimento (DEV)</option>
                  <option value="QAS">Qualidade (QAS)</option>
                  <option value="PRD">Produção (PRD)</option>
                  <option value="SBX">Sandbox (SBX)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">ID do Sistema</label>
                <input name="systemId" className="input" defaultValue={editingItem.systemId || ''} />
              </div>
              <div>
                <label className="input-label">Versão</label>
                <input name="version" className="input" defaultValue={editingItem.version || ''} />
              </div>
            </div>
            <div>
              <label className="input-label">Observações</label>
              <input name="notes" className="input" defaultValue={editingItem.notes || ''} />
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '14px',
            }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditingItem(null)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </EditModal>
    </div>
  )
}
