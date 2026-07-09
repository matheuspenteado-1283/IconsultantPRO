'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateActionItemStatus, deleteMeeting, syncVexaMeeting, stopVexaMeeting } from '../actions'

interface MeetingDetailClientProps {
  meeting: {
    id: string
    title: string
    platform: string
    meetingDate: Date | string
    durationSeconds: number | null
    participants: string[]
    status: string
    project: { id: string; name: string } | null
    vexaBotId?: string | null
    vexaMeetingUrl?: string | null
    vexaMeetingId?: string | null
    transcription: { fullText: string; source: string | null; language: string | null } | null
    summary: {
      summary: string
      keyPoints: string[]
      decisions: string[]
      nextSteps: string[]
      sentiment: string | null
    } | null
    actionItems: Array<{
      id: string
      description: string
      responsible: string | null
      dueDate: Date | string | null
      status: string
    }>
    createdBy: { name: string | null; email: string }
  }
}

const PLATFORM_LABELS: Record<string, string> = {
  TEAMS: '🟦 Microsoft Teams',
  GOOGLE_MEET: '🟩 Google Meet',
  ZOOM: '🔵 Zoom',
  WEBEX: '🔴 Webex',
  OTHER: '⚪ Outro',
}

const SENTIMENT_BADGE: Record<string, string> = {
  positivo: 'badge-green',
  neutro: 'badge-blue',
  tenso: 'badge-red',
  produtivo: 'badge-yellow',
}

const ACTION_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em andamento',
  DONE: 'Concluído',
  CANCELLED: 'Cancelado',
}

const ACTION_STATUS_BADGE: Record<string, string> = {
  OPEN: 'badge-gray',
  IN_PROGRESS: 'badge-yellow',
  DONE: 'badge-green',
  CANCELLED: 'badge-red',
}

