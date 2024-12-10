import { StatusPagamento } from "@prisma/client";
import prismaClient from "../prisma";

class ParcelaService {

    async createParcela(clientId: string, userId: string, numTotal: number, valor: number, dataVencimento: Date) {
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
            throw new Error('Você não tem permissão para cadastrar novas parcelas para este cliente.');
        }

        const parcelas = [];

        for (let i = 1; i <= numTotal; i++) {
            const vencimentoAtual = new Date(dataVencimento);
            vencimentoAtual.setMonth(vencimentoAtual.getMonth() + (i - 1));

            parcelas.push({
                num: i,
                numTotal,
                valor,
                dataVencimento: vencimentoAtual,
                clientId,
            });
        }

        await prismaClient.parcela.createMany({
            data: parcelas,
        });

        return parcelas;

    }

    async getParcelas() {
        return await prismaClient.parcela.findMany();
    }

    async getParcelasByClientId(clientId: string, userId: string) {
        const existingClient = await prismaClient.user.findUnique({
            where: {
                id: clientId,
                role: "CLIENTE"
            }
        });

        if (!existingClient) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingUser = await prismaClient.user.findUnique({
            where: { id: userId }
        });

        if (existingClient.montadorId !== existingUser!.id && existingUser!.role !== "ADMIN") {
            throw new Error('Voce não tem permissão para acessar as parcelas deste cliente.');
        }

        return await prismaClient.parcela.findMany({
            where: {
                clientId: existingClient.id
            }
        });
    }

    async getParcelasByUserId(userId: string) {
        const existingUser = await prismaClient.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        if (existingUser.role !== "MONTADOR") {
            throw new Error('Usuário sem clientes relacionados');
        }

        return await prismaClient.parcela.findMany({
            where: {
                client: {
                    montadorId: existingUser.id
                }
            }
        });
    }

    async getParcelaById(parcelaId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const parcela = await prismaClient.parcela.findUnique({
            where: {
                id: parcelaId,
            },
            include: {
                client: true
            },
        });

        if (!parcela) {
            throw new Error('Parcela não encontrada no banco de dados.');
        }

        if (parcela.client.montadorId !== existingUser.id || existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar a parcela.');
        }

        return parcela;
    }

    async updateParcela(parcelaId: string, userId: string, valor: number, num: number, numTotal: number, dataVencimento: Date, dataPagamento: Date, multa: number, status: StatusPagamento) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingParcela = await prismaClient.parcela.findUnique({
            where: {
                id: parcelaId,
            },
            include: {
                client: true,
            },
        });

        if (!existingParcela) {
            throw new Error('Parcela não encontrada no banco de dados.');
        }

        if (existingParcela.client.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar a planta solar.');
        }

        await prismaClient.parcela.update({
            where: { id: parcelaId },
            data: {
                num: num ? num : existingParcela.num,
                numTotal: numTotal ? numTotal : existingParcela.numTotal,
                dataVencimento: dataVencimento ? dataVencimento : existingParcela.dataVencimento,
                dataPagamento: dataPagamento ? dataPagamento : existingParcela.dataPagamento,
                multa: multa ? multa : existingParcela.multa,
                valor: valor ? valor : existingParcela.valor,
                status: status ? status : existingParcela.status,
            }
        });

        return;
    }

    async deleteParcela(parcelaId: string, userId: string) {
        const exitingParcela = await prismaClient.parcela.findUnique({
            where: { id: parcelaId },
            include: {
                client: true
            }
        });

        if (!exitingParcela) {
            throw new Error('Parcela não encontrada no banco de dados.');
        }

        const existingUser = await prismaClient.user.findUnique({
            where: { id: userId },
        });

        if (exitingParcela.client.montadorId !== userId || existingUser!.role !== "ADMIN") {
            throw new Error('Você não tem permissão para deletar a parcela.');
        }

        await prismaClient.parcela.delete({
            where: {
                id: parcelaId,
            },
        });

        return;
    }
}

export default ParcelaService;