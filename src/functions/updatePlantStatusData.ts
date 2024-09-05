import { Inversor } from "@prisma/client";
import pLimit from "p-limit";
import { toZonedTime } from 'date-fns-tz';

import DashboardService from "../services/dashboardService";
import prismaClient from "../prisma";

const limit = pLimit(5);
const dashboardService = new DashboardService();
const timeZone = 'America/Sao_Paulo';

async function updatePlantData() {
    try {
        const utcDate = new Date();
        const zonedDate = toZonedTime(utcDate, timeZone);
        const hour = zonedDate.getHours();

        if (hour < 5 || hour >= 18) {
            console.log('Fora do horário de operação. Atualização não executada.');
            return;
        }

        const users = await prismaClient.user.findMany();

        const solarPlants = await Promise.all(
            users.map(user => prismaClient.plant.findMany({ where: { userId: user.id } }))
        ).then(results => results.flat());

        await Promise.all(
            solarPlants.map(plant =>
                limit(async () => {
                    let plantData;

                    if (plant.inversor === Inversor.ABB) {
                        plantData = await dashboardService.getABBData(plant.login, plant.password);
                    } else if (plant.inversor === Inversor.CANADIAN) {
                        plantData = await dashboardService.getCanadianData(plant.login, plant.password);
                    } else if (plant.inversor === Inversor.DEYE) {
                        plantData = await dashboardService.getDeyeData(plant.login, plant.password);
                    } else if (plant.inversor === Inversor.GROWATT) {
                        plantData = await dashboardService.getGrowattData(plant.login, plant.password);
                    } else {
                        console.error(`Inversor não suportado: ${plant.inversor}`);
                        return;
                    }

                    await prismaClient.plant.update({
                        where: { id: plant.id },
                        data: {
                            status: plantData.status,
                            eTotal: plantData.eTotal,
                            updatedAt: new Date()
                        }
                    });
                })
            )
        );
    } catch (error) {
        console.error('Erro ao atualizar dados da plantas solares:', error);
    }
}

export default updatePlantData;