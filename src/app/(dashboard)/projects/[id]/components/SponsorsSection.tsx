'use client'
import { useState, useTransition } from 'react'
import EditModal from './EditModal'
import { updateSponsor, deleteSponsor, addSponsor } from '../actions'
import FormSubmitButton from '@/components/FormSubmitButton'
import CsvImportButton from '@/components/CsvImportButton'
import { importSponsorsCsv } from '../csv-actions'

type Sponsor = {
  id: string
  name: string
  role: string | null
  company: string | null
  email: string | null
  phone: string | null
  authorityLevel: string | null
  notes: string | null
}

export default function SponsorsSection({
  sponsors,
  projectId,
}: {
  sponsors: Sponsor[]
  projectId: string
}) {
  const [editingItem, setEditingItem] = useState<Sponsor | null>(null)
  const [isPending, startTransition] = useTransition()

  const addWithId = addSponsor.bind(null, projectId)

  async function handleEdit(formData: FormData) {
    if (!editingItem) return
    startTransition(async () => {
      await updateSponsor(projectId, editingItem.id, formData)
      setEditingItem(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteSponsor(projectId, id)
    })
  }

  return (
    <div>
      <span style={{
        fontSize: '12px',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        fontWeight: 600,
        display: 'block',
        marginBottom: '8px',
      }}>
        Sponsors (Patrocinadores)
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {sponsors.map(sp => (
          <div
            key={sp.id}
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
              <strong style={{ fontSize: '13px' }}>{sp.name}</strong>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                {sp.role || 'Sponsor'} {sp.authorityLevel ? `[Aut: ${sp.authorityLevel}]` : ''}
              </span>
              {sp.company && (
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {sp.company}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: '#60a5fa', fontSize: '11px', padding: '2px 6px' }}
                onClick={() => setEditingItem(sp)}
              >
                ✏️ Editar
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: '#f87171', fontSize: '11px', padding: '2px 6px' }}
                onClick={() => handleDelete(sp.id)}
                disabled={isPending}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
        {sponsors.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Nenhum sponsor cadastrado.
          </p>
        )}
      </div>

      {/* Add form */}
      <form action={addWithId as any} style={{ display: 'flex', gap: '10px' }}>
        <input
          name="name"
          className="input"
          placeholder="Nome Sponsor"
          required
          style={{ padding: '8px 12px', fontSize: '13px' }}
        />
        <input
          name="role"
          className="input"
          placeholder="Cargo"
          style={{ padding: '8px 12px', fontSize: '13px' }}
        />
        <input
          name="authorityLevel"
          className="input"
          placeholder="Nível Aut."
          style={{ padding: '8px 12px', fontSize: '13px', maxWidth: '100px' }}
        />
        <FormSubmitButton label="Add" className="btn-secondary" />
      </form>

      {/* CSV Import */}
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--color-border)' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
          Carga em massa via CSV (Sponsors):
        </span>
        <CsvImportButton
          templateFilename="sponsors_template.csv"
          templateHeaders={['name', 'role', 'company', 'email', 'phone', 'authorityLevel', 'notes']}
          templateExample={['Maria Souza', 'CIO', 'Empresa XYZ', 'maria@empresa.com', '11988887777', 'Alto', 'Aprova orçamentos']}
          onImport={(csv) => importSponsorsCsv(projectId, csv)}
        />
      </div>

      {/* Edit modal */}
      <EditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="✏️ Editar Sponsor"
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
                <label className="input-label">Empresa</label>
                <input name="company" className="input" defaultValue={editingItem.company || ''} />
              </div>
              <div>
                <label className="input-label">Nível de Autoridade</label>
                <input name="authorityLevel" className="input" defaultValue={editingItem.authorityLevel || ''} />
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