function formatDate(d: Date | string | null): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(secs: number | null): string {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}min ${s}s`
}

function formatShortDate(d: Date | string | null): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type Tab = 'summary' | 'actions' | 'transcript' | 'info'

export function MeetingDetailClient({ meeting }: MeetingDetailClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [searchText, setSearchText] = useState('')
  const [copiedTranscript, setCopiedTranscript] = useState(false)
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
  const [localActionItems, setLocalActionItems] = useState(meeting.actionItems)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)

  const handleSyncVexa = async () => {
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await syncVexaMeeting(meeting.id)
      if (res.error) {
        setSyncError(res.error)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      setSyncError(err.message || 'Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const handleStopVexa = async () => {
    if (!confirm('Deseja realmente encerrar a gravação do Bot do Vexa e gerar o resumo?')) return
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await stopVexaMeeting(meeting.id)
      if (res.error) {
        setSyncError(res.error)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      setSyncError(err.message || 'Erro ao parar bot')
    } finally {
      setSyncing(false)
    }
  }

  const handleActionStatusChange = async (id: string, newStatus: string) => {
    setUpdatingItemId(id)
    const result = await updateActionItemStatus(id, newStatus)
    if (!result.error) {
      setLocalActionItems(prev =>
        prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
      )
    }
    setUpdatingItemId(null)
  }

  const handleDelete = async () => {
    if (!confirm(`Excluir a reunião "${meeting.title}"? Esta ação não pode ser desfeita.`)) return
    await deleteMeeting(meeting.id)
    router.push('/meetings')
    router.refresh()
  }

  const handleCopyTranscript = () => {
    if (meeting.transcription?.fullText) {
      navigator.clipboard.writeText(meeting.transcription.fullText)
      setCopiedTranscript(true)
      setTimeout(() => setCopiedTranscript(false), 2000)
    }
  }

  const getHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? `<mark style="background:rgba(251,191,36,0.3);color:inherit;border-radius:2px">${part}</mark>`
        : part
    ).join('')
  }

  const doneCount = localActionItems.filter(i => i.status === 'DONE').length

  const tabs: { id: Tab; label: string }[] = [
    { id: 'summary', label: '📊 Resumo' },
    { id: 'actions', label: `✅ Ações (${localActionItems.length})` },
    { id: 'transcript', label: '📝 Transcrição' },
    { id: 'info', label: 'ℹ️ Informações' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Back + Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          className="btn-ghost"
          onClick={() => router.back()}
          style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          ← Voltar
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
              {meeting.title}
            </h1>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-blue">{PLATFORM_LABELS[meeting.platform] || meeting.platform}</span>
              <span className="badge badge-gray">{formatDate(meeting.meetingDate)}</span>
              {meeting.durationSeconds && (
                <span className="badge badge-gray">⏱ {formatDuration(meeting.durationSeconds)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '24px',
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? '#60a5fa' : 'var(--color-text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* === SUMMARY TAB === */}
      {activeTab === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {meeting.status !== 'COMPLETED' && meeting.status !== 'ERROR' && !meeting.vexaMeetingId && (
            <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{
                display: 'inline-block', width: '40px', height: '40px',
                border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#60a5fa',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px',
              }} />
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Processando reunião... Aguarde.</p>
            </div>
          )}

          {meeting.vexaMeetingId && (meeting.status === 'RECORDING' || meeting.status === 'PROCESSING' || meeting.status === 'PENDING') && (
            <div className="card" style={{
              background: 'rgba(16,185,129,0.04)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '48px', animation: meeting.status === 'RECORDING' ? 'pulse-text 1.5s infinite' : 'none' }}>
                🤖
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
                  {meeting.status === 'RECORDING' && 'Agente Vexa está Gravando a Reunião'}
                  {meeting.status === 'PROCESSING' && 'Agente Vexa Processando Resumo...'}
                  {meeting.status === 'PENDING' && 'Agente Vexa Aguardando Início...'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, maxWidth: '500px' }}>
                  O Bot do Vexa está conectado à chamada. Você pode acompanhar a gravação, obter transcrições parciais ou parar a gravação para gerar o resumo completo.
                </p>
                {meeting.vexaMeetingUrl && (
                  <p style={{ fontSize: '13px', marginTop: '8px', margin: 0 }}>
                    🔗 Link da reunião: <a href={meeting.vexaMeetingUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>{meeting.vexaMeetingUrl}</a>
                  </p>
                )}
              </div>

              {syncError && (
                <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
                  ⚠️ {syncError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  className="btn-secondary"
                  onClick={handleSyncVexa}
                  disabled={syncing}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {syncing ? '⟳ Sincronizando...' : '🔄 Sincronizar Transcrição'}
                </button>
                {meeting.status === 'RECORDING' && (
                  <button
                    className="btn-primary"
                    onClick={handleStopVexa}
                    disabled={syncing}
                    style={{
                      background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ⏹ Encerrar e Resumir
                  </button>
                )}
              </div>
            </div>
          )}

          {meeting.summary && (
            <>
              {/* Main summary */}
              <div className="card" style={{ borderLeft: '3px solid #60a5fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Resumo Executivo
                  </h3>
                  {meeting.summary.sentiment && (
                    <span className={`badge ${SENTIMENT_BADGE[meeting.summary.sentiment] || 'badge-gray'}`}>
                      Sentimento: {meeting.summary.sentiment}
                    </span>
                  )}
                </div>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', margin: 0, fontSize: '14px' }}>
                  {meeting.summary.summary}
                </p>
              </div>

              {/* 3-column grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {/* Key Points */}
                <div className="card">
                  <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    📌 Pontos Principais
                  </h4>
                  {meeting.summary.keyPoints.length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {meeting.summary.keyPoints.map((pt, i) => (
                        <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          <span style={{ color: '#60a5fa', flexShrink: 0 }}>•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>Nenhum ponto registrado.</p>
                  )}
                </div>

                {/* Decisions */}
                <div className="card">
                  <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ⚖️ Decisões
                  </h4>
                  {meeting.summary.decisions.length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {meeting.summary.decisions.map((d, i) => (
                        <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          <span style={{ color: '#34d399', flexShrink: 0 }}>✓</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>Nenhuma decisão registrada.</p>
                  )}
                </div>

                {/* Next Steps */}
                <div className="card">
                  <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🚀 Próximos Passos
                  </h4>
                  {meeting.summary.nextSteps.length > 0 ? (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {meeting.summary.nextSteps.map((ns, i) => (
                        <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          <span style={{ color: '#f59e0b', flexShrink: 0 }}>→</span>
                          <span>{ns}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>Nenhum próximo passo registrado.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* === ACTIONS TAB === */}
      {activeTab === 'actions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Itens de Ação
            </h3>
            {localActionItems.length > 0 && (
              <span className="badge badge-green">
                {doneCount} de {localActionItems.length} concluídos
              </span>
            )}
          </div>

          {localActionItems.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              Nenhum item de ação encontrado para esta reunião.
            </div>
          ) : (
            <div className="table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Tarefa', 'Responsável', 'Prazo', 'Status'].map(col => (
                      <th key={col} style={{
                        padding: '10px 16px', fontSize: '12px', fontWeight: 700,
                        color: 'var(--color-text-muted)', textAlign: 'left',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localActionItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text-primary)', maxWidth: '300px' }}>
                        {item.description}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {item.responsible || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {formatShortDate(item.dueDate)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          className="input"
                          value={item.status}
                          disabled={updatingItemId === item.id}
                          onChange={(e) => handleActionStatusChange(item.id, e.target.value)}
                          style={{ fontSize: '12px', padding: '4px 8px', minWidth: '130px' }}
                        >
                          {Object.entries(ACTION_STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* === TRANSCRIPT TAB === */}
      {activeTab === 'transcript' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              className="input"
              placeholder="🔍 Buscar no texto..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <button
              className="btn-secondary"
              onClick={handleCopyTranscript}
              disabled={!meeting.transcription}
            >
              {copiedTranscript ? '✓ Copiado!' : '📋 Copiar tudo'}
            </button>
          </div>

          {meeting.transcription ? (
            <div
              ref={transcriptRef}
              className="card"
              style={{
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.8',
                color: 'var(--color-text-secondary)',
                maxHeight: '500px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              dangerouslySetInnerHTML={{
                __html: getHighlightedText(meeting.transcription.fullText, searchText)
              }}
            />
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              {meeting.status === 'PROCESSING'
                ? 'Transcrição sendo gerada...'
                : 'Nenhuma transcrição disponível.'}
            </div>
          )}

          {meeting.transcription?.source && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              Fonte: {meeting.transcription.source === 'whisper' ? 'OpenAI Whisper' : 'Web Speech API'}{' '}
              {meeting.transcription.language && `• Idioma: ${meeting.transcription.language}`}
            </p>
          )}
        </div>
      )}

      {/* === INFO TAB === */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Metadados da Reunião
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}>
              {[
                { label: 'Plataforma', value: PLATFORM_LABELS[meeting.platform] || meeting.platform },
                { label: 'Data / Hora', value: formatDate(meeting.meetingDate) },
                { label: 'Duração', value: formatDuration(meeting.durationSeconds) },
                { label: 'Projeto', value: meeting.project?.name || '— Avulso —' },
                { label: 'Criado por', value: meeting.createdBy.name || meeting.createdBy.email },
                { label: 'Participantes', value: meeting.participants.length > 0 ? meeting.participants.join(', ') : '—' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <button
              className="btn-primary"
              onClick={handleDelete}
              style={{
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🗑 Excluir Reunião
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-text { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
      `}</style>
    </div>
  )
}
