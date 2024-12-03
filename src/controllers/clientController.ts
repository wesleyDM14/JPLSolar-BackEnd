import { Request, Response } from "express";
import ClientService from "../services/clientService";
import { UserRole } from "@prisma/client";

const clientService = new ClientService();

class ClientController {

    async createClient(req: Request, res: Response) {
        try {
            const { name, phone, address } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Nome de Cliente é obrigatório.' });
            }

            const newClient = await clientService.createClient(name, phone, address, req.user.id);
            return res.status(201).json(newClient);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro cadastrar o cliente: ' + error.message);
                res.status(500).json({ message: 'Erro cadastrar o cliente: ' + error.message });
            } else {
                console.error('Erro cadastrar o cliente: Erro desconhecido.');
                res.status(500).json({ message: 'Erro cadastrar o cliente: Erro desconhecido.' });
            }
        }
    }

    async getClients(req: Request, res: Response) {
        try {
            if (req.user.userRole !== UserRole.ADMIN) {
                return res.status(403).json({ message: 'Somente administradores podem acessar todos os clientes.' });
            }

            const clients = await clientService.getClients();
            return res.status(200).json(clients);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro acessar os clientes: ' + error.message);
                res.status(500).json({ message: 'Erro acessar os clientes: ' + error.message });
            } else {
                console.error('Erro acessar os clientes: Erro desconhecido.');
                res.status(500).json({ message: 'Erro acessar os clientes: Erro desconhecido.' });
            }
        }
    }

    async getSelfUserClients(req: Request, res: Response) {
        try {
            const clients = await clientService.getClientsByUserId(req.user.id);
            return res.status(200).json(clients);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro acessar os clientes: ' + error.message);
                res.status(500).json({ message: 'Erro acessar os clientes: ' + error.message });
            } else {
                console.error('Erro acessar os clientes: Erro desconhecido.');
                res.status(500).json({ message: 'Erro acessar os clientes: Erro desconhecido.' });
            }
        }
    }

    async getClientsByUserId(req: Request, res: Response) {
        try {
            if (req.user.userRole !== UserRole.ADMIN) {
                return res.status(403).json({ message: 'Somente administradores podem acessar os clientes.' });
            }

            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({ message: 'ID de usuário não fornecido.' });
            }

            const clients = await clientService.getClientsByUserId(userId);
            return res.status(200).json(clients);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro acessar os clientes: ' + error.message);
                res.status(500).json({ message: 'Erro acessar os clientes: ' + error.message });
            } else {
                console.error('Erro acessar os clientes: Erro desconhecido.');
                res.status(500).json({ message: 'Erro acessar os clientes: Erro desconhecido.' });
            }
        }
    }

    async getClientById(req: Request, res: Response) {
        try {
            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const client = await clientService.getClientById(clientId, req.user.id);
            return res.status(201).json(client);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao acessar o cliente: ' + error.message);
                res.status(500).json({ message: 'Erro ao acessar o cliente: ' + error.message });
            } else {
                console.error('Erro cadastrar o cliente: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao acessar o cliente: Erro desconhecido.' });
            }
        }
    }

    async updateClient(req: Request, res: Response) {
        try {
            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            const { name, phone, address, login, password } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Nome de Cliente é obrigatório.' });
            }

            await clientService.updateClient(clientId, req.user.id, name, phone, address, login, password);
            return res.status(200).json({ message: 'Cliente atualizado com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao atualizar o cliente: ' + error.message);
                res.status(500).json({ message: 'Erro ao atualizar o cliente: ' + error.message });
            } else {
                console.error('Erro cadastrar o cliente: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao atualizar o cliente: Erro desconhecido.' });
            }
        }
    }

    async deleteClient(req: Request, res: Response) {
        try {
            const clientId = req.params.clientId;

            if (!clientId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            await clientService.deleteClient(clientId, req.user.id);
            return res.status(200).json({ message: 'Cliente deletado com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao deletar o cliente: ' + error.message);
                res.status(500).json({ message: 'Erro ao deletar o cliente: ' + error.message });
            } else {
                console.error('Erro ao deletar o cliente: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao deletar o cliente: Erro desconhecido.' });
            }
        }
    }
}

export default ClientController;