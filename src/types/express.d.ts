/**
 * Teaches TypeScript about the properties our middleware attaches to Request.
 * `user` is optional because it only exists after `auth` has run.
 */
declare global {
    namespace Express {
        interface Request {
            user?: { sub: number }
        }
    }
}

export {}
