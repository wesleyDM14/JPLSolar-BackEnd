import prismaClient from "../prisma";

class WarningService {

    async createWarning(userId: string, message: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const newWarning = await prismaClient.notification.create({
            data: {
                userId: existingUser.id,
                message: message,
            }
        });

        return newWarning;
    }

    async getWarnings() {
        const warnings = await prismaClient.notification.findMany();
        return warnings;
    }

    async getWarningByUserId(userId: string) {
        const existingUser = await prismaClient.user.findUnique({ where: { id: userId } });

        if (!existingUser) {
            throw new Error('Usuário não encontrado no banco de dados.');
        }

        const warnings = await prismaClient.notification.findMany({ where: { userId: existingUser.id } });

        return warnings;
    }

    async getWarningById(warningId: string, userId: string, isAdmin: boolean) {

        const existingWarning = await prismaClient.notification.findUnique({ where: { id: warningId } });

        if (!existingWarning) {
            throw new Error('Aviso não encontrado no banco de dados.');
        }

        if (existingWarning.userId !== userId && !isAdmin) {
            throw new Error('Você não tem permissão para acessar o aviso.');
        }

        return existingWarning;
    }

    async updateWarning(warningId: string, isReaded: boolean, userId: string, isAdmin: boolean) {
        const existingWarning = await prismaClient.notification.findUnique({ where: { id: warningId } });

        if (!existingWarning) {
            throw new Error('Aviso não encontrado no banco de dados.');
        }

        if (existingWarning.userId !== userId && !isAdmin) {
            throw new Error('Você não tem permissão para acessar o aviso.');
        }

        await prismaClient.notification.update({
            where: { id: warningId },
            data: {
                isRead: isReaded,
            }
        });

        return;
    }

    async deleteWarning(warningId: string, userId: string, isAdmin: boolean) {
        const existingWarning = await prismaClient.notification.findUnique({ where: { id: warningId } });

        if (!existingWarning) {
            throw new Error('Aviso não encontrado no banco de dados.');
        }

        if (existingWarning.userId !== userId && !isAdmin) {
            throw new Error('Você não tem permissão para acessar o aviso.');
        }

        await prismaClient.notification.delete({ where: { id: warningId } });

        return;
    }
}

export default WarningService;