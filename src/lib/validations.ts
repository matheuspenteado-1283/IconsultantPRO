import { z } from "zod"

// Auth
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

// Project
export const projectSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  code: z.string().optional(),
  clientId: z.string().optional(),
  scope: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["PROSPECTING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).default("PROSPECTING"),
})

export const participantSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  role: z.string().min(1, "Função é obrigatória"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  userId: z.string().optional(),
})

// Partner
export const partnerSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  segment: z.string().optional(),
  partnerType: z.enum(["CLIENT", "SUPPLIER", "BUSINESS_PARTNER", "PROSPECT"]),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
})

// Backlog
export const backlogItemSchema = z.object({
  projectId: z.string().min(1, "Projeto é obrigatório"),
  description: z.string().min(5, "Descrição é obrigatória"),
  responsibleId: z.string().optional(),
  type: z.enum(["CONFIGURATION", "WRICEF", "CONSULTING", "TRAINING", "GUIDANCE"]),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  category: z.enum(["IMPLEMENTATION", "IMPROVEMENT"]),
  moduleId: z.string().optional(),
})

export const implementationFormSchema = z.object({
  phase: z.string().optional(),
  technicalObject: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
  acceptanceCriteria: z.string().optional(),
  risks: z.string().optional(),
  notes: z.string().optional(),
})

export const improvementFormSchema = z.object({
  currentSituation: z.string().optional(),
  desiredSituation: z.string().optional(),
  businessJustification: z.string().optional(),
  operationalImpact: z.string().optional(),
  expectedBenefits: z.string().optional(),
  notes: z.string().optional(),
})

// System Environment
export const systemEnvironmentSchema = z.object({
  projectId: z.string().min(1, "Projeto é obrigatório"),
  name: z.string().min(2, "Nome é obrigatório"),
  systemId: z.string().optional(),
  environment: z.enum(["DEV", "QAS", "PRD", "SBX", "SANDBOX"]),
  version: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

// SAP Module
export const sapModuleSchema = z.object({
  code: z.string().min(1, "Código é obrigatório").max(10),
  name: z.string().min(2, "Nome é obrigatório"),
  description: z.string().optional(),
})

// Effort
export const abapEffortSchema = z.object({
  type: z.enum(["REPORT", "INTERFACE", "CONVERSION", "ENHANCEMENT", "FORM", "WORKFLOW", "BADI", "USER_EXIT", "SMARTFORM", "ADOBE_FORM"]),
  complexity: z.enum(["SIMPLE", "MEDIUM", "COMPLEX", "VERY_COMPLEX"]),
  standardHours: z.number().positive("Horas devem ser positivas"),
  description: z.string().optional(),
})

export const functionalEffortSchema = z.object({
  moduleId: z.string().min(1, "Módulo é obrigatório"),
  activityType: z.string().min(1, "Tipo de atividade é obrigatório"),
  complexity: z.enum(["SIMPLE", "MEDIUM", "COMPLEX", "VERY_COMPLEX"]),
  standardHours: z.number().positive("Horas devem ser positivas"),
  description: z.string().optional(),
})

// Price Tables
export const professionalPriceSchema = z.object({
  profile: z.string().min(2, "Perfil é obrigatório"),
  dailyRate: z.number().positive("Valor deve ser positivo"),
  hourlyRate: z.number().positive("Valor deve ser positivo"),
  currency: z.string().default("BRL"),
})

export const developmentPriceSchema = z.object({
  type: z.enum(["REPORT", "INTERFACE", "CONVERSION", "ENHANCEMENT", "FORM", "WORKFLOW", "BADI", "USER_EXIT", "SMARTFORM", "ADOBE_FORM"]),
  complexity: z.enum(["SIMPLE", "MEDIUM", "COMPLEX", "VERY_COMPLEX"]),
  unitPrice: z.number().positive("Valor deve ser positivo"),
  currency: z.string().default("BRL"),
  description: z.string().optional(),
})

// Proposal
export const proposalSchema = z.object({
  projectId: z.string().min(1, "Projeto é obrigatório"),
  title: z.string().min(2, "Título é obrigatório"),
  contingency: z.number().min(0).max(100).default(0),
  discount: z.number().min(0).max(100).default(0),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ProjectFormData = z.infer<typeof projectSchema>
export type PartnerFormData = z.infer<typeof partnerSchema>
export type BacklogItemFormData = z.infer<typeof backlogItemSchema>
export type SystemEnvironmentFormData = z.infer<typeof systemEnvironmentSchema>
export type SapModuleFormData = z.infer<typeof sapModuleSchema>
export type AbapEffortFormData = z.infer<typeof abapEffortSchema>
export type FunctionalEffortFormData = z.infer<typeof functionalEffortSchema>
export type ProfessionalPriceFormData = z.infer<typeof professionalPriceSchema>
export type DevelopmentPriceFormData = z.infer<typeof developmentPriceSchema>
export type ProposalFormData = z.infer<typeof proposalSchema>
