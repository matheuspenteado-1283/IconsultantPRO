'use client'
import { useState, useTransition } from 'react'
import EditModal from './EditModal'
import { updateApprover, deleteApprover, addApprover } from '../actions'
import FormSubmitButton from '@/components/FormSubmitButton'
import CsvImportButton from '@/components/CsvImportButton'
import { importApproversCsv } from '../csv-actions'

type Approver = {
  id: string
  name: string
  email: string
  approvalStatus: string
}

const statusBadge = (status: string) => {
  if (status === 'APPROVED') return 'badge-green'
  if (status === 'REJECTED') return 'badge-red'
  return 'badge-yellow'
}

const statusLabel = (status: string) => {
  if (status === 'APPROVED') return 'Aprovado'
  if (status === 'REJECTED') return 'Rejeitado'
  return 'Pendente'
}

export default function ApproversSection({
  approvers,
  projectId,
}: {
  approvers: Approver[]
  projectId: string
}) {
  const [editingItem, setEditingItem] = useState<Approver | null>(null)
  const [isPending, startTransition] = useTransition()

  const addWithId = addApprover.bind(null, projectId)

  async function handleEdit(formData: FormData) {
    if (!editingItem) return
    startTransition(async () => {
      await updateApprover(projectId, editingItem.id, formData)
      setEditingItem(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteApprover(projectId, id)
    })
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>✍️ Fluxo de Aprovadores</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {approvers.map(appr => (
          <div
            key={appr.id}
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
              <strong style={{ fontSize: '14px' }}>{appr.name}</strong>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                ({appr.email})
              </span>
              <div style={{ marginTop: '4px' }}>
                <span className={`badge ${statusBadge(appr.approvalStatus)}`}>
                  {statusLabel(appr.approvalStatus)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: '#60a5fa', fontSize: '12px' }}
                onClick={() => setEditingItem(appr)}
              >
                ✏️ Editar
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: '#f87171', fontSize: '12px' }}
                onClick={() => handleDelete(appr.id)}
                disabled={isPending}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
        {approvers.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Nenhum aprovador cadastrado para este projeto.
          </p>
        )}
      </div>

      {/* Add form */}
      <form
        action={addWithId as any}
        style={{
          display: 'flex',
          gap: '10px',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '16px',
        }}
      >
        <input
          name="name"
          className="input"
          placeholder="Nome do Aprovador"
          required
          style={{ padding: '8px 12px', fontSize: '13px' }}
        />
        <input
          name="email"
          type="email"
          className="input"
          placeholder="E-mail"
          required
          style={{ padding: '8px 12px', fontSize: '13px' }}
        />
        <FormSubmitButton label="Adicionar" className="btn-secondary" />
      </form>

      {/* CSV Import */}
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
          Carga em massa via CSV:
        </span>
        <CsvImportButton
          templateFilename="aprovadores_template.csv"
          templateHeaders={['name', 'email']}
          templateExample={['Ana Costa', 'ana@empresa.com']}
          onImport={(csv) => importApproversCsv(projectId, csv)}
        />
      </div>

      {/* Edit modal — only name and email; status is read-only */}
      <EditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="✏️ Editar Aprovador"
      >
        {editingItem && (
          <form
            action={handleEdit}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {/* Read-only status badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Status atual:</span>
              <span className={`badge ${statusBadge(editingItem.approvalStatus)}`}>
                {statusLabel(editingItem.approvalStatus)}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                (não editável)
              </span>
            </div>

            <div>
              <label className="input-label">Nome *</label>
              <input name="name" className="input" defaultValue={editingItem.name} required />
            </div>
            <div>
              <label className="input-label">E-mail *</label>
              <input
                name="email"
                type="email"
                className="input"
                defaultValue={editingItem.email}
                required
              />
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
