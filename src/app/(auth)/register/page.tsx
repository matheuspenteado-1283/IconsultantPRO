"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterFormData } from "@/lib/validations"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.message || "Erro ao criar conta.")
      } else {
        setSuccess(true)
        setTimeout(() => router.push("/login"), 2000)
      }
    } catch {
      setError("Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="animate-fade-in" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>✅</div>
        <h2 style={{ fontSize: "24px", marginBottom: "12px" }}>Conta criada!</h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Sua conta foi criada com sucesso. Redirecionando para o login...
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <style>{`
        .auth-form-header { margin-bottom: 32px; }
        .auth-form-header h2 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .auth-form-header p { color: var(--color-text-secondary); font-size: 14px; }
        .auth-form { display: flex; flex-direction: column; gap: 18px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .error-alert {
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 14px;
          color: #f87171;
        }
        .auth-link { color: #60a5fa; text-decoration: none; font-weight: 500; }
        .auth-link:hover { text-decoration: underline; }
        .auth-footer {
          text-align: center;
          font-size: 14px;
          color: var(--color-text-secondary);
          margin-top: 4px;
        }
        .terms-text {
          font-size: 12px;
          color: var(--color-text-muted);
          text-align: center;
          margin-top: 8px;
          line-height: 1.6;
        }
      `}</style>

      <div className="auth-form-header">
        <h2>Criar sua conta 🚀</h2>
        <p>Comece a gerenciar seus projetos SAP agora mesmo</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="error-alert">⚠️ {error}</div>
        )}

        <div className="form-group">
          <label className="input-label" htmlFor="name">Nome completo</label>
          <input
            id="name"
            type="text"
            className={`input ${errors.name ? "input-error" : ""}`}
            placeholder="João da Silva"
            autoComplete="name"
            {...register("name")}
          />
          {errors.name && <span className="input-hint">{errors.name.message}</span>}
        </div>

        <div className="form-group">
          <label className="input-label" htmlFor="email">E-mail</label>
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

        <div className="form-group">
          <label className="input-label" htmlFor="password">Senha</label>
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

        <div className="form-group">
          <label className="input-label" htmlFor="confirmPassword">Confirmar senha</label>
          <input
            id="confirmPassword"
            type="password"
            className={`input ${errors.confirmPassword ? "input-error" : ""}`}
            placeholder="••••••••"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <span className="input-hint">{errors.confirmPassword.message}</span>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          id="btn-register"
          disabled={isLoading}
          style={{ width: "100%", padding: "13px", fontSize: "15px", marginTop: "4px" }}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              Criando conta...
            </>
          ) : (
            "Criar Conta Grátis →"
          )}
        </button>

        <div className="auth-footer">
          Já tem uma conta?{" "}
          <Link href="/login" className="auth-link">Entrar</Link>
        </div>
      </form>
    </div>
  )
}
