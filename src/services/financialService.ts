import prismaClient from "../prisma";
import { decryptPassword, encryptPassword } from "../utils/encryptPassword";

class FinancialService {

    async getResume(userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const parcelas = await prismaClient.parcela.findMany({
            where: {
                client: {
                    montadorId: userId,
                }
            },
            include: {
                client: true
            }
        });

        let recebido = 0;
        let num_pagos = 0;
        let a_receber = 0;
        let num_receber = 0;
        let vencidas = 0;
        let num_vencidas = 0;
        let a_vencer = 0;
        let num_avencer = 0;

        parcelas.forEach(element => {
            if (element.status === 'AGUARDANDO') {
                a_receber += element.valor;
                num_receber += 1;
                a_vencer += element.valor;
                num_avencer += 1;
            } else if (element.status === 'PAGO') {
                recebido += element.valor;
                num_pagos += 1;
            } else {
                vencidas += element.valor;
                num_vencidas += 1;
            }
        });

        let response = {
            recebido,
            num_pagos,
            a_receber,
            num_receber,
            vencidas,
            num_vencidas,
            a_vencer,
            num_avencer,
        };

        return response;
    }

    async createConta(userId: string, agencia: string, banco: string, posto: string, codBeneficiario: string, cnpj: string, empresa: string, conta: string, sicrediLogin: string, sicrediPassword: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        if (existingUser.role !== "MONTADOR") {
            throw new Error('Usuário não habilitado para criação de conta.');
        }

        const existingConta = await prismaClient.conta.findUnique({ where: { userId: userId } });

        if (existingConta) {
            throw new Error('Usuário já possui conta cadastrada.');
        }

        const { encrypted, iv } = encryptPassword(sicrediPassword);

        const newConta = await prismaClient.conta.create({
            data: {
                agencia: agencia,
                conta: conta,
                banco: banco,
                cnpj: cnpj,
                codBeneficiario: codBeneficiario,
                empresa: empresa,
                posto: posto,
                sicrediLogin: sicrediLogin,
                sicrediPassword: encrypted,
                ivPassword: iv,
                userId: userId,
            }
        });

        return newConta;
    }

    async getContas() {
        const contas = await prismaClient.conta.findMany();
        return contas;
    }

    async getContaById(contaid: string, userId: string) {
        const existingConta = await prismaClient.conta.findUnique({ where: { id: contaid } });

        if (!existingConta) {
            throw new Error('Conta não cadastrada no banco de dados.')
        }

        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        if (existingConta.userId !== existingUser.id && existingUser.role !== 'ADMIN') {
            throw new Error('Você não tem permissão para acessar esta conta.');
        }

        return existingConta;
    }

    async getContaByUser(userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingConta = await prismaClient.conta.findUnique({ where: { userId: userId } });

        return existingConta;
    }

    async updateConta(userId: string, agencia: string, banco: string, posto: string, codBeneficiario: string, cnpj: string, empresa: string, conta: string, sicrediLogin: string, sicrediPassword: string, contaId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingConta = await prismaClient.conta.findUnique({ where: { id: contaId } });

        if (!existingConta) {
            throw new Error('Conta não encontrada no banco de dados.');
        }

        if (existingConta.userId !== existingUser.id && existingUser.role !== 'ADMIN') {
            throw new Error('Você não tem permissão para editar a conta.');
        }

        let newPassword = null;
        let newIv = null;

        if (sicrediPassword !== decryptPassword(existingConta.sicrediPassword, existingConta.ivPassword)) {
            const { encrypted, iv } = encryptPassword(sicrediPassword);
            newPassword = encrypted;
            newIv = iv;
        }

        await prismaClient.conta.update({
            where: { id: contaId },
            data: {
                agencia,
                banco,
                posto,
                codBeneficiario,
                cnpj,
                conta,
                empresa,
                sicrediLogin,
                sicrediPassword: newPassword ? newPassword : existingConta.sicrediPassword,
                ivPassword: newIv ? newIv : existingConta.ivPassword
            }
        });

        return;
    }

    async deleteConta(userId: string, contaId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingConta = await prismaClient.conta.findUnique({ where: { id: contaId } });

        if (!existingConta) {
            throw new Error('Conta não encontrada no banco de dados.');
        }

        if (existingConta.userId !== existingUser.id && existingUser.role !== 'ADMIN') {
            throw new Error('Você não tem permissão para deletar a conta.');
        }

        await prismaClient.conta.delete({ where: { id: contaId } });

        return;
    }

}

export default FinancialService;