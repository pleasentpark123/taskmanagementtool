// `user` is optional because it only exists after `auth` has run.
declare global {
    namespace Express {
        interface Request {
            user?: { sub: number; jti: string; exp: number; sid: string }
        }
    }
}

export {}
