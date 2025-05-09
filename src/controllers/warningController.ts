import { Request, Response } from "express";
import WarningService from "../services/warningService";
import { UserRole } from "@prisma/client";

const warningService = new WarningService();

class WarningController {

    async createWarning(req: Request, res: Response) {
        try {
            const { userId, message } = req.body;

            if (req.user.userRole !== UserRole.ADMIN) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar novos avisos.' });
            }

            if (!userId || !message) {
                return res.status(400).json({ message: 'Dados de cadastro de aviso incorretos.' });
            }

            const newWarning = await warningService.createWarning(userId, message);
            return res.status(201).json(newWarning);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao criar aviso: ' + error.message);
                res.status(500).json({ message: 'Erro ao criar aviso: ' + error.message });
            } else {
                console.error('Erro ao criar aviso: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao criar aviso: Erro desconhecido.' });
            }
        }
    }

    async getWarnings(req: Request, res: Response) {
        try {
            if (req.user.userRole !== UserRole.ADMIN) {
                return res.status(403).json({ message: 'Apenas administradores podem buscar todos os usuários.' });
            }

            const warnings = await warningService.getWarnings();
            return res.status(200).json(warnings);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao retornar avisos: ' + error.message);
                res.status(500).json({ message: 'Erro ao retornar avisos: ' + error.message });
            } else {
                console.error('Erro ao retornar avisos: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao retornar avisos: Erro desconhecido.' });
            }
        }
    }

    async getWarningByUserId(req: Request, res: Response) {
        try {
            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            if (req.user.id !== userId && req.user.userRole !== UserRole.ADMIN) {
                return res.status(403).json({ message: 'Você não possui autorização para acessar os avisos.' });
            }

            const warnings = await warningService.getWarningByUserId(userId);
            return res.status(200).json(warnings);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao retornar avisos: ' + error.message);
                res.status(500).json({ message: 'Erro ao retornar avisos: ' + error.message });
            } else {
                console.error('Erro ao retornar avisos: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao retornar avisos: Erro desconhecido.' });
            }
        }
    }

    async getWarningByUserLoggedIn(req: Request, res: Response) {
        try {
            const warnings = await warningService.getWarningByUserId(req.user.id);
            return res.status(200).json(warnings);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao retornar avisos: ' + error.message);
                res.status(500).json({ message: 'Erro ao retornar avisos: ' + error.message });
            } else {
                console.error('Erro ao retornar avisos: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao retornar avisos: Erro desconhecido.' });
            }
        }
    }

    async getWarningById(req: Request, res: Response) {
        try {
            const warningId = req.params.warningId;

            if (!warningId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            let isAdmin = req.user.userRole === UserRole.ADMIN;

            const warning = await warningService.getWarningById(warningId, req.user.id, isAdmin);
            return res.status(200).json(warning);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao retornar aviso: ' + error.message);
                res.status(500).json({ message: 'Erro ao retornar aviso: ' + error.message });
            } else {
                console.error('Erro ao retornar aviso: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao retornar aviso: Erro desconhecido.' });
            }
        }
    }

    async getUnreadedWarningCounter(req: Request, res: Response) {
        const count = await warningService.getWarningsUnreadCounter(req.user.id);
        return res.status(200).json({ count: count });
    }

    async updateWarning(req: Request, res: Response) {
        try {
            const warningId = req.params.warningId;

            if (!warningId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const { isReaded } = req.body;

            if (isReaded === null || isReaded === undefined) {
                return res.status(400).json({ message: 'Dados de atualização Inválidos.' });
            }

            let isAdmin = req.user.userRole === UserRole.ADMIN;

            await warningService.updateWarning(warningId, isReaded, req.user.id, isAdmin);
            return res.status(200).json({ message: 'Aviso atualizado com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao atualizar aviso: ' + error.message);
                res.status(500).json({ message: 'Erro ao atualizat aviso: ' + error.message });
            } else {
                console.error('Erro ao atualizar aviso: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao atualizar aviso: Erro desconhecido.' });
            }
        }
    }

    async deleteWarning(req: Request, res: Response) {
        try {
            const warningId = req.params.warningId;

            if (!warningId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            let isAdmin = req.user.userRole === UserRole.ADMIN;

            await warningService.deleteWarning(warningId, req.user.id, isAdmin);
            return res.status(200).json({ message: 'Aviso deletado com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao deletar aviso: ' + error.message);
                res.status(500).json({ message: 'Erro ao deletar aviso: ' + error.message });
            } else {
                console.error('Erro ao deletar aviso: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao deletar aviso: Erro desconhecido.' });
            }
        }
    }

}

export default WarningController;