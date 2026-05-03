import { z } from "zod"

export const loginSchema = z.object({
  email: z.email({ message: "Email invalide" }).min(1, "L'email est requis"),
  password: z.string().min(1, "Le mot de passe est requis").min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

export const registerSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").max(100, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name too long"),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
