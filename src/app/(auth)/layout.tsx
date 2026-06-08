import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Entrar",
  description: "Faça login na sua conta Iconsultant Pro",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--color-bg-primary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glows */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          filter: "blur(120px)",
          pointerEvents: "none",
          top: "-200px",
          left: "-200px",
          background: "radial-gradient(circle, rgba(30,64,175,0.2) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          filter: "blur(120px)",
          pointerEvents: "none",
          bottom: "-200px",
          right: "-200px",
          background: "radial-gradient(circle, rgba(8,145,178,0.15) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      {/* Grid pattern in background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.02,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Large centered watermark background logo */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "550px",
          height: "550px",
          opacity: 0.035,
          pointerEvents: "none",
          backgroundImage: "url(/logo_iconsultant_dark.png)",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />

      {/* Left Panel — hidden on mobile */}
      <div
        style={{
          display: "none",
          flex: 1,
          background: "linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #111827 100%)",
          padding: "60px",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          zIndex: 1,
        }}
        className="auth-left-panel"
      >
        {/* Grid pattern inside left panel */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        {/* Radial glow inside left panel */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 30% 50%, rgba(30,64,175,0.12) 0%, transparent 60%)",
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
          <img
            src="/logo_iconsultant_dark.png"
            alt="Iconsultant Pro Logo"
            style={{
              height: "44px",
              objectFit: "contain",
            }}
          />
        </div>

        {/* Hero */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "44px", fontWeight: 800, lineHeight: 1.1, marginBottom: "20px" }}>
            Gestão de<br />
            <span
              style={{
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Consultoria SAP
            </span>
            <br />
            Profissional
          </h1>
          <p style={{ fontSize: "16px", color: "var(--color-text-secondary)", maxWidth: "400px", lineHeight: 1.7 }}>
            Plataforma completa para administrar seus projetos SAP, gerenciar
            backlogs e gerar propostas comerciais com precisão.
          </p>
        </div>

        {/* Features */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { icon: "📋", text: "Gestão completa de projetos e backlogs" },
            { icon: "💡", text: "Estimativas de esforço e preços automatizadas" },
            { icon: "📄", text: "Geração de propostas comerciais em PDF" },
            { icon: "🤖", text: "JobSeeker com IA para oportunidades SAP" },
          ].map((f) => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: "14px", color: "var(--color-text-secondary)", fontSize: "14px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background: "rgba(30,64,175,0.15)",
                  border: "1px solid rgba(30,64,175,0.25)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div
        style={{
          flex: "0 0 auto",
          width: "100%",
          maxWidth: "520px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px" }}>
          {children}
        </div>
      </div>

      {/* CSS for auth-left-panel responsive show on desktop */}
      <style>{`
        @media (min-width: 1024px) {
          .auth-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
