import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM || "noreply@iconsultantpro.com"
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Iconsultant Pro"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function sendPasswordResetEmail(email: string, token: string, name?: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `[${APP_NAME}] Redefinição de Senha`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Inter, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #1e40af, #0891b2); padding: 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .body { padding: 32px; }
            .button { display: inline-block; background: linear-gradient(135deg, #1e40af, #0891b2); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
            .footer { padding: 20px 32px; border-top: 1px solid #334155; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 ${APP_NAME}</h1>
            </div>
            <div class="body">
              <p>Olá${name ? ` ${name}` : ""},</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>${APP_NAME}</strong>.</p>
              <p>Clique no botão abaixo para criar uma nova senha. Este link expira em <strong>1 hora</strong>.</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
              </div>
              <p style="color: #94a3b8; font-size: 14px;">Ou copie e cole este link no seu navegador:</p>
              <p style="background: #0f172a; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px;">${resetUrl}</p>
              <p style="color: #64748b; font-size: 13px;">Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá a mesma.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}

export async function sendApprovalEmail(
  email: string,
  name: string,
  projectName: string,
  approvalToken: string
) {
  const approveUrl = `${APP_URL}/approve/${approvalToken}?decision=approve`
  const rejectUrl = `${APP_URL}/approve/${approvalToken}?decision=reject`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `[${APP_NAME}] Aprovação Necessária: ${projectName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Inter, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #1e40af, #0891b2); padding: 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .body { padding: 32px; }
            .buttons { display: flex; gap: 16px; justify-content: center; margin: 28px 0; }
            .btn-approve { display: inline-block; background: #059669; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; }
            .btn-reject { display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; }
            .footer { padding: 20px 32px; border-top: 1px solid #334155; text-align: center; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 ${APP_NAME}</h1>
            </div>
            <div class="body">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Você foi indicado como aprovador do projeto <strong>${projectName}</strong> no ${APP_NAME}.</p>
              <p>Por favor, revise a proposta e indique sua decisão clicando em um dos botões abaixo:</p>
              <div class="buttons">
                <a href="${approveUrl}" class="btn-approve">✅ Aprovar</a>
                <a href="${rejectUrl}" class="btn-reject">❌ Rejeitar</a>
              </div>
              <p style="color: #64748b; font-size: 13px;">Se você tiver dúvidas, entre em contato com o consultor responsável pelo projeto.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${APP_NAME}. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  })
}
