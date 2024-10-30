import { Inversor } from "@prisma/client";
import prismaClient from "../prisma";
import { fetchGrowattData, getErrorDataListForYear } from "../functions/getGrowattParams";

class SolarPlantService {

    async createSolarPlant(code: string, local: string, installationDate: Date, inverter: Inversor, inverterPot: number, panel: string, panelPower: number, numberPanel: number, estimatedGeneration: number, login: string, password: string, clientId: string, userId: string) {

        const existingClient = await prismaClient.client.findUnique({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        if (existingClient.userId !== userId && !existingUser.isAdmin) {
            throw new Error('Você não tem permissão para cadastrar novas plantas solares neste cliente.');
        }

        const installedPower = (numberPanel * panelPower) / 1000;

        const solarPlantAlreadyExist = await prismaClient.plant.findFirst({
            where: {
                code: code,
                userId: userId
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
                userId: userId,
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

        const solarPlants = await prismaClient.plant.findMany({ where: { userId: existingUser.id } });
        return solarPlants;
    }

    async getSolarPlantsByClientId(clientId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingClient = await prismaClient.client.findUnique({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        if (existingClient.userId !== existingUser.id && !existingUser.isAdmin) {
            throw new Error('Você não tem permissão para acessar as plantas deste cliente.');
        }

        const solarPlants = await prismaClient.plant.findMany({ where: { clientId: existingClient.id } });
        return solarPlants;
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
                user: true,
            }
        });

        if (!existingSolarPlant) {
            throw new Error('Planta Solar não encontrada no banco de dados.');
        }

        if (existingSolarPlant.userId !== existingUser.id && !existingUser.isAdmin) {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        return existingSolarPlant;
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

        if (existingSolarPlant.userId !== existingUser.id && !existingUser.isAdmin) {
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

        if (existingSolarPlant.userId !== existingUser.id && !existingUser.isAdmin) {
            throw new Error('Você não tem permissão para deletar a planta solar.');
        }

        await prismaClient.plant.delete({ where: { id: existingSolarPlant.id } });

        return;
    }

    async getAbbParams(login: string, password: string) {

    }

    async getCanadianParams(login: string, password: string) {

    }

    async getDeyeParams(login: string, password: string) {

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

        if (existingSolarPlant.userId !== existingUser.id && !existingUser.isAdmin) {
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

        if (existingSolarPlant.userId !== existingUser.id && !existingUser.isAdmin) {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        const response = await getErrorDataListForYear(login, password, year, plantId);

        return response;
    }
}

export default SolarPlantService;