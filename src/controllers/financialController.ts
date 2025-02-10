import { Request, Response } from "express";

import FinancialService from "../services/financialService";
import { UserRole } from "@prisma/client";

const financialService = new FinancialService();

class FinancialController {

    async getResume(req: Request, res: Response) {
        try {
            const resume = await financialService.getResume(req.user.id);
            return res.status(200).json(resume);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar o resumo do usuário: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar o resumo do usuário: ' + error.message });
            } else {
                console.error('Erro ao pegar o resumo do usuário: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar o resumo do usuário: Erro desconhecido.' });
            }
        }
    }

    async createConta(req: Request, res: Response) {
        try {
            const { agencia, banco, posto, codBeneficiario, cnpj, empresa, conta, sicrediLogin, sicrediPassword } = req.body;

            if (!agencia || !banco || !posto || !codBeneficiario || !cnpj || !empresa || !conta || !sicrediLogin || !sicrediPassword) {
                return res.status(400).json({ message: 'Dados de criação de conta estão faltando.' });
            }

            const newConta = await financialService.createConta(req.user.id, agencia, banco, posto, codBeneficiario, cnpj, empresa, conta, sicrediLogin, sicrediPassword);

            return res.status(201).json(newConta);

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao criar conta: ' + error.message);
                res.status(500).json({ message: 'Erro ao criar conta: ' + error.message });
            } else {
                console.error('Erro ao criar conta: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao criar conta: Erro desconhecido.' });
            }
        }
    }

    async getContas(req: Request, res: Response) {
        try {
            if (req.user.userRole !== UserRole.ADMIN) {
                return res.status(403).json({ message: 'Apenas administradores podem acessar todas as contas.' });
            }
            const contas = await financialService.getContas();
            return res.status(200).json(contas);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar as contas: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar as contas: ' + error.message });
            } else {
                console.error('Erro ao pegar as contas: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar as contas: Erro desconhecido.' });
            }
        }
    }

    async getContaById(req: Request, res: Response) {
        try {
            const contaId = req.params.contaId;

            if (!contaId) {
                return res.status(400).json({ message: 'Id de conta não informado.' });
            }

            const conta = await financialService.getContaById(contaId, req.user.id);

            return res.status(200).json(conta);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar a conta: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar a conta: ' + error.message });
            } else {
                console.error('Erro ao pegar a conta: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar a conta: Erro desconhecido.' });
            }
        }
    }

    async getContaByUser(req: Request, res: Response) {
        try {
            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({ message: 'Id de usuário não informado.' });
            }

            const conta = await financialService.getContaByUser(userId);

            return res.status(200).json(conta);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar a conta: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar a conta: ' + error.message });
            } else {
                console.error('Erro ao pegar a conta: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar a conta: Erro desconhecido.' });
            }
        }
    }

    async getSelfConta(req: Request, res: Response) {
        try {
            const conta = await financialService.getContaByUser(req.user.id);
            return res.status(200).json(conta);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar a conta: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar a conta: ' + error.message });
            } else {
                console.error('Erro ao pegar a conta: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar a conta: Erro desconhecido.' });
            }
        }
    }

    async updateConta(req: Request, res: Response) {
        try {
            const contaId = req.params.contaId;

            if (!contaId) {
                return res.status(400).json({ message: 'Id de conta não informado.' });
            }

            const { agencia, banco, posto, codBeneficiario, cnpj, empresa, conta, sicrediLogin, sicrediPassword } = req.body;

            if (!agencia || !banco || !posto || !codBeneficiario || !cnpj || !empresa || !conta || !sicrediLogin || !sicrediPassword) {
                return res.status(400).json({ message: 'Dados de conta estão faltando.' });
            }

            await financialService.updateConta(req.user.id, agencia, banco, posto, codBeneficiario, cnpj, empresa, conta, sicrediLogin, sicrediPassword, contaId);

            return res.status(200).json({ message: 'Conta atualizada com sucesso.' });

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao atualizar conta: ' + error.message);
                res.status(500).json({ message: 'Erro ao atualizar conta: ' + error.message });
            } else {
                console.error('Erro ao atualizar conta: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao atualizar conta: Erro desconhecido.' });
            }
        }
    }

    async deleteConta(req: Request, res: Response) {
        try {
            const contaId = req.params.contaId;

            if (!contaId) {
                return res.status(400).json({ message: 'Id de conta não informado.' });
            }

            await financialService.deleteConta(req.user.id, contaId);

            return res.status(200).json({ message: 'Conta deletada com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao deletar conta: ' + error.message);
                res.status(500).json({ message: 'Erro ao deletar conta: ' + error.message });
            } else {
                console.error('Erro ao deletar conta: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao deletar conta: Erro desconhecido.' });
            }
        }
    }

    async createClientFinancial(req: Request, res: Response) {
        try {

            const { nome, numParcelasTotal, valorParcela, pagTotal, custoImplantacao, lucro, numParcelasRest, valorQuitado, valorRest, terceiro, notafiscal } = req.body;

            if (!nome || (numParcelasTotal === null || numParcelasTotal === undefined) || (valorParcela === null || valorParcela === undefined) || (pagTotal === null || pagTotal === undefined) || (custoImplantacao === null || custoImplantacao === undefined) || (lucro === null || lucro === undefined) || (numParcelasRest === null || numParcelasRest === undefined) || (valorQuitado === null || valorQuitado === undefined) || (valorRest === null || valorRest === undefined) || (terceiro === null || terceiro === undefined) || (notafiscal === null || notafiscal === undefined)) {
                return res.status(403).json({ message: 'Valores para cliente financeiro inválidos.' });
            }

            const newClient = await financialService.createClientFinancial(req.user.id, nome, numParcelasTotal, valorParcela, pagTotal, custoImplantacao, lucro, numParcelasRest, valorQuitado, valorRest, terceiro, notafiscal);

            return res.status(201).json(newClient);

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao criar cliente: ' + error.message);
                res.status(500).json({ message: 'Erro ao criar cliente: ' + error.message });
            } else {
                console.error('Erro ao criar cliente: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao criar cliente: Erro desconhecido.' });
            }
        }
    }

    async createClientFinancialImport(req: Request, res: Response) {
        try {

            const { nome, numParcelasTotal, valorParcela, pagTotal, custoImplantacao, lucro, numParcelasRest, valorQuitado, valorRest, terceiro, notafiscal, contractId } = req.body;

            if (!nome || !contractId || (numParcelasTotal === null || numParcelasTotal === undefined) || (valorParcela === null || valorParcela === undefined) || (pagTotal === null || pagTotal === undefined) || (custoImplantacao === null || custoImplantacao === undefined) || (lucro === null || lucro === undefined) || (numParcelasRest === null || numParcelasRest === undefined) || (valorQuitado === null || valorQuitado === undefined) || (valorRest === null || valorRest === undefined) || (terceiro === null || terceiro === undefined) || (notafiscal === null || notafiscal === undefined)) {
                return res.status(403).json({ message: 'Valores para cliente financeiro inválidos.' });
            }

            const newClient = await financialService.importClientFinancialContract(req.user.id, nome, numParcelasTotal, valorParcela, pagTotal, custoImplantacao, lucro, numParcelasRest, valorQuitado, valorRest, terceiro, notafiscal, contractId);

            return res.status(201).json(newClient);

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao criar cliente: ' + error.message);
                res.status(500).json({ message: 'Erro ao criar cliente: ' + error.message });
            } else {
                console.error('Erro ao criar cliente: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao criar cliente: Erro desconhecido.' });
            }
        }
    }

    async getClientsFinancial(req: Request, res: Response) {
        try {
            if (req.user.userRole !== UserRole.ADMIN) {
                return res.status(401).json({ message: 'Sem permissão para acessar os clientes.' });
            }

            const clients = await financialService.getClientsFinancial();

            return res.status(200).json(clients);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar os clientes: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar os clientes: ' + error.message });
            } else {
                console.error('Erro ao pegar os clientes: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar os clientes: Erro desconhecido.' });
            }
        }
    }

    async getClientsFinancialByUserId(req: Request, res: Response) {
        try {

            const userId = req.params.userId;

            if (!userId) {
                return res.status(403).json({ message: 'Id de usuário não informado.' });
            }

            if (req.user.userRole !== UserRole.ADMIN && req.user.id !== userId) {
                return res.status(401).json({ message: 'Sem permissão para acessar os clientes.' });
            }

            const clients = await financialService.getClientsFinancialByUserId(userId);

            return res.status(200).json(clients);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar os clientes: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar os clientes: ' + error.message });
            } else {
                console.error('Erro ao pegar os clientes: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar os clientes: Erro desconhecido.' });
            }
        }
    }

    async getSelfClientsFinancial(req: Request, res: Response) {
        try {
            const clients = await financialService.getClientsFinancialByUserId(req.user.id);
            return res.status(200).json(clients);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar os clientes: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar os clientes: ' + error.message });
            } else {
                console.error('Erro ao pegar os clientes: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar os clientes: Erro desconhecido.' });
            }
        }
    }

    async getClientById(req: Request, res: Response) {
        try {
            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(403).json({ message: 'Id de cliente não informado.' });
            }

            const client = await financialService.getClientFinancialById(clientId, req.user.id);
            return res.status(200).json(client);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao pegar o cliente: ' + error.message);
                res.status(500).json({ message: 'Erro ao pegar o cliente: ' + error.message });
            } else {
                console.error('Erro ao pegar o cliente: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao pegar o cliente: Erro desconhecido.' });
            }
        }
    }

    async updateClientFinancial(req: Request, res: Response) {
        try {

            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(403).json({ message: 'Id de cliente não informado.' });
            }

            const { nome, numParcelasTotal, valorParcela, pagTotal, custoImplantacao, lucro, numParcelasRest, valorQuitado, valorRest, terceiro, notafiscal } = req.body;

            if (!nome || (numParcelasTotal === null || numParcelasTotal === undefined) || (valorParcela === null || valorParcela === undefined) || (pagTotal === null || pagTotal === undefined) || (custoImplantacao === null || custoImplantacao === undefined) || (lucro === null || lucro === undefined) || (numParcelasRest === null || numParcelasRest === undefined) || (valorQuitado === null || valorQuitado === undefined) || (valorRest === null || valorRest === undefined) || (terceiro === null || terceiro === undefined) || (notafiscal === null || notafiscal === undefined)) {
                return res.status(403).json({ message: 'Valores para cliente financeiro inválidos.' });
            }

            await financialService.updateClientFinancial(req.user.id, clientId, nome, numParcelasTotal, valorParcela, pagTotal, custoImplantacao, lucro, numParcelasRest, valorQuitado, valorRest, terceiro, notafiscal);

            return res.status(200).json({ message: 'Cliente Financeiro atualizado com sucesso.' });

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao atualizar cliente: ' + error.message);
                res.status(500).json({ message: 'Erro ao atualizar cliente: ' + error.message });
            } else {
                console.error('Erro ao atualizar cliente: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao atualizar cliente: Erro desconhecido.' });
            }
        }
    }

    async deleteClientFinancial(req: Request, res: Response) {
        try {
            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(403).json({ message: 'Id de cliente não informado.' });
            }

            await financialService.deleteClientFinancial(clientId, req.user.id);

            return res.status(200).json({ message: 'Cliente Financeiro deletado com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao deletar cliente: ' + error.message);
                res.status(500).json({ message: 'Erro ao deletar cliente: ' + error.message });
            } else {
                console.error('Erro ao deletar cliente: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao deletar cliente: Erro desconhecido.' });
            }
        }
    }
}

export default FinancialController;