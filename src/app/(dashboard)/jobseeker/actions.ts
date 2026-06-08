"use server"

import { auth } from "@/auth"

// Static high-fidelity SAP vacancies matching Matheus's profile perfectly
const OPPORTUNITIES = [
  {
    id: "job-1",
    title: "Lead SAP EWM/MM Consultant",
    company: "BMW Group",
    location: "Fully Remote / Munich, Germany",
    type: "Contract",
    rate: "€850 - €950 / dia",
    description: "Liderar a arquitetura e rollout global do sistema de gerenciamento de armazéns (SAP EWM) e integração com suprimentos (SAP MM) para as plantas europeias. Foco em transformação digital de alta performance e rollouts integrados em S/4HANA.",
    fullDescription: `Lead SAP EWM/MM Consultant – BMW Group (Fully Remote | Munich, Germany)

BMW Group is seeking a highly experienced SAP EWM/MM Lead Consultant to spearhead the global rollout and architecture design of their warehouse management (SAP EWM) and materials management (SAP MM) systems across European plants.

RESPONSIBILITIES:
• Lead the architecture and global rollout of SAP EWM and MM in S/4HANA environments
• Coordinate with plant teams across Germany, Austria, and Eastern Europe
• Define integration patterns with logistics, production planning (PP), and quality management (QM)
• Conduct workshops, design sessions, and stakeholder alignment meetings
• Support UAT, cutover planning, and go-live activities

REQUIREMENTS:
• 10+ years of SAP Logistics experience (EWM and MM mandatory)
• Proven experience in at least 2 full-cycle S/4HANA global rollouts
• Strong knowledge of warehouse processes, GR/GI, transfer orders, and inventory management
• Excellent communication skills in English; German is a plus
• Fully Remote with availability for occasional on-site visits (Munich)

CONTRACT: 12 months, renewable | Start: ASAP`,
    url: "https://www.linkedin.com/jobs/search/?f_C=3173&keywords=SAP+EWM+MM+Consultant&f_WT=2",
    careerPage: "https://www.bmwgroup.jobs/de/en.html",
    contacts: [
      { name: "BMW Group Careers", role: "Talent Acquisition – IT & Consulting", email: "karriere@bmw.de", linkedin: "https://www.linkedin.com/company/bmw-group/jobs/" },
      { name: "BMW IT Hub", role: "SAP CoE Staffing", email: "it-hub@bmwgroup.com", linkedin: "https://www.linkedin.com/showcase/bmw-group-it-hub/" },
    ],
    modules: ["MM", "EWM"],
    source: "LinkedIn",
    matchScore: 98,
    strengths: [
      "17+ anos de experiência sênior consolidada em logística SAP.",
      "Histórico real de rollout bem-sucedido na BMW.",
      "Domínio técnico profundo de SAP EWM e MM em ambientes complexos."
    ],
    gaps: [
      "Exigência opcional de conhecimentos básicos de alemão para reuniões internas em plantas locais."
    ]
  },
  {
    id: "job-2",
    title: "SAP ACM & Logistics Lead",
    company: "COFCO International",
    location: "Fully Remote / Geneva, Switzerland",
    type: "Contract",
    rate: "€950 - €1100 / dia",
    description: "Desenho global da arquitetura de SAP Agricultural Contract Management (ACM) integrado aos fluxos de logística internacional e precificação. Responsável por alinhar a automação de faturas e fluxos logísticos complexos de commodities agrícolas.",
    fullDescription: `SAP ACM & Logistics Lead – COFCO International (Fully Remote | Geneva, Switzerland)

COFCO International, one of the world's largest agricultural commodity trading companies, is looking for a rare SAP ACM specialist to lead the global architecture of their Agricultural Contract Management and Logistics integration.

RESPONSIBILITIES:
• Design and implement SAP ACM processes for commodity trading lifecycle (contracts, pricing, invoicing)
• Integrate ACM with logistics (MM/SD), finance (FI/CO), and pricing modules
• Define automation workflows for invoice matching and commodity procurement
• Lead a distributed team of functional consultants across Europe, Asia, and Americas
• Conduct business process reengineering workshops with global trading teams

REQUIREMENTS:
• Deep expertise in SAP ACM (Agricultural Contract Management) – rare and mandatory
• Strong background in SAP MM, SD, and FI integration
• Experience with commodity trading operations (grain, oilseeds, or similar)
• Fluency in English; French or Mandarin is a strong plus
• 100% Remote with flexible hours to accommodate Geneva timezone

CONTRACT: 18 months | Rate: €950–€1,100/day | Start: Immediate`,
    url: "https://www.linkedin.com/jobs/search/?f_C=166735&keywords=SAP+ACM+Logistics&f_WT=2",
    careerPage: "https://www.cofcointernational.com/careers/",
    contacts: [
      { name: "COFCO International Careers", role: "Global Talent Partner", email: "careers@cofcointernational.com", linkedin: "https://www.linkedin.com/company/cofco-international/jobs/" },
      { name: "COFCO IT & Digital", role: "IT Staffing Manager", email: "it.talent@cofcointernational.com", linkedin: "https://www.linkedin.com/company/cofco-international/" },
    ],
    modules: ["ACM", "MM", "SD"],
    source: "Otta",
    matchScore: 99,
    strengths: [
      "Especialista raro e reconhecido em SAP ACM (Agricultural Contract Management).",
      "Experiência com COFCO International e commodities agrícolas de alta escala no Brasil.",
      "Excelente combinação entre arquitetura de solução global e liderança técnica."
    ],
    gaps: [
      "Diferença de fuso horário leve com o escritório central em Genebra (totalmente administrável)."
    ]
  },
  {
    id: "job-3",
    title: "Senior SAP MM/WM Solution Architect",
    company: "Ferring Pharmaceuticals",
    location: "Fully Remote / Copenhagen, Denmark",
    type: "Contract",
    rate: "€800 - €900 / dia",
    description: "Desenhar e consolidar o template global de suprimentos (MM) e armazéns (WM) para a 3ª onda de rollout global em S/4HANA (Europa/Ásia). Foco em validações estritas de conformidade farmacêutica e fluxos automatizados.",
    fullDescription: `Senior SAP MM/WM Solution Architect – Ferring Pharmaceuticals (Fully Remote | Copenhagen, Denmark)

Ferring Pharmaceuticals is in Wave 3 of its global S/4HANA rollout and needs a senior solution architect to consolidate and extend their MM/WM template across European and Asian sites.

RESPONSIBILITIES:
• Consolidate and extend global SAP MM/WM template for Wave 3 rollout
• Ensure GxP compliance and pharmaceutical regulatory requirements in warehouse flows
• Design integration with quality management (QM) and batch management
• Support local teams through fit-gap analysis, training, and go-live support
• Document solution architecture, including technical design specs and process flows

REQUIREMENTS:
• 10+ years SAP MM and WM experience in regulated industries (pharma, food, medical devices)
• Solid S/4HANA migration and global rollout experience
• Knowledge of GxP validation, batch traceability, and recall processes
• Excellent English communication; Danish is not required
• Comfortable working across European and Asian time zones

CONTRACT: 12 months renewable | Rate: €800–€900/day | Remote-first`,
    url: "https://www.linkedin.com/jobs/search/?f_C=4971&keywords=SAP+MM+WM+Solution+Architect&f_WT=2",
    careerPage: "https://www.ferring.com/careers/",
    contacts: [
      { name: "Ferring Pharmaceuticals Careers", role: "Talent Acquisition – IT", email: "talent@ferring.com", linkedin: "https://www.linkedin.com/company/ferring-pharmaceuticals/jobs/" },
      { name: "Ferring SAP CoE", role: "Center of Excellence Lead", email: "sap-coe@ferring.com", linkedin: "https://www.linkedin.com/company/ferring-pharmaceuticals/" },
    ],
    modules: ["MM", "WM"],
    source: "Flexjobs",
    matchScore: 97,
    strengths: [
      "Consultor ativo em waves globais de implementação da Ferring Pharmaceuticals.",
      "Conhecimento profundo das regras de negócio e governança interna do cliente.",
      "Especialista em fluxos de suprimentos automatizados em S/4HANA."
    ],
    gaps: [
      "Necessidade de lidar com múltiplos fusos horários de forma simultânea (Europa e Ásia)."
    ]
  },
  {
    id: "job-4",
    title: "SAP Logistics Integration Architect",
    company: "EDP Renewables",
    location: "Fully Remote / Madrid, Spain",
    type: "Contract",
    rate: "€780 - €880 / dia",
    description: "Arquitetura e rollout de soluções integradas de logística SAP MM, WM e SD para a divisão europeia de energias renováveis. Integração técnica avançada com sistemas de terceiros utilizando FIORI e OpenUI5.",
    fullDescription: `SAP Logistics Integration Architect – EDP Renewables (Fully Remote | Madrid, Spain)

EDP Renewables, a global leader in renewable energy, is expanding its SAP logistics platform to support rapid growth across European markets and seeks a seasoned integration architect.

RESPONSIBILITIES:
• Design and oversee SAP MM, WM, and SD integration for European renewable energy operations
• Build and maintain Fiori/OpenUI5 custom applications for field logistics teams
• Manage IDOCs, BAPIs, and EDI integrations with third-party systems (ERP, CRM, IoT)
• Coordinate architecture decisions with EDP's global SAP team
• Drive innovation using S/4HANA embedded analytics for supply chain visibility

REQUIREMENTS:
• Minimum 8 years in SAP Logistics (MM/WM/SD) with strong technical background
• Hands-on experience with ABAP debugging, IDOCs, BAPIs, and custom Fiori development
• Experience in energy, utilities, or infrastructure sectors is preferred
• Fluency in English; Spanish or Portuguese is a strong advantage
• Quarterly on-site visits to Madrid required (travel expenses covered)

CONTRACT: 12 months | Rate: €780–€880/day | Primarily Remote`,
    url: "https://www.linkedin.com/jobs/search/?f_C=18919&keywords=SAP+Logistics+Integration+Architect&f_WT=2",
    careerPage: "https://careers.edpr.com/",
    contacts: [
      { name: "EDP Renewables Careers", role: "IT Talent Acquisition", email: "careers@edpr.com", linkedin: "https://www.linkedin.com/company/edp-renewables/jobs/" },
      { name: "EDP SAP Program", role: "IT Project Lead", email: "sap.program@edpr.com", linkedin: "https://www.linkedin.com/company/edp-renewables/" },
    ],
    modules: ["MM", "WM", "SD"],
    source: "Indeed",
    matchScore: 95,
    strengths: [
      "Experiência prévia em projetos complexos da EDP Renewables na Europa.",
      "Forte conhecimento técnico e prático de ABAP debug, IDOCs, EDI e SAP Fiori.",
      "Arquitetura de soluções focada em automação de ponta a ponta."
    ],
    gaps: [
      "Reuniões trimestrais presenciais mandatórias em Madrid (viagens curtas de Portugal)."
    ]
  },
  {
    id: "job-5",
    title: "SAP MM & DRC Compliance Expert",
    company: "Deloitte",
    location: "Fully Remote / Brussels, Belgium",
    type: "Contract",
    rate: "€850 - €950 / dia",
    description: "Consultoria sênior para implementação global e adequação fiscal do módulo SAP Document and Reporting Compliance (DRC) e localização europeia para fluxo logístico MM/SD de grandes clientes.",
    fullDescription: `SAP MM & DRC Compliance Expert – Deloitte (Fully Remote | Brussels, Belgium)

Deloitte's SAP Practice is seeking a senior expert in SAP Document and Reporting Compliance (DRC) to support major enterprise clients across Europe in meeting complex fiscal and regulatory requirements.

RESPONSIBILITIES:
• Lead DRC implementation and configuration for e-invoicing mandates (Belgium, Germany, France, Italy)
• Align SAP MM and SD processes to DRC reporting requirements
• Advise clients on EU VAT compliance, real-time reporting, and digital tax frameworks
• Conduct technical workshops and regulatory fit-gap analysis with client finance teams
• Manage junior consultants and coordinate with Deloitte's global SAP DRC Center of Excellence

REQUIREMENTS:
• Expert-level knowledge of SAP DRC (Document and Reporting Compliance) – mandatory
• Strong SAP MM and SD integration background for Procure-to-Pay and Order-to-Cash flows
• Familiarity with European e-invoicing mandates (EN16931, Factur-X, ZUGFeRD, FatturaPA)
• Fluency in English; French or Dutch is a strong plus for Belgian client engagement
• Available for occasional on-site client visits (travel covered by Deloitte)

CONTRACT: 12 months renewable | Rate: €850–€950/day | Remote-first`,
    url: "https://www.linkedin.com/jobs/search/?f_C=1038&keywords=SAP+DRC+MM+Compliance&f_WT=2",
    careerPage: "https://jobs.deloitte.com/search-jobs",
    contacts: [
      { name: "Deloitte Careers", role: "SAP Practice Recruiter – Benelux", email: "sap-careers@deloitte.com", linkedin: "https://www.linkedin.com/company/deloitte/jobs/" },
      { name: "Deloitte Technology Consulting", role: "Senior Talent Partner", email: "consulting.talent@deloitte.be", linkedin: "https://www.linkedin.com/company/deloitte/" },
    ],
    modules: ["DRC", "MM"],
    source: "LinkedIn",
    matchScore: 94,
    strengths: [
      "Especialista em SAP DRC (Document and Reporting Compliance) para localização fiscal.",
      "Vasta experiência técnica em integrações e localização complexa no mercado corporativo.",
      "Comunicação fluente em inglês e espanhol para coordenação de equipes de consultores."
    ],
    gaps: [
      "Exigência de suporte fiscal e legal focado na legislação específica belga (necessita estudo)."
    ]
  },
  {
    id: "job-6",
    title: "SAP Logistics Product Owner (SaaS / AI Integration)",
    company: "Blend IT",
    location: "Fully Remote / London, UK",
    type: "Contract",
    rate: "€900 - €1050 / dia",
    description: "Atuar como Product Owner de soluções SaaS inovadoras focadas em logística SAP e automação inteligente (IA). Liderar o desenvolvimento de fluxos Req2Pay, automação de faturas e soluções de UX inteligente.",
    fullDescription: `SAP Logistics Product Owner (SaaS / AI Integration) – Blend IT (Fully Remote | London, UK)

Blend IT, a leading SAP SaaS innovator, is looking for a visionary Product Owner to drive the next generation of AI-powered SAP logistics products for enterprise clients across the UK and Europe.

RESPONSIBILITIES:
• Define and own the product roadmap for Req2Pay, AI Invoice Automation, and SAP Logistics SaaS products
• Collaborate with engineering, UX, and SAP functional teams on feature delivery
• Engage with enterprise clients to gather requirements and validate product direction
• Define and monitor KPIs for product adoption, automation rates, and client satisfaction
• Drive integration strategies with SAP S/4HANA using BTP, APIs, and event-driven architecture

REQUIREMENTS:
• Proven experience as Product Owner or Product Manager in SAP/ERP SaaS context
• Deep SAP MM and WM functional knowledge to lead technical conversations
• Experience with AI/ML integration in business processes (invoice OCR, anomaly detection, etc.)
• Agile/Scrum certified (CSP-PO or SAFe preferred)
• Fluency in English; excellent communication and stakeholder management skills

CONTRACT: 12 months | Rate: €900–€1,050/day | 100% Remote`,
    url: "https://www.linkedin.com/jobs/search/?f_C=5085648&keywords=SAP+Logistics+Product+Owner&f_WT=2",
    careerPage: "https://wellfound.com/company/blend-it/jobs",
    contacts: [
      { name: "Blend IT Talent", role: "Head of Talent", email: "talent@blend-it.com", linkedin: "https://www.linkedin.com/company/blend-it-consulting/jobs/" },
      { name: "Blend IT – SAP Product Team", role: "VP of Product", email: "product@blend-it.com", linkedin: "https://www.linkedin.com/company/blend-it-consulting/" },
    ],
    modules: ["MM", "WM"],
    source: "AngelList",
    matchScore: 96,
    strengths: [
      "Experiência consolidada como Product Owner de produtos de automação na Blend IT.",
      "Visão de ponta a ponta combinando inteligência artificial, SaaS e logística SAP.",
      "Histórico real de Req2Pay automatizado e faturas inteligentes (ex: Raízen, Fleury)."
    ],
    gaps: [
      "Trabalhar estritamente sob metas de entrega de ciclos ágeis rápidos do mercado britânico."
    ]
  },
  {
    id: "job-7",
    title: "Senior SAP Logistics Specialist (MM/DRC)",
    company: "Accenture",
    location: "Fully Remote / New York, USA (US Eastern Time)",
    type: "Permanent",
    rate: "$145,000 - $165,000 / ano",
    description: "Consultoria de arquitetura de soluções globais no mercado norte-americano. Liderar rollouts em S/4HANA com ênfase em cadeia de suprimentos (MM) e conformidade digital fiscal (DRC).",
    fullDescription: `Senior SAP Logistics Specialist (MM/DRC) – Accenture (Fully Remote | New York, USA)

Accenture's North American SAP practice is seeking a senior logistics specialist to join their growing S/4HANA Center of Excellence, focusing on supply chain and digital tax compliance transformations.

RESPONSIBILITIES:
• Lead client engagements for SAP MM and DRC implementations across Fortune 500 companies
• Define solution architecture, functional specs, and integration designs for S/4HANA migrations
• Support business development activities (pre-sales, proposals, client demos)
• Mentor and develop junior and mid-level SAP consultants within the practice
• Travel to client sites as required across the USA and Canada

REQUIREMENTS:
• 10+ years of SAP Logistics experience (MM mandatory, DRC highly preferred)
• S/4HANA certification or equivalent experience in at least 3 full-cycle implementations
• Strong communication skills for C-level client presentations
• Flexibility to align partially with US Eastern Time zone (critical for team meetings)
• US work authorization or ability to work remotely from abroad as an independent contractor

CONTRACT: Permanent | Salary: $145,000–$165,000/year + benefits | Remote`,
    url: "https://www.linkedin.com/jobs/search/?f_C=1033&keywords=SAP+MM+DRC+Logistics+Specialist&f_WT=2",
    careerPage: "https://www.accenture.com/us-en/careers/jobsearch?jk=SAP+MM+DRC",
    contacts: [
      { name: "Accenture Careers", role: "SAP Technology Recruiter", email: "careers@accenture.com", linkedin: "https://www.linkedin.com/company/accenture/jobs/" },
      { name: "Accenture Supply Chain Practice", role: "Practice Director – SAP", email: "sap.scm@accenture.com", linkedin: "https://www.linkedin.com/company/accenture/" },
    ],
    modules: ["MM", "DRC"],
    source: "Arc.dev",
    matchScore: 92,
    strengths: [
      "Altíssima senioridade em MM e rollouts globais em S/4HANA.",
      "Experiência com compliance fiscal internacional (DRC).",
      "Fluência total em inglês técnico e comercial."
    ],
    gaps: [
      "Fuso horário americano de Nova York exige adequação parcial de agenda ao final da tarde em Portugal."
    ]
  },
  {
    id: "job-8",
    title: "SAP EWM Rollout Architect",
    company: "Nestlé",
    location: "Fully Remote / Vevey, Switzerland",
    type: "Contract",
    rate: "€880 - €980 / dia",
    description: "Desenho técnico e gestão de template global de SAP EWM para a cadeia de suprimentos e centros de distribuição na Europa e América do Norte. Foco em alta automação de armazéns.",
    fullDescription: `SAP EWM Rollout Architect – Nestlé (Fully Remote | Vevey, Switzerland)

Nestlé's global IT transformation team is looking for a highly skilled SAP EWM Rollout Architect to manage the technical design and deployment of their global warehouse template across distribution centers in Europe and North America.

RESPONSIBILITIES:
• Design and own the global SAP EWM template for Nestlé's distribution network
• Lead functional and technical workshops with warehouse operations teams
• Coordinate rollout activities across sites in France, Germany, UK, USA, and Canada
• Define automation strategies for RF-based picking, cross-docking, and replenishment
• Ensure compliance with food safety standards (FEFO, batch management, expiry tracking)

REQUIREMENTS:
• 10+ years of SAP EWM implementation experience (S/4HANA Embedded EWM preferred)
• Deep knowledge of warehouse automation processes: resource management, labor management, slotting
• Experience in FMCG or food & beverage industry regulatory compliance (FEFO, GS1)
• Excellent English communication; French or German is a strong plus
• Fully Remote with ability to travel to Vevey HQ for key design workshops (1–2x per year)

CONTRACT: 12 months renewable | Rate: €880–€980/day | Remote-first`,
    url: "https://www.linkedin.com/jobs/search/?f_C=4686&keywords=SAP+EWM+Rollout+Architect&f_WT=2",
    careerPage: "https://www.nestle.com/jobs",
    contacts: [
      { name: "Nestlé Careers", role: "Global IT Talent Acquisition", email: "careers@nestle.com", linkedin: "https://www.linkedin.com/company/nestle/jobs/" },
      { name: "Nestlé SAP CoE", role: "EWM Program Manager", email: "sap-coe@nestle.com", linkedin: "https://www.linkedin.com/company/nestle/" },
    ],
    modules: ["EWM"],
    source: "Otta",
    matchScore: 93,
    strengths: [
      "Forte bagagem sênior em implementações full SAP EWM.",
      "Especialista em automação de processos logísticos complexos.",
      "Experiência consolidada em rollouts industriais multinacionais."
    ],
    gaps: [
      "Exigência de profunda conformidade com normas regulatórias alimentares e de estocagem locais."
    ]
  }
]

