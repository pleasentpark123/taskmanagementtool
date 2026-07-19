import 'dotenv/config';
import jwt from 'jsonwebtoken'
import express from 'express'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq,sql } from 'drizzle-orm'
import { z } from 'zod'
import { UserSchema } from './schema';

const app = express();
app.use(express.json());
app.use(cookieParser());
const PORT=3000

const db=drizzle(process.env.DATABASE_URL)

app.post("/registerUser",async (req,res)=>{
    try{
        const result = UserSchema.safeParse(req.body)
        if (result.error){
            return res.status(400).json({
                success:false,
                message:'Validation failed',
                error: result.error.flatten()
            })
        }
        const {name,email,password} =result.data
        const normalizedEmail = email.toLowerCase().trim();
        const emailResult = await db.execute(sql`SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1`)
        if (emailResult.rows.length>0){
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists!"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const insertResult = await db.execute(
            sql`INSERT INTO users (name, email, hashedpassword) 
                VALUES (${name}, ${normalizedEmail}, ${hashedPassword}) 
                RETURNING id, email`
        );
        if (!insertResult.rows || insertResult.rows.length === 0) {
            return res.status(500).json({
                success: false,
                message: "The database failed to create the user record."
            });
        }
        const newUser = insertResult.rows[0];
        console.log(`Success! User created with ID: ${newUser.id}`);


    }catch(error){
        console.error("Registration failed:",error)
        return res.status(500).json({
            success:false,
            message: "Internal server error"
        })
    }

})




app.listen(PORT,()=>{console.log(`Server is running on http://localhost:${PORT}`)})