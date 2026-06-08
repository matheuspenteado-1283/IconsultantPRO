import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const orgId = (session?.user as any)?.organizationId
    const userId = session?.user?.id
    if (!session || !orgId || !userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const audioBlob = formData.get('audio') as File | null
    const transcript = formData.get('transcript') as string | null
    const meetingId = formData.get('meetingId') as string
    const transcriptSource = formData.get('transcriptSource') as string | null

    if (!meetingId) {
      return NextResponse.json({ error: 'meetingId é obrigatório' }, { status: 400 })
    }

    // Verify meeting belongs to org
    const meeting = await db.meeting.findFirst({
      where: { id: meetingId, organizationId: orgId }
    })
    if (!meeting) {
      return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 })
    }

    await db.meeting.update({
      where: { id: meetingId },
      data: { status: 'PROCESSING' }
    })

    let fullText = ''
    let transcriptionSource = transcriptSource || 'unknown'

    // === TRANSCRIPTION ===
    if (audioBlob && audioBlob.size > 0 && process.env.OPENAI_API_KEY) {
      // Use OpenAI Whisper
      const whisperForm = new FormData()
      whisperForm.append('file', audioBlob, 'recording.webm')
      whisperForm.append('model', 'whisper-1')
      whisperForm.append('language', 'pt')
      whisperForm.append('response_format', 'json')

      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: whisperForm,
      })

      if (whisperRes.ok) {
        const whisperData = await whisperRes.json()
        fullText = whisperData.text || ''
        transcriptionSource = 'whisper'
      } else {
        console.error('Whisper error:', await whisperRes.text())
        if (transcript) {
          fullText = transcript
          transcriptionSource = 'webspeech_fallback'
        }
      }
    } else if (transcript) {
      fullText = transcript
      transcriptionSource = 'webspeech'
    }

    if (!fullText || fullText.trim().length === 0) {
      await db.meeting.update({
        where: { id: meetingId },
        data: { status: 'ERROR' }
      })
      return NextResponse.json({ error: 'Não foi possível obter transcrição' }, { status: 422 })
    }

    // Save transcription
    await db.meetingTranscription.create({
      data: {
        meetingId,
        fullText,
        source: transcriptionSource,
        language: 'pt',
      }
    })

    // === SUMMARIZATION via Claude ===
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey || anthropicKey.includes('configure') || anthropicKey.includes('your_api_key')) {
      await db.meetingSummary.create({
        data: {
          meetingId,
          summary: 'Chave Anthropic não configurada. Configure ANTHROPIC_API_KEY para gerar resumos.',
          keyPoints: [],
          decisions: [],
          nextSteps: [],
          sentiment: 'neutro',
        }
      })
      await db.meeting.update({ where: { id: meetingId }, data: { status: 'COMPLETED' } })
      return NextResponse.json({ success: true, meetingId })
    }

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

    let summaryData: any = {
      summary: 'Não foi possível gerar resumo automático.',
      keyPoints: [],
      decisions: [],
      nextSteps: [],
      actionItems: [],
      sentiment: 'neutro',
    }

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
      console.error('Claude error:', await claudeRes.text())
    }

    // Save summary
    await db.meetingSummary.create({
      data: {
        meetingId,
        summary: summaryData.summary || '',
        keyPoints: summaryData.keyPoints || [],
        decisions: summaryData.decisions || [],
        nextSteps: summaryData.nextSteps || [],
        sentiment: summaryData.sentiment || 'neutro',
      }
    })

    // Save action items
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

    // Mark as completed
    await db.meeting.update({
      where: { id: meetingId },
      data: { status: 'COMPLETED' }
    })

    return NextResponse.json({ success: true, meetingId })
  } catch (error: any) {
    console.error('Meeting process error:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
