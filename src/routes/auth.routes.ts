import { Router } from 'express'
import {ConflictError, InternalError, UnauthorizedError, ValidationError} from "../lib/errors";
import {auth} from "../middleware/auth";
import {db} from "../db";
import {users} from "../db/schema";
import {eq} from "drizzle-orm";
import {rateLimiter} from "../middleware/rateLimiter";
import {loginUserSchema, registerUserSchema} from "../validation/auth.schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {env} from "../config/env";
const DUMMY_HASH="$2b$10$KIqRWTBXtc/obFflqazVnuCWXlQynmdTqcjNJbKCwPheOxXpsFqEG"
const router = Router()
router.get("/me", auth, async (req, res) => {
    const r = await db.select({
        id: users.id,
        name: users.name,
        email: users.email
    }).from(users).where(eq(users.id, req.user!.sub)).limit(1)
    if (!r[0]){
        // Valid token, but the user is gone — treat as unauthenticated.
        throw new UnauthorizedError("Authentication unverified")
    }
    return res.json({success:true,user:r[0]})
})
router.post("/loginUser",rateLimiter,async(req,res)=>{
    const result = loginUserSchema.safeParse(req.body)
    if (!result.success){
        throw new ValidationError(result.error.flatten())
    }
    const {email,password}=result.data
    const normalizedEmail = email.toLowerCase().trim()
    const userResult = await db.select({id:users.id,hashedpassword:users.hashedpassword,name:users.name,email:users.email}).from(users).where(eq(users.email,normalizedEmail)).limit(1)
    const user = userResult[0]
    // Always run a compare, even with no user or a null stored hash, so response
    // time doesn't reveal whether the account exists.
    const passwordResult = await bcrypt.compare(password, user?.hashedpassword ?? DUMMY_HASH)
    if (!user || !passwordResult) {
        // Same message for both cases so we don't confirm which emails exist.
        throw new UnauthorizedError("Invalid email or password.")
    }
    console.log(`Success! Welcome ${user.name}`);
    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '1h' })
    res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000
    })
    return res.status(200).json({
        success: true,
        message: "User logged in successfully!",
        user: {
            id: user.id,
            email: user.email
        }
    });
})
router.post("/logoutUser", (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict'
    })
    return res.json({ success: true, message: "Logged out" })
})
router.post("/registerUser",rateLimiter,async (req,res)=>{
    const result = registerUserSchema.safeParse(req.body)
    if (!result.success){
        throw new ValidationError(result.error.flatten())
    }
    const {name,email,password} =result.data
    const normalizedEmail = email.toLowerCase().trim();
    const emailResult = await db.select({id:users.id}).from(users).where(eq(users.email,normalizedEmail)).limit(1)
    if (emailResult.length>0){
        throw new ConflictError("A user with this email already exists!")
    }
    const hashedPassword = await bcrypt.hash(password, 10)

    let insertResult
    try {
        insertResult = await db.insert(users).values({name, email:normalizedEmail, hashedpassword:hashedPassword}).returning({id:users.id,email:users.email})
    } catch (err) {
        // Two concurrent signups can both pass the check above; the unique index
        // is what actually decides. 23505 = unique_violation.
        if ((err as { code?: string })?.code === '23505') {
            throw new ConflictError("A user with this email already exists!")
        }
        throw err
    }
    if (!insertResult || insertResult.length === 0) {
        throw new InternalError("The database failed to create the user record.")
    }
    const newUser = insertResult[0];
    console.log(`Success! User created with ID: ${newUser.id}`);
    return res.status(201).json({
        success: true,
        message: "User registered successfully!",
        user: {
            id: newUser.id,
            email: newUser.email
        }
    });
})
export default router;