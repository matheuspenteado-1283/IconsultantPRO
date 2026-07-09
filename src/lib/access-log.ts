import { db } from "@/lib/db"
import type { AccessAction } from "@prisma/client"

export interface LogAccessParams {
  userId: string
  email: string
  path: string
  action: AccessAction
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export async function logAccess(params: LogAccessParams) {
  try {
    await db.accessLog.create({
      data: {
        userId: params.userId,
        email: params.email,
        path: params.path,
        action: params.action,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata as any,
      },
    })
  } catch (error) {
    console.error("AccessLog write error:", error)
  }
}

export async function getAccessLogs(opts: {
  userId?: string
  action?: AccessAction
  page?: number
  limit?: number
  startDate?: Date
  endDate?: Date
}) {
  const page = opts.page ?? 1
  const limit = opts.limit ?? 50
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (opts.userId) where.userId = opts.userId
  if (opts.action) where.action = opts.action
  if (opts.startDate || opts.endDate) {
    where.createdAt = {}
    if (opts.startDate) (where.createdAt as Record<string, Date>).gte = opts.startDate
    if (opts.endDate) (where.createdAt as Record<string, Date>).lte = opts.endDate
  }

  const [logs, total] = await Promise.all([
    db.accessLog.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    db.accessLog.count({ where: where as any }),
  ])

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) }
}
