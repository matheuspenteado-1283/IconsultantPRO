'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createMeeting, updateMeetingDuration, startVexaMeeting } from '../actions'

type RecorderState =
  | 'idle'
  | 'setup'
  | 'requesting'
  | 'recording'
  | 'processing'
  | 'done'
  | 'error'

interface MeetingRecorderProps {
  projects: Array<{ id: string; name: string }>
  onClose: () => void
  onComplete: (meetingId: string) => void
}

const PLATFORMS = [
  { value: 'TEAMS', label: 'Microsoft Teams' },
  { value: 'GOOGLE_MEET', label: 'Google Meet' },
  { value: 'ZOOM', label: 'Zoom' },
  { value: 'WEBEX', label: 'Webex' },
  { value: 'OTHER', label: 'Outro' },
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function MeetingRecorder({ projects, onClose, onComplete }: MeetingRecorderProps) {
  const [state, setState] = useState<RecorderState>('setup')
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('TEAMS')
  const [projectId, setProjectId] = useState('')
  const [participants, setParticipants] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [meetingId, setMeetingId] = useState('')
  const [completedId, setCompletedId] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [processingStep, setProcessingStep] = useState('Transcrevendo...')
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(5))
  const [mode, setMode] = useState<'local' | 'vexa'>('vexa')
  const [meetingUrl, setMeetingUrl] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const transcriptPartsRef = useRef<string[]>([])
  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const displayStreamRef = useRef<MediaStream | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const stopStreams = useCallback(() => {
    displayStreamRef.current?.getTracks().forEach(t => t.stop())
    displayStreamRef.current = null
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    micStreamRef.current = null
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {})
      }
      audioCtxRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      stopStreams()
    }
  }, [stopStreams])

  const animateWaveform = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    // Take 32 evenly spaced samples
    const step = Math.floor(data.length / 32)
    const bars = Array.from({ length: 32 }, (_, i) => {
      const val = data[i * step] || 0
      return Math.max(4, Math.round((val / 255) * 60))
    })
    setWaveformData(bars)
    animFrameRef.current = requestAnimationFrame(animateWaveform)
  }, [])

  const handleStart = async () => {
    if (!title.trim()) {
      alert('Informe o título da reunião.')
      return
    }

    setState('requesting')

    try {
      // 1. Create meeting record first
      const result = await createMeeting({ title, platform, projectId: projectId || undefined, participants })
      if (result.error || !result.meetingId) {
        setErrorMsg(result.error || 'Erro ao criar reunião')
        setState('error')
        return
      }
      setMeetingId(result.meetingId)

      // 2. Capture display audio (system sound)
      let displayStream: MediaStream | null = null
      try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({ video: false, audio: true } as any)
        displayStreamRef.current = displayStream
      } catch {
        // User cancelled or no system audio — continue with mic only
      }

      // 3. Capture microphone
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = micStream

      // 4. Mix streams via AudioContext
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const dest = ctx.createMediaStreamDestination()
      const micSource = ctx.createMediaStreamSource(micStream)
      micSource.connect(dest)

      if (displayStream && displayStream.getAudioTracks().length > 0) {
        const displaySource = ctx.createMediaStreamSource(displayStream)
        displaySource.connect(dest)
      }

      // 5. Analyser for waveform
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      micSource.connect(analyser)
      analyserRef.current = analyser

      // 6. Setup MediaRecorder
      chunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(dest.stream, { mimeType })
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.start(5000)

      // 7. Web Speech API fallback
      transcriptPartsRef.current = []
      if (typeof window !== 'undefined') {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRec) {
          const recognition = new SpeechRec()
          recognition.lang = 'pt-BR'
          recognition.continuous = true
          recognition.interimResults = false
          recognition.onresult = (e: any) => {
            for (let i = e.resultIndex; i < e.results.length; i++) {
              if (e.results[i].isFinal) {
                transcriptPartsRef.current.push(e.results[i][0].transcript)
              }
            }
          }
          recognition.onerror = () => { /* silent */ }
          recognition.start()
          recognitionRef.current = recognition
        }
      }

      // 8. Timer
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      // 9. Start waveform animation
      animFrameRef.current = requestAnimationFrame(animateWaveform)

      setState('recording')
    } catch (err: any) {
      stopStreams()
      setErrorMsg(err?.message || 'Erro ao acessar mídia. Verifique as permissões do navegador.')
      setState('error')
    }
  }

  const handleStartVexa = async () => {
    if (!title.trim()) {
      alert('Informe o título da reunião.')
      return
    }
    if (!meetingUrl.trim()) {
      alert('Informe o link da reunião (Google Meet, Zoom ou MS Teams).')
      return
    }

    setState('processing')
    setProcessingStep('Despachando Bot de IA do Vexa para a reunião...')

    try {
      const result = await startVexaMeeting({
        title,
        meetingUrl,
        projectId: projectId || undefined,
        participants
      })

      if (result.error) {
        setErrorMsg(result.error)
        setState('error')
      } else if (result.meetingId) {
        setCompletedId(result.meetingId)
        setState('done')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao despachar bot')
      setState('error')
    }
  }

  const handleStop = async () => {
    if (!mediaRecorderRef.current) return

    const durationSecs = Math.floor((Date.now() - startTimeRef.current) / 1000)
    stopStreams()
    recognitionRef.current?.stop()

    setState('processing')
    setProcessingStep('Transcrevendo...')

    // Stop recorder and collect final chunks
    await new Promise<void>((resolve) => {
      const rec = mediaRecorderRef.current!
      rec.onstop = () => resolve()
      rec.stop()
    })

    // Update duration
    await updateMeetingDuration(meetingId, durationSecs)

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const form = new FormData()
    form.append('audio', blob, 'recording.webm')
    form.append('transcript', transcriptPartsRef.current.join(' '))
    form.append('transcriptSource', 'webspeech')
    form.append('meetingId', meetingId)

    setProcessingStep('Gerando resumo com IA...')

    try {
      const res = await fetch('/api/meetings/process', { method: 'POST', body: form })
      const data = await res.json()
      if (data.success) {
        setCompletedId(meetingId)
        setState('done')
      } else {
        setErrorMsg(data.error || 'Erro no processamento')
        setState('error')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro de rede')
      setState('error')
    }
  }

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget && state !== 'recording' && state !== 'processing') onClose() }}
    >
      <div
        className="modal-content"
        style={{
          width: '600px',
          maxWidth: '95vw',
          padding: '32px',
          position: 'relative',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '28px' }}>🎙️</span>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {state === 'setup' && 'Nova Reunião'}
              {state === 'requesting' && 'Preparando gravação...'}
              {state === 'recording' && 'Reunião em andamento'}
              {state === 'processing' && 'Processando reunião'}
              {state === 'done' && 'Reunião processada!'}
              {state === 'error' && 'Erro na gravação'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
              {state === 'setup' && 'Configure os dados antes de iniciar a gravação'}
              {state === 'requesting' && 'Aguardando permissão de tela e microfone...'}
              {state === 'recording' && 'Gravando áudio e gerando transcrição em tempo real'}
              {state === 'processing' && processingStep}
              {state === 'done' && 'Transcrição e resumo gerados com sucesso'}
              {state === 'error' && 'Ocorreu um erro durante o processamento'}
            </p>
          </div>
          {state !== 'recording' && state !== 'processing' && (
            <button
              onClick={onClose}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* SETUP STATE */}
        {state === 'setup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tabs Selector for local vs vexa bot */}
            <div style={{
              display: 'flex',
              gap: '4px',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: '4px',
            }}>
              <button
                type="button"
                onClick={() => setMode('local')}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: mode === 'local' ? 700 : 500,
                  color: mode === 'local' ? '#60a5fa' : 'var(--color-text-secondary)',
                  background: 'none',
                  border: 'none',
                  borderBottom: mode === 'local' ? '2px solid #60a5fa' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🎙️ Gravação Local
              </button>
              <button
                type="button"
                onClick={() => setMode('vexa')}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: mode === 'vexa' ? 700 : 500,
                  color: mode === 'vexa' ? '#60a5fa' : 'var(--color-text-secondary)',
                  background: 'none',
                  border: 'none',
                  borderBottom: mode === 'vexa' ? '2px solid #60a5fa' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🤖 Agente Vexa (Bot)
              </button>
            </div>

            <div>
              <label className="input-label">Título da Reunião *</label>
              <input
                className="input"
                placeholder="Ex: Alinhamento SAP FI - Sprint 3"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            
            {mode === 'local' ? (
              <div>
                <label className="input-label">Plataforma</label>
                <select
                  className="input"
                  value={platform}
                  onChange={e => setPlatform(e.target.value)}
                >
                  {PLATFORMS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="input-label">Link da Reunião (Google Meet, Zoom ou Teams) *</label>
                <input
                  className="input"
                  placeholder="https://meet.google.com/abc-defg-hij ou link do Zoom/Teams"
                  value={meetingUrl}
                  onChange={e => setMeetingUrl(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="input-label">Projeto (opcional)</label>
              <select
                className="input"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
              >
                <option value="">— Sem vínculo com projeto —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Participantes (separados por vírgula)</label>
              <input
                className="input"
                placeholder="Ex: João Silva, Maria Costa, Pedro Alves"
                value={participants}
                onChange={e => setParticipants(e.target.value)}
              />
            </div>

            {mode === 'local' ? (
              <div
                style={{
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.5',
                }}
              >
                💡 <strong>Como funciona:</strong> O navegador irá solicitar permissão para capturar o áudio da tela (para som do sistema) e do microfone. A transcrição é gerada automaticamente com IA.
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.5',
                }}
              >
                🤖 <strong>Como funciona:</strong> O assistente de reuniões do Vexa entrará na chamada como participante secundário para gravar e transcrever a reunião diretamente da plataforma (Google Meet, Teams ou Zoom). Você não precisa manter esta aba aberta.
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>
                Cancelar
              </button>
              {mode === 'local' ? (
                <button className="btn-primary" onClick={handleStart} style={{ flex: 2 }}>
                  🎙️ Iniciar Gravação
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handleStartVexa}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, var(--color-primary, #3b82f6), #10b981)',
                  }}
                >
                  🤖 Despachar Agente Vexa
                </button>
              )}
            </div>
          </div>
        )}

        {/* REQUESTING STATE */}
        {state === 'requesting' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖥️</div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
              O navegador vai solicitar permissão para compartilhar sua tela.<br />
              <strong>Selecione uma aba ou janela</strong> e marque a opção <strong>"Compartilhar áudio"</strong>.<br />
              Em seguida, confirme o acesso ao microfone.
            </p>
            <div style={{ marginTop: '24px' }}>
              <div style={{
                display: 'inline-block',
                width: '40px',
                height: '40px',
                border: '3px solid rgba(59,130,246,0.3)',
                borderTopColor: '#60a5fa',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          </div>
        )}

        {/* RECORDING STATE */}
        {state === 'recording' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Timer + indicator */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  animation: 'pulse-red 1s ease-in-out infinite',
                }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>GRAVANDO</span>
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: 800,
                fontFamily: 'monospace',
                color: 'var(--color-text-primary)',
                letterSpacing: '0.05em',
              }}>
                {formatTime(elapsed)}
              </div>
            </div>

            {/* Platform badge */}
            <div style={{ textAlign: 'center' }}>
              <span className={`badge badge-blue`}>
                {PLATFORMS.find(p => p.value === platform)?.label || platform}
              </span>
              {' '}
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{title}</span>
            </div>

            {/* Waveform */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '3px',
              height: '64px',
              background: 'var(--color-bg-primary)',
              borderRadius: '10px',
              padding: '8px 12px',
            }}>
              {waveformData.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: '5px',
                    height: `${h}px`,
                    background: `rgba(96,165,250,${0.5 + (h / 60) * 0.5})`,
                    borderRadius: '3px',
                    transition: 'height 0.08s ease',
                  }}
                />
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={handleStop}
              style={{
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                fontSize: '16px',
                padding: '14px 24px',
                borderRadius: '10px',
              }}
            >
              ⏹ Encerrar Reunião
            </button>
          </div>
        )}

        {/* PROCESSING STATE */}
        {state === 'processing' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              display: 'inline-block',
              width: '56px',
              height: '56px',
              border: '4px solid rgba(59,130,246,0.2)',
              borderTopColor: '#60a5fa',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '20px',
            }} />
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {processingStep}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              Isso pode levar alguns segundos...
            </p>
          </div>
        )}

        {/* DONE STATE */}
        {state === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Reunião processada!
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              Transcrição e resumo gerados com sucesso pela IA.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn-secondary"
                onClick={onClose}
              >
                Fechar
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  onComplete(completedId)
                  onClose()
                }}
              >
                Ver Reunião →
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {state === 'error' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <p style={{ fontSize: '15px', color: '#ef4444', marginBottom: '8px', fontWeight: 600 }}>
              Erro na gravação
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              {errorMsg}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={onClose}>Fechar</button>
              <button className="btn-primary" onClick={() => setState('setup')}>Tentar novamente</button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse-red {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}
