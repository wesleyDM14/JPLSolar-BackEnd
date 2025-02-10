import { Request, Response, NextFunction } from "express";
import { sicrediAuthService } from "../Api/services/SicrediAuthService";

export async function sicrediAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }

        const token = await sicrediAuthService.getValidToken(userId);
        req.sicrediToken = token;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Falha na authenticação Sicredi' });
    }
}