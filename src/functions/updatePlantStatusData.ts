import { Inversor, Plant, User } from "@prisma/client";
import { toZonedTime } from 'date-fns-tz';

import DashboardService from "../services/dashboardService";
import prismaClient from "../prisma";

const dashboardService = new DashboardService();
const timeZone = 'America/Sao_Paulo';

// Função para processar UMA única planta.
async function processPlant(plant: Plant): Promise<void> {
    let plantData;
    // Seu código de busca de dados para uma planta
    if (plant.inversor === Inversor.ABB) {
        plantData = await dashboardService.getABBData(plant.login, plant.password);
    } else if (plant.inversor === Inversor.CANADIAN) {
        plantData = await dashboardService.getCanadianData(plant.login, plant.password);
    } else if (plant.inversor === Inversor.DEYE) {
        plantData = await dashboardService.getDeyeData(plant.login, plant.password);
    } else if (plant.inversor === Inversor.GOODWE) {
        plantData = await dashboardService.getGoodweData(plant.login, plant.password);
    } else if (plant.inversor === Inversor.GROWATT) {
        plantData = await dashboardService.getGrowattData(plant.login, plant.password);
    } else if (plant.inversor === Inversor.SOLIS) {
        plantData = await dashboardService.getSolisData(plant.login, plant.password);
    } else {
        console.error(`Inversor não suportado: ${plant.inversor}`);
        return;
    }

    const previousStatus = plant.status;
    const newStatus = plantData?.status;

    await prismaClient.plant.update({
        where: { id: plant.id },
        data: {
            status: plantData?.status,
            eTotal: parseFloat(plantData?.eTotal),
            updatedAt: new Date()
        }
    });

    if (newStatus === '-1' && previousStatus !== '-1') {
        const existingNotification = await prismaClient.notification.findFirst({
            where: {
                userId: plant.montadorId,
                message: `A usina com Código ${plant.code} está com erro.`,
                isRead: false,
            }
        });

        if (!existingNotification) {
            await prismaClient.notification.create({
                data: {
                    userId: plant.montadorId,
                    message: `A usina com Código ${plant.code} está com erro.`,
                }
            });
            console.log(`Notificação criada para montador ID ${plant.montadorId} sobre a usina ${plant.id}`);
        }
    }
}


async function updatePlantData() {
    try {
        const utcDate = new Date();
        const zonedDate = toZonedTime(utcDate, timeZone);
        const hour = zonedDate.getHours();

        if (hour < 5 || hour >= 19) {
            console.log('Fora do horário de operação. Atualização não executada.');
            return;
        }

        const users: User[] = await prismaClient.user.findMany();
        const solarPlants: Plant[] = await Promise.all(
            users.map(user => prismaClient.plant.findMany({ where: { montadorId: user.id } }))
        ).then(results => results.flat());

        const totalPlants = solarPlants.length;
        if (totalPlants === 0) {
            console.log("Nenhuma planta solar para atualizar.");
            return;
        }
        
        console.log(`Iniciando atualização de ${totalPlants} plantas...`);
        let completed = 0;

        // --- INÍCIO DO NOVO BLOCO DE EXECUÇÃO PARALELA ---
        const concurrency = 5; // 5 "trabalhadores"
        const queue = [...solarPlants]; // Uma cópia da fila de plantas

        const workers = Array(concurrency).fill(null).map(async () => {
            while (queue.length > 0) {
                const plant = queue.shift(); // Cada trabalhador pega uma planta da fila
                if (!plant) continue;

                try {
                    await processPlant(plant);
                } catch (e) {
                    console.error(`Erro ao processar a planta ${plant.id}:`, e);
                } finally {
                    completed++;
                    const progress = ((completed / totalPlants) * 100).toFixed(2);
                    console.log(`Progresso: ${completed}/${totalPlants} (${progress}%)`);
                }
            }
        });

        await Promise.all(workers);
        // --- FIM DO NOVO BLOCO DE EXECUÇÃO PARALELA ---

        console.log("Atualização de plantas concluída.");

    } catch (error) {
        console.error('Erro geral ao atualizar dados das plantas solares:', error);
    } finally {
        await prismaClient.$disconnect();
    }
}

// O código abaixo para execução direta continua o mesmo
if (require.main === module) {
    (async () => {
        await updatePlantData();
        process.exit(0);
    })().catch(err => {
        console.error('Error ao executar o script: ', err);
        process.exit(1);
    });
}

export default updatePlantData;