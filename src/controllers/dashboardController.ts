import { Request, Response } from "express";
import DashboardService from "../services/dashboardService";
import { Inversor } from "@prisma/client";

const dashboardService = new DashboardService();

class DashboardController {

    async getDashboardData(req: Request, res: Response) {
        try {
            const dashboardData = await dashboardService.getDashBoardData(req.user.id);
            res.status(200).json(dashboardData);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar dados do dashboard: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar dados do dashboard: ' + error.message });
            } else {
                console.error('Erro ao pegar dados do dashboard: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar dados do dashboard: Erro desconhecido.' });
            }
        }
    }
}

export default DashboardController;