import { Request, Response } from "express";
import PartnerService from "../services/partnerService";
import { UserRole } from "@prisma/client";

const partnerService = new PartnerService();

class PartnerController {

    async createPartner(req: Request, res: Response) {
        try {
            const { name, phone, address } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Nome do Parceiro é obrigatório.' });
            }

            const newPartner = await partnerService.createPartner(name, phone, address, req.user.id);
            return res.status(201).json(newPartner);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao cadastrar o parceiro: ' + error.message);
                res.status(500).json({ message: 'Erro ao cadastrar o parceiro: ' + error.message });
            } else {
                console.error('Erro ao cadastrar o parceiro: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao cadastrar o parceiro: Erro desconhecido.' });
            }
        }
    }

    async getPartners(req: Request, res: Response) {
        try {
            if (req.user.userRole !== UserRole.ADMIN) {
                return res.status(403).json({ message: 'Somente administradores podem acessar todos os parceiros.' });
            }

            const partners = await partnerService.getPartners();
            return res.status(200).json(partners);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao recuperar os parceiros: ' + error.message);
                res.status(500).json({ message: 'Erro ao recuperar os parceiros: ' + error.message });
            } else {
                console.error('Erro ao recuperar os parceiros: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao recuperar os parceiros: Erro desconhecido.' });
            }
        }
    }

    async getPartnersByUserLoggedIn(req: Request, res: Response) {
        try {
            const partners = await partnerService.getPartnersByUserId(req.user.id);
            return res.status(200).json(partners);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao recuperar os parceiros: ' + error.message);
                res.status(500).json({ message: 'Erro ao recuperar os parceiros: ' + error.message });
            } else {
                console.error('Erro ao recuperar os parceiros: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao recuperar os parceiros: Erro desconhecido.' });
            }
        }
    }

    async getPartnersByUserId(req: Request, res: Response) {
        try {
            if (req.user.userRole !== UserRole.ADMIN) {
                return res.status(403).json({ message: 'Somente administradores podem acessar os parceiros.' });
            }

            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({ message: 'ID de usuário não fornecido.' });
            }

            const partners = await partnerService.getPartnersByUserId(userId);
            return res.status(200).json(partners);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao recuperar os parceiros: ' + error.message);
                res.status(500).json({ message: 'Erro ao recuperar os parceiros: ' + error.message });
            } else {
                console.error('Erro ao recuperar os parceiros: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao recuperar os parceiros: Erro desconhecido.' });
            }
        }
    }

    async getPartnerById(req: Request, res: Response) {
        try {
            const partnerId = req.params.partnerId;

            if (!partnerId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const partner = await partnerService.getPartnerById(partnerId, req.user.id);
            return res.status(201).json(partner);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao recuperar o parceiro: ' + error.message);
                res.status(500).json({ message: 'Erro ao recuperar o parceiro: ' + error.message });
            } else {
                console.error('Erro ao recuperar o parceiro: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao recuperar o parceiro: Erro desconhecido.' });
            }
        }
    }

    async updatePartner(req: Request, res: Response) {
        try {
            const partnerId = req.params.partnerId;

            if (!partnerId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const { name, phone, address, login, password } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Nome de Parceiro é obrigatório.' });
            }

            await partnerService.updatePartner(partnerId, req.user.id, name, phone, address, login, password);
            return res.status(200).json({ message: 'Parceiro atualizado com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao atualizar o parceiro: ' + error.message);
                res.status(500).json({ message: 'Erro ao recuperar os parceiros: ' + error.message });
            } else {
                console.error('Erro ao atualizar o parceiro: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao atualizar o parceiro: Erro desconhecido.' });
            }
        }
    }

    async deletePartner(req: Request, res: Response) {
        try {
            const partnerId = req.params.partnerId;

            if (!partnerId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            await partnerService.deletePartner(partnerId, req.user.id);
            return res.status(200).json({ message: 'Parceiro deletado com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao deletar o parceiro: ' + error.message);
                res.status(500).json({ message: 'Erro ao deletar o parceiro: ' + error.message });
            } else {
                console.error('Erro ao deletar o parceiro: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao deletar o parceiro: Erro desconhecido.' });
            }
        }
    }

}

export default PartnerController;