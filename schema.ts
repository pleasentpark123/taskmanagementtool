import { z } from 'zod'

export const UserSchema = z.object({
    name: z
        .string()
        .min(1,{message: "Name is required"})
        .max(49,{message: "Name must be less than 50 characters"}),
    email: z.string().email({message:"Invalid email"}),
    password: z
        .string()
        .min(8, {message: "Password must be at least 8 characters long"})
        .max(100, {message:"Password is too long"})

})

export type User = z.infer<typeof userSchema>
