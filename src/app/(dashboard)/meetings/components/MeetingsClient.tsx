'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MeetingRecorder } from './MeetingRecorder'
import { deleteMeeting } from '../actions'

interface Meeting {
  id: string
  title: string
  platform: string
  meetingDate: Date | string
  durationSeconds: number | null
  participants: string[]
  status: string
  project: { id: string; name: string } | null
  summary: { summary: string } | null
  transcription: { id: string } | null
}

interface MeetingsClientProps {
  meetings: Meeting[]
  projects: Array<{ id: string; name: string }>
}

const PLATFORM_LABELS: Record<string, string> = {
  TEAMS: 'Teams',
  GOOGLE_MEET: 'Google Meet',
  ZOOM: 'Zoom',
  WEBEX: 'Webex',
  OTHER: 'Outro',
}

const PLATFORM_BADGE: Record<string, string> = {
  TEAMS: 'badge-blue',
  GOOGLE_MEET: 'badge-green',
  ZOOM: 'badge-blue',
  WEBEX: 'badge-red',
  OTHER: 'badge-gray',
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-gray',
  RECORDING: 'badge-red',
  PROCESSING: 'badge-yellow',
  COMPLETED: 'badge-green',
  ERROR: 'badge-red',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  RECORDING: '● Gravando',
  PROCESSING: '⟳ Processando',
  COMPLETED: '✓ Concluída',
  ERROR: '✕ Erro',
}

function formatDuration(secs: number | null): string {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}min ${s}s`
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function MeetingsClient({ meetings, projects }: MeetingsClientProps) {
  const router = useRouter()
  const [showRecorder, setShowRecorder] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleComplete = (meetingId: string) => {
    router.push(`/meetings/${meetingId}`)
    router.refresh()
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir a reunião "${title}"? Esta ação não pode ser desfeita.`)) return
    setDeletingId(id)
    await deleteMeeting(id)
    router.refresh()
    setDeletingId(null)
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            🎙️ Reuniões
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', margin: '4px 0 0' }}>
            Grave, transcreva e analise reuniões automaticamente com IA
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowRecorder(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          🎙️ Nova Reunião
        </button>
      </div>

      {/* Meeting recorder modal */}
      {showRecorder && (
        <MeetingRecorder
          projects={projects}
          onClose={() => setShowRecorder(false)}
          onComplete={handleComplete}
        />
      )}

      {/* Empty state */}
      {meetings.length === 0 && (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '64px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(59,130,246,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
          }}>
            🎙️
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Nenhuma reunião ainda
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', maxWidth: '400px', margin: 0 }}>
            Grave sua primeira reunião e deixe a IA gerar a transcrição e o resumo automaticamente.
          </p>
          <button
            className="btn-primary"
            onClick={() => setShowRecorder(true)}
            style={{ marginTop: '8px' }}
          >
            🎙️ Gravar primeira reunião
          </button>
        </div>
      )}

      {/* Meeting cards grid */}
      {meetings.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}>
          {meetings.map(meeting => (
            <div
              key={meeting.id}
              className="card animate-fade-in"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderColor: meeting.status === 'RECORDING' ? 'rgba(239,68,68,0.4)' : undefined,
              }}
              onClick={() => router.push(`/meetings/${meeting.id}`)}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: '0 0 6px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {meeting.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className={`badge ${PLATFORM_BADGE[meeting.platform] || 'badge-gray'}`}>
                      {PLATFORM_LABELS[meeting.platform] || meeting.platform}
                    </span>
                    <span className={`badge ${STATUS_BADGE[meeting.status] || 'badge-gray'}`}
                      style={meeting.status === 'RECORDING' ? { animation: 'pulse-text 1s infinite' } : undefined}>
                      {STATUS_LABEL[meeting.status] || meeting.status}
                    </span>
                  </div>
                </div>
                <button
                  className="btn-ghost"
                  onClick={(e) => { e.stopPropagation(); handleDelete(meeting.id, meeting.title) }}
                  disabled={deletingId === meeting.id}
                  style={{
                    padding: '4px 8px',
                    fontSize: '14px',
                    color: 'var(--color-text-muted)',
                    flexShrink: 0,
                  }}
                >
                  🗑
                </button>
              </div>

              {/* Meta */}
              <div style={{
                display: 'flex',
                gap: '12px',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                marginBottom: meeting.summary ? '12px' : 0,
                flexWrap: 'wrap',
              }}>
                <span>📅 {formatDate(meeting.meetingDate)}</span>
                <span>⏱ {formatDuration(meeting.durationSeconds)}</span>
                {meeting.project && <span>📁 {meeting.project.name}</span>}
              </div>

              {/* Summary preview */}
              {meeting.summary && (
                <p style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: '1.5',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                } as any}>
                  {meeting.summary.summary.substring(0, 120)}
                  {meeting.summary.summary.length > 120 ? '...' : ''}
                </p>
              )}

              {meeting.status === 'PROCESSING' && !meeting.summary && (
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>
                  ⟳ Gerando resumo com IA...
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse-text { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}
