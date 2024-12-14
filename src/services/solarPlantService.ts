import { Inversor } from "@prisma/client";
import prismaClient from "../prisma";

import { fetchGrowattData, getChartByType, getErrorDataListForYear } from "../functions/getGrowattParams";
import { fetchAbbData, getAbbErrorDataListForYear, getChartAbbByType } from "../functions/getAbbParams";
import { fetchDeyeData, getChartDeyeByType, getDeyeErrorDataListForYear } from "../functions/getDeyeParams";
import { fetchCanadianData, getCanadianErrorDataListForYear, getChartCanadianByType } from "../functions/getCanadianParams";

class SolarPlantService {

    async createSolarPlant(code: string, local: string, installationDate: Date, inverter: Inversor, inverterPot: number, panel: string, panelPower: number, numberPanel: number, estimatedGeneration: number, login: string, password: string, clientId: string, userId: string) {

        const existingClient = await prismaClient.user.findUnique({
            where: {
                id: clientId,
                role: "CLIENTE",
            },
        });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        const existingUser = await prismaClient.user.findUnique({
            where: {
                id: userId,
            }
        });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        if (existingClient.montadorId !== userId && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para cadastrar novas plantas solares neste cliente.');
        }

        const installedPower = (numberPanel * panelPower) / 1000;

        const solarPlantAlreadyExist = await prismaClient.plant.findFirst({
            where: {
                code: code,
                montadorId: userId
            }
        });

        if (solarPlantAlreadyExist) {
            throw new Error('Codigo de Planta Solar já em uso.');
        }

        const newSolarPlant = await prismaClient.plant.create({
            data: {
                code: code,
                local: local,
                installationDate: installationDate,
                inversor: inverter,
                inverterPot: inverterPot,
                estimatedGeneration: estimatedGeneration,
                installedPower: installedPower,
                login: login,
                numberPanel: numberPanel,
                panel: panel,
                panelPower: panelPower,
                password: password,
                clientId: clientId,
                montadorId: userId,
            }
        });

        return newSolarPlant;
    }

    async getSolarPlants() {
        const solarPlants = await prismaClient.plant.findMany();
        return solarPlants;
    }

    async getSolarPlantsByUserId(userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        if (existingUser.role === 'MONTADOR') {
            const solarPlants = await prismaClient.plant.findMany({
                where: { montadorId: existingUser.id },
                orderBy: { installationDate: "desc" },
            });

            const result = { userInfo: existingUser, solarPlants: solarPlants };

            return result;

        } else if (existingUser.role === 'CLIENTE') {
            const solarPlants = await prismaClient.plant.findMany({
                where: { clientId: existingUser.id },
                orderBy: { installationDate: "desc" },
            });

            const result = { userInfo: existingUser, solarPlants: solarPlants };

            return result;
        }

    }

