'use client'
import { useState, useTransition } from 'react'
import EditModal from './EditModal'
import { updateParticipant, deleteParticipant, addParticipant } from '../actions'
import FormSubmitButton from '@/components/FormSubmitButton'
import CsvImportButton from '@/components/CsvImportButton'
import { importParticipantsCsv } from '../csv-actions'

type Participant = {
  id: string
  name: string
  role: string
  email: string | null
  phone: string | null
  notes: string | null
}

export default function ParticipantsSection({
  participants,
  projectId,
}: {
  participants: Participant[]
  projectId: string
}) {
  const [editingItem, setEditingItem] = useState<Participant | null>(null)
  const [isPending, startTransition] = useTransition()

  const addWithId = addParticipant.bind(null, projectId)

  async function handleEdit(formData: FormData) {
    if (!editingItem) return
    startTransition(async () => {
      await updateParticipant(projectId, editingItem.id, formData)
      setEditingItem(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteParticipant(projectId, id)
    })
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>👥 Equipe e Participantes</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {participants.map(part => (
          <div
            key={part.id}
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
                <strong style={{ fontSize: '14px' }}>{part.name}</strong>
                <span className="badge badge-purple">{part.role}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {part.email || 'Sem e-mail'} {part.phone ? `| ${part.phone}` : ''}
              </div>
              {part.notes && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  obs: {part.notes}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: '#60a5fa', fontSize: '12px' }}
                onClick={() => setEditingItem(part)}
              >
                ✏️ Editar
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: '#f87171', fontSize: '12px' }}
                onClick={() => handleDelete(part.id)}
                disabled={isPending}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
        {participants.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Nenhum participante da equipe cadastrado.
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
          + Adicionar Integrante
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input name="name" className="input" placeholder="Nome completo" required />
          <input name="role" className="input" placeholder="Função (Ex: Consultor Sênior)" required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input name="email" type="email" className="input" placeholder="E-mail" />
          <input name="phone" className="input" placeholder="Telefone" />
        </div>
        <input name="notes" className="input" placeholder="Observações (disponibilidade, etc.)" />
        <FormSubmitButton label="Adicionar Integrante" className="btn-secondary" />
      </form>

      {/* CSV Import */}
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--color-border)' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
          Carga em massa via CSV:
        </span>
        <CsvImportButton
          templateFilename="participantes_template.csv"
          templateHeaders={['name', 'role', 'email', 'phone', 'notes']}
          templateExample={['João Silva', 'Consultor Sênior', 'joao@empresa.com', '11999998888', 'Disponível em período integral']}
          onImport={(csv) => importParticipantsCsv(projectId, csv)}
        />
      </div>

      {/* Edit modal */}
      <EditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="✏️ Editar Participante"
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
                <label className="input-label">Função *</label>
                <input name="role" className="input" defaultValue={editingItem.role} required />
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
