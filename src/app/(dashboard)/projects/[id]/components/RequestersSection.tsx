'use client'
import { useState, useTransition } from 'react'
import EditModal from './EditModal'
import { updateRequester, deleteRequester, addRequester } from '../actions'
import FormSubmitButton from '@/components/FormSubmitButton'
import CsvImportButton from '@/components/CsvImportButton'
import { importRequestersCsv } from '../csv-actions'

type Requester = {
  id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  notes: string | null
}

export default function RequestersSection({
  requesters,
  projectId,
}: {
  requesters: Requester[]
  projectId: string
}) {
  const [editingItem, setEditingItem] = useState<Requester | null>(null)
  const [isPending, startTransition] = useTransition()

  const addWithId = addRequester.bind(null, projectId)

  async function handleEdit(formData: FormData) {
    if (!editingItem) return
    startTransition(async () => {
      await updateRequester(projectId, editingItem.id, formData)
      setEditingItem(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteRequester(projectId, id)
    })
  }

  return (
    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
      <span style={{
        fontSize: '12px',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        fontWeight: 600,
        display: 'block',
        marginBottom: '8px',
      }}>
        Requisitantes do Projeto
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {requesters.map(req => (
          <div
            key={req.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '10px',
              borderRadius: '6px',
            }}
          >
            <div>
              <strong style={{ fontSize: '13px' }}>{req.name}</strong>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                {req.role || 'Requisitante'}
              </span>
              {req.email && (
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {req.email} {req.phone ? `| ${req.phone}` : ''}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: '#60a5fa', fontSize: '11px', padding: '2px 6px' }}
                onClick={() => setEditingItem(req)}
              >
                ✏️ Editar
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: '#f87171', fontSize: '11px', padding: '2px 6px' }}
                onClick={() => handleDelete(req.id)}
                disabled={isPending}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
        {requesters.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Nenhum requisitante cadastrado.
          </p>
        )}
      </div>

      {/* Add form */}
      <form action={addWithId as any} style={{ display: 'flex', gap: '10px' }}>
        <input
          name="name"
          className="input"
          placeholder="Nome Requisitante"
          required
          style={{ padding: '8px 12px', fontSize: '13px' }}
        />
        <input
          name="role"
          className="input"
          placeholder="Cargo"
          style={{ padding: '8px 12px', fontSize: '13px' }}
        />
        <FormSubmitButton label="Add" className="btn-secondary" />
      </form>

      {/* CSV Import */}
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--color-border)' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
          Carga em massa via CSV (Requisitantes):
        </span>
        <CsvImportButton
          templateFilename="requisitantes_template.csv"
          templateHeaders={['name', 'role', 'email', 'phone', 'notes']}
          templateExample={['Carlos Lima', 'Gerente de TI', 'carlos@empresa.com', '11977776666', '']}
          onImport={(csv) => importRequestersCsv(projectId, csv)}
        />
      </div>

      {/* Edit modal */}
      <EditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="✏️ Editar Requisitante"
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
                <label className="input-label">Cargo</label>
                <input name="role" className="input" defaultValue={editingItem.role || ''} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label">E-mail</label>
                <input name="email" type="email" className="input" defaultValue={editingItem.email || ''} />
              </div>
              <div>
                <label className="input-label">Telefone</label>
                <input name="phone" className="input" defaultValue={editingItem.phone || ''} />
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
