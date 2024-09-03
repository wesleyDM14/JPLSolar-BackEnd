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

    async getGeneralSolarPlantData(req: Request, res: Response) {
        try {
            const { login, password, inverter, clientName, solarPlantCode, clientId, plantId, plantUserId } = req.params;

            if (!login || !password || !inverter || !clientName || !solarPlantCode || !clientId || !plantId || !plantUserId) {
                return res.status(400).json({ message: 'Parâmetros da url estão faltando.' });
            }

            if (!req.user.isAdmin && plantUserId !== req.user.id) {
                return res.status(403).json({ error: 'Acesso negado: Planta Solar não pertence ao usuário.' });
            }

            let response = {
                clientName,
                codUsina: solarPlantCode,
                plantId,
                clientId,
                status: '',
                eTotal: 0
            };

            if (inverter === Inversor.ABB) {
                const data = await dashboardService.getABBData(login, password);
                response.status = data.status;
                response.eTotal = data.eTotal;
            } else if (inverter === Inversor.CANADIAN) {
                const data = await dashboardService.getCanadianData(login, password);
                response.status = data.status;
                response.eTotal = data.eTotal;
            } else if (inverter === Inversor.DEYE) {
                const data = await dashboardService.getDeyeData(login, password);
                response.status = data.status;
                response.eTotal = data.eTotal;
            } else if (inverter === Inversor.GROWATT) {
                const data = await dashboardService.getGrowattData(login, password);
                response.status = data.status;
                response.eTotal = data.eTotal;
            } else {
                return res.status(400).json({ message: 'inversor não suportado na API.' });
            }

            return res.status(200).json(response);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar dados gerais da planta solar: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar dados gerais da planta solar: ' + error.message });
            } else {
                console.error('Erro ao pegar dados gerais da planta solar: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar dados gerais da planta solar: Erro desconhecido.' });
            }
        }
    }
}

export default DashboardController;