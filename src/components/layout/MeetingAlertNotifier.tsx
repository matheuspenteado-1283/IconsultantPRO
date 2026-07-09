'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getPendingUpcomingMeetings, startVexaForExistingMeeting } from '@/app/(dashboard)/meetings/actions'

interface MeetingAlert {
  id: string
  title: string
  meetingDate: Date | string
}

export function MeetingAlertNotifier() {
  const router = useRouter()
  const [activeMeeting, setActiveMeeting] = useState<MeetingAlert | null>(null)
  const [meetingUrl, setMeetingUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Check for upcoming meetings every 25 seconds
    const checkMeetings = async () => {
      try {
        const upcoming = await getPendingUpcomingMeetings()
        if (upcoming && upcoming.length > 0) {
          const first = upcoming[0]
          
          // Check if this meeting has been dismissed in this session
          const isDismissed = sessionStorage.getItem(`meeting_dismissed_${first.id}`)
          if (!isDismissed) {
            setActiveMeeting(first)
          }
        } else {
          setActiveMeeting(null)
        }
      } catch (err) {
        console.error('Failed to check upcoming meetings:', err)
      }
    }

    // Run initially and then on interval
    checkMeetings()
    const interval = setInterval(checkMeetings, 25000)

    return () => clearInterval(interval)
  }, [])

  const handleDismiss = () => {
    if (activeMeeting) {
      sessionStorage.setItem(`meeting_dismissed_${activeMeeting.id}`, 'true')
    }
    setActiveMeeting(null)
    setMeetingUrl('')
    setErrorMsg(null)
    setSuccess(false)
  }

  const handleStartVexa = async () => {
    if (!activeMeeting) return
    if (!meetingUrl.trim()) {
      alert('Por favor, informe a URL da reunião.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await startVexaForExistingMeeting(activeMeeting.id, meetingUrl)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccess(true)
        // Redirect to the meeting details after 1.5 seconds
        setTimeout(() => {
          router.push(`/meetings/${activeMeeting.id}`)
          router.refresh()
          handleDismiss()
        }, 1500)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao despachar o bot')
    } finally {
      setLoading(false)
    }
  }

  if (!activeMeeting) return null

  return (
    <div
      className="meeting-alert-toast animate-slide-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '380px',
        maxWidth: 'calc(100vw - 48px)',
        background: 'rgba(23, 23, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(96, 165, 250, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        padding: '20px',
        zIndex: 9999,
        color: '#f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', animation: 'bell-ring 2s ease infinite' }}>📅</span>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#60a5fa', letterSpacing: '0.05em' }}>
            REUNIÃO COMEÇANDO
          </span>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      {!success ? (
        <>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: '#f9fafb' }}>
              {activeMeeting.title}
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              Deseja gravar e transcrever esta reunião automaticamente com o Vexa?
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af' }}>Link da Reunião (Meet, Teams, Zoom)</label>
            <input
              type="text"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/..."
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {errorMsg && (
            <p style={{ fontSize: '12px', color: '#f87171', margin: 0 }}>
              ⚠️ {errorMsg}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleDismiss}
              disabled={loading}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#d1d5db',
                padding: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Dispensar
            </button>
            <button
              onClick={handleStartVexa}
              disabled={loading}
              style={{
                flex: 2,
                background: 'linear-gradient(135deg, #3b82f6, #10b981)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                padding: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {loading ? '🤖 Despachando...' : '🤖 Gravar com Vexa'}
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤖✅</div>
          <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: '#34d399' }}>
            Bot Despachado!
          </h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
            O Agente Vexa entrou na chamada. Redirecionando...
          </p>
        </div>
      )}

      <style>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0); }
          10%, 30% { transform: rotate(10deg); }
          20%, 40% { transform: rotate(-10deg); }
          50% { transform: rotate(0); }
        }
        .animate-slide-in {
          animation: toast-slide-in 0.3s ease-out forwards;
        }
        @keyframes toast-slide-in {
          from { transform: translateX(100%) translateY(20px); opacity: 0; }
          to { transform: translateX(0) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
