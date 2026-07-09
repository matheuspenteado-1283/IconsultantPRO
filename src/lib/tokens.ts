import { db } from "@/lib/db"
import type { TokenType, RenewalStatus } from "@prisma/client"

interface CreateTokenParams {
  userId: string
  organizationId: string
  tokenType: TokenType
  totalAllocated: number
  autoRenew?: boolean
}

export async function ensureUserTokens(userId: string, organizationId: string) {
  const tokenTypes: TokenType[] = ["CLAUDE", "WHISPER", "VEXA", "EMAIL"]
  const defaultAllocations: Record<TokenType, number> = {
    CLAUDE: 1000,
    WHISPER: 500,
    VEXA: 500,
    EMAIL: 200,
  }

  const results = []
  for (const tokenType of tokenTypes) {
    const existing = await db.agentToken.findUnique({
      where: { userId_tokenType: { userId, tokenType } },
    })
    if (!existing) {
      const token = await db.agentToken.create({
        data: {
          userId,
          organizationId,
          tokenType,
          totalAllocated: defaultAllocations[tokenType],
          autoRenew: false,
        },
      })
      results.push(token)
    }
  }
  return results
}

export async function getTokenBalance(userId: string, tokenType: TokenType): Promise<number> {
  const token = await db.agentToken.findUnique({
    where: { userId_tokenType: { userId, tokenType } },
  })
  if (!token) return 0
  return token.totalAllocated - token.consumed
}

export async function consumeToken(userId: string, tokenType: TokenType, amount: number = 1): Promise<boolean> {
  const token = await db.agentToken.findUnique({
    where: { userId_tokenType: { userId, tokenType } },
  })
  if (!token) return false

  const remaining = token.totalAllocated - token.consumed
  if (remaining < amount) return false

  await db.agentToken.update({
    where: { userId_tokenType: { userId, tokenType } },
    data: { consumed: { increment: amount } },
  })
  return true
}

export async function requestTokenRenewal(
  userId: string,
  tokenType: TokenType,
  amount: number,
  notes?: string
) {
  const token = await db.agentToken.findUnique({
    where: { userId_tokenType: { userId, tokenType } },
  })
  if (!token) throw new Error("Token não encontrado para este usuário e tipo")

  const renewal = await db.tokenRenewalRequest.create({
    data: {
      tokenId: token.id,
      requestedBy: userId,
      amount,
      notes: notes ?? null,
    },
  })
  return renewal
}

export async function resolveRenewalRequest(
  requestId: string,
  status: RenewalStatus,
  resolvedBy: string
) {
  const renewal = await db.tokenRenewalRequest.findUnique({ where: { id: requestId } })
  if (!renewal) throw new Error("Solicitação não encontrada")
  if (renewal.status !== "PENDING") throw new Error("Solicitação já resolvida")

  await db.$transaction([
    db.tokenRenewalRequest.update({
      where: { id: requestId },
      data: { status, resolvedBy, resolvedAt: new Date() },
    }),
    ...(status === "APPROVED"
      ? [
          db.agentToken.update({
            where: { id: renewal.tokenId },
            data: {
              totalAllocated: { increment: renewal.amount },
              lastRenewedAt: new Date(),
            },
          }),
        ]
      : []),
  ])

  return true
}

export async function getAllAgentTokens(organizationId?: string) {
  return db.agentToken.findMany({
    where: organizationId ? { organizationId } : undefined,
    include: {
      user: { select: { id: true, name: true, email: true } },
      renewalRequests: {
        where: { status: "PENDING" },
        orderBy: { requestedAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  })
}

export async function getAllRenewalRequests(opts?: { status?: RenewalStatus }) {
  return db.tokenRenewalRequest.findMany({
    where: opts?.status ? { status: opts.status } : undefined,
    include: {
      token: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { requestedAt: "desc" },
  })
}

export async function updateTokenAllocation(tokenId: string, totalAllocated: number) {
  return db.agentToken.update({
    where: { id: tokenId },
    data: { totalAllocated, lastRenewedAt: new Date() },
  })
}
