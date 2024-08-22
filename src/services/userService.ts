import { hash, compare } from 'bcryptjs';
import prismaClient from "../prisma";

class UserService {

    async createUser(name: string, login: string, password: string) {
        const existingUser = await prismaClient.user.findUnique({
            where: {
                login: login,
            }
        });

        if (existingUser) {
            throw new Error('O login já está sendo usado por outro usuário.');
        }

        const passwordHash = await hash(password, 8);

        const newUser = await prismaClient.user.create({
            data: {
                login: login,
                password: passwordHash,
                name: name ? name : null
            }
        });

        return newUser;
    }

    async getUsers() {
        const users = await prismaClient.user.findMany();
        return users;
    }

    async getUserById(userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        return existingUser;
    }

    async updateUser(userId: string, name: string, newPassword: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const passwordHash = await hash(newPassword, 8);

        await prismaClient.user.update({
            where: { id: userId },
            data: {
                name: name ? name : existingUser.name,
                password: passwordHash
            }
        });

        return;
    }

    async deleteUser(userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        await prismaClient.user.delete({ where: { id: userId } });

        return;
    }
}

export default UserService;