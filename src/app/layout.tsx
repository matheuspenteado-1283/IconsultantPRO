import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Iconsultant Pro — Gestão de Consultoria SAP",
    template: "%s | Iconsultant Pro",
  },
  description:
    "Sistema completo de administração para consultorias SAP. Gerencie projetos, backlogs, esforços e gere propostas comerciais profissionais.",
  keywords: ["SAP", "consultoria", "gestão de projetos", "proposta comercial", "backlog"],
  authors: [{ name: "Iconsultant Pro" }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
