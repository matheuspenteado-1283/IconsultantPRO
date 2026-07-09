import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

/**
 * Resolves all module keys a user is allowed to access.
 * Implements automatic profile provisioning from AllowedEmail or fallback to User.role.
 */
export async function getUserAllowedModules(userId: string, email?: string): Promise<string[]> {
  try {
    // 1. Fetch user's profiles
    let userProfiles = await db.userProfile.findMany({
      where: { userId },
      include: {
        profile: {
          include: {
            modules: true,
          },
        },
      },
    })

    // 2. Auto-provisioning: If user has no profile, try to find their email in AllowedEmail
    if (userProfiles.length === 0 && email) {
      const allowed = await db.allowedEmail.findUnique({
        where: { email },
      })

      if (allowed) {
        // Link user to the pre-registered profile
        await db.userProfile.create({
          data: {
            userId,
            profileId: allowed.profileId,
          },
        })

        // Re-fetch profiles
        userProfiles = await db.userProfile.findMany({
          where: { userId },
          include: {
            profile: {
              include: {
                modules: true,
              },
            },
          },
        })
      }
    }

    // 3. Fallback: If still no profiles, map based on User's legacy role field
    if (userProfiles.length === 0) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user) {
        // Map ADMIN to ADM_SIST, others to CONSULTANT
        const targetRole = user.role === "ADMIN" ? "ADM_SIST" : "CONSULTANT"
        const dbProfile = await db.profile.findUnique({
          where: { name: targetRole },
        })

        if (dbProfile) {
          await db.userProfile.create({
            data: {
              userId,
              profileId: dbProfile.id,
            },
          })

          // Re-fetch profiles
          userProfiles = await db.userProfile.findMany({
            where: { userId },
            include: {
              profile: {
                include: {
                  modules: true,
                },
              },
            },
          })
        }
      }
    }

    // 4. Collect all permitted module keys
    const allowedKeys = new Set<string>()
    let hasAllAccess = false

    for (const up of userProfiles) {
      const profileName = up.profile.name
      // ADM_SIST and MANAGER always have all access
      if (profileName === "ADM_SIST" || profileName === "MANAGER") {
        hasAllAccess = true
      }
      for (const m of up.profile.modules) {
        allowedKeys.add(m.moduleKey)
      }
    }

    if (hasAllAccess) {
      return ["all"]
    }

    return Array.from(allowedKeys)
  } catch (error) {
    console.error("Error in getUserAllowedModules:", error)
    return [] // Default to no access on error
  }
}

/**
 * Utility to verify if a specific module key is allowed given the user's permitted modules.
 */
export function isModuleAllowed(userModules: string[], moduleKey: string): boolean {
  if (userModules.includes("all")) return true
  
  if (moduleKey.startsWith("settings_")) {
    return userModules.includes("settings") || userModules.includes(moduleKey)
  }
  
  if (moduleKey.startsWith("admin_")) {
    return userModules.includes("access") || userModules.includes(moduleKey)
  }
  
  return userModules.includes(moduleKey)
}

/**
 * Enforces module-level authorization inside Server Components.
 * Redirects to `/dashboard?error=access-denied` if access is prohibited.
 */
export async function enforceModuleAccess(moduleKey: string): Promise<boolean> {
  const session = await auth()
  
  if (!session || !session.user?.id) {
    redirect("/login")
  }

  const userModules = await getUserAllowedModules(
    session.user.id,
    session.user.email || undefined
  )

  if (!isModuleAllowed(userModules, moduleKey)) {
    redirect("/dashboard?error=access-denied")
  }

  return true
}