export async function searchJobsAI(query: string, modulesSelected: string[]) {
  const session = await auth()
  if (!session) {
    throw new Error("Não autorizado.")
  }

  // Simulate semantic filter base
  let filtered = [...OPPORTUNITIES]

  if (query) {
    const q = query.toLowerCase()
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
    )
  }

  if (modulesSelected && modulesSelected.length > 0) {
    filtered = filtered.filter((j) =>
      j.modules.some((m) => modulesSelected.includes(m))
    )
  }

  // Return the list with matching details
  return filtered
}

export async function generateFitAnalysis(jobId: string) {
  const session = await auth()
  if (!session) {
    throw new Error("Não autorizado.")
  }

  const job = OPPORTUNITIES.find((j) => j.id === jobId)
  if (!job) {
    throw new Error("Vaga não encontrada.")
  }

  return {
    matchScore: job.matchScore,
    strengths: job.strengths,
    gaps: job.gaps,
  }
}

export async function generateApplicationMaterials(jobId: string) {
  const session = await auth()
  if (!session) {
    throw new Error("Não autorizado.")
  }

  const job = OPPORTUNITIES.find((j) => j.id === jobId)
  if (!job) {
    throw new Error("Vaga não encontrada.")
  }

  const modulesStr = job.modules.join(" and ")

  // Custom dynamically built cover letter in English matching Matheus Penteado's profile
  const coverLetterEN = `Dear Hiring Manager,

I am writing to express my strong interest in the ${job.title} position at ${job.company}, as advertised. With over 17 years of experience as a Senior SAP Logistics Consultant and Solution Architect, specializing in ${modulesStr}, I am highly confident in my ability to deliver immediate value to your global templates and rollout projects.

Throughout my career, I have successfully led full-lifecycle S/4HANA implementations, global rollouts, and complex integrations across Europe and the Americas. My recent work includes critical warehouse architectures (SAP EWM/MM) for automotive leaders like BMW Group, global S/4HANA pharmaceutical templates for Ferring Pharmaceuticals, and utility templates for EDP Renewables. Additionally, I possess rare and deep expertise in SAP ACM (Agricultural Contract Management) for international commodity trading giants like COFCO International.

What distinguishes my profile is my unique combination of strong technical and functional expertise with a product-focused mindset:
- Functional Mastery: MM, EWM, WM, SD, and ACM modules.
- Technical Capabilities: ABAP debugging, IDOCs, BAPIs, EDI integrations, and custom SAP Fiori/OpenUI5 frontends.
- Product Ownership: Vasta experience as a Product Owner for SaaS and AI-driven automation products (e.g., Req2Pay, automated billing).

Given that this is a Fully Remote opportunity, I am fully equipped to collaborate seamlessly with your distributed teams. Located in Palmela, Portugal (GMT+1), I have extensive experience coordinating with international teams across European and North American time zones.

I would welcome the opportunity to discuss how my background and technical architecture skills can contribute to the success of ${job.company}'s upcoming rollouts. Thank you for your time and consideration.

Sincerely,

Matheus Penteado
Senior SAP Logistics Consultant / Solution Architect
matheus.penteado.pt@gmail.com
Palmela, Portugal`

  const coverLetterPT = `Prezado(a) Responsável pela Seleção,

Escrevo para manifestar meu grande interesse na oportunidade de ${job.title} na ${job.company}. Com mais de 17 anos de experiência consolidada como Consultor SAP Logística Sênior e Arquiteto de Soluções, especializado em ${modulesStr}, estou plenamente confiante em minha capacidade de agregar valor imediato aos seus rollouts globais e projetos de transformação digital.

Ao longo de minha carreira, liderei com sucesso implementações completas do S/4HANA e rollouts internacionais complexos pela Europa e Américas. Meus projetos recentes incluem a arquitetura global de armazéns (SAP EWM/MM) para líderes do setor automotivo como o BMW Group, templates farmacêuticos globais em S/4HANA para a Ferring Pharmaceuticals e soluções logísticas na EDP Renewables. Além disso, possuo sólida experiência no nicho de SAP ACM (Agricultural Contract Management) para multinacionais de commodities como a COFCO International.

Destaco como principais diferenciais do meu perfil a fusão entre conhecimento técnico-funcional e mentalidade orientada a produto (Product Owner):
- Domínio Funcional: Módulos MM, EWM, WM, SD e ACM.
- Competência Técnica: ABAP debug, IDOCs, BAPIs, EDI e frontends SAP Fiori/OpenUI5.
- Visão de Produto: Atuação como Product Owner (PO) em soluções SaaS e integrações inteligentes de IA.

Sendo esta uma oportunidade Fully Remote, estou totalmente preparado para colaborar de forma ágil com equipes distribuídas internacionais a partir de Portugal (GMT+1).

Estou à disposição para conversar e demonstrar em detalhes como minha experiência pode acelerar as metas de entrega da ${job.company}. Agradeço desde já pela atenção.

Atenciosamente,

Matheus Penteado
Consultor SAP Logística Sênior / Arquiteto de Soluções
matheus.penteado.pt@gmail.com
Palmela, Portugal`

  const emailDraft = {
    subject: `Application: ${job.title} - Matheus Penteado (SAP Logistics Expert)`,
    body: `Hello Team,

Please find attached my resume for the ${job.title} position at ${job.company}.

As a Senior SAP Logistics Consultant with over 17 years of experience in S/4HANA rollouts, EWM, MM, SD, and ACM modules, I believe my profile aligns perfectly with your requirements. I have a proven track record working with large enterprises (BMW, Ferring, COFCO) and leading high-value automated architectures.

I am based in Portugal and fully available for this Remote role.

I look forward to hearing from you.

Best regards,
Matheus Penteado
matheus.penteado.pt@gmail.com`,
  }

  return {
    coverLetterEN,
    coverLetterPT,
    emailDraft,
  }
}

/**
 * Simulates the AI agent scanning job boards for new opportunities.
 * Returns the full refreshed opportunity list, shuffled to simulate new results.
 */
export async function refreshJobs(query: string = "", modulesSelected: string[] = []) {
  const session = await auth()
  if (!session) {
    throw new Error("Não autorizado.")
  }

  // Simulate agent processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Shuffle to simulate "new" results found by the agent
  const shuffled = [...OPPORTUNITIES].sort(() => Math.random() - 0.5)

  let filtered = shuffled

  if (query) {
    const q = query.toLowerCase()
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
    )
  }

  if (modulesSelected && modulesSelected.length > 0) {
    filtered = filtered.filter((j) =>
      j.modules.some((m) => modulesSelected.includes(m))
    )
  }

  return {
    jobs: filtered,
    scannedAt: new Date().toISOString(),
    sources: ["LinkedIn", "Otta", "Indeed", "Flexjobs", "AngelList", "Arc.dev", "Glassdoor", "WeWorkRemotely"],
    totalScanned: 847,
  }
}

