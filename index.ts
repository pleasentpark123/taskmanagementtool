import 'dotenv/config';
import jwt from 'jsonwebtoken'
import express from 'express'
import bcrypt from 'bcrypt'
import { UserSchema, type User} from 'schema.ts'
import cookieParser from 'cookie-parser'
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'

app.use(express.json());
app.use(cookieParser());

const app=express()
const db=drizzle(process.env.DATABASE_URL)

app.get("/registerUser",async (req,res)=>{
    try{
        const result = UserSchema.safeParse(req.body)
        if (result.error){
            const errorTree=z.treeifyError(result.error)
            return res.status(400).json({
                success:false,
                message:'Validation failed',
                ...errorTree
            })
        }
        const {name,email,password} =result.data



    }


})




app.listen(PORT,()=>{console.log(`Server is running on http://localhost:${PORT}`)})