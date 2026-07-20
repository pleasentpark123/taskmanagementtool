import {RequestHandler} from "express";
import {UnauthorizedError} from "../lib/errors";
import jwt, {JwtPayload} from "jsonwebtoken";
import {env} from "../config/env";

export const auth: RequestHandler = (req,res,next)=>{
    const token= req.cookies.token
    if (!token) throw new UnauthorizedError("Not authenticated")

    let payload: string | JwtPayload
    try {
        payload = jwt.verify(token, env.JWT_SECRET)   // { sub, iat, exp }
    } catch {
        throw new UnauthorizedError("Invalid or expired token")
    }

    // jwt.verify can hand back a plain string instead of an object. We need an object.
    if (typeof payload === 'string') {
        throw new UnauthorizedError("Malformed token payload")
    }

    // A valid signature doesn't guarantee a sensible payload — check `sub` is a real id.
    const sub = Number(payload.sub)
    if (!Number.isInteger(sub) || sub <= 0) {
        throw new UnauthorizedError("Malformed token payload")
    }

    req.user = { sub }
    next()
}