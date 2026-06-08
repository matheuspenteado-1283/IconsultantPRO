"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      })
      // Always show success to prevent email enumeration
      setSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="animate-fade-in" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "20px" }}>📧</div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>
          E-mail enviado!
        </h2>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "24px", lineHeight: 1.7 }}>
          Se houver uma conta com o endereço <strong>{getValues("email")}</strong>, você receberá
          um link de redefinição de senha em breve.
        </p>
        <p style={{ color: "var(--color-text-muted)", fontSize: "13px", marginBottom: "32px" }}>
          Verifique também a pasta de spam.
        </p>
        <Link href="/login" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>
          ← Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <style>{`
        .auth-form-header { margin-bottom: 32px; }
        .auth-form-header h2 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .auth-form-header p { color: var(--color-text-secondary); font-size: 14px; line-height: 1.6; }
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .auth-link { color: #60a5fa; text-decoration: none; font-weight: 500; }
        .auth-link:hover { text-decoration: underline; }
      `}</style>

      <div className="auth-form-header">
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔑</div>
        <h2>Esqueceu sua senha?</h2>
        <p>
          Sem problemas! Digite seu e-mail cadastrado e enviaremos um link
          para você criar uma nova senha.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label className="input-label" htmlFor="email">Seu e-mail cadastrado</label>
          <input
            id="email"
            type="email"
            className={`input ${errors.email ? "input-error" : ""}`}
            placeholder="seu@email.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && <span className="input-hint">{errors.email.message}</span>}
        </div>

        <button
          type="submit"
          className="btn-primary"
          id="btn-forgot-password"
          disabled={isLoading}
          style={{ width: "100%", padding: "13px", fontSize: "15px" }}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              Enviando...
            </>
          ) : (
            "Enviar link de redefinição"
          )}
        </button>

        <div style={{ textAlign: "center", fontSize: "14px", color: "var(--color-text-secondary)" }}>
          <Link href="/login" className="auth-link">← Voltar ao login</Link>
        </div>
      </form>
    </div>
  )
}
