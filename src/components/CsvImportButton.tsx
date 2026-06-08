'use client'

import { useRef, useState, useTransition } from 'react'
import { buildCsv } from '@/lib/csv'

interface CsvImportButtonProps {
  templateHeaders: string[]
  templateExample: string[]
  templateFilename: string
  onImport: (csvText: string) => Promise<{ imported?: number; errors?: Array<{ line: number; message: string }> }>
  label?: string
}

export default function CsvImportButton({
  templateHeaders,
  templateExample,
  templateFilename,
  onImport,
  label = 'Importar CSV',
}: CsvImportButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ imported?: number; errors?: Array<{ line: number; message: string }> } | null>(null)

  function handleDownloadTemplate() {
    const csv = buildCsv(templateHeaders, [templateExample])
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = templateFilename
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setResult(null)
      startTransition(async () => {
        const res = await onImport(text)
        setResult(res)
        // Reset input
        if (fileRef.current) fileRef.current.value = ''
        // Clear success after 8s
        if (res.imported && res.imported > 0) {
          setTimeout(() => setResult(null), 8000)
        }
      })
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="btn-ghost"
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            background: 'transparent'
          }}
        >
          ⬇️ Template CSV
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="btn-ghost"
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            color: '#60a5fa',
            border: '1px solid rgba(96,165,250,0.3)',
            borderRadius: '4px',
            cursor: 'pointer',
            background: 'transparent'
          }}
        >
          {isPending ? 'Importando...' : `📂 ${label}`}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {result && result.imported !== undefined && result.imported > 0 && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(52,211,153,0.1)',
          border: '1px solid rgba(52,211,153,0.3)',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '13px',
          color: '#34d399',
          marginTop: '4px'
        }}>
          ✅ {result.imported} registro{result.imported !== 1 ? 's' : ''} importado{result.imported !== 1 ? 's' : ''}
        </div>
      )}

      {result && result.errors && result.errors.length > 0 && (
        <div style={{
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: '6px',
          padding: '10px 14px',
          marginTop: '4px'
        }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#f87171', marginBottom: '6px' }}>
            ❌ Erros encontrados — nenhum registro importado:
          </p>
          <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {result.errors.map((err, i) => (
              <li key={i} style={{ fontSize: '12px', color: '#fca5a5' }}>
                Linha {err.line}: {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
