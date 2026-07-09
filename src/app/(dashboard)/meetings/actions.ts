'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { auth } from '@/auth'

export async function createMeeting(data: {
  title: string
  platform: string
  projectId?: string
  participants?: string
}) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  const userId = session?.user?.id
  if (!session || !orgId || !userId) return { error: 'Não autorizado' }

  try {
    const participantsList = data.participants
      ? data.participants.split(',').map(p => p.trim()).filter(Boolean)
      : []

    const meeting = await db.meeting.create({
      data: {
        organizationId: orgId,
        projectId: data.projectId || null,
        title: data.title,
        platform: data.platform as any,
        participants: participantsList,
        status: 'PENDING',
        createdById: userId,
      }
    })
    revalidatePath('/meetings')
    return { success: true, meetingId: meeting.id }
  } catch (error: any) {
    return { error: error.message || 'Erro ao criar reunião' }
  }
}

export async function updateMeetingDuration(meetingId: string, durationSeconds: number) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }

  try {
    await db.meeting.update({
      where: { id: meetingId, organizationId: orgId },
      data: { durationSeconds }
    })
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateActionItemStatus(id: string, status: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }

  try {
    await db.meetingActionItem.update({
      where: { id },
      data: { status: status as any }
    })
    revalidatePath('/meetings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteMeeting(id: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }

  try {
    const meeting = await db.meeting.findFirst({ where: { id, organizationId: orgId } })
    if (!meeting) return { error: 'Reunião não encontrada' }
    await db.meeting.delete({ where: { id } })
    revalidatePath('/meetings')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function startVexaMeeting(data: {
  title: string
  meetingUrl: string
  projectId?: string
  participants?: string
}) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  const userId = session?.user?.id
  if (!session || !orgId || !userId) return { error: 'Não autorizado' }

  const vexaApiKey = process.env.VEXA_API_KEY
  const vexaApiUrl = process.env.VEXA_API_URL || 'https://api.cloud.vexa.ai'

  if (!vexaApiKey || vexaApiKey.includes('placeholder')) {
    return { error: 'VEXA_API_KEY não configurada no servidor. Por favor, adicione-a em .env.local.' }
  }

  // Parse platform and native meeting ID (Vexa API expects 'google_meet', 'zoom', 'teams' or 'browser_session')
  let platform: 'google_meet' | 'teams' | 'zoom' | 'browser_session' | 'other' = 'other'
  let nativeId = data.meetingUrl.trim()
  let passcode: string | undefined = undefined

  const url = data.meetingUrl.trim()
  if (url.includes('meet.google.com')) {
    platform = 'google_meet'
    const match = url.match(/meet\.google\.com\/([a-z0-9\-]+)/i)
    nativeId = match ? match[1] : url
  } else if (url.includes('zoom.us')) {
    platform = 'zoom'
    const match = url.match(/zoom\.us\/[j|s]\/([0-9]+)/i)
    nativeId = match ? match[1] : url
  } else if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) {
    platform = 'teams'
    const match = url.match(/\/meet\/([0-9a-zA-Z\-]+)/i)
    nativeId = match ? match[1] : url
    const pMatch = url.match(/[?&]p=([a-zA-Z0-9]+)/)
    if (pMatch) {
      passcode = pMatch[1]
    }
  } else if (url.includes('webex.com')) {
    // If Webex is not natively supported by Vexa bots, use browser_session or other fallback
    platform = 'other'
    nativeId = url
  }

  // Map platform to Prisma MeetingPlatform enum
  let dbPlatform: 'GOOGLE_MEET' | 'TEAMS' | 'ZOOM' | 'WEBEX' | 'OTHER' = 'OTHER'
  if (platform === 'google_meet') dbPlatform = 'GOOGLE_MEET'
  else if (platform === 'teams') dbPlatform = 'TEAMS'
  else if (platform === 'zoom') dbPlatform = 'ZOOM'

  try {
    // 1. Request bot from Vexa
    const vexaRes = await fetch(`${vexaApiUrl}/bots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': vexaApiKey
      },
      body: JSON.stringify({
        platform,
        native_meeting_id: nativeId,
        ...(passcode ? { passcode } : {})
      })
    })

    if (!vexaRes.ok) {
      const errorText = await vexaRes.text()
      console.error('Vexa API error:', errorText)
      return { error: `Erro na API do Vexa: ${errorText || vexaRes.statusText}` }
    }

    const vexaData = await vexaRes.json()
    const botId = vexaData.id || vexaData.bot_id || null

    const participantsList = data.participants
      ? data.participants.split(',').map(p => p.trim()).filter(Boolean)
      : []

    // 2. Save meeting in database
    const meeting = await db.meeting.create({
      data: {
        organizationId: orgId,
        projectId: data.projectId || null,
        title: data.title,
        platform: dbPlatform,
        participants: participantsList,
        status: 'RECORDING', // bot starts recording
        createdById: userId,
        vexaBotId: botId,
        vexaMeetingUrl: data.meetingUrl,
        vexaMeetingId: nativeId,
      }
    })

    revalidatePath('/meetings')
    return { success: true, meetingId: meeting.id }
  } catch (error: any) {
    console.error('startVexaMeeting error:', error)
    return { error: error.message || 'Erro ao iniciar reunião com Vexa' }
  }
}

export async function syncVexaMeeting(meetingId: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }

  try {
    const meeting = await db.meeting.findFirst({
      where: { id: meetingId, organizationId: orgId }
    })

    if (!meeting) return { error: 'Reunião não encontrada' }
    if (!meeting.vexaMeetingId) return { error: 'Esta não é uma reunião gerenciada pelo Vexa' }

    // Map Prisma MeetingPlatform to Vexa platform query ('google_meet', 'zoom', 'teams')
    let vexaPlatform = 'google_meet'
    if (meeting.platform === 'TEAMS') vexaPlatform = 'teams'
    else if (meeting.platform === 'ZOOM') vexaPlatform = 'zoom'
    else if (meeting.platform === 'WEBEX') vexaPlatform = 'webex'
    else if (meeting.platform === 'OTHER') vexaPlatform = 'other'

    const vexaApiKey = process.env.VEXA_API_KEY
    const vexaApiUrl = process.env.VEXA_API_URL || 'https://api.cloud.vexa.ai'

    if (!vexaApiKey || vexaApiKey.includes('placeholder')) {
      return { error: 'VEXA_API_KEY não configurada no servidor. Por favor, adicione-a em .env.local.' }
    }

    // Fetch transcript from Vexa
    const transcriptRes = await fetch(`${vexaApiUrl}/transcripts/${vexaPlatform}/${meeting.vexaMeetingId}`, {
      headers: {
        'X-API-Key': vexaApiKey
      }
    })

    if (!transcriptRes.ok) {
      const errorText = await transcriptRes.text()
      return { error: `Erro ao buscar transcrição do Vexa: ${errorText || transcriptRes.statusText}` }
    }

    const rawData = await transcriptRes.json()
    let fullText = ''

    if (Array.isArray(rawData)) {
      fullText = rawData.map((seg: any) => {
        const speaker = seg.speaker || seg.speaker_name || 'Participante'
        const text = seg.text || seg.content || ''
        return `${speaker}: ${text}`
      }).join('\n')
    } else if (typeof rawData === 'object' && rawData !== null) {
      if (typeof rawData.transcript === 'string') {
        fullText = rawData.transcript
      } else if (typeof rawData.text === 'string') {
        fullText = rawData.text
      } else if (Array.isArray(rawData.segments)) {
        fullText = rawData.segments.map((seg: any) => {
          const speaker = seg.speaker || 'Participante'
          const text = seg.text || ''
          return `${speaker}: ${text}`
        }).join('\n')
      } else if (Array.isArray(rawData.transcripts)) {
        fullText = rawData.transcripts.map((t: any) => t.text || '').join('\n')
      } else {
        fullText = JSON.stringify(rawData)
      }
    } else if (typeof rawData === 'string') {
      fullText = rawData
    }

    if (!fullText || fullText.trim().length === 0) {
      return { error: 'A transcrição do Vexa está vazia ou a chamada ainda não começou a gravar.' }
    }

    // Update status to processing to reflect status change
    await db.meeting.update({
      where: { id: meetingId },
      data: { status: 'PROCESSING' }
    })

    // Save/update transcription
    await db.meetingTranscription.upsert({
      where: { meetingId },
      create: {
        meetingId,
        fullText,
        source: 'vexa',
        language: 'pt',
      },
      update: {
        fullText,
        source: 'vexa',
      }
    })

    // Summarize using Claude (Anthropic API)
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    let summaryData: any = {
      summary: 'Resumo automático pendente devido à falta de chave Anthropic.',
      keyPoints: [],
      decisions: [],
      nextSteps: [],
      actionItems: [],
      sentiment: 'neutro',
    }

    if (anthropicKey && !anthropicKey.includes('configure') && !anthropicKey.includes('your_api_key')) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: `Você é um assistente especialista em gestão de projetos SAP. Analise a transcrição abaixo e retorne SOMENTE um JSON válido, sem markdown, sem explicações, com exatamente esta estrutura:

{
  "summary": "resumo executivo em 3-5 frases em português",
  "keyPoints": ["ponto principal 1", "ponto principal 2"],
  "decisions": ["decisão tomada 1", "decisão tomada 2"],
  "nextSteps": ["próximo passo 1 (com responsável se mencionado)"],
  "actionItems": [
    { "description": "tarefa", "responsible": "nome ou null", "dueDate": "YYYY-MM-DD ou null" }
  ],
  "sentiment": "positivo | neutro | tenso | produtivo"
}

Transcrição da reunião:
${fullText.substring(0, 8000)}`
            }
          ]
        })
      })

      if (claudeRes.ok) {
        const claudeJson = await claudeRes.json()
        const rawText = claudeJson.content?.[0]?.text || '{}'
        try {
          const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
          summaryData = JSON.parse(cleaned)
        } catch {
          console.error('Failed to parse Claude response:', rawText)
        }
      } else {
        console.error('Claude API error:', await claudeRes.text())
      }
    }

    // Save summary
    await db.meetingSummary.upsert({
      where: { meetingId },
      create: {
        meetingId,
        summary: summaryData.summary || '',
        keyPoints: summaryData.keyPoints || [],
        decisions: summaryData.decisions || [],
        nextSteps: summaryData.nextSteps || [],
        sentiment: summaryData.sentiment || 'neutro',
      },
      update: {
        summary: summaryData.summary || '',
        keyPoints: summaryData.keyPoints || [],
        decisions: summaryData.decisions || [],
        nextSteps: summaryData.nextSteps || [],
        sentiment: summaryData.sentiment || 'neutro',
      }
    })

    // Update action items (clear and recreate)
    await db.meetingActionItem.deleteMany({
      where: { meetingId }
    })

    if (Array.isArray(summaryData.actionItems) && summaryData.actionItems.length > 0) {
      await db.meetingActionItem.createMany({
        data: summaryData.actionItems.map((item: any) => ({
          meetingId,
          description: item.description || '',
          responsible: item.responsible || null,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          status: 'OPEN' as const,
        }))
      })
    }

    // Update meeting status to completed
    await db.meeting.update({
      where: { id: meetingId },
      data: { status: 'COMPLETED' }
    })

    revalidatePath('/meetings')
    revalidatePath(`/meetings/${meetingId}`)

    return { success: true }
  } catch (error: any) {
    console.error('syncVexaMeeting error:', error)
    await db.meeting.update({
      where: { id: meetingId },
      data: { status: 'RECORDING' } // Rollback to recording on error
    })
    return { error: error.message || 'Erro ao sincronizar transcrição' }
  }
}

export async function stopVexaMeeting(meetingId: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }

  try {
    const meeting = await db.meeting.findFirst({
      where: { id: meetingId, organizationId: orgId }
    })

    if (!meeting) return { error: 'Reunião não encontrada' }
    if (!meeting.vexaMeetingId) return { error: 'Esta não é uma reunião gerenciada pelo Vexa' }

    // Map Prisma MeetingPlatform to Vexa platform ('google_meet', 'zoom', 'teams')
    let vexaPlatform = 'google_meet'
    if (meeting.platform === 'TEAMS') vexaPlatform = 'teams'
    else if (meeting.platform === 'ZOOM') vexaPlatform = 'zoom'
    else if (meeting.platform === 'WEBEX') vexaPlatform = 'webex'

    const vexaApiKey = process.env.VEXA_API_KEY
    const vexaApiUrl = process.env.VEXA_API_URL || 'https://api.cloud.vexa.ai'

    if (!vexaApiKey || vexaApiKey.includes('placeholder')) {
      return { error: 'VEXA_API_KEY não configurada no servidor. Por favor, adicione-a em .env.local.' }
    }

    // Call DELETE /bots/{platform}/{meeting_id} to stop recording
    const stopRes = await fetch(`${vexaApiUrl}/bots/${vexaPlatform}/${meeting.vexaMeetingId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': vexaApiKey
      }
    })

    if (!stopRes.ok) {
      console.warn('Vexa stop bot returned non-2xx response:', await stopRes.text())
      // We still attempt to sync the transcript, in case it was already stopped or we want to pull what was recorded.
    }

    // Trigger sync to fetch the final transcript and summarize
    const syncRes = await syncVexaMeeting(meetingId)
    return syncRes
  } catch (error: any) {
    console.error('stopVexaMeeting error:', error)
    return { error: error.message || 'Erro ao parar bot do Vexa' }
  }
}

export async function getPendingUpcomingMeetings() {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return []

  try {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
    
    // Fetch meetings starting in the next 5 minutes or scheduled in the past but still PENDING
    const meetings = await db.meeting.findMany({
      where: {
        organizationId: orgId,
        status: 'PENDING',
        meetingDate: {
          lte: fiveMinutesFromNow
        }
      },
      select: {
        id: true,
        title: true,
        meetingDate: true,
      },
      orderBy: {
        meetingDate: 'asc'
      },
      take: 3
    })
    return meetings
  } catch (error) {
    console.error('getPendingUpcomingMeetings error:', error)
    return []
  }
}

export async function startVexaForExistingMeeting(meetingId: string, meetingUrl: string) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  if (!session || !orgId) return { error: 'Não autorizado' }

  const vexaApiKey = process.env.VEXA_API_KEY
  const vexaApiUrl = process.env.VEXA_API_URL || 'https://api.cloud.vexa.ai'

  if (!vexaApiKey || vexaApiKey.includes('placeholder')) {
    return { error: 'VEXA_API_KEY não configurada no servidor.' }
  }

  // Parse platform and native meeting ID (Vexa API expects 'google_meet', 'zoom', 'teams' or 'browser_session')
  let platform: 'google_meet' | 'teams' | 'zoom' | 'browser_session' | 'other' = 'other'
  let nativeId = meetingUrl.trim()
  let passcode: string | undefined = undefined

  const url = meetingUrl.trim()
  if (url.includes('meet.google.com')) {
    platform = 'google_meet'
    const match = url.match(/meet\.google\.com\/([a-z0-9\-]+)/i)
    nativeId = match ? match[1] : url
  } else if (url.includes('zoom.us')) {
    platform = 'zoom'
    const match = url.match(/zoom\.us\/[j|s]\/([0-9]+)/i)
    nativeId = match ? match[1] : url
  } else if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) {
    platform = 'teams'
    const match = url.match(/\/meet\/([0-9a-zA-Z\-]+)/i)
    nativeId = match ? match[1] : url
    const pMatch = url.match(/[?&]p=([a-zA-Z0-9]+)/)
    if (pMatch) {
      passcode = pMatch[1]
    }
  } else if (url.includes('webex.com')) {
    platform = 'other'
    nativeId = url
  }

  // Map platform to Prisma MeetingPlatform enum
  let dbPlatform: 'GOOGLE_MEET' | 'TEAMS' | 'ZOOM' | 'WEBEX' | 'OTHER' = 'OTHER'
  if (platform === 'google_meet') dbPlatform = 'GOOGLE_MEET'
  else if (platform === 'teams') dbPlatform = 'TEAMS'
  else if (platform === 'zoom') dbPlatform = 'ZOOM'

  try {
    // 1. Request bot from Vexa
    const vexaRes = await fetch(`${vexaApiUrl}/bots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': vexaApiKey
      },
      body: JSON.stringify({
        platform,
        native_meeting_id: nativeId,
        ...(passcode ? { passcode } : {})
      })
    })

    if (!vexaRes.ok) {
      const errorText = await vexaRes.text()
      console.error('Vexa API error:', errorText)
      return { error: `Erro na API do Vexa: ${errorText || vexaRes.statusText}` }
    }

    const vexaData = await vexaRes.json()
    const botId = vexaData.id || vexaData.bot_id || null

    // 2. Update meeting in database
    await db.meeting.update({
      where: { id: meetingId, organizationId: orgId },
      data: {
        platform: dbPlatform,
        status: 'RECORDING',
        vexaBotId: botId,
        vexaMeetingUrl: meetingUrl,
        vexaMeetingId: nativeId,
      }
    })

    revalidatePath('/meetings')
    revalidatePath(`/meetings/${meetingId}`)
    return { success: true }
  } catch (error: any) {
    console.error('startVexaForExistingMeeting error:', error)
    return { error: error.message || 'Erro ao iniciar reunião com Vexa' }
  }
}
