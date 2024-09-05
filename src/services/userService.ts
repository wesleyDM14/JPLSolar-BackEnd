import { hash, compare } from 'bcryptjs';
import prismaClient from "../prisma";
import { generateAccessToken } from '../functions/generateAccessToken';

const MAX_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000;

class UserService {

    async authenticateUser(login: string, password: string) {
        const userLogin = await prismaClient.user.findUnique({ where: { login: login } });

        if (!userLogin) {
            throw new Error('Login não encontrado no banco de dados.');
        }

        if (userLogin.lockUntil && userLogin.lockUntil > new Date()) {
            const remainingTime = Math.ceil((userLogin.lockUntil.getTime() - Date.now()) / 60000);
            throw new Error(`Conta bloqueada. Tente novamente em ${remainingTime} minutos.`);
        }

        const passwordMatch = await compare(password, userLogin.password);

        if (!passwordMatch) {
            await prismaClient.user.update({
                where: { id: userLogin.id },
                data: {
                    failedAttemps: userLogin.failedAttemps + 1,
                },
            });

            if (userLogin.failedAttemps + 1 >= MAX_ATTEMPTS) {
                await prismaClient.user.update({
                    where: { id: userLogin.id },
                    data: {
                        lockUntil: new Date(Date.now() + LOCK_TIME),
                        failedAttemps: 0,
                    },
                });
                throw new Error(`Conta bloqueada por ${LOCK_TIME / 60000} minutos devido a muitas tentativas falhas.`)
            }

            throw new Error('A senha está incorreta.');
        }

        await prismaClient.user.update({
            where: { id: userLogin.id },
            data: {
                failedAttemps: 0,
                lockUntil: null,
            },
        });

        const accessToken = generateAccessToken(userLogin.id);
        return { accessToken, isAdmin: userLogin.isAdmin };
    }

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
                name: name ? name : null,
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