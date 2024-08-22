import prismaClient from "../prisma";

class ClientService {

    async createClient(name: string, contact: string, address: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const newClient = await prismaClient.client.create({
            data: {
                name: name,
                phone: contact ? contact : null,
                address: address ? address : null,
                userId: existingUser.id
            }
        });

        return newClient;
    }

    async getClients() {
        const clients = await prismaClient.client.findMany();
        return clients;
    }

    async getClientsByUserId(userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const clients = await prismaClient.client.findMany({ where: { userId: existingUser.id } });
        return clients;
    }

    async getClientById(clientId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingClient = await prismaClient.client.findUnique({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        if (existingClient.userId !== existingUser.id && !existingUser.isAdmin) {
            throw new Error('Você não tem permissão para acessar este cliente.');
        }

        return existingClient;
    }

    async updateClient(clientId: string, userId: string, nome: string, contact: string, address: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingClient = await prismaClient.client.findUnique({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        if (existingClient.userId !== existingUser.id && !existingUser.isAdmin) {
            throw new Error('Você não tem permissão para editar este cliente.');
        }

        await prismaClient.client.update({
            where: { id: existingClient.id },
            data: {
                name: nome ? nome : existingClient.name,
                address: address ? address : existingClient.address,
                phone: contact ? contact : existingClient.phone
            }
        });

        return;
    }

    async deleteClient(clientId: string, userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const existingClient = await prismaClient.client.findUnique({ where: { id: clientId } });

        if (!existingClient) {
            throw new Error('Cliente não encontrado no banco de dados.');
        }

        if (existingClient.userId !== existingUser.id && !existingUser.isAdmin) {
            throw new Error('Você não tem permissão para deletar este cliente.');
        }

        await prismaClient.client.delete({ where: { id: clientId } });
        return;
    }
}

export default ClientService;