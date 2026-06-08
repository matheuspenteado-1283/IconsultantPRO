"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Suspense } from "react"
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  if (!token) {
    return (
      <div className="animate-fade-in" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
        <h2 style={{ fontSize: "22px", marginBottom: "12px" }}>Link inválido</h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}>
          Este link de redefinição é inválido ou expirou.
        </p>
        <Link href="/forgot-password" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>
          Solicitar novo link
        </Link>
      </div>
    )
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.message || "Erro ao redefinir senha.")
      } else {
        setSuccess(true)
        setTimeout(() => router.push("/login"), 3000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="animate-fade-in" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "20px" }}>🎉</div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>Senha redefinida!</h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px" }}>
          Sua senha foi alterada com sucesso. Redirecionando para o login...
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔐</div>
        <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>Nova senha</h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
          Escolha uma senha forte para sua conta.
        </p>
      </div>

      <form style={{ display: "flex", flexDirection: "column", gap: "20px" }} onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div style={{
            background: "rgba(220,38,38,0.1)",
            border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "14px",
            color: "#f87171",
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label className="input-label" htmlFor="password">Nova senha</label>
          <input
            id="password"
            type="password"
            className={`input ${errors.password ? "input-error" : ""}`}
            placeholder="••••••••"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && <span className="input-hint">{errors.password.message}</span>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label className="input-label" htmlFor="confirmPassword">Confirmar nova senha</label>
          <input
            id="confirmPassword"
            type="password"
            className={`input ${errors.confirmPassword ? "input-error" : ""}`}
            placeholder="••••••••"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && <span className="input-hint">{errors.confirmPassword.message}</span>}
        </div>

        <button
          type="submit"
          className="btn-primary"
          id="btn-reset-password"
          disabled={isLoading}
          style={{ width: "100%", padding: "13px", fontSize: "15px" }}
        >
          {isLoading ? <><div className="spinner" /> Salvando...</> : "Salvar nova senha"}
        </button>

        <div style={{ textAlign: "center", fontSize: "14px", color: "var(--color-text-secondary)" }}>
          <Link href="/login" style={{ color: "#60a5fa", textDecoration: "none" }}>← Voltar ao login</Link>
        </div>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="spinner" style={{ margin: "auto" }} />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
