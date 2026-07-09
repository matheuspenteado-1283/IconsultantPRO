// Load .env.local FIRST - before any other code runs
import { config } from "dotenv"
import { resolve } from "path"
config({ path: resolve(process.cwd(), ".env.local"), override: true })

// Use DIRECT_URL (non-pooler) for seed - PrismaAdapter with pg for Node.js scripts
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!dbUrl) {
  console.error("❌ DATABASE_URL not set in .env.local")
  process.exit(1)
}

console.log("📡 Connecting to Neon PostgreSQL...")

const pool = new pg.Pool({ connectionString: dbUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter: adapter as any })

async function main() {
  console.log("🌱 Seeding database...")

  // SAP Modules
  const sapModules = [
    { code: "FI", name: "Financial Accounting", description: "Contabilidade Financeira" },
    { code: "CO", name: "Controlling", description: "Controladoria" },
    { code: "MM", name: "Materials Management", description: "Gestão de Materiais" },
    { code: "SD", name: "Sales & Distribution", description: "Vendas e Distribuição" },
    { code: "PP", name: "Production Planning", description: "Planejamento de Produção" },
    { code: "PM", name: "Plant Maintenance", description: "Manutenção de Planta" },
    { code: "QM", name: "Quality Management", description: "Gestão de Qualidade" },
    { code: "HR", name: "Human Resources", description: "Recursos Humanos" },
    { code: "PS", name: "Project System", description: "Sistema de Projetos" },
    { code: "WM", name: "Warehouse Management", description: "Gestão de Armazém" },
    { code: "TM", name: "Transportation Management", description: "Gestão de Transportes" },
    { code: "EWM", name: "Extended Warehouse Management", description: "Gestão Avançada de Armazém" },
    { code: "FICO", name: "FI/CO Integration", description: "Integração Financeira e Controladoria" },
    { code: "ABAP", name: "ABAP Development", description: "Desenvolvimento ABAP" },
    { code: "BASIS", name: "SAP Basis", description: "Administração SAP Basis" },
    { code: "BW", name: "Business Warehouse", description: "Business Intelligence SAP" },
    { code: "CRM", name: "Customer Relationship Management", description: "Gestão de Relacionamento com Cliente" },
    { code: "SRM", name: "Supplier Relationship Management", description: "Gestão de Fornecedores" },
    { code: "GRC", name: "Governance Risk & Compliance", description: "Governança, Risco e Conformidade" },
    { code: "S4H", name: "S/4HANA", description: "SAP S/4HANA" },
  ]

  for (const module of sapModules) {
    await prisma.sapModule.upsert({
      where: { code: module.code },
      update: {},
      create: module,
    })
  }
  console.log(`  ✓ ${sapModules.length} módulos SAP`)

  // ABAP Effort Table
  const abapEfforts = [
    { type: "REPORT", complexity: "SIMPLE", standardHours: 8 },
    { type: "REPORT", complexity: "MEDIUM", standardHours: 16 },
    { type: "REPORT", complexity: "COMPLEX", standardHours: 32 },
    { type: "REPORT", complexity: "VERY_COMPLEX", standardHours: 60 },
    { type: "INTERFACE", complexity: "SIMPLE", standardHours: 16 },
    { type: "INTERFACE", complexity: "MEDIUM", standardHours: 32 },
    { type: "INTERFACE", complexity: "COMPLEX", standardHours: 60 },
    { type: "INTERFACE", complexity: "VERY_COMPLEX", standardHours: 100 },
    { type: "CONVERSION", complexity: "SIMPLE", standardHours: 20 },
    { type: "CONVERSION", complexity: "MEDIUM", standardHours: 40 },
    { type: "CONVERSION", complexity: "COMPLEX", standardHours: 80 },
    { type: "CONVERSION", complexity: "VERY_COMPLEX", standardHours: 120 },
    { type: "ENHANCEMENT", complexity: "SIMPLE", standardHours: 8 },
    { type: "ENHANCEMENT", complexity: "MEDIUM", standardHours: 20 },
    { type: "ENHANCEMENT", complexity: "COMPLEX", standardHours: 40 },
    { type: "ENHANCEMENT", complexity: "VERY_COMPLEX", standardHours: 80 },
    { type: "FORM", complexity: "SIMPLE", standardHours: 12 },
    { type: "FORM", complexity: "MEDIUM", standardHours: 24 },
    { type: "FORM", complexity: "COMPLEX", standardHours: 48 },
    { type: "FORM", complexity: "VERY_COMPLEX", standardHours: 80 },
    { type: "WORKFLOW", complexity: "SIMPLE", standardHours: 16 },
    { type: "WORKFLOW", complexity: "MEDIUM", standardHours: 32 },
    { type: "WORKFLOW", complexity: "COMPLEX", standardHours: 60 },
    { type: "WORKFLOW", complexity: "VERY_COMPLEX", standardHours: 100 },
    { type: "BADI", complexity: "SIMPLE", standardHours: 8 },
    { type: "BADI", complexity: "MEDIUM", standardHours: 16 },
    { type: "BADI", complexity: "COMPLEX", standardHours: 32 },
    { type: "BADI", complexity: "VERY_COMPLEX", standardHours: 60 },
    { type: "USER_EXIT", complexity: "SIMPLE", standardHours: 4 },
    { type: "USER_EXIT", complexity: "MEDIUM", standardHours: 12 },
    { type: "USER_EXIT", complexity: "COMPLEX", standardHours: 24 },
    { type: "USER_EXIT", complexity: "VERY_COMPLEX", standardHours: 40 },
    { type: "SMARTFORM", complexity: "SIMPLE", standardHours: 16 },
    { type: "SMARTFORM", complexity: "MEDIUM", standardHours: 32 },
    { type: "SMARTFORM", complexity: "COMPLEX", standardHours: 60 },
    { type: "SMARTFORM", complexity: "VERY_COMPLEX", standardHours: 100 },
    { type: "ADOBE_FORM", complexity: "SIMPLE", standardHours: 20 },
    { type: "ADOBE_FORM", complexity: "MEDIUM", standardHours: 40 },
    { type: "ADOBE_FORM", complexity: "COMPLEX", standardHours: 80 },
    { type: "ADOBE_FORM", complexity: "VERY_COMPLEX", standardHours: 120 },
  ]

  for (const effort of abapEfforts) {
    await prisma.abapEffort.upsert({
      where: { type_complexity: { type: effort.type as any, complexity: effort.complexity as any } },
      update: {},
      create: effort as any,
    })
  }
  console.log(`  ✓ ${abapEfforts.length} registros de esforço ABAP`)

  // Professional Price Table
  const professionalPrices = [
    { profile: "Consultor Junior", dailyRate: 800, hourlyRate: 100 },
    { profile: "Consultor Pleno", dailyRate: 1200, hourlyRate: 150 },
    { profile: "Consultor Sênior", dailyRate: 1800, hourlyRate: 225 },
    { profile: "Consultor Especialista", dailyRate: 2400, hourlyRate: 300 },
    { profile: "Arquiteto SAP", dailyRate: 3200, hourlyRate: 400 },
    { profile: "Gerente de Projeto SAP", dailyRate: 2800, hourlyRate: 350 },
    { profile: "Desenvolvedor ABAP Junior", dailyRate: 900, hourlyRate: 112 },
    { profile: "Desenvolvedor ABAP Sênior", dailyRate: 2000, hourlyRate: 250 },
  ]

  for (const price of professionalPrices) {
    const existing = await prisma.professionalPrice.findFirst({ where: { profile: price.profile } })
    if (!existing) {
      await prisma.professionalPrice.create({ data: price })
    }
  }
  console.log(`  ✓ ${professionalPrices.length} preços profissionais`)

  // Development Price Table
  const developmentPrices = [
    { type: "REPORT", complexity: "SIMPLE", unitPrice: 2400, description: "Report ABAP Simples" },
    { type: "REPORT", complexity: "MEDIUM", unitPrice: 4800, description: "Report ABAP Médio" },
    { type: "REPORT", complexity: "COMPLEX", unitPrice: 9600, description: "Report ABAP Complexo" },
    { type: "REPORT", complexity: "VERY_COMPLEX", unitPrice: 18000, description: "Report ABAP Muito Complexo" },
    { type: "INTERFACE", complexity: "SIMPLE", unitPrice: 4800, description: "Interface Simples" },
    { type: "INTERFACE", complexity: "MEDIUM", unitPrice: 9600, description: "Interface Média" },
    { type: "INTERFACE", complexity: "COMPLEX", unitPrice: 18000, description: "Interface Complexa" },
    { type: "INTERFACE", complexity: "VERY_COMPLEX", unitPrice: 30000, description: "Interface Muito Complexa" },
    { type: "FORM", complexity: "SIMPLE", unitPrice: 3600, description: "Formulário Simples" },
    { type: "FORM", complexity: "MEDIUM", unitPrice: 7200, description: "Formulário Médio" },
    { type: "FORM", complexity: "COMPLEX", unitPrice: 14400, description: "Formulário Complexo" },
  ]

  for (const price of developmentPrices) {
    await prisma.developmentPrice.upsert({
      where: { type_complexity: { type: price.type as any, complexity: price.complexity as any } },
      update: {},
      create: price as any,
    })
  }
  console.log(`  ✓ ${developmentPrices.length} preços de desenvolvimento`)

  // ============================================
  // SEED ACCESS CONTROL SYSTEM
  // ============================================
  console.log("\n🔑 Seeding Access Control System...")

  const profilesData = [
    { name: "ADM_SIST", description: "Administrador do sistema - Acesso a todos os módulos" },
    { name: "MANAGER", description: "Manager - Acesso a todos os módulos" },
    { name: "CONSULTANT", description: "Consultor SAP - Acesso a módulos de projeto e estimativas" },
    { name: "BP_KEY_USER", description: "Business Partner Key User - Acesso a projetos e backlog" },
    { name: "BP_SPONSOR", description: "Business Partner Sponsor - Acesso a aprovações e projetos" },
  ]

  const profiles: Record<string, any> = {}
  for (const prof of profilesData) {
    profiles[prof.name] = await prisma.profile.upsert({
      where: { name: prof.name },
      update: { description: prof.description },
      create: prof,
    })
  }
  console.log(`  ✓ ${profilesData.length} perfis de acesso criados/atualizados`)

  // Default Profile Modules mapping
  const defaultProfileModules: Record<string, string[]> = {
    CONSULTANT: [
      "dashboard",
      "projects",
      "backlog",
      "approvals",
      "systems",
      "estimates",
      "proposals",
      "jobseeker",
    ],
    BP_KEY_USER: [
      "dashboard",
      "projects",
      "backlog",
      "approvals",
    ],
    BP_SPONSOR: [
      "dashboard",
      "projects",
      "approvals",
    ],
  }

  let modulesSeeded = 0
  for (const [profileName, modules] of Object.entries(defaultProfileModules)) {
    const profile = profiles[profileName]
    if (!profile) continue

    for (const modKey of modules) {
      await prisma.profileModule.upsert({
        where: {
          profileId_moduleKey: {
            profileId: profile.id,
            moduleKey: modKey,
          },
        },
        update: {},
        create: {
          profileId: profile.id,
          moduleKey: modKey,
        },
      })
      modulesSeeded++
    }
  }
  console.log(`  ✓ ${modulesSeeded} associações padrão de perfil x módulos`)

  // Seed Allowed Email for Matheus
  const initialAdminEmail = "matheus.penteado.pt@gmail.com"
  const adminProfile = profiles["ADM_SIST"]
  if (adminProfile) {
    await prisma.allowedEmail.upsert({
      where: { email: initialAdminEmail },
      update: {},
      create: {
        email: initialAdminEmail,
        profileId: adminProfile.id,
      },
    })
    console.log(`  ✓ E-mail inicial autorizado: ${initialAdminEmail} (${adminProfile.name})`)
  }

  // Update existing users to link them to their profiles
  const existingUsers = await prisma.user.findMany()
  let linkedUsers = 0
  for (const user of existingUsers) {
    // Check if user already has a profile
    const existingUserProfile = await prisma.userProfile.findFirst({
      where: { userId: user.id },
    })

    if (!existingUserProfile) {
      // Determine profile based on email or legacy role
      let targetProfileName = "CONSULTANT"
      if (user.email === initialAdminEmail) {
        targetProfileName = "ADM_SIST"
      } else if (user.role === "ADMIN") {
        targetProfileName = "ADM_SIST" // Map existing ADMIN to ADM_SIST
      }

      const targetProfile = profiles[targetProfileName]
      if (targetProfile) {
        await prisma.userProfile.create({
          data: {
            userId: user.id,
            profileId: targetProfile.id,
          },
        })
        linkedUsers++
      }
    }

    // Ensure agent tokens exist for user
    if (user.organizationId) {
      const tokenTypes = ["CLAUDE", "WHISPER", "VEXA", "EMAIL"] as const
      const defaultAllocations: Record<string, number> = { CLAUDE: 1000, WHISPER: 500, VEXA: 500, EMAIL: 200 }
      let tokensSeeded = 0
      for (const tt of tokenTypes) {
        const existingToken = await prisma.agentToken.findUnique({
          where: { userId_tokenType: { userId: user.id, tokenType: tt } },
        })
        if (!existingToken) {
          await prisma.agentToken.create({
            data: {
              userId: user.id,
              organizationId: user.organizationId,
              tokenType: tt,
              totalAllocated: defaultAllocations[tt],
            },
          })
          tokensSeeded++
        }
      }
      if (tokensSeeded > 0) {
        console.log(`  ✓ ${tokensSeeded} tokens criados para ${user.email}`)
      }
    }
  }
  console.log(`  ✓ ${linkedUsers} usuários existentes vinculados a perfis padrão`)

  console.log("\n✅ Seed concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e.message || e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
