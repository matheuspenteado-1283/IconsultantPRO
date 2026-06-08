"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginFormData } from "@/lib/validations"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("E-mail ou senha incorretos. Verifique suas credenciais.")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <style>{`
        .auth-form-header { margin-bottom: 32px; }
        .auth-form-header h2 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
        .auth-form-header p { color: var(--color-text-secondary); font-size: 14px; }
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .error-alert {
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 14px;
          color: #f87171;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .auth-link { color: #60a5fa; text-decoration: none; font-weight: 500; }
        .auth-link:hover { color: #93c5fd; text-decoration: underline; }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--color-text-muted);
          font-size: 13px;
          margin: 4px 0;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }
        .auth-footer {
          text-align: center;
          font-size: 14px;
          color: var(--color-text-secondary);
          margin-top: 8px;
        }
      `}</style>

      <div className="auth-form-header">
        <h2>Bem-vindo de volta 👋</h2>
        <p>Entre na sua conta para acessar o sistema</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="error-alert">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="input-label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className={`input ${errors.email ? "input-error" : ""}`}
            placeholder="seu@email.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <span className="input-hint">{errors.email.message}</span>
          )}
        </div>

        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="input-label" htmlFor="password">
              Senha
            </label>
            <Link href="/forgot-password" className="auth-link" style={{ fontSize: "13px" }}>
              Esqueci minha senha
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className={`input ${errors.password ? "input-error" : ""}`}
            placeholder="••••••••"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <span className="input-hint">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          id="btn-login"
          disabled={isLoading}
          style={{ width: "100%", padding: "13px", fontSize: "15px", marginTop: "4px" }}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              Entrando...
            </>
          ) : (
            "Entrar na Plataforma →"
          )}
        </button>

        <div className="auth-divider">ou</div>

        <div className="auth-footer">
          Não tem uma conta?{" "}
          <Link href="/register" className="auth-link">
            Criar conta grátis
          </Link>
        </div>
      </form>
    </div>
  )
}
