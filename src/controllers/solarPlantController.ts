import { Request, Response } from "express";

import SolarPlantService from "../services/solarPlantService";
import { Inversor, UserRole } from "@prisma/client";
import { generateSolarPlantReport } from "../functions/generateSolarPlantReport";

const solarPlantService = new SolarPlantService();

class SolarPlantController {

    async createSolarPlant(req: Request, res: Response) {
        try {
            const {
                code,
                local,
                installationDate,
                inverter,
                inverterPot,
                panel,
                panelPower,
                numberPanel,
                estimatedGeneration,
                login,
                password,
                clientId
            } = req.body;

            if (!local || !installationDate) {
                return res.status(400).json({ message: 'Dados Sobre a instalação da planta solar estão faltando.' });
            }

            if (!inverter || !panel || (inverterPot === null || inverterPot === undefined) || (panelPower === null || panelPower === undefined) || (numberPanel === null || numberPanel === undefined) || (estimatedGeneration === null || estimatedGeneration === undefined)) {
                return res.status(400).json({ message: 'Dados Tecnicos sobre a planta solar estão faltando.' });
            }

            if (!code || !login || !password || !clientId) {
                return res.status(400).json({ message: 'Dados sobre a Indentificação da planta solar estão faltando.' });
            }

            const newSolarPlant = await solarPlantService.createSolarPlant(code, local, installationDate, inverter, inverterPot, panel, panelPower, numberPanel, estimatedGeneration, login, password, clientId, req.user.id);

            return res.status(201).json(newSolarPlant);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao cadastrar a planta solar: ' + error.message);
                res.status(500).json({ message: 'Erro ao cadastrar a planta solar: ' + error.message });
            } else {
                console.error('Erro ao cadastrar a planta solar: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao cadastrar a planta solar: Erro desconhecido.' });
            }
        }
    }

    async getSolarPlants(req: Request, res: Response) {
        try {
            if (req.user.userRole !== UserRole.ADMIN) {
                return res.status(403).json({ message: 'Apenas Administradores podem recuperar todos as plantas cadastradas.' });
            }

            const solarPlants = await solarPlantService.getSolarPlants();

            return res.status(200).json(solarPlants);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao buscar as plantas solares: ' + error.message);
                res.status(500).json({ message: 'Erro ao buscar as plantas solares: ' + error.message });
            } else {
                console.error('Erro ao buscar as plantas solares: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao buscar as plantas solares: Erro desconhecido.' });
            }
        }
    }

    async getSelfSolarPlants(req: Request, res: Response) {
        try {
            const solarPlants = await solarPlantService.getSolarPlantsByUserId(req.user.id);
            return res.status(200).json(solarPlants);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao buscar as plantas solares: ' + error.message);
                res.status(500).json({ message: 'Erro ao buscar as plantas solares: ' + error.message });
            } else {
                console.error('Erro ao buscar as plantas solares: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao buscar as plantas solares: Erro desconhecido.' });
            }
        }
    }

    async getSolarPlantsByUserId(req: Request, res: Response) {
        try {
            if (req.user.userRole !== UserRole.ADMIN) {
                return res.status(403).json({ message: 'Somente administradores podem acessar as plantas solares.' });
            }

            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({ message: 'Id de usuário não fornecido.' });
            }

            const solarPlants = await solarPlantService.getSolarPlantsByUserId(userId);
            return res.status(200).json(solarPlants);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao buscar as plantas solares: ' + error.message);
                res.status(500).json({ message: 'Erro ao buscar as plantas solares: ' + error.message });
            } else {
                console.error('Erro ao buscar as plantas solares: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao buscar as plantas solares: Erro desconhecido.' });
            }
        }
    }

    async getSolarPlantsByClientId(req: Request, res: Response) {
        try {
            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(400).json({ message: 'Id de cliente não fornecido.' });
            }

            const solarPlants = await solarPlantService.getSolarPlantsByClientId(clientId, req.user.id);
            return res.status(200).json(solarPlants);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao buscar as plantas solares: ' + error.message);
                res.status(500).json({ message: 'Erro ao buscar as plantas solares: ' + error.message });
            } else {
                console.error('Erro ao buscar as plantas solares: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao buscar as plantas solares: Erro desconhecido.' });
            }
        }
    }

    async getSolarPlantById(req: Request, res: Response) {
        try {
            const solarPlantId = req.params.solarPlantId;

            if (!solarPlantId) {
                return res.status(400).json({ message: 'Id de planta solar não fornecido.' });
            }

            const solarPlants = await solarPlantService.getSolarPlantById(solarPlantId, req.user.id);
            return res.status(200).json(solarPlants);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao buscar a planta solare: ' + error.message);
                res.status(500).json({ message: 'Erro ao buscar a planta solare: ' + error.message });
            } else {
                console.error('Erro ao buscar a planta solare: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao buscar a planta solare: Erro desconhecido.' });
            }
        }
    }

    async updateSolarPlant(req: Request, res: Response) {
        try {
            const solarPlantId = req.params.solarPlantId;

            if (!solarPlantId) {
                return res.status(400).json({ message: 'Id de planta solar não fornecido.' });
            }

            const {
                code,
                local,
                installedPower,
                installationDate,
                inverter,
                inverterPot,
                panel,
                panelPower,
                numberPanel,
                estimatedGeneration,
                login,
                password
            } = req.body;

            await solarPlantService.updateSolarPlant(code, installedPower, local, installationDate, inverter, inverterPot, panel, panelPower, numberPanel, estimatedGeneration, login, password, solarPlantId, req.user.id);

            return res.status(200).json({ message: 'Planta Solar atualizada com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao atualizar a planta solar: ' + error.message);
                res.status(500).json({ message: 'Erro ao atualizar a planta solar: ' + error.message });
            } else {
                console.error('Erro ao atualziar a planta solar: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao atualizar a planta solar: Erro desconhecido.' });
            }
        }
    }

    async deleteSolarPlant(req: Request, res: Response) {
        try {
            const solarPlantId = req.params.solarPlantId;

            if (!solarPlantId) {
                return res.status(400).json({ message: 'Id de planta solar não fornecido.' });
            }

            await solarPlantService.deleteSolarPlant(solarPlantId, req.user.id);

            return res.status(200).json({ message: 'Planta Solar deletada com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao deletar a planta solar: ' + error.message);
                res.status(500).json({ message: 'Erro ao deletar a planta solar: ' + error.message });
            } else {
                console.error('Erro ao deletar a planta solar: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao deletar a planta solar: Erro desconhecido.' });
            }
        }
    }

    async getSolarPlantParams(req: Request, res: Response) {
        try {
            const { login, password, inversor, montadorId, clientId } = req.body;

            if (!login || !password || !inversor || !montadorId) {
                return res.status(400).json({ message: 'Parâmetros da url estão faltando.' });
            }

            if (req.user.userRole === UserRole.CLIENTE && clientId !== req.user.id) {
                return res.status(403).json({ error: 'Acesso negado: Planta Solar não pertence ao usuário.' });
            }

            if (req.user.userRole === UserRole.MONTADOR && montadorId !== req.user.id) {
                return res.status(403).json({ error: 'Acesso negado: Planta Solar não pertence ao usuário.' });
            }

            let response = null;

            if (inversor === Inversor.ABB) {
                response = await solarPlantService.getAbbParams(login, password, req.user.id);
            } else if (inversor === Inversor.CANADIAN) {
                response = await solarPlantService.getCanadianParams(login, password, req.user.id);
            } else if (inversor === Inversor.DEYE) {
                response = await solarPlantService.getDeyeParams(login, password, req.user.id);
            } else if (inversor === Inversor.GOODWE) {
                response = await solarPlantService.getGoodweParams(login, password, req.user.id);
            } else if (inversor === Inversor.GROWATT) {
                response = await solarPlantService.getGrowattParams(login, password, req.user.id);
            } else {
                return res.status(400).json({ message: 'inversor não suportado na API.' });
            }

            return res.status(200).json(response);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar parametros individuais da planta solar: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar parametros individuais da planta solar: ' + error.message });
            } else {
                console.error('Erro ao pegar parametros individuais da planta solar: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar parametros individuais da planta solar: Erro desconhecido.' });
            }
        }
    }

    async getErrorList(req: Request, res: Response) {
        try {
            const { login, password, year, plantId, inversor } = req.body;

            if (!login || !password || (year === null || year === undefined) || !plantId || !inversor) {
                return res.status(400).json({ message: 'Parâmetros da planta solar estão faltando.' });
            }

            let response = null;

            if (inversor === Inversor.ABB) {
                response = await solarPlantService.getErrorDataListAbb(login, password, year, plantId, req.user.id);
            } else if (inversor === Inversor.CANADIAN) {
                response = await solarPlantService.getErrorDataListCanadian(login, password, year, plantId, req.user.id);
            } else if (inversor === Inversor.DEYE) {
                response = await solarPlantService.getErrorDataListDeye(login, password, year, plantId, req.user.id);
            } else if (inversor === Inversor.GOODWE) {
                response = await solarPlantService.getErrorDataListGoodwe(login, password, year, plantId, req.user.id);
            } else if (inversor === Inversor.GROWATT) {
                response = await solarPlantService.getErrorDataListGrowatt(login, password, year, plantId, req.user.id);
            } else {
                return res.status(400).json({ message: 'inversor não suportado na API.' });
            }

            return res.status(200).json(response);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar lista de erros da planta solar: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar lista de erros da planta solar: ' + error.message });
            } else {
                console.error('Erro ao pegar lista de erros da planta solar: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar lista de erros da planta solar: Erro desconhecido.' });
            }
        }
    }

    async getChartByType(req: Request, res: Response) {
        try {
            const { login, password, date, type, plantId, deviceTypeName, deviceSN, inversor } = req.body;

            if (!login || !password || !date || !plantId || !inversor || !type || !deviceTypeName || !deviceSN) {
                return res.status(400).json({ message: 'Parâmetros da planta solar estão faltando.' });
            }

            let response = null;

            if (inversor === Inversor.ABB) {
                response = await solarPlantService.getChartByTypeAbb(login, password, date, type, plantId, req.user.id);
            } else if (inversor === Inversor.CANADIAN) {
                response = await solarPlantService.getChartByTypeCanadian(login, password, date, type, plantId, req.user.id);
            } else if (inversor === Inversor.DEYE) {
                response = await solarPlantService.getChartByTypeDeye(login, password, date, type, plantId, req.user.id);
            } else if (inversor === Inversor.GOODWE) {
                response = await solarPlantService.getChartByTypeGoodwe(login, password, date, type, plantId, req.user.id);
            } else if (inversor === Inversor.GROWATT) {
                response = await solarPlantService.getChartByTypeGrowatt(login, password, date, type, plantId, deviceTypeName, deviceSN, req.user.id);
            } else {
                return res.status(400).json({ message: 'inversor não suportado na API.' });
            }

            return res.status(200).json(response);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar dados de geração da planta solar: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar dados de geração da planta solar: ' + error.message });
            } else {
                console.error('Erro ao pegar dados de geração da planta solar: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar dados de geração da planta solar: Erro desconhecido.' });
            }
        }
    }

    async getReportBySolarPlant(req: Request, res: Response) {
        try {
            const solarPlantId = req.params.solarPlantId;
            const { year } = req.body;

            if (!solarPlantId) {
                return res.status(400).json({ message: 'Id de planta solar não fornecido.' });
            }

            if (year === undefined || year === null) {
                return res.status(400).json({ message: 'Ano não informado.' });
            }

            generateSolarPlantReport(solarPlantId, req.user.id, year, (err, pdfBuffer) => {

                if (err) {
                    return res.status(500).json({ message: 'Erro ao gerar relatório de usina solar.' });
                }

                if (!pdfBuffer) {
                    return res.status(500).json({ message: 'Erro ao gerar relatório de usina solar: buffer vazio.' });
                }

                res.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': 'attachment; filename=report.pdf',
                    'Content-Length': pdfBuffer.length
                });

                res.end(pdfBuffer);
            });

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao gerar relatório de geração solar da planta: ' + error.message);
                res.status(500).json({ message: 'Erro ao gerar relatório de geração solar da planta: ' + error.message });
            } else {
                console.error('Erro ao gerar relatório de geração solar da planta: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao gerar relatório de geração solar da planta: Erro desconhecido.' });
            }
        }
    }
}

export default SolarPlantController;