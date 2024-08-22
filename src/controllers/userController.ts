import { Request, Response } from "express";

import UserService from "../services/userService";
import { validatePassword } from "../functions/validatePassword";

const userService = new UserService();

class UserController {

    async createUser(req: Request, res: Response) {
        try {
            const { nome, login, password, confirmPassword } = req.body;

            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem cadastrar novos usuários.' });
            }

            if (!login || !password || !confirmPassword) {
                return res.status(400).json({ message: 'Por favor, informe os dados de usuário corretamente.' });
            }

            validatePassword(password, confirmPassword);

            const newUser = await userService.createUser(nome, login, password);
            return res.status(201).json(newUser);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao cadastrar o usuário: ' + error.message);
                res.status(500).json({ message: 'Erro ao cadastrar o usuário: ' + error.message });
            } else {
                console.error('Erro ao cadastrar o usuário: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao cadastrar o usuário: Erro desconhecido.' });
            }
        }
    }

    async getUsers(req: Request, res: Response) {
        try {

            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem buscar todos os usuários.' });
            }

            const users = await userService.getUsers();
            return res.status(200).json(users);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao buscar os usuários: ' + error.message);
                res.status(500).json({ message: 'Erro ao buscar os usuários: ' + error.message });
            } else {
                console.error('Erro ao buscar os usuários: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao buscar os usuários: Erro desconhecido.' });
            }
        }
    }

    async getUserById(req: Request, res: Response) {
        try {
            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            if (req.user.id !== userId && !req.user.isAdmin) {
                return res.status(403).json({ message: 'Você não possui autorização para acessar o usuário.' });
            }

            const user = await userService.getUserById(userId);
            return res.status(200).json(user);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao buscar o usuário: ' + error.message);
                res.status(500).json({ message: 'Erro ao busca o usuário: ' + error.message });
            } else {
                console.error('Erro ao buscar o usuário: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao buscar o usuário: Erro desconhecido.' });
            }
        }
    }

    async updateUser(req: Request, res: Response) {
        try {
            const { newPassword, confirmPassword, nome } = req.body;

            if (!newPassword || !confirmPassword) {
                return res.status(400).json({ message: 'As senhas são obrigatórias. ' });
            }

            validatePassword(newPassword, confirmPassword);

            await userService.updateUser(req.user.id, nome, newPassword);

            return res.status(200).json({ message: 'Usuário Atualizado com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao atualizar o usuário: ' + error.message);
                res.status(500).json({ message: 'Erro ao atualizar o usuário: ' + error.message });
            } else {
                console.error('Erro ao atualizar o usuário: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao atualizar o usuário: Erro desconhecido.' });
            }
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({ message: 'Apenas administradores podem deletar usuários.' });
            }

            const userId = req.params.userId;

            if (!userId) {
                return res.status(400).json({ message: 'ID não fornecido.' });
            }

            await userService.deleteUser(userId);
            return res.json({ message: 'Usuário deletado com sucesso.' });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao deletar o usuário: ' + error.message);
                res.status(500).json({ message: 'Erro ao deletar o usuário: ' + error.message });
            } else {
                console.error('Erro ao deletar o usuário: Erro desconhecido.');
                res.status(500).json({ message: 'Erro ao deletar o usuário: Erro desconhecido.' });
            }
        }
    }
}

export default UserController;