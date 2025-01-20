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
            const userId = req.params.contaId;

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
}

export default FinancialController;