    async getSolarPlantsByClientId(clientId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingClient = await prismaClient.user.findUnique({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        if (existingClient.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar as plantas deste cliente.');
        }

        const solarPlants = await prismaClient.plant.findMany({ where: { clientId: existingClient.id } });
        const result = { client: existingClient, solarPlants: solarPlants };

        return result;
    }

    async getSolarPlantById(solarPlantId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findUnique({
            where: { id: solarPlantId },
            include: {
                client: true,
                montador: true,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingUser.role === 'MONTADOR') {
            if (existingSolarPlant.montadorId !== existingUser.id) {
                throw new Error('Você não tem permissão para acessar a planta solar.');
            }
            return existingSolarPlant;
        } else if (existingUser.role === 'CLIENTE') {
            if (existingSolarPlant.clientId !== existingUser.id) {
                throw new Error('Você não tem permissão para acessar a planta solar.');
            }
            return existingSolarPlant;
        } else if (existingUser.role === 'ADMIN') {
            return existingSolarPlant;
        } else {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

    }

    async updateSolarPlant(code: string, installedPower: number, local: string, installationDate: Date, inverter: Inversor, inverterPot: number, panel: string, panelPower: number, numberPanel: number, estimatedGeneration: number, login: string, password: string, solarPlantId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findUnique({ where: { id: solarPlantId } });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingSolarPlant.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        await prismaClient.plant.update({
            where: { id: solarPlantId },
            data: {
                code: code ? code : existingSolarPlant.code,
                inversor: inverter ? inverter : existingSolarPlant.inversor,
                inverterPot: inverterPot ? inverterPot : existingSolarPlant.inverterPot,
                estimatedGeneration: estimatedGeneration ? estimatedGeneration : existingSolarPlant.estimatedGeneration,
                installationDate: installationDate ? installationDate : existingSolarPlant.installationDate,
                installedPower: installedPower ? installedPower : existingSolarPlant.installedPower,
                local: local ? local : existingSolarPlant.local,
                login: login ? login : existingSolarPlant.login,
                numberPanel: numberPanel ? numberPanel : existingSolarPlant.numberPanel,
                panel: panel ? panel : existingSolarPlant.panel,
                panelPower: panelPower ? panelPower : existingSolarPlant.panelPower,
                password: password ? password : existingSolarPlant.password
            }
        });

        return;
    }

    async deleteSolarPlant(solarPlantId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findUnique({ where: { id: solarPlantId } });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingSolarPlant.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para deletar a planta solar.');
        }

        await prismaClient.plant.delete({ where: { id: existingSolarPlant.id } });

        return;
    }

    async getAbbParams(login: string, password: string, userId: string) {
        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingUser.role === 'MONTADOR' && existingSolarPlant.montadorId !== existingUser.id) {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        if (existingUser.role === 'CLIENTE' && existingSolarPlant.clientId !== existingUser.id) {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await fetchAbbData(login, password);

        return response;
    }

    async getCanadianParams(login: string, password: string, userId: string) {
        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingUser.role === 'MONTADOR' && existingSolarPlant.montadorId !== existingUser.id) {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        if (existingUser.role === 'CLIENTE' && existingSolarPlant.clientId !== existingUser.id) {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await fetchCanadianData(login, password);

        return response;
    }

    async getDeyeParams(login: string, password: string, userId: string) {
        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingUser.role === 'MONTADOR' && existingSolarPlant.montadorId !== existingUser.id) {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        if (existingUser.role === 'CLIENTE' && existingSolarPlant.clientId !== existingUser.id) {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await fetchDeyeData(login, password);

        return response;
    }

    async getGrowattParams(login: string, password: string, userId: string) {

        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingUser.role === 'MONTADOR' && existingSolarPlant.montadorId !== existingUser.id) {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        if (existingUser.role === 'CLIENTE' && existingSolarPlant.clientId !== existingUser.id) {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await fetchGrowattData(login, password);

        return response;
    }

    async getErrorDataListGrowatt(login: string, password: string, year: number, plantId: string, userId: string) {
        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingSolarPlant.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await getErrorDataListForYear(login, password, year, plantId);

        return response;
    }

    async getErrorDataListAbb(login: string, password: string, year: number, plantId: string, userId: string) {
        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingSolarPlant.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await getAbbErrorDataListForYear(login, password, year, plantId);

        return response;
    }

    async getErrorDataListCanadian(login: string, password: string, year: number, plantId: string, userId: string) {
        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingSolarPlant.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await getCanadianErrorDataListForYear(login, password, year, plantId);

        return response;
    }

    async getErrorDataListDeye(login: string, password: string, year: number, plantId: string, userId: string) {
        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingSolarPlant.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await getDeyeErrorDataListForYear(login, password, year, plantId);

        return response;
    }

    async getChartByTypeGrowatt(login: string, password: string, date: string, type: string, plantId: string, deviceTypeName: string, deviceSN: string, userId: string) {
        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingSolarPlant.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await getChartByType(login, password, date, type, plantId, deviceTypeName, deviceSN);

        return response;
    }

    async getChartByTypeAbb(login: string, password: string, date: string, type: string, plantId: string, userId: string) {
        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingSolarPlant.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await getChartAbbByType(login, password, date, type, plantId);

        return response;
    }

    async getChartByTypeCanadian(login: string, password: string, date: string, type: string, plantId: string, userId: string) {
        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingSolarPlant.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await getChartCanadianByType(login, password, date, type, plantId);

        return response;
    }

    async getChartByTypeDeye(login: string, password: string, date: string, type: string, plantId: string, userId: string) {
        const existingUser = await prismaClient.user.findFirst({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingSolarPlant = await prismaClient.plant.findFirst({
            where: {
                login: login,
                password: password,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingSolarPlant.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await getChartDeyeByType(login, password, date, type, plantId);

        return response;
    }

}

export default SolarPlantService;