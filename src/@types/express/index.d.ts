declare namespace Express {
    export interface Request {
        user: { id: string, userRole: string },
        sicrediToken: string,
    }
}