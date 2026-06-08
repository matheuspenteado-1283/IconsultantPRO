import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToStream,
} from "@react-pdf/renderer"

// PDF Styling
const styles = StyleSheet.create({
  // Cover page styling
  coverPage: {
    padding: 60,
    fontFamily: "Helvetica",
    backgroundColor: "#0f172a", // Dark theme cover!
    color: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  coverHeader: {
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 20,
    marginTop: 40,
  },
  coverBranding: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3b82f6",
    letterSpacing: 1,
  },
  coverTitleBlock: {
    marginVertical: "auto",
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 1.2,
    color: "#ffffff",
    marginBottom: 10,
  },
  coverSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
  },
  coverFooter: {
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#94a3b8",
  },
  footerCol: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  // Content page styling (white page for print friendly usage)
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#334155",
    backgroundColor: "#ffffff",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 10,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerDocId: {
    fontSize: 9,
    color: "#94a3b8",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#3b82f6",
    paddingBottom: 6,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 8,
    color: "#475569",
    textAlign: "justify",
  },

  // KPI/Summary panel
  kpiContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 12,
    marginVertical: 16,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#f8fafc",
  },
  kpiLabel: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },

  // Tables
  table: {
    display: "flex",
    flexDirection: "column",
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#0f172a",
    padding: 8,
    color: "#ffffff",
    fontWeight: "bold",
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRowAlt: {
    display: "flex",
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  colCode: { width: "15%", fontSize: 9 },
  colDesc: { width: "45%", fontSize: 9 },
  colModule: { width: "12%", fontSize: 9, textAlign: "center" },
  colHours: { width: "13%", fontSize: 9, textAlign: "right" },
  colPrice: { width: "15%", fontSize: 9, textAlign: "right" },

  // Financial Breakdown Summary
  financeSummary: {
    alignSelf: "flex-end",
    width: "40%",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    backgroundColor: "#f8fafc",
    padding: 10,
  },
  financeRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 9,
  },
  financeRowTotal: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
    marginTop: 6,
    fontWeight: "bold",
    color: "#10b981",
  },

  // Signature Block
  signatureContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    paddingTop: 20,
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 8,
    alignItems: "center",
  },
  signatureTitle: {
    fontSize: 9,
    color: "#64748b",
  },

  // Footer/Page Numbering
  pageNumber: {
    position: "absolute",
    fontSize: 8,
    color: "#94a3b8",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
  },
})

// Formatting and Calculation Helpers (Outside of JSX to avoid syntax parser slashes conflict)
const formatBRL = (val: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val)
}

const getContingencyValue = (totalPrice: number, contingency: number) => {
  return totalPrice * (contingency / 100)
}

const getDiscountValue = (totalPrice: number, contingency: number, discount: number) => {
  const baseWithContingency = totalPrice * (1 + contingency / 100)
  return baseWithContingency * (discount / 100)
}

const formatPageNumber = (page: number, total: number) => {
  return page + " / " + total
}

// PDF Document Component
interface PdfDocumentProps {
  proposal: any
  organization: any
}

