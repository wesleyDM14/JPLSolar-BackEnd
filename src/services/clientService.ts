import { hash } from "bcryptjs";
import prismaClient from "../prisma";

class ClientService {

    async createClient(name: string, phone: string, address: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        let login = name.split(" ")[0];

        let password = login;

        const existente = await prismaClient.user.findUnique({ where: { login } });

        if (existente) {
            login = `${login}${Date.now()}`;
        }

        let hashPassword = await hash(password, 8);

        const newClient = await prismaClient.user.create({
            data: {
                name: name,
                phone: phone ? phone : null,
                address: address ? address : null,
                montadorId: existingUser.id,
                login: login,
                password: hashPassword,
                role: "CLIENTE",
            }
        });

        return newClient;
    }

    async getClients() {
        const clients = await prismaClient.user.findMany({
            where: {
                role: "CLIENTE",
            }
        });

        return clients;
    }

    async getClientsByUserId(userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const clients = await prismaClient.user.findMany({
            where: {
                montadorId: existingUser.id,
                role: "CLIENTE",
            },
            orderBy: { name: "asc" },
        });

        return clients;
    }

    async getClientById(clientId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingClient = await prismaClient.user.findUnique({
            where: { id: clientId }
        });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        if (existingClient.role !== "CLIENTE") {
            throw new Error('Usuário não listado como cliente.');
        }

        if (existingClient.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para acessar este cliente.');
        }

        return existingClient;
    }

    async updateClient(clientId: string, userId: string, nome: string, phone: string, address: string, login: string, password: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingClient = await prismaClient.user.findUnique({ where: { id: clientId } });

        if (!existingClient || existingClient.role !== "CLIENTE") {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        if (existingClient.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para editar este cliente.');
        }

        let hashPassword = null;

        if (password) {
            hashPassword = await hash(password, 8);
        }

        await prismaClient.user.update({
            where: { id: existingClient.id },
            data: {
                name: nome ? nome : existingClient.name,
                address: address ? address : existingClient.address,
                phone: phone ? phone : existingClient.phone,
                login: login ? login : existingClient.login,
                password: hashPassword ? hashPassword : existingClient.password,
            },
        });

        return;
    }

    async deleteClient(clientId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingClient = await prismaClient.user.findUnique({ where: { id: clientId } });

        if (!existingClient || existingClient.role !== "CLIENTE") {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        if (existingClient.montadorId !== existingUser.id && existingUser.role !== "ADMIN") {
            throw new Error('Você não tem permissão para deletar este cliente.');
        }

        await prismaClient.user.delete({ where: { id: clientId } });
        return;
    }
}

export default ClientService;