"use client"

import { useFormStatus } from "react-dom"

interface FormSubmitButtonProps {
  label: string
  pendingLabel?: string
  className?: string
}

export default function FormSubmitButton({
  label,
  pendingLabel = "Salvando...",
  className = "btn-primary",
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={className} style={{ minWidth: "120px" }}>
      {pending ? (
        <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
          <span className="spinner" style={{ width: "16px", height: "16px" }} />
          {pendingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  )
}