const ProposalPdfDocument = ({ proposal, organization }: PdfDocumentProps) => {
  const creationDate = new Date(proposal.createdAt).toLocaleDateString("pt-BR")
  const validUntilDate = proposal.validUntil
    ? new Date(proposal.validUntil).toLocaleDateString("pt-BR")
    : "N/D"

  const clientName = proposal.project?.client?.name || "Cliente Final"
  const consultantName = proposal.createdBy?.name || "Consultor SAP"

  return (
    <Document>
      {/* PAGE 1: COVER PAGE */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverHeader}>
          <Text style={styles.coverBranding}>Iconsultant Pro</Text>
          <Text style={{ fontSize: 9, color: "#60a5fa", marginTop: 4 }}>
            Sistemas de Gestão & Estimativas Inteligentes
          </Text>
        </View>

        <View style={styles.coverTitleBlock}>
          <Text style={styles.coverTitle}>{proposal.title}</Text>
          <Text style={styles.coverSubtitle}>Proposta Técnica & Comercial de Serviços SAP</Text>
        </View>

        <View style={styles.coverFooter}>
          <View style={styles.footerCol}>
            <Text style={{ fontSize: 8, textTransform: "uppercase", color: "#64748b" }}>Preparado Para</Text>
            <Text style={{ color: "#ffffff", fontWeight: "bold" }}>{clientName}</Text>
            <Text>{"Projeto: " + (proposal.project?.name || "")}</Text>
          </View>
          <View style={styles.footerCol}>
            <Text style={{ fontSize: 8, textTransform: "uppercase", color: "#64748b" }}>Preparado Por</Text>
            <Text style={{ color: "#ffffff", fontWeight: "bold" }}>{consultantName}</Text>
            <Text>{organization.name}</Text>
          </View>
          <View style={[styles.footerCol, { alignItems: "flex-end" }]}>
            <Text style={{ fontSize: 8, textTransform: "uppercase", color: "#64748b" }}>Validade</Text>
            <Text style={{ color: "#34d399", fontWeight: "bold" }}>{"Até " + validUntilDate}</Text>
            <Text>{"Emitida em: " + creationDate}</Text>
          </View>
        </View>
      </Page>

      {/* PAGE 2: OBJECTIVE & SUMMARY */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Proposta Comercial — Iconsultant Pro</Text>
          <Text style={styles.headerDocId}>{"Cód: PROP-" + proposal.id.substring(0, 8).toUpperCase()}</Text>
        </View>

        {/* Section 1: Objective */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Objetivo Geral</Text>
          <Text style={styles.paragraph}>
            {"Esta proposta comercial tem como objetivo formalizar a prestação de serviços de consultoria especializada SAP para a execução do projeto \"" + (proposal.project?.name || "") + "\". As atividades descritas neste documento foram baseadas no backlog de requisitos técnicos mapeado e detalhado previamente pelas partes interessadas."}
          </Text>
          {proposal.notes ? (
            <Text style={styles.paragraph}>
              {"Observações Adicionais: " + proposal.notes}
            </Text>
          ) : null}
        </View>

        {/* Section 2: Financial Summary KPI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Resumo da Proposta</Text>
          <View style={styles.kpiContainer}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Esforço Total</Text>
              <Text style={styles.kpiValue}>{proposal.totalEffort + " Horas"}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Ajuste de Contingência</Text>
              <Text style={styles.kpiValue}>{"+" + proposal.contingency + "%"}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Desconto Aplicado</Text>
              <Text style={styles.kpiValue}>{"-" + proposal.discount + "%"}</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftWidth: 3, borderLeftColor: "#10b981" }]}>
              <Text style={styles.kpiLabel}>Preço Comercial Final</Text>
              <Text style={[styles.kpiValue, { color: "#10b981" }]}>{formatBRL(proposal.finalPrice)}</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Premissas e Condições</Text>
          <Text style={styles.paragraph}>
            - Os valores contidos nesta proposta estão representados em Reais (BRL).
          </Text>
          <Text style={styles.paragraph}>
            {"- A validade desta proposta comercial estende-se até " + validUntilDate + ". Após este período, os termos poderão sofrer reajustes conforme disponibilidade e tarifas vigentes."}
          </Text>
          <Text style={styles.paragraph}>
            - O faturamento e as condições de pagamento serão estabelecidos em contrato formal de prestação de serviços.
          </Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => formatPageNumber(pageNumber, totalPages)}
          fixed
        />
      </Page>

      {/* PAGE 3: TECHNICAL BACKLOG DETAIL */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Detalhamento Técnico do Backlog</Text>
          <Text style={styles.headerDocId}>{"Cód: PROP-" + proposal.id.substring(0, 8).toUpperCase()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Escopo Técnico Detalhado</Text>
          <Text style={styles.paragraph}>
            Abaixo estão discriminados todos os itens de backlog importados e precificados que compõem o escopo de execução deste projeto:
          </Text>

          {/* Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.colCode}>Código</Text>
              <Text style={styles.colDesc}>Descrição do Requisito</Text>
              <Text style={styles.colModule}>Módulo</Text>
              <Text style={styles.colHours}>Esforço (h)</Text>
              <Text style={styles.colPrice}>Subtotal (R$)</Text>
            </View>

            {/* Table Rows */}
            {proposal.items.map((item: any, idx: number) => {
              const rowStyle = idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt
              const code = item.backlogItem?.backlogCode || ("BKL-" + (idx + 1))
              const sapModuleCode = item.backlogItem?.sapModule?.code || "—"
              return (
                <View key={item.id} style={rowStyle}>
                  <Text style={[styles.colCode, { fontWeight: "bold", color: "#3b82f6" }]}>{code}</Text>
                  <Text style={styles.colDesc}>{item.description || item.backlogItem?.description || "—"}</Text>
                  <Text style={styles.colModule}>{sapModuleCode}</Text>
                  <Text style={styles.colHours}>{item.effortHours + "h"}</Text>
                  <Text style={styles.colPrice}>{formatBRL(item.totalPrice)}</Text>
                </View>
              )
            })}
          </View>

          {/* Financial Summary */}
          <View style={styles.financeSummary}>
            <View style={styles.financeRow}>
              <Text style={{ color: "#64748b" }}>Custo Base:</Text>
              <Text style={{ fontWeight: "bold" }}>{formatBRL(proposal.totalPrice)}</Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={{ color: "#64748b" }}>{"Contingência (+" + proposal.contingency + "%):"}</Text>
              <Text style={{ fontWeight: "bold", color: "#3b82f6" }}>
                {formatBRL(getContingencyValue(proposal.totalPrice, proposal.contingency))}
              </Text>
            </View>
            {proposal.discount > 0 ? (
              <View style={styles.financeRow}>
                <Text style={{ color: "#64748b" }}>{"Desconto Comercial (-" + proposal.discount + "%):"}</Text>
                <Text style={{ fontWeight: "bold", color: "#ef4444" }}>
                  {"-" + formatBRL(getDiscountValue(proposal.totalPrice, proposal.contingency, proposal.discount))}
                </Text>
              </View>
            ) : null}
            <View style={styles.financeRowTotal}>
              <Text>Total Líquido:</Text>
              <Text>{formatBRL(proposal.finalPrice)}</Text>
            </View>
          </View>
        </View>

        {/* Section 5: Signature and Approval */}
        <View style={{ marginTop: 30 }}>
          <Text style={styles.sectionTitle}>5. Aceitação e Formalização</Text>
          <Text style={styles.paragraph}>
            Estando de acordo com os termos, escopo e precificação apresentados nesta proposta comercial, as partes assinam eletrônica ou fisicamente abaixo:
          </Text>

          <View style={styles.signatureContainer}>
            <View style={styles.signatureBox}>
              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0f172a", marginBottom: 2 }}>{organization.name}</Text>
              <Text style={styles.signatureTitle}>{consultantName}</Text>
              <Text style={{ fontSize: 8, color: "#94a3b8", marginTop: 4 }}>Assinatura Contratada</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0f172a", marginBottom: 2 }}>{clientName}</Text>
              <Text style={styles.signatureTitle}>Representante Legal</Text>
              <Text style={{ fontSize: 8, color: "#94a3b8", marginTop: 4 }}>Assinatura Contratante</Text>
            </View>
          </View>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => formatPageNumber(pageNumber, totalPages)}
          fixed
        />
      </Page>
    </Document>
  )
}

// Next.js Route Handler
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const user = session?.user as any

  if (!user || !user.organizationId) {
    return new Response("Não autorizado.", { status: 401 })
  }

  const { id } = await params

  try {
    // 1. Fetch complete proposal with references
    const proposal = await db.proposal.findFirst({
      where: {
        id,
        project: {
          organizationId: user.organizationId,
        },
      },
      include: {
        createdBy: true,
        project: {
          include: {
            client: true,
          },
        },
        items: {
          include: {
            backlogItem: {
              include: {
                sapModule: true,
              },
            },
          },
        },
      },
    })

    if (!proposal) {
      return new Response("Proposta comercial não encontrada.", { status: 404 })
    }

    // 2. Fetch organization info
    const org = await db.organization.findUnique({
      where: { id: user.organizationId },
    })

    if (!org) {
      return new Response("Organização não encontrada.", { status: 404 })
    }

    // 3. Render PDF document to Node.js stream
    const pdfStream = await renderToStream(
      <ProposalPdfDocument proposal={proposal} organization={org} />
    )

    // 4. Return the stream response with application/pdf content type
    return new Response(pdfStream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="proposta-${id.substring(0, 8)}.pdf"`,
      },
    })

  } catch (err) {
    console.error("Error generating proposal PDF:", err)
    return new Response("Erro interno do servidor ao gerar PDF.", { status: 500 })
  }
}
