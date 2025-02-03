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

        const conta = await prismaClient.conta.findUnique({ where: { userId: userId } });

        let passwordDecrypted = null;

        if (conta) {
            passwordDecrypted = decryptPassword(conta.sicrediPassword, conta.ivPassword);
        }

        if (conta && passwordDecrypted) {
            conta.sicrediPassword = passwordDecrypted;
        }

        let response = {
            recebido,
            num_pagos,
            a_receber,
            num_receber,
            vencidas,
            num_vencidas,
            a_vencer,
            num_avencer,
            conta,
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

    async createClientFinancial(userId: string, nome: string, numParcelasTotal: number, valorParcela: number, pagTotal: number, custoImplantacao: number, lucro: number, numParcelasRest: number, valorQuitado: number, valorRest: number, terceiro: boolean, notafiscal: boolean) {
        const existingUser = await prismaClient.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const newClient = await prismaClient.clienteFinanciamento.create({
            data: {
                custoImplantacao: custoImplantacao,
                lucro: lucro,
                nome: nome,
                numParcelasRest: numParcelasRest,
                numParcelasTotal: numParcelasTotal,
                pagTotal: pagTotal,
                valorParcela: valorParcela,
                valorQuitado: valorQuitado,
                valorRest: valorRest,
                sePagou: valorQuitado >= custoImplantacao,
                terceiro: terceiro,
                montadorId: userId,
                notafiscal: notafiscal,
            }
        });

        return newClient;
    }

    async importClientFinancialContract(userId: string, nome: string, numParcelasTotal: number, valorParcela: number, pagTotal: number, custoImplantacao: number, lucro: number, numParcelasRest: number, valorQuitado: number, valorRest: number, terceiro: boolean, notafiscal: boolean, contractId: string) {
        const existingContract = await prismaClient.contract.findUnique({
            where: { id: contractId },
        });

        if (!existingContract) {
            throw new Error('Contrato não encontrado no banco de dados.');
        }

        return await prismaClient.$transaction(async (prisma) => {
            const newClient = await prisma.clienteFinanciamento.create({
                data: {
                    custoImplantacao: custoImplantacao,
                    lucro: lucro,
                    nome: nome,
                    numParcelasRest: numParcelasRest,
                    numParcelasTotal: numParcelasTotal,
                    pagTotal: pagTotal,
                    valorParcela: valorParcela,
                    valorQuitado: valorQuitado,
                    valorRest: valorRest,
                    sePagou: valorQuitado >= custoImplantacao,
                    terceiro: terceiro,
                    montadorId: userId,
                    notafiscal: notafiscal,
                    contractId: contractId,
                }
            });

            if (newClient) {
                await prisma.contract.update({
                    where: { id: contractId },
                    data: {
                        clienteFinanciamentoId: newClient.id
                    }
                });
            }

            return newClient;
        }, {
            timeout: 120000
        });

    }

    async getClientsFinancial() {
        const clientsFinancial = await prismaClient.clienteFinanciamento.findMany();
        return clientsFinancial;
    }

    async getClientsFinancialByUserId(userId: string) {
        const existingUser = await prismaClient.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const clients = await prismaClient.clienteFinanciamento.findMany({ where: { montadorId: userId } });

        return clients;
    }

    async getClientFinancialById(clientId: string, userId: string) {

        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário nao cadastrado no banco de dados.');
        }

        const client = await prismaClient.clienteFinanciamento.findUnique({ where: { id: clientId } });

        if (!client) {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        if (client.montadorId !== existingUser.id && existingUser.role !== 'ADMIN') {
            throw new Error('Você não tem permissão para acessar este usuário.');
        }

        return client;
    }

    async updateClientFinancial(userId: string, clientId: string, nome: string, numParcelasTotal: number, valorParcela: number, pagTotal: number, custoImplantacao: number, lucro: number, numParcelasRest: number, valorQuitado: number, valorRest: number, terceiro: boolean, notafiscal: boolean) {
        const existingUser = await prismaClient.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingClient = await prismaClient.clienteFinanciamento.findUnique({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados');
        }

        if (existingClient.montadorId !== existingUser.id && existingUser.role !== 'ADMIN') {
            throw new Error('Você não tem permissão para editar este cliente');
        }

        await prismaClient.clienteFinanciamento.update({
            where: { id: clientId },
            data: {
                custoImplantacao: custoImplantacao,
                lucro: lucro,
                nome: nome,
                numParcelasRest: numParcelasRest,
                numParcelasTotal: numParcelasTotal,
                pagTotal: pagTotal,
                valorParcela: valorParcela,
                valorQuitado: valorQuitado,
                valorRest: valorRest,
                sePagou: valorQuitado >= custoImplantacao,
                terceiro: terceiro,
                notafiscal: notafiscal,
            }
        });

        return;
    }

    async deleteClientFinancial(clientFinancialId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingClient = await prismaClient.clienteFinanciamento.findUnique({ where: { id: clientFinancialId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados');
        }

        if (existingClient.montadorId !== existingUser.id && existingUser.role !== 'ADMIN') {
            throw new Error('Você não tem permissão para excluir este cliente');
        }

        return await prismaClient.$transaction(async (prisma) => {
            if (existingClient.contractId) {
                await prisma.contract.update({
                    where: { id: existingClient.contractId },
                    data: {
                        clienteFinanciamentoId: null
                    }
                });
            }
            await prisma.clienteFinanciamento.delete({
                where: { id: clientFinancialId }
            });
        });

    }

}

export default FinancialService;