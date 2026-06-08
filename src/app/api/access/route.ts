import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET handler: Fetch all access configuration data
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
    }

    // Verify if current user has ADM_SIST profile
    const userProfile = await db.userProfile.findFirst({
      where: {
        userId: session.user.id,
        profile: { name: "ADM_SIST" },
      },
    })

    if (!userProfile) {
      return NextResponse.json({ message: "Acesso negado. Apenas administradores podem gerenciar acessos." }, { status: 403 })
    }

    // Fetch all profiles, including their module associations
    const profiles = await db.profile.findMany({
      include: {
        modules: true,
      },
      orderBy: { name: "asc" },
    })

    // Fetch all pre-registered emails (AllowedEmails)
    const allowedEmails = await db.allowedEmail.findMany({
      include: {
        profile: true,
      },
      orderBy: { email: "asc" },
    })

    // Fetch all registered users and their profiles
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        userProfiles: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({
      profiles,
      allowedEmails,
      users,
    })
  } catch (error) {
    console.error("GET access configuration error:", error)
    return NextResponse.json({ message: "Erro ao buscar configurações de acesso." }, { status: 500 })
  }
}

/**
 * POST handler: Update access configurations (AllowedEmails, Profiles, User Profiles)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
    }

    // Verify ADM_SIST profile
    const userProfile = await db.userProfile.findFirst({
      where: {
        userId: session.user.id,
        profile: { name: "ADM_SIST" },
      },
    })

    if (!userProfile) {
      return NextResponse.json({ message: "Acesso negado. Apenas administradores podem gerenciar acessos." }, { status: 403 })
    }

    const body = await req.json()
    const { action } = body

    if (action === "create-allowed-email") {
      const { email, profileId } = body
      if (!email || !profileId) {
        return NextResponse.json({ message: "Dados incompletos." }, { status: 400 })
      }

      const existingAllowed = await db.allowedEmail.findUnique({
        where: { email },
      })

      if (existingAllowed) {
        return NextResponse.json({ message: "Este e-mail já está autorizado." }, { status: 400 })
      }

      const newAllowed = await db.allowedEmail.create({
        data: {
          email: email.toLowerCase().trim(),
          profileId,
        },
        include: {
          profile: true,
        },
      })

      return NextResponse.json({ message: "E-mail autorizado com sucesso!", data: newAllowed }, { status: 201 })
    }

    if (action === "delete-allowed-email") {
      const { id } = body
      if (!id) {
        return NextResponse.json({ message: "ID é obrigatório." }, { status: 400 })
      }

      await db.allowedEmail.delete({
        where: { id },
      })

      return NextResponse.json({ message: "Autorização de e-mail removida com sucesso!" })
    }

    if (action === "update-user-profile") {
      const { userId, profileId } = body
      if (!userId || !profileId) {
        return NextResponse.json({ message: "Dados incompletos." }, { status: 400 })
      }

      // First delete all profiles for this user (to replace it)
      await db.userProfile.deleteMany({
        where: { userId },
      })

      // Add the new profile association
      const newRelation = await db.userProfile.create({
        data: {
          userId,
          profileId,
        },
        include: {
          profile: true,
        },
      })

      // Update the user's legacy role as well (ADM_SIST -> ADMIN, others -> CONSULTANT)
      const targetProfile = await db.profile.findUnique({
        where: { id: profileId },
      })
      if (targetProfile) {
        const legacyRole = targetProfile.name === "ADM_SIST" ? "ADMIN" : "CONSULTANT"
        await db.user.update({
          where: { id: userId },
          data: { role: legacyRole as any },
        })
      }

      return NextResponse.json({ message: "Perfil do usuário atualizado com sucesso!", data: newRelation })
    }

    if (action === "update-profile-modules") {
      const { profileId, moduleKeys } = body // moduleKeys: Array<string>
      if (!profileId || !Array.isArray(moduleKeys)) {
        return NextResponse.json({ message: "Dados inválidos." }, { status: 400 })
      }

      // Find the profile to verify
      const profile = await db.profile.findUnique({ where: { id: profileId } })
      if (!profile) {
        return NextResponse.json({ message: "Perfil não encontrado." }, { status: 404 })
      }

      // ADM_SIST cannot have their module access restricted (must always have access to everything)
      if (profile.name === "ADM_SIST" && moduleKeys.length < 10) {
        return NextResponse.json({ message: "Não é permitido remover acessos do perfil de Administrador do Sistema (ADM_SIST)." }, { status: 400 })
      }

      // First clear all existing profileModule records for this profile
      await db.profileModule.deleteMany({
        where: { profileId },
      })

      // Batch create new associations
      const newAssociations = await Promise.all(
        moduleKeys.map((key) =>
          db.profileModule.create({
            data: {
              profileId,
              moduleKey: key,
            },
          })
        )
      )

      return NextResponse.json({ message: "Matriz de acessos salva com sucesso!", count: newAssociations.length })
    }

    return NextResponse.json({ message: "Ação desconhecida." }, { status: 400 })
  } catch (error) {
    console.error("POST access configuration error:", error)
    return NextResponse.json({ message: "Erro ao processar alteração de acesso." }, { status: 500 })
  }
}